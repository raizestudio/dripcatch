"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/app/lib/supabase/server"

export interface AddSubscriptionInput {
  name: string
  category: string
  catalog_id?: string | null
  plan_id?: string | null
  cost: number
  currency: string
  interval: "weekly" | "monthly" | "quarterly" | "yearly"
  next_billing_date: string
}

export interface UpdateSubscriptionInput {
  name: string
  category: string
  cost: number
  currency: string
  interval: "weekly" | "monthly" | "quarterly" | "yearly"
  next_billing_date: string
  is_zombie: boolean
}

export async function createSubscription(input: AddSubscriptionInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("user_subscriptions").insert({
    user_id: user.id,
    catalog_id: input.catalog_id || null,
    plan_id: input.plan_id || null,
    name: input.name,
    category: input.category || "Other",
    cost: input.cost,
    currency: input.currency || "USD",
    interval: input.interval,
    original_cost: input.cost,
    next_billing_date: input.next_billing_date,
    status: "active",
  })

  if (error) throw new Error(error.message)

  revalidatePath("/[locale]/ledger", "page")
  return { success: true }
}

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      name: input.name,
      category: input.category,
      cost: input.cost,
      currency: input.currency,
      interval: input.interval,
      next_billing_date: input.next_billing_date,
      is_zombie: input.is_zombie,
      updated_at: new Date().toISOString(),
    })
    .match({ id, user_id: user.id })

  if (error) throw new Error(error.message)

  revalidatePath("/[locale]/ledger", "page")
  return { success: true }
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("user_subscriptions")
    .delete()
    .match({ id, user_id: user.id })

  if (error) throw new Error(error.message)

  revalidatePath("/[locale]/ledger", "page")
  return { success: true }
}
