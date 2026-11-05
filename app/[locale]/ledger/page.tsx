import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { CatalogItem } from "@/app/components/ledger/add-subscription-modal";
import { UserSubscriptionRow } from "@/app/components/ledger/types";
import { LedgerView } from "@/app/components/ledger/ledger-view";

export const instant = false;

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await connection();

  const supabase = await createClient();

  const [{ data: userSubsData }, { data: catalogData }] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("catalog_subscriptions")
      .select(
        `
        id,
        name,
        slug,
        category,
        catalog_subscription_plans (
          id,
          name,
          default_cost,
          currency,
          interval
        )
      `,
      )
      .order("name", { ascending: true }),
  ]);

  const subscriptions = (userSubsData as UserSubscriptionRow[]) || [];
  const catalog = (catalogData as unknown as CatalogItem[]) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 text-zinc-900 dark:text-zinc-100 sm:p-8 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="mx-auto max-w-5xl">
        <LedgerView subscriptions={subscriptions} catalog={catalog} />
      </div>
    </div>
  );
}
