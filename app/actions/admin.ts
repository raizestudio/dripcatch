"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/app/lib/auth/admin";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { getErrorMessage } from "@/app/lib/utils";
import type { AppRole } from "@/app/lib/db/schema";

export type BugReportStatus = "open" | "in_progress" | "resolved" | "closed";

const VALID_BUG_STATUSES = new Set<BugReportStatus>([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

const VALID_ROLES = new Set<AppRole>(["admin", "moderator"]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// STAFF ACTIONS (Admin + Moderator)
// ============================================================================

export async function updateBugReportStatus(
  id: string,
  status: BugReportStatus,
) {
  try {
    await requireStaff();

    if (!VALID_BUG_STATUSES.has(status)) {
      return { success: false, error: "Invalid bug report status." };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("bug_reports")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to update bug report status.") };
  }
}

export interface UpsertCatalogServiceInput {
  id?: string;
  name: string;
  slug?: string;
  category: string;
}

export async function upsertCatalogService(input: UpsertCatalogServiceInput) {
  try {
    await requireStaff();

    const name = input.name.trim();
    const category = input.category.trim();
    const slug = slugify(input.slug?.trim() || name);

    if (!name || !category || !slug) {
      return {
        success: false,
        error: "Name, slug, and category are required.",
      };
    }

    const adminSupabase = createAdminClient();

    if (input.id) {
      const { error } = await adminSupabase
        .from("catalog_subscriptions")
        .update({ name, slug, category })
        .eq("id", input.id);

      if (error) throw error;
    } else {
      const { error } = await adminSupabase
        .from("catalog_subscriptions")
        .insert({ name, slug, category });

      if (error) throw error;
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to upsert catalog service.") };
  }
}

export async function deleteCatalogService(id: string) {
  try {
    await requireStaff();

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("catalog_subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to delete catalog service.") };
  }
}

export interface UpsertCatalogPlanInput {
  id?: string;
  catalog_id: string;
  name: string;
  default_cost: number;
  currency: string;
  interval: string;
}

export async function upsertCatalogPlan(input: UpsertCatalogPlanInput) {
  try {
    await requireStaff();

    const name = input.name.trim();
    const currency = input.currency.trim().toUpperCase();
    const interval = input.interval.trim().toLowerCase();
    const defaultCost = Number(input.default_cost);

    if (
      !name ||
      !currency ||
      !interval ||
      Number.isNaN(defaultCost) ||
      defaultCost < 0
    ) {
      return { success: false, error: "Invalid plan fields." };
    }

    const adminSupabase = createAdminClient();

    if (input.id) {
      const { error } = await adminSupabase
        .from("catalog_subscription_plans")
        .update({
          name,
          default_cost: defaultCost,
          currency,
          interval,
        })
        .eq("id", input.id);

      if (error) throw error;
    } else {
      const { error } = await adminSupabase
        .from("catalog_subscription_plans")
        .insert({
          catalog_id: input.catalog_id,
          name,
          default_cost: defaultCost,
          currency,
          interval,
        });

      if (error) throw error;
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to upsert catalog service.") };
  }
}

export async function deleteCatalogPlan(id: string) {
  try {
    await requireStaff();

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("catalog_subscription_plans")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to delete catalog service.") };
  }
}

// ============================================================================
// ADMIN-ONLY ACTIONS (Role Management)
// ============================================================================

async function findAuthUserByEmail(email: string) {
  const adminSupabase = createAdminClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) return match;

    if (data.users.length < 1000) return null;
    page += 1;
  }
}

export async function assignUserRole(email: string, role: AppRole) {
  try {
    const caller = await requireAdmin();

    if (!VALID_ROLES.has(role)) {
      return { success: false, error: "Invalid role." };
    }

    const targetUser = await findAuthUserByEmail(email);
    if (!targetUser) {
      return {
        success: false,
        error: "No registered account found with that email.",
      };
    }

    if (targetUser.id === caller.user.id && role !== "admin") {
      return {
        success: false,
        error: "You cannot demote your own admin account.",
      };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("user_roles").upsert(
      {
        user_id: targetUser.id,
        role,
        granted_by: caller.user.id,
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to assign user role.") };
  }
}

export async function revokeUserRole(targetUserId: string) {
  try {
    const caller = await requireAdmin();

    if (targetUserId === caller.user.id) {
      return {
        success: false,
        error: "You cannot revoke your own role.",
      };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);

    if (error) throw error;

    revalidatePath("/[locale]/admin", "page");
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Failed to revoke user role.") };
  }
}
