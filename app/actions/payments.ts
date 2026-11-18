"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { getErrorMessage } from "@/app/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActionResponse<T = void> =
  { success: true; data?: T } | { success: false; error: string };

async function syncSubscriptionLastBilledDate(
  supabase: SupabaseClient,
  subscriptionId: string,
  userId: string,
) {
  const { data: latestRow } = await supabase
    .from("subscription_payments")
    .select("billed_date")
    .eq("subscription_id", subscriptionId)
    .eq("user_id", userId)
    .order("billed_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("user_subscriptions")
    .update({
      last_billed_date: latestRow?.billed_date ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", userId);
}

function revalidateLedgerPaths(subscriptionId: string) {
  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/ledger/history", "page");
  revalidatePath(`/[locale]/ledger/subscriptions/${subscriptionId}`, "page");
}

export async function addSubscriptionPayment(
  subscriptionId: string,
  input: {
    billedDate: string;
    amount: number;
    currency?: string;
  },
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!UUID_RE.test(subscriptionId)) {
      return { success: false, error: "Invalid subscription ID." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!ISO_DATE_RE.test(input.billedDate)) {
      return { success: false, error: "Valid billing date is required." };
    }

    const numericAmount = Number(input.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return { success: false, error: "Amount must be 0 or greater." };
    }

    // Verify ownership before inserting
    const { data: sub, error: subError } = await supabase
      .from("user_subscriptions")
      .select("id, currency")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError || !sub) {
      return { success: false, error: "Subscription not found." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("subscription_payments")
      .insert({
        subscription_id: subscriptionId,
        user_id: user.id,
        amount: numericAmount,
        currency: (input.currency || sub.currency || "EUR").toUpperCase(),
        billed_date: input.billedDate,
        source: "manual",
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "A payment with this exact date and amount already exists.",
        };
      }
      return { success: false, error: insertError.message };
    }

    await syncSubscriptionLastBilledDate(supabase, subscriptionId, user.id);
    revalidateLedgerPaths(subscriptionId);

    return { success: true, data: { id: inserted.id } };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to log payment."),
    };
  }
}

export async function updateSubscriptionPayment(
  paymentId: string,
  input: {
    billedDate: string;
    amount: number;
  },
): Promise<ActionResponse> {
  try {
    if (!UUID_RE.test(paymentId)) {
      return { success: false, error: "Invalid payment ID." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!ISO_DATE_RE.test(input.billedDate)) {
      return { success: false, error: "Valid billing date is required." };
    }

    const numericAmount = Number(input.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return { success: false, error: "Amount must be 0 or greater." };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("subscription_payments")
      .select("id, subscription_id")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Payment record not found." };
    }

    const { error: updateError } = await supabase
      .from("subscription_payments")
      .update({
        billed_date: input.billedDate,
        amount: numericAmount,
      })
      .eq("id", paymentId)
      .eq("user_id", user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          success: false,
          error: "A payment with this exact date and amount already exists.",
        };
      }
      return { success: false, error: updateError.message };
    }

    await syncSubscriptionLastBilledDate(
      supabase,
      existing.subscription_id,
      user.id,
    );
    revalidateLedgerPaths(existing.subscription_id);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to update payment."),
    };
  }
}

export async function deleteSubscriptionPayment(
  paymentId: string,
): Promise<ActionResponse> {
  try {
    if (!UUID_RE.test(paymentId)) {
      return { success: false, error: "Invalid payment ID." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("subscription_payments")
      .select("id, subscription_id")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Payment record not found." };
    }

    const { error: deleteError } = await supabase
      .from("subscription_payments")
      .delete()
      .eq("id", paymentId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    await syncSubscriptionLastBilledDate(
      supabase,
      existing.subscription_id,
      user.id,
    );
    revalidateLedgerPaths(existing.subscription_id);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to delete payment."),
    };
  }
}
