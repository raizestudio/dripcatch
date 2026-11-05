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

  // 2. Initialize Service Role Supabase Client (bypasses RLS to query across users)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Query active subscriptions joined with user_settings
  const { data: subs, error: subsError } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      user_id,
      name,
      cost,
      currency,
      interval,
      next_billing_date,
      is_zombie,
      user_settings:user_id (
        reminder_days,
        base_currency
      )
    `)
    .eq("status", "active");

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ message: "No active subscriptions to evaluate." });
  }

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

    // Fall back to 3 days if settings don't exist yet
    const reminderDays = (sub.user_settings as any)?.reminder_days ?? 3;

    // Trigger notification if today exactly matches their alert window or is renewal day
    if (diffDays === reminderDays || diffDays === 0) {
      const currency = sub.currency || (sub.user_settings as any)?.base_currency || "EUR";
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
    return NextResponse.json({ message: "Evaluated subscriptions, no alerts due today." });
  }

  // 4. Batch upsert using the unique deduplication index
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
