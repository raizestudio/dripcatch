"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/app/lib/supabase/server"

export interface SubscriptionSplitInput {
  name: string
  email?: string | null
  amount: number
}

export interface AddSubscriptionInput {
  name: string
  category: string
  catalog_id?: string | null
  plan_id?: string | null
  cost: number
  currency: string
  interval: "weekly" | "monthly" | "quarterly" | "yearly"
  next_billing_date: string
  splits?: SubscriptionSplitInput[]
}

export interface UpdateSubscriptionInput {
  name: string
  category: string
  cost: number
  currency: string
  interval: "weekly" | "monthly" | "quarterly" | "yearly"
  next_billing_date: string
  is_zombie: boolean
  splits?: SubscriptionSplitInput[]
}

type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function createSubscription(
  input: AddSubscriptionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    if (!input.name?.trim()) {
      return { success: false, error: "Subscription name is required." }
    }

    const cleanCost = Math.max(0, Number(input.cost) || 0)

    // 1. Create the base subscription
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
        original_cost: cleanCost, // Set initial cost for price-hike detection
        next_billing_date: input.next_billing_date,
        status: "active",
      })
      .select("id")
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // 2. Insert splits if provided
    if (input.splits && input.splits.length > 0) {
      const validSplits = input.splits
        .filter((s) => s.name?.trim() && Number(s.amount) > 0)
        .map((s) => ({
          subscription_id: sub.id,
          name: s.name.trim(),
          email: s.email?.trim() || null,
          amount: Math.max(0, Number(s.amount)),
        }))

      if (validSplits.length > 0) {
        const { error: splitsError } = await supabase
          .from("subscription_splits")
          .insert(validSplits)

        if (splitsError) {
          return { success: false, error: splitsError.message }
        }
      }
    }

    revalidatePath("/[locale]/ledger", "page")
    return { success: true, data: { id: sub.id } }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred.",
    }
  }
}

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    const cleanCost = Math.max(0, Number(input.cost) || 0)

    // 1. Update the subscription row (keeps original_cost untouched)
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        name: input.name.trim(),
        category: input.category,
        cost: cleanCost,
        currency: input.currency || "EUR",
        interval: input.interval,
        next_billing_date: input.next_billing_date,
        is_zombie: input.is_zombie,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // 2. Sync splits if passed in the update payload
    if (input.splits !== undefined) {
      // Clear existing splits for this subscription
      const { error: deleteError } = await supabase
        .from("subscription_splits")
        .delete()
        .eq("subscription_id", id)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      const validSplits = input.splits
        .filter((s) => s.name?.trim() && Number(s.amount) > 0)
        .map((s) => ({
          subscription_id: id,
          name: s.name.trim(),
          email: s.email?.trim() || null,
          amount: Math.max(0, Number(s.amount)),
        }))

      if (validSplits.length > 0) {
        const { error: insertSplitsError } = await supabase
          .from("subscription_splits")
          .insert(validSplits)

        if (insertSplitsError) {
          return { success: false, error: insertSplitsError.message }
        }
      }
    }

    revalidatePath("/[locale]/ledger", "page")
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred.",
    }
  }
}

export async function deleteSubscription(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." }
    }

    // Cascade delete in Postgres will automatically clean up subscription_splits
    const { error: deleteError } = await supabase
      .from("user_subscriptions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/[locale]/ledger", "page")
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred.",
    }
  }
}
