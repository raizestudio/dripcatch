import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Bearer token
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Initialize Service Role Supabase Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Query active subscriptions
  const { data: subs, error: subsError } = await supabase
    .from("user_subscriptions")
    .select(
      "id, user_id, name, cost, currency, interval, next_billing_date, is_zombie"
    )
    .eq("status", "active");

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({
      message: "No active subscriptions to evaluate.",
    });
  }

  // 4. Fetch settings for all relevant users in a single query
  const userIds = Array.from(new Set(subs.map((s) => s.user_id)));
  const { data: settings } = await supabase
    .from("user_settings")
    .select("user_id, reminder_days, base_currency")
    .in("user_id", userIds);

  const settingsMap = new Map<
    string,
    { reminder_days: number; base_currency: string }
  >();

  settings?.forEach((s) => {
    settingsMap.set(s.user_id, {
      reminder_days: s.reminder_days ?? 3,
      base_currency: s.base_currency ?? "EUR",
    });
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notificationsToInsert: {
    user_id: string;
    subscription_id: string;
    type: "renewal";
    title: string;
    message: string;
    scheduled_for: string;
  }[] = [];

  for (const sub of subs) {
    if (!sub.next_billing_date) continue;

    const renewalDate = new Date(sub.next_billing_date);
    renewalDate.setHours(0, 0, 0, 0);

    const diffMs = renewalDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const userSetting = settingsMap.get(sub.user_id) ?? {
      reminder_days: 3,
      base_currency: "EUR",
    };

    const reminderDays = userSetting.reminder_days;

    // Trigger notification if renewal matches user's alert window or is due today
    if (diffDays === reminderDays || diffDays === 0) {
      const currency = sub.currency || userSetting.base_currency;
      const formattedCost = `${Number(sub.cost).toFixed(2)} ${currency}`;

      const message =
        diffDays === 0
          ? `Renews today for ${formattedCost}.`
          : `Renews in ${diffDays} day${diffDays > 1 ? "s" : ""} (${sub.next_billing_date}) for ${formattedCost}.`;

      notificationsToInsert.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        type: "renewal",
        title: `${sub.name} Renewal`,
        message,
        scheduled_for: sub.next_billing_date,
      });
    }
  }

  if (notificationsToInsert.length === 0) {
    return NextResponse.json({
      message: "Evaluated subscriptions, no alerts due today.",
    });
  }

  // 5. Batch upsert using unique deduplication index
  const { error: insertError } = await supabase
    .from("notifications")
    .upsert(notificationsToInsert, {
      onConflict: "user_id,subscription_id,scheduled_for,type",
      ignoreDuplicates: true,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    created: notificationsToInsert.length,
  });
}

export { GET as POST };
