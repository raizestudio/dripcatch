"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { sendSplitInvitationEmail } from "@/app/lib/mail";
import { getErrorMessage } from "@/app/lib/utils";
import {
  backfillSubscriptionPayments,
  rollForwardDueRenewals,
  type BillingInterval,
} from "@/app/lib/payments/sync-payments";
import type { SubscriptionImportDraft } from "@/app/components/ledger/types";

export interface SubscriptionPaymentItem {
  id: string;
  amount: number;
  currency: string;
  billed_date: string;
  source?: string;
}

export interface UserSubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  original_cost: number | null;
  first_billed_date: string | null;
  last_billed_date?: string | null;
  next_billing_date: string | null;
  is_zombie: boolean;
  status: "active" | "paused" | "canceled";
  is_owner?: boolean;
  effective_cost?: number;
  subscription_splits?: {
    id: string;
    name: string;
    email?: string | null;
    amount: number;
    user_id?: string | null;
  }[];
  subscription_payments?: SubscriptionPaymentItem[];
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

const ALLOWED_STATUSES = new Set(["active", "paused", "canceled"]);
const ALLOWED_INTERVALS = new Set(["weekly", "monthly", "quarterly", "yearly"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface UpdateSubscriptionInput {
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  status?: "active" | "paused" | "canceled";
  first_billed_date?: string | null;
  last_billed_date?: string | null;
  next_billing_date?: string | null;
  is_zombie?: boolean;
  splits?: {
    name: string;
    email?: string | null;
    amount: number;
  }[];
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
  first_billed_date: string | null;
  last_billed_date: string | null;
  next_billing_date: string | null;
  is_zombie: boolean;
  status: "active" | "paused" | "canceled";
  is_owner: boolean;
  splits: SubscriptionSplitItem[];
  subscription_splits: SubscriptionSplitItem[];
  subscription_payments: SubscriptionPaymentItem[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SubscriptionDetailRow extends SharedSubscriptionRow {
  original_cost: number | null;
  last_hike_date: string | null;
  notes: string | null;
}

interface RawSubscriptionQueryRow extends Omit<
  UserSubscriptionRow,
  "subscription_splits"
> {
  subscription_splits?: SubscriptionSplitItem[] | null;
}

type ActionResponse<T = void> =
  { success: true; data?: T } | { success: false; error: string };

function resolveDate(dateStr?: string | null, fallback?: string): string {
  const trimmed = dateStr?.trim();
  if (trimmed) return trimmed;
  const fallbackTrimmed = fallback?.trim();
  if (fallbackTrimmed) return fallbackTrimmed;
  return new Date().toISOString().split("T")[0];
}

function normalizeOptionalDate(value?: string | null): string | null {
  if (!value || !value.trim()) return null;
  return resolveDate(value);
}

export async function getSubscriptions(): Promise<SharedSubscriptionRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Record any due renewals into subscription_payments and advance next_billing_date
  await rollForwardDueRenewals(supabase, user.id);

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
          last_billed_date,
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
          ),
          subscription_payments (
            id,
            amount,
            currency,
            billed_date,
            source
          )
        `,
    )
    .order("next_billing_date", { ascending: true, nullsFirst: false })
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
        first_billed_date: sub.first_billed_date ?? null,
        last_billed_date: sub.last_billed_date ?? null,
        next_billing_date: sub.next_billing_date ?? null,
        is_zombie: sub.is_zombie,
        status: sub.status,
        is_owner: isOwner,
        splits,
        subscription_splits: splits,
        subscription_payments: (sub.subscription_payments || []).map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
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
    const currency = (input.currency || "EUR").toUpperCase();
    const interval = (input.interval || "monthly") as BillingInterval;
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
        currency,
        interval,
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

    // 2. Backfill historical payments from first_billed_date up to today
    await backfillSubscriptionPayments(supabase, {
      subscriptionId: sub.id,
      userId: user.id,
      amount: cleanCost,
      currency,
      interval,
      firstBilledDate: resolvedFirstBilled,
      status: "active",
    });

    // 3. Insert splits
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
                  currency,
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
    revalidatePath("/[locale]/ledger/history", "page");
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

    const status = input.status ?? "active";
    if (!ALLOWED_STATUSES.has(status)) {
      return { success: false, error: "Invalid subscription status." };
    }

    const cleanCost = Math.max(0, Number(input.cost) || 0);
    const resolvedFirstBilled = normalizeOptionalDate(input.first_billed_date);
    const resolvedLastBilled = normalizeOptionalDate(input.last_billed_date);
    const resolvedNextBilling =
      status === "canceled"
        ? null
        : normalizeOptionalDate(input.next_billing_date);

    if (status === "active" && !resolvedNextBilling) {
      return {
        success: false,
        error: "Next billing date is required for active subscriptions.",
      };
    }

    // 1. Update root subscription
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        name: input.name.trim(),
        category: input.category,
        cost: cleanCost,
        currency: input.currency || "EUR",
        interval: input.interval,
        status,
        first_billed_date: resolvedFirstBilled,
        last_billed_date: resolvedLastBilled,
        next_billing_date: resolvedNextBilling,
        is_zombie: status === "canceled" ? false : Boolean(input.is_zombie),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Re-sync splits while preserving existing acceptance status and user_id
    if (input.splits !== undefined) {
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
    revalidatePath("/[locale]/ledger/history", "page");
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
    revalidatePath("/[locale]/ledger/history", "page");
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

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("split_id", splitId)
      .eq("user_id", user.id);

    if (accept) {
      const { error: splitError } = await supabase
        .from("subscription_splits")
        .update({
          status: "accepted",
          user_id: user.id,
        })
        .eq("id", splitId);

      if (splitError) return { success: false, error: splitError.message };
    } else {
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

function mapSourceToPaymentSource(
  source: SubscriptionImportDraft["source"],
): string {
  switch (source) {
    case "csv_statement":
      return "csv_import";
    case "email_receipt":
      return "email_receipt";
    case "screenshot_ocr":
      return "screenshot_ocr";
    case "open_banking":
      return "open_banking";
    case "catalog_quick_pick":
    default:
      return "manual";
  }
}

export async function createSubscriptionsBatch(
  drafts: SubscriptionImportDraft[],
): Promise<
  { success: true; count: number } | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const selectedDrafts = drafts.filter((d) => d.selected);
  if (selectedDrafts.length === 0) {
    return {
      success: false,
      error: "Select at least one subscription to import.",
    };
  }

  if (selectedDrafts.length > 100) {
    return { success: false, error: "Maximum 100 subscriptions per batch." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const rows = [];

  for (const draft of selectedDrafts) {
    const cleanName = draft.name.trim();
    const numericCost = Number(draft.cost);
    const status = draft.status ?? "active";

    if (!cleanName) {
      return {
        success: false,
        error: "All imported subscriptions must have a name.",
      };
    }
    if (!Number.isFinite(numericCost) || numericCost < 0) {
      return { success: false, error: `Invalid cost for "${cleanName}".` };
    }
    if (!ALLOWED_INTERVALS.has(draft.interval)) {
      return {
        success: false,
        error: `Invalid billing interval for "${cleanName}".`,
      };
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return {
        success: false,
        error: `Invalid status for "${cleanName}".`,
      };
    }
    if (draft.nextBillingDate && !ISO_DATE_RE.test(draft.nextBillingDate)) {
      return {
        success: false,
        error: `Invalid renewal date for "${cleanName}".`,
      };
    }
    if (status === "active" && !draft.nextBillingDate) {
      return {
        success: false,
        error: `Renewal date is required for active subscription "${cleanName}".`,
      };
    }

    const firstBilled =
      draft.firstBilledDate && ISO_DATE_RE.test(draft.firstBilledDate)
        ? draft.firstBilledDate
        : today;

    const lastBilled =
      draft.lastBilledDate && ISO_DATE_RE.test(draft.lastBilledDate)
        ? draft.lastBilledDate
        : null;

    const originalCost =
      typeof draft.originalCost === "number" &&
      Number.isFinite(draft.originalCost)
        ? draft.originalCost
        : numericCost;

    rows.push({
      user_id: user.id,
      catalog_id: draft.catalogId || null,
      plan_id: draft.planId || null,
      name: cleanName,
      category: draft.category.trim() || "Other",
      cost: numericCost,
      currency: (draft.currency || "EUR").toUpperCase(),
      interval: draft.interval,
      original_cost: originalCost,
      last_hike_date: draft.lastHikeDate ?? null,
      first_billed_date: firstBilled,
      last_billed_date: lastBilled,
      next_billing_date: status === "canceled" ? null : draft.nextBillingDate,
      status,
    });
  }

  const { data: insertedSubs, error } = await supabase
    .from("user_subscriptions")
    .insert(rows)
    .select("id");

  if (error || !insertedSubs) {
    console.error("[createSubscriptionsBatch] Supabase error:", error);
    return { success: false, error: "Failed to import subscriptions." };
  }

  // Record payments for every imported subscription (factual statement rows or backfilled schedule)
  for (let i = 0; i < selectedDrafts.length; i++) {
    const draft = selectedDrafts[i];
    const subId = insertedSubs[i]?.id;
    if (!subId) continue;

    if (draft.payments && draft.payments.length > 0) {
      const paymentSource = mapSourceToPaymentSource(draft.source);
      const paymentRows = draft.payments
        .filter((p) => ISO_DATE_RE.test(p.billedDate) && p.amount >= 0)
        .map((p) => ({
          subscription_id: subId,
          user_id: user.id,
          amount: p.amount,
          currency: (p.currency || draft.currency || "EUR").toUpperCase(),
          billed_date: p.billedDate,
          source: paymentSource,
        }));

      if (paymentRows.length > 0) {
        await supabase.from("subscription_payments").upsert(paymentRows, {
          onConflict: "subscription_id,billed_date,amount",
          ignoreDuplicates: true,
        });
      }
    } else {
      await backfillSubscriptionPayments(supabase, {
        subscriptionId: subId,
        userId: user.id,
        amount: Number(draft.cost),
        currency: (draft.currency || "EUR").toUpperCase(),
        interval: draft.interval,
        firstBilledDate: rows[i].first_billed_date,
        lastBilledDate: rows[i].last_billed_date,
        status: rows[i].status as "active" | "paused" | "canceled",
      });
    }
  }

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/ledger/history", "page");

  return { success: true, count: rows.length };
}

export async function getSubscriptionById(
  id: string,
): Promise<SubscriptionDetailRow | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await rollForwardDueRenewals(supabase, user.id);

  const { data: sub, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
        id,
        user_id,
        name,
        category,
        cost,
        original_cost,
        last_hike_date,
        currency,
        interval,
        first_billed_date,
        last_billed_date,
        next_billing_date,
        is_zombie,
        status,
        notes,
        subscription_splits (
          id,
          name,
          email,
          amount,
          user_id,
          status
        ),
        subscription_payments (
          id,
          amount,
          currency,
          billed_date,
          source
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !sub) return null;

  const isOwner = sub.user_id === user.id;
  const splits = (sub.subscription_splits || []) as SubscriptionSplitItem[];

  // Verify access: must be owner or an accepted split participant
  if (!isOwner) {
    const mySplit = splits.find(
      (s) =>
        s.user_id === user.id ||
        (s.email &&
          user.email &&
          s.email.toLowerCase() === user.email.toLowerCase()),
    );
    if (!mySplit || mySplit.status !== "accepted") {
      return null;
    }
  }

  const totalCost = Number(sub.cost);
  let effectiveCost = totalCost;

  if (isOwner) {
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

  const payments = (
    (sub.subscription_payments || []) as SubscriptionPaymentItem[]
  )
    .map((p) => ({
      ...p,
      amount: Number(p.amount),
    }))
    .sort((a, b) => b.billed_date.localeCompare(a.billed_date));

  return {
    id: sub.id,
    user_id: sub.user_id,
    name: sub.name,
    category: sub.category,
    cost: totalCost,
    original_cost:
      sub.original_cost !== null ? Number(sub.original_cost) : null,
    last_hike_date: sub.last_hike_date ?? null,
    effective_cost: effectiveCost,
    currency: sub.currency,
    interval: sub.interval as SharedSubscriptionRow["interval"],
    first_billed_date: sub.first_billed_date ?? null,
    last_billed_date: sub.last_billed_date ?? null,
    next_billing_date: sub.next_billing_date ?? null,
    is_zombie: Boolean(sub.is_zombie),
    status: sub.status as SharedSubscriptionRow["status"],
    notes: sub.notes ?? null,
    is_owner: isOwner,
    splits,
    subscription_splits: splits,
    subscription_payments: payments,
  };
}
