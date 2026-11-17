import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { getUserSettings } from "@/app/actions/settings";
import { getSubscriptions } from "@/app/actions/subscriptions";
import { UserSubscriptionRow } from "@/app/components/ledger/types";
import { HistoryView } from "@/app/components/ledger/history-view";

export const instant = false;

export default async function LedgerHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await connection();

  const supabase = await createClient();

  const [
    userSubsData,
    settings,
    {
      data: { user },
    },
  ] = await Promise.all([
    getSubscriptions(),
    getUserSettings(),
    supabase.auth.getUser(),
  ]);

  const subscriptions = (userSubsData as unknown as UserSubscriptionRow[]) || [];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <HistoryView
          subscriptions={subscriptions}
          baseCurrency={settings.base_currency}
          locale={locale}
          currentUserId={user?.id}
          currentUserEmail={user?.email}
        />
      </div>
    </div>
  );
}
