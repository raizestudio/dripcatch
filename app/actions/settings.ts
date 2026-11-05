"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export async function getUserSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { base_currency: "USD" };

  const { data, error } = await supabase
    .from("user_settings")
    .select("base_currency")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    // Initialize default row if not found
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      base_currency: "USD",
    });
    return { base_currency: "USD" };
  }

  return { base_currency: data.base_currency || "USD" };
}

export async function updateBaseCurrency(base_currency: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    base_currency,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}
