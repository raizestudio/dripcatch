"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

interface UserSettings {
  base_currency: string | null;
  reminder_days: number | null;
  calendar_feed_token: string | null;
}

const ALLOWED_REMINDER_DAYS = new Set([1, 2, 5, 10, 15]);
const ALLOWED_CURRENCIES = new Set([
  "EUR",
  "USD",
  "GBP",
  "CAD",
  "CHF",
  "AUD",
  "JPY",
]);

export async function getUserSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      base_currency: "EUR",
      reminder_days: 2,
      calendar_feed_token: null,
    };
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("base_currency, reminder_days, calendar_feed_token")
    .eq("user_id", user.id)
    .maybeSingle()
    .overrideTypes<UserSettings, { merge: false }>();

  if (error || !data) {
    await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        base_currency: "EUR",
        reminder_days: 2,
      },
      { onConflict: "user_id" },
    );

    return {
      base_currency: "EUR",
      reminder_days: 2,
      calendar_feed_token: null,
    };
  }

  return {
    base_currency: data.base_currency || "EUR",
    reminder_days: data.reminder_days ?? 2,
    calendar_feed_token: data.calendar_feed_token ?? null,
  };
}

export async function updateBaseCurrency(base_currency: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      base_currency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/ledger/settings", "page");
  return { success: true };
}

export async function updateReminderDays(reminder_days: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (!ALLOWED_REMINDER_DAYS.has(reminder_days)) {
    throw new Error("Invalid reminder lead time.");
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      reminder_days,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/ledger/settings", "page");
  return { success: true };
}

export async function updateLedgerSettings(input: {
  baseCurrency: string;
  reminderDays: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const baseCurrency = input.baseCurrency.toUpperCase().trim();
  const reminderDays = Number(input.reminderDays);

  if (!ALLOWED_CURRENCIES.has(baseCurrency)) {
    return { success: false, error: "Unsupported currency." };
  }

  if (!ALLOWED_REMINDER_DAYS.has(reminderDays)) {
    return { success: false, error: "Invalid reminder lead time." };
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      base_currency: baseCurrency,
      reminder_days: reminderDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[updateLedgerSettings] Supabase error:", error);
    return { success: false, error: "Failed to save settings." };
  }

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/ledger/settings", "page");

  return { success: true };
}
