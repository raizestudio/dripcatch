import { useTranslations } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { TrendingUp, Ghost, Activity, AlertCircle } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import {
  AddSubscriptionModal,
  CatalogItem,
} from "@/app/components/ledger/add-subscription-modal";

// Marks this user-specific dashboard route as a blocking dynamic route
export const instant = false;

interface UserSubscriptionRow {
  id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  original_cost: number | null;
  next_billing_date: string;
  is_zombie: boolean;
  status: string;
}

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

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

  const subscriptions: UserSubscriptionRow[] =
    (userSubsData as UserSubscriptionRow[]) || [];
  const catalog = (catalogData as unknown as CatalogItem[]) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 text-zinc-900 dark:text-zinc-100 sm:p-8 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
          <AddSubscriptionModal catalog={catalog} />
        </header>

        <LedgerView subscriptions={subscriptions} catalog={catalog} />
      </div>
    </div>
  );
}

function LedgerView({
  subscriptions,
  catalog,
}: {
  subscriptions: UserSubscriptionRow[];
  catalog: CatalogItem[];
}) {
  const t = useTranslations("Dashboard");

  const getNormalizedMonthly = (cost: number, interval: string) => {
    switch (interval) {
      case "yearly":
        return cost / 12;
      case "quarterly":
        return cost / 3;
      case "weekly":
        return (cost * 52) / 12;
      case "monthly":
      default:
        return cost;
    }
  };

  const monthlyBurn = subscriptions.reduce((acc, sub) => {
    return acc + getNormalizedMonthly(Number(sub.cost), sub.interval);
  }, 0);

  const projectedAnnual = monthlyBurn * 12;
  const zombiesCount = subscriptions.filter((s) => s.is_zombie).length;
  const hikesCount = subscriptions.filter(
    (s) => s.original_cost && Number(s.cost) > Number(s.original_cost),
  ).length;

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("kpi.monthly")}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
            ${monthlyBurn.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("kpi.annual")}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
            ${projectedAnnual.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400/80">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("kpi.hikes")}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {hikesCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400/80">
            <Ghost className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t("kpi.zombies")}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {zombiesCount}
          </p>
        </div>
      </section>

      {/* Ledger Table vs Empty State */}
      {subscriptions.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
            {t("emptyState.title")}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t("emptyState.desc")}
          </p>
          <div className="mt-5">
            <AddSubscriptionModal catalog={catalog} />
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.service")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.interval")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.cost")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.normalized")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.renewal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {subscriptions.map((sub) => {
                  const costNum = Number(sub.cost);
                  const originalCostNum = sub.original_cost
                    ? Number(sub.original_cost)
                    : costNum;
                  const normalized = getNormalizedMonthly(costNum, sub.interval);
                  const hasHike = originalCostNum < costNum;

                  return (
                    <tr
                      key={sub.id}
                      className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {sub.name}
                          </span>
                          {hasHike && (
                            <span className="inline-flex items-center rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              +${(costNum - originalCostNum).toFixed(2)}{" "}
                              {t("badges.hike")}
                            </span>
                          )}
                          {sub.is_zombie && (
                            <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {t("badges.zombie")}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {sub.category}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {t(`badges.${sub.interval}`)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                        ${costNum.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-500">
                        ${normalized.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {sub.next_billing_date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
