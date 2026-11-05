"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertTriangle, TrendingDown, Users } from "lucide-react";
import { UserSubscriptionRow } from "./types";
import {
  calculate12MonthForecast,
  calculateCategoryBreakdown,
  getNormalizedMonthly,
  getSubNetCost,
} from "./utils";
import { formatCurrency } from "@/app/lib/currency";

const PALETTE = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

export function LedgerAnalytics({
  subscriptions,
  baseCurrency = "EUR",
}: {
  subscriptions: UserSubscriptionRow[];
  baseCurrency?: string;
}) {
  const t = useTranslations("Dashboard");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || subscriptions.length === 0) return null;

  const isDark = resolvedTheme === "dark";
  const forecastData = calculate12MonthForecast(subscriptions);
  const categoryData = calculateCategoryBreakdown(subscriptions);

  // Compute total monthly recovery from splits
  const monthlyGross = subscriptions.reduce(
    (acc, s) => acc + getNormalizedMonthly(Number(s.cost), s.interval),
    0
  );
  const monthlyNet = subscriptions.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0
  );
  const monthlyCovered = Math.max(0, monthlyGross - monthlyNet);

  // Zombie analytics
  const zombieSubs = subscriptions.filter((s) => s.is_zombie);
  const zombieMonthlyLeak = zombieSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0
  );
  const zombieAnnualLeak = zombieMonthlyLeak * 12;

  return (
    <div className="space-y-4">
      {/* Zombie Leak Prediction Banner */}
      {zombieSubs.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {t("analytics.zombieWarningTitle")}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/90">
                {t("analytics.zombieWarningDesc", {
                  annualAmount: formatCurrency(zombieAnnualLeak, baseCurrency),
                  count: zombieSubs.length,
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-center font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
            <TrendingDown className="h-4 w-4" />
            <span>-{formatCurrency(zombieMonthlyLeak, baseCurrency)}/mo</span>
          </div>
        </div>
      )}

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Outflow Comparison Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                {t("analytics.title")}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("analytics.forecastSubtitle")}
              </p>
            </div>

            {/* Split recovery pill if splits exist */}
            {monthlyCovered > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                <Users className="h-3 w-3" />
                {t("analytics.splitSavingsPill", {
                  amount: formatCurrency(monthlyCovered, baseCurrency),
                })}
              </span>
            )}
          </div>

          {/* Chart Legend */}
          <div className="mb-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              <span>{t("analytics.yourShare")}</span>
            </div>
            {monthlyCovered > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" />
                <span>{t("analytics.coveredByFriends")}</span>
              </div>
            )}
          </div>

          {/* Responsive BarChart */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={forecastData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  stroke={isDark ? "#71717a" : "#a1a1aa"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={isDark ? "#71717a" : "#a1a1aa"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  cursor={{
                    fill: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.04)",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]
                        .payload as (typeof forecastData)[0];
                      return (
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900 text-xs">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                            {data.month} Breakdown
                          </p>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                              <span>{t("analytics.yourShare")}:</span>
                              <span className="font-bold">
                                {formatCurrency(data.net, baseCurrency)}
                              </span>
                            </div>

                            {data.covered > 0 && (
                              <div className="flex justify-between gap-4 text-sky-600 dark:text-sky-400">
                                <span>{t("analytics.coveredByFriends")}:</span>
                                <span>
                                  +{formatCurrency(data.covered, baseCurrency)}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1 flex justify-between gap-4 text-zinc-900 dark:text-zinc-100 font-semibold">
                              <span>{t("analytics.grossTotal")}:</span>
                              <span>
                                {formatCurrency(data.gross, baseCurrency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Stacked Bars: Base is what you pay, Top is what friends pay */}
                <Bar
                  dataKey="net"
                  stackId="outflow"
                  fill="#10b981"
                  radius={monthlyCovered > 0 ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="covered"
                  stackId="outflow"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              {t("analytics.categoryTitle")}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              {t("analytics.categorySubtitle")}
            </p>

            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0]
                          .payload as (typeof categoryData)[0];
                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-md dark:border-zinc-800 dark:bg-zinc-900 text-xs">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.category}:
                            </span>{" "}
                            <span className="font-mono text-zinc-600 dark:text-zinc-300">
                              {formatCurrency(item.amount, baseCurrency)}/mo (
                              {item.percentage}%)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <div
                key={cat.category}
                className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: PALETTE[idx % PALETTE.length],
                    }}
                  />
                  <span className="truncate">{cat.category}</span>
                </div>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
