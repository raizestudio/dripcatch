"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Ghost,
  Users,
  Wallet,
  Receipt,
  CalendarClock,
} from "lucide-react";
import { UserSubscriptionRow } from "./types";
import { calculateLedgerLifetimeMetrics, LifetimeSpendResult } from "./utils";

interface HistoryViewProps {
  subscriptions: UserSubscriptionRow[];
  baseCurrency: string;
  locale: string;
  currentUserId?: string;
  currentUserEmail?: string;
}

type HistoryFilter = "all" | "active" | "zombie" | "shared";

function getSubDisplayName(sub: UserSubscriptionRow): string {
  const record = sub as unknown as {
    name?: string;
    custom_name?: string;
    catalog_subscriptions?: { name?: string } | null;
  };
  return (
    record.name ||
    record.custom_name ||
    record.catalog_subscriptions?.name ||
    "Subscription"
  );
}

export function HistoryView({
  subscriptions,
  baseCurrency,
  locale,
  currentUserId,
  currentUserEmail,
}: HistoryViewProps) {
  const t = useTranslations("LedgerHistory");
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const metrics = useMemo(
    () =>
      calculateLedgerLifetimeMetrics(
        subscriptions,
        currentUserId,
        currentUserEmail,
      ),
    [subscriptions, currentUserId, currentUserEmail],
  );

  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: baseCurrency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (value: number) => formatter.format(value);
  }, [locale, baseCurrency]);

  const formatStartDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const match = dateStr.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
    if (!match) return dateStr;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = match[3] ? Number(match[3]) : 1;
    return new Date(year, month, day).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      ...(match[3] ? { day: "numeric" } : {}),
    });
  };

  const formatDuration = (lifetime: LifetimeSpendResult) => {
    if (lifetime.isUpcoming) return t("upcoming");
    if (lifetime.years === 0 && lifetime.months === 0) {
      return t("lessThanMonth");
    }
    const parts: string[] = [];
    if (lifetime.years > 0) {
      parts.push(t("yearsShort", { count: lifetime.years }));
    }
    if (lifetime.months > 0) {
      parts.push(t("monthsShort", { count: lifetime.months }));
    }
    return parts.join(" ");
  };

  const activeOutOfPocket = Math.max(
    0,
    metrics.totalNetPaid - metrics.totalZombieLeaked,
  );
  const grossTotal = metrics.totalGrossPaid;

  const activePct =
    grossTotal > 0 ? Math.round((activeOutOfPocket / grossTotal) * 100) : 0;
  const zombiePct =
    grossTotal > 0
      ? Math.round((metrics.totalZombieLeaked / grossTotal) * 100)
      : 0;
  const savedPct =
    grossTotal > 0 ? Math.max(0, 100 - activePct - zombiePct) : 0;

  const topVendors = useMemo(
    () =>
      [...metrics.items]
        .sort((a, b) => b.lifetime.grossPaid - a.lifetime.grossPaid)
        .slice(0, 6),
    [metrics.items],
  );
  const maxVendorGross = topVendors[0]?.lifetime.grossPaid || 0;

  const filteredItems = useMemo(() => {
    return metrics.items.filter(({ subscription, lifetime }) => {
      if (filter === "zombie") return Boolean(subscription.is_zombie);
      if (filter === "shared") return lifetime.coveredPaid > 0;
      if (filter === "active") return !subscription.is_zombie;
      return true;
    });
  }, [metrics.items, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ledger"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToLedger")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{t("kpi.allTimeNet")}</span>
            <Wallet className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatCurrency(metrics.totalNetPaid)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("kpi.grossVolume", {
              amount: formatCurrency(metrics.totalGrossPaid),
            })}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{t("kpi.splitSavings")}</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalSplitSavings)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("kpi.splitSavingsHint")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{t("kpi.zombieLeaked")}</span>
            <Ghost className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.totalZombieLeaked)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("kpi.zombieLeakedHint")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{t("kpi.billsPaid")}</span>
            <Receipt className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {metrics.totalBillsPaid.toLocaleString(locale)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("kpi.trackedSubs", { count: metrics.trackedCount })}
          </p>
        </div>
      </div>

      {/* Empty State if no subscriptions have first_billed_date */}
      {metrics.trackedCount === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <CalendarClock className="mx-auto h-8 w-8 text-zinc-400" />
          <h2 className="mt-3 text-base font-medium text-zinc-900 dark:text-zinc-100">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            {t("empty.description")}
          </p>
        </div>
      ) : (
        <>
          {/* Zombie & Shared Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Chart 1: Lifetime Composition (Active vs Zombie vs Shared) */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("charts.compositionTitle")}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("charts.compositionSubtitle")}
                </p>

                {/* Stacked Proportional Bar */}
                <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {activePct > 0 && (
                    <div
                      style={{ width: `${activePct}%` }}
                      className="bg-zinc-800 transition-all dark:bg-zinc-200"
                      title={`${t("charts.activeShare")}: ${formatCurrency(activeOutOfPocket)}`}
                    />
                  )}
                  {zombiePct > 0 && (
                    <div
                      style={{ width: `${zombiePct}%` }}
                      className="bg-rose-500 transition-all"
                      title={`${t("charts.zombieShare")}: ${formatCurrency(metrics.totalZombieLeaked)}`}
                    />
                  )}
                  {savedPct > 0 && (
                    <div
                      style={{ width: `${savedPct}%` }}
                      className="bg-emerald-500 transition-all"
                      title={`${t("charts.sharedShare")}: ${formatCurrency(metrics.totalSplitSavings)}`}
                    />
                  )}
                </div>
              </div>

              {/* Legend Breakdown */}
              <div className="mt-6 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {t("charts.activeShare")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-zinc-400">{activePct}%</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(activeOutOfPocket)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {t("charts.zombieShare")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-zinc-400">{zombiePct}%</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrency(metrics.totalZombieLeaked)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {t("charts.sharedShare")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-zinc-400">{savedPct}%</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(metrics.totalSplitSavings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Top Vendors Lifetime Ranking (Stacked Horizontal Bars) */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("charts.topVendorsTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("charts.topVendorsSubtitle")}
              </p>

              <div className="mt-4 space-y-3.5">
                {topVendors.map(({ subscription, lifetime }) => {
                  const totalWidthPct =
                    maxVendorGross > 0
                      ? Math.max(
                          4,
                          Math.round(
                            (lifetime.grossPaid / maxVendorGross) * 100,
                          ),
                        )
                      : 0;
                  const netRatio =
                    lifetime.grossPaid > 0
                      ? (lifetime.netPaid / lifetime.grossPaid) * 100
                      : 100;
                  const coveredRatio = Math.max(0, 100 - netRatio);

                  return (
                    <div key={subscription.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                            {getSubDisplayName(subscription)}
                          </span>
                          {subscription.is_zombie && (
                            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                              {t("badges.zombie")}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(lifetime.netPaid)}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          style={{ width: `${totalWidthPct}%` }}
                          className="flex h-full overflow-hidden rounded-full"
                        >
                          <div
                            style={{ width: `${netRatio}%` }}
                            className={
                              subscription.is_zombie
                                ? "bg-rose-500"
                                : "bg-zinc-800 dark:bg-zinc-200"
                            }
                          />
                          {coveredRatio > 0 && (
                            <div
                              style={{ width: `${coveredRatio}%` }}
                              className="bg-emerald-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lifetime Subscriptions Table */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("table.title")}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {(["all", "active", "zombie", "shared"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      filter === key
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/70"
                    }`}
                  >
                    {t(`filters.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                    <th className="px-4 py-3">{t("table.subscription")}</th>
                    <th className="px-4 py-3">{t("table.started")}</th>
                    <th className="px-4 py-3 text-right">{t("table.bills")}</th>
                    <th className="px-4 py-3 text-right">
                      {t("table.splitSaved")}
                    </th>
                    <th className="px-4 py-3 text-right">
                      {t("table.allTimePaid")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredItems.map(({ subscription, lifetime }) => (
                    <tr
                      key={subscription.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {getSubDisplayName(subscription)}
                          </span>
                          {subscription.is_zombie && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                              <Ghost className="h-3 w-3" />
                              {t("badges.zombie")}
                            </span>
                          )}
                          {lifetime.coveredPaid > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <Users className="h-3 w-3" />
                              {t("badges.shared")}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs capitalize text-zinc-500 dark:text-zinc-400">
                          {subscription.category} • {subscription.interval}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-zinc-800 dark:text-zinc-200">
                          {formatStartDate(subscription.first_billed_date)}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDuration(lifetime)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                        {lifetime.isUpcoming ? "0" : lifetime.cycles}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        {lifetime.coveredPaid > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            -{formatCurrency(lifetime.coveredPaid)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                        {lifetime.isUpcoming ? (
                          <span className="text-xs font-normal text-zinc-400">
                            {t("upcoming")}
                          </span>
                        ) : (
                          <span
                            className={
                              subscription.is_zombie
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            }
                          >
                            {formatCurrency(lifetime.netPaid)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {metrics.untrackedCount > 0 && (
              <div className="border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                {t("untrackedNotice", { count: metrics.untrackedCount })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
