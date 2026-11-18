"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

type RotateResult =
  | { success: true; token: string }
  | { success: false; error: string };

type RevokeResult = { success: true } | { success: false; error: string };

export async function rotateCalendarFeedToken(): Promise<RotateResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("user_settings")
        .update({
          calendar_feed_token: token,
          updated_at: now,
        })
        .eq("user_id", user.id)
    : await supabase.from("user_settings").insert({
        user_id: user.id,
        reminder_days: 2,
        calendar_feed_token: token,
        updated_at: now,
      });

  if (error) {
    console.error("[rotateCalendarFeedToken] Supabase error:", error);
    return { success: false, error: "Failed to generate calendar feed token." };
  }

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/settings", "page");

  return { success: true, token };
}

export async function revokeCalendarFeedToken(): Promise<RevokeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_settings")
    .update({
      calendar_feed_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("[revokeCalendarFeedToken] Supabase error:", error);
    return { success: false, error: "Failed to revoke calendar feed token." };
  }

  revalidatePath("/[locale]/ledger", "page");
  revalidatePath("/[locale]/settings", "page");

  return { success: true };
}
