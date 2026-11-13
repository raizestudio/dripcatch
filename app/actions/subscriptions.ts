// app/actions/subscriptions.ts
"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { sendSplitInvitationEmail } from "@/app/lib/mail";
import { getErrorMessage } from "@/app/lib/utils";

export interface UserSubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  original_cost: number | null;
  first_billed_date: string;
  next_billing_date: string;
  is_zombie: boolean;
  status: "active" | "paused" | "cancelled";
  is_owner?: boolean;
  effective_cost?: number;
  subscription_splits?: {
    id: string;
    name: string;
    email?: string | null;
    amount: number;
    user_id?: string | null;
  }[];
}

export interface SubscriptionSplitInput {
  name: string;
  email?: string | null;
  amount: number;
}

export interface AddSubscriptionInput {
  name: string;
  category: string;
  catalog_id?: string | null;
  plan_id?: string | null;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  first_billed_date: string;
  next_billing_date: string;
  splits?: SubscriptionSplitInput[];
}

export interface UpdateSubscriptionInput {
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  first_billed_date: string;
  next_billing_date: string;
  is_zombie: boolean;
  splits?: SubscriptionSplitInput[];
}

export interface SubscriptionSplitItem {
  id: string;
  name: string;
  email?: string | null;
  amount: number;
  user_id?: string | null;
  status: "pending" | "accepted" | "rejected";
}

export interface SharedSubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost: number;
  effective_cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  first_billed_date: string;
  next_billing_date: string;
  is_zombie: boolean;
  status: "active" | "paused" | "cancelled";
  is_owner: boolean;
  splits: SubscriptionSplitItem[];
  subscription_splits: SubscriptionSplitItem[];
}

interface RawSubscriptionQueryRow extends Omit<
  UserSubscriptionRow,
  "subscription_splits"
> {
  subscription_splits?: SubscriptionSplitItem[] | null;
}

type ActionResponse<T = void> =
  { success: true; data?: T } | { success: false; error: string };

/**
 * Ensures non-null string date for PostgreSQL columns configured with NOT NULL
 */
function resolveDate(dateStr?: string | null, fallback?: string): string {
  const trimmed = dateStr?.trim();
  if (trimmed) return trimmed;
  const fallbackTrimmed = fallback?.trim();
  if (fallbackTrimmed) return fallbackTrimmed;
  return new Date().toISOString().split("T")[0];
}

