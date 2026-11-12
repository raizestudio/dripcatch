"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

interface UserSettings {
  base_currency: string | null;
  reminder_days: number | null;
}

interface UserSettings {
  base_currency: string | null;
  reminder_days: number | null;
}

export async function getUserSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { base_currency: "EUR", reminder_days: 3 };

  const { data, error } = await supabase
    .from("user_settings")
    .select("base_currency, reminder_days")
    .eq("user_id", user.id)
    .maybeSingle()
    .overrideTypes<UserSettings, { merge: false }>();

  if (error || !data) {
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      base_currency: "EUR",
      reminder_days: 3,
    });
    return { base_currency: "EUR", reminder_days: 3 };
  }

  return {
    base_currency: data.base_currency || "EUR",
    reminder_days: data.reminder_days ?? 3,
  };
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

export async function updateReminderDays(reminder_days: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    reminder_days,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}
