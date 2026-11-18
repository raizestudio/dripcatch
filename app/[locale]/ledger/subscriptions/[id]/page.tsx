import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { getSubscriptionById } from "@/app/actions/subscriptions";
import { getUserSettings } from "@/app/actions/settings";
import { SubscriptionDetailView } from "@/app/components/ledger/detail/subscription-detail-view";

export const instant = false;

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await connection();

  const [subscription, settings] = await Promise.all([
    getSubscriptionById(id),
    getUserSettings(),
  ]);

  if (!subscription) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <SubscriptionDetailView
          subscription={subscription}
          baseCurrency={settings.base_currency}
        />
      </div>
    </div>
  );
}
