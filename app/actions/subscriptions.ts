"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export interface AddSubscriptionInput {
  name: string;
  category: string;
  catalog_id?: string | null;
  plan_id?: string | null;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  next_billing_date: string;
}

export async function createSubscription(input: AddSubscriptionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("user_subscriptions").insert({
    user_id: user.id,
    catalog_id: input.catalog_id || null,
    plan_id: input.plan_id || null,
    name: input.name,
    category: input.category || "Other",
    cost: input.cost,
    currency: input.currency || "USD",
    interval: input.interval,
    original_cost: input.cost, // base cost for calculating future creep
    next_billing_date: input.next_billing_date,
    status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}
