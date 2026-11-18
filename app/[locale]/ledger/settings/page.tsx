import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { getUserSettings } from "@/app/actions/settings";
import { LedgerSettingsView } from "@/app/components/ledger/ledger-settings-view";

async function SettingsContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const settings = await getUserSettings();

  return (
    <LedgerSettingsView
      userEmail={user.email ?? ""}
      initialCurrency={settings.base_currency}
      initialReminderDays={settings.reminder_days}
      initialCalendarToken={settings.calendar_feed_token}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="h-14 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-52 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function LedgerSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent params={params} />
    </Suspense>
  );
}