export async function getSubscriptions(): Promise<SharedSubscriptionRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
          id,
          user_id,
          name,
          category,
          cost,
          original_cost,
          currency,
          interval,
          first_billed_date,
          next_billing_date,
          is_zombie,
          status,
          subscription_splits (
            id,
            name,
            email,
            amount,
            user_id,
            status
          )
        `,
    )
    .order("next_billing_date", { ascending: true })
    .overrideTypes<RawSubscriptionQueryRow[], { merge: false }>();

  if (error || !data) {
    if (error) console.error("Error fetching subscriptions:", error.message);
    return [];
  }

  return data
    .filter((sub) => {
      if (sub.user_id === user.id) return true;
      const mySplit = sub.subscription_splits?.find(
        (s) =>
          s.user_id === user.id ||
          (s.email &&
            user.email &&
            s.email.toLowerCase() === user.email.toLowerCase()),
      );
      return mySplit && mySplit.status === "accepted";
    })
    .map((sub) => {
      const isOwner = sub.user_id === user.id;
      const splits: SubscriptionSplitItem[] = sub.subscription_splits || [];
      const totalCost = Number(sub.cost);

      let effectiveCost = totalCost;

      if (isOwner) {
        // Count both accepted and pending splits (ignore only rejected)
        const coveredBySplits = splits
          .filter((s) => s.status !== "rejected")
          .reduce((acc, s) => acc + Number(s.amount), 0);

        effectiveCost = Math.max(0, totalCost - coveredBySplits);
      } else {
        const userSplit = splits.find(
          (s) =>
            s.user_id === user.id ||
            (s.email &&
              user.email &&
              s.email.toLowerCase() === user.email.toLowerCase()),
        );
        effectiveCost = userSplit
          ? Number(userSplit.amount)
          : splits.length > 0
            ? Number(splits[0].amount)
            : totalCost;
      }

      return {
        id: sub.id,
        user_id: sub.user_id,
        name: sub.name,
        category: sub.category,
        cost: totalCost,
        effective_cost: effectiveCost,
        currency: sub.currency,
        interval: sub.interval,
        first_billed_date:
          sub.first_billed_date ||
          sub.next_billing_date ||
          new Date().toISOString().split("T")[0],
        next_billing_date: sub.next_billing_date,
        is_zombie: sub.is_zombie,
        status: sub.status,
        is_owner: isOwner,
        splits,
        subscription_splits: splits,
      };
    });
}

export async function createSubscription(
  input: AddSubscriptionInput,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!input.name?.trim()) {
      return { success: false, error: "Subscription name is required." };
    }

    const cleanCost = Math.max(0, Number(input.cost) || 0);
    const resolvedNextBilling = resolveDate(input.next_billing_date);
    const resolvedFirstBilled = resolveDate(
      input.first_billed_date,
      resolvedNextBilling,
    );

    // 1. Create root subscription
    const { data: sub, error: insertError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        catalog_id: input.catalog_id || null,
        plan_id: input.plan_id || null,
        name: input.name.trim(),
        category: input.category || "Other",
        cost: cleanCost,
        currency: input.currency || "EUR",
        interval: input.interval || "monthly",
        original_cost: cleanCost,
        first_billed_date: resolvedFirstBilled,
        next_billing_date: resolvedNextBilling,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // 2. Insert splits
    if (input.splits && input.splits.length > 0) {
      const validSplits = input.splits
        .filter((s) => s.name?.trim() && Number(s.amount) > 0)
        .map((s) => {
          const hasEmail = Boolean(s.email?.trim());
          return {
            subscription_id: sub.id,
            name: s.name.trim(),
            email: s.email?.trim() || null,
            amount: Math.max(0, Number(s.amount)),
            // Manual splits without an email are accepted by default
            status: hasEmail ? "pending" : "accepted",
          };
        });

      if (validSplits.length > 0) {
        const { data: insertedSplits, error: splitsError } = await supabase
          .from("subscription_splits")
          .insert(validSplits)
          .select("id, name, email, amount, user_id, status");

        if (splitsError) {
          return { success: false, error: splitsError.message };
        }

        // 3. Email only pending invitees with an email
        const unassignedInvites = (insertedSplits || []).filter(
          (split) =>
            split.email && !split.user_id && split.status === "pending",
        );

        if (unassignedInvites.length > 0) {
          after(async () => {
            for (const split of unassignedInvites) {
              try {
                await sendSplitInvitationEmail({
                  toEmail: split.email!,
                  recipientName: split.name,
                  inviterEmail: user.email || "A friend",
                  subscriptionName: input.name.trim(),
                  amount: Number(split.amount),
                  currency: input.currency || "EUR",
                });
              } catch (err) {
                console.error(
                  `Failed to send invite email to ${split.email}:`,
                  err,
                );
              }
            }
          });
        }
      }
    }

    revalidatePath("/[locale]/ledger", "page");
    return { success: true, data: { id: sub.id } };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "An unexpected error occurred."),
    };
  }
}

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const cleanCost = Math.max(0, Number(input.cost) || 0);
    const resolvedNextBilling = resolveDate(input.next_billing_date);
    const resolvedFirstBilled = resolveDate(
      input.first_billed_date,
      resolvedNextBilling,
    );

    // 1. Update root subscription
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        name: input.name.trim(),
        category: input.category,
        cost: cleanCost,
        currency: input.currency || "EUR",
        interval: input.interval,
        first_billed_date: resolvedFirstBilled,
        next_billing_date: resolvedNextBilling,
        is_zombie: input.is_zombie,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Re-sync splits while preserving existing acceptance status and user_id
    if (input.splits !== undefined) {
      // Fetch existing splits before deleting to retain status and user links
      const { data: existingSplits } = await supabase
        .from("subscription_splits")
        .select("id, name, email, status, user_id")
        .eq("subscription_id", id);

      const existingMap = new Map(
        (existingSplits || []).map((s) => [
          s.email?.trim().toLowerCase() || s.name.trim().toLowerCase(),
          s,
        ]),
      );

      const { error: deleteError } = await supabase
        .from("subscription_splits")
        .delete()
        .eq("subscription_id", id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      const validSplits = input.splits
        .filter((s) => s.name?.trim() && Number(s.amount) > 0)
        .map((s) => {
          const key =
            s.email?.trim().toLowerCase() || s.name.trim().toLowerCase();
          const prev = existingMap.get(key);
          const hasEmail = Boolean(s.email?.trim());

          return {
            subscription_id: id,
            name: s.name.trim(),
            email: s.email?.trim() || null,
            amount: Math.max(0, Number(s.amount)),
            // Retain previous status; if new and has no email, auto-accept
            status: prev?.status || (hasEmail ? "pending" : "accepted"),
            user_id: prev?.user_id || null,
          };
        });

      if (validSplits.length > 0) {
        const { data: insertedSplits, error: insertSplitsError } =
          await supabase
            .from("subscription_splits")
            .insert(validSplits)
            .select("id, name, email, amount, user_id, status");

        if (insertSplitsError) {
          return { success: false, error: insertSplitsError.message };
        }

        // Email only newly added email invites that weren't previously accepted
        const newInvites = (insertedSplits || []).filter(
          (split) =>
            split.email &&
            !split.user_id &&
            split.status === "pending" &&
            !existingMap.has(split.email.toLowerCase()),
        );

        if (newInvites.length > 0) {
          after(async () => {
            for (const split of newInvites) {
              try {
                await sendSplitInvitationEmail({
                  toEmail: split.email!,
                  recipientName: split.name,
                  inviterEmail: user.email || "A friend",
                  subscriptionName: input.name.trim(),
                  amount: Number(split.amount),
                  currency: input.currency || "EUR",
                });
              } catch (err) {
                console.error(
                  `Failed to send invite email to ${split.email}:`,
                  err,
                );
              }
            }
          });
        }
      }
    }

    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "An unexpected error occurred."),
    };
  }
}

export async function deleteSubscription(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const { error: deleteError } = await supabase
      .from("user_subscriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "An unexpected error occurred."),
    };
  }
}

export async function respondToSplitInvitation(
  splitId: string,
  accept: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Dismiss notification first
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("split_id", splitId)
      .eq("user_id", user.id);

    if (accept) {
      // 1. Mark accepted and bind to user
      const { error: splitError } = await supabase
        .from("subscription_splits")
        .update({
          status: "accepted",
          user_id: user.id,
        })
        .eq("id", splitId);

      if (splitError) return { success: false, error: splitError.message };
    } else {
      // 2. If rejected, remove it completely from splits
      const { error: deleteError } = await supabase
        .from("subscription_splits")
        .delete()
        .eq("id", splitId);

      if (deleteError) return { success: false, error: deleteError.message };
    }

    revalidatePath("/[locale]/ledger", "page");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to respond."),
    };
  }
}
