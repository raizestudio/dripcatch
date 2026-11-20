// app/lib/payments/sync-payments.ts

import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingInterval = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RollForwardResult {
  processedSubscriptions: number;
  recordedPayments: number;
}

/**
 * Adds `steps` billing intervals to an anchor YYYY-MM-DD date without
 * timezone shifts or month-end drift (e.g. Jan 31 -> Feb 28 -> Mar 31).
 */
export function addBillingIntervals(
  anchorIso: string,
  steps: number,
  interval: BillingInterval,
): string {
  const [year, month, day] = anchorIso.split("-").map(Number);

  if (interval === "weekly") {
    const dt = new Date(Date.UTC(year, month - 1, day + steps * 7));
    return dt.toISOString().slice(0, 10);
  }

  const monthsToAdd =
    interval === "yearly"
      ? steps * 12
      : interval === "quarterly"
        ? steps * 3
        : steps;

  const targetMonthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const maxDayInMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, maxDayInMonth);

  return new Date(Date.UTC(targetYear, targetMonth, clampedDay))
    .toISOString()
    .slice(0, 10);
}

/**
 * Returns every YYYY-MM-DD billing date from `firstBilledDate` up to `endDateIso` (inclusive).
 */
export function generateDueBillingDates(
  firstBilledDate: string,
  endDateIso: string,
  interval: BillingInterval,
): string[] {
  if (!firstBilledDate || firstBilledDate > endDateIso) return [];

  const dates: string[] = [];
  let step = 0;

  while (step < 600) {
    const candidate = addBillingIntervals(firstBilledDate, step, interval);
    if (candidate > endDateIso) break;
    dates.push(candidate);
    step += 1;
  }

  return dates;
}

/**
 * Backfills historical payment rows from `first_billed_date` up to `today`
 * when a subscription is created manually or via Quick-Pick.
 */
export async function backfillSubscriptionPayments(
  supabase: SupabaseClient,
  params: {
    subscriptionId: string;
    userId: string;
    amount: number;
    currency: string;
    interval: BillingInterval;
    firstBilledDate: string | null;
    lastBilledDate?: string | null;
    status?: "active" | "paused" | "canceled";
  },
) {
  if (!params.firstBilledDate) return;

  const todayIso = new Date().toISOString().slice(0, 10);
  const cutoffIso =
    params.status && params.status !== "active" && params.lastBilledDate
      ? params.lastBilledDate < todayIso
        ? params.lastBilledDate
        : todayIso
      : todayIso;

  const dueDates = generateDueBillingDates(
    params.firstBilledDate,
    cutoffIso,
    params.interval,
  );

  if (dueDates.length === 0) return;

  const rows = dueDates.map((billedDate) => ({
    subscription_id: params.subscriptionId,
    user_id: params.userId,
    amount: params.amount,
    currency: params.currency,
    billed_date: billedDate,
    source: "manual",
  }));

  await supabase.from("subscription_payments").upsert(rows, {
    onConflict: "subscription_id,billed_date,amount",
    ignoreDuplicates: true,
  });

  const latestBilled = dueDates[dueDates.length - 1];
  await supabase
    .from("user_subscriptions")
    .update({ last_billed_date: latestBilled })
    .eq("id", params.subscriptionId)
    .eq("user_id", params.userId);
}

/**
 * Advances active subscriptions whose `next_billing_date` is today or in the past,
 * recording the missed/due payments into `subscription_payments` idempotently.
 * - Pass `userId` for scoped lazy execution on dashboard load.
 * - Omit `userId` for global multi-user execution via the daily cron job.
 */
export async function rollForwardDueRenewals(
  supabase: SupabaseClient,
  userId?: string,
): Promise<RollForwardResult> {
  const todayIso = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("user_subscriptions")
    .select(
      "id, user_id, cost, currency, interval, first_billed_date, next_billing_date",
    )
    .eq("status", "active")
    .not("next_billing_date", "is", null)
    .lte("next_billing_date", todayIso)
    .limit(500);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: dueSubs, error } = await query;

  if (error || !dueSubs || dueSubs.length === 0) {
    return { processedSubscriptions: 0, recordedPayments: 0 };
  }

  let processedSubscriptions = 0;
  let recordedPayments = 0;

  for (const sub of dueSubs) {
    if (!sub.next_billing_date) continue;

    const interval = (sub.interval || "monthly") as BillingInterval;
    const newPaymentDates: string[] = [];
    let cursor = sub.next_billing_date;
    let guard = 0;

    while (cursor <= todayIso && guard < 120) {
      newPaymentDates.push(cursor);
      guard += 1;
      cursor = addBillingIntervals(sub.next_billing_date, guard, interval);
    }

    if (newPaymentDates.length === 0) continue;

    const paymentRows = newPaymentDates.map((billedDate) => ({
      subscription_id: sub.id,
      user_id: sub.user_id,
      amount: Number(sub.cost),
      currency: sub.currency || "EUR",
      billed_date: billedDate,
      source: "manual",
    }));

    const { error: upsertError } = await supabase
      .from("subscription_payments")
      .upsert(paymentRows, {
        onConflict: "subscription_id,billed_date,amount",
        ignoreDuplicates: true,
      });

    if (upsertError) {
      console.error(
        `[rollForwardDueRenewals] Failed upserting payments for sub ${sub.id}:`,
        upsertError.message,
      );
      continue;
    }

    const latestBilled = newPaymentDates[newPaymentDates.length - 1];

    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        last_billed_date: latestBilled,
        next_billing_date: cursor,
        first_billed_date: sub.first_billed_date ?? newPaymentDates[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)
      .eq("user_id", sub.user_id);

    if (updateError) {
      console.error(
        `[rollForwardDueRenewals] Failed advancing dates for sub ${sub.id}:`,
        updateError.message,
      );
      continue;
    }

    processedSubscriptions += 1;
    recordedPayments += paymentRows.length;
  }

  return { processedSubscriptions, recordedPayments };
}
