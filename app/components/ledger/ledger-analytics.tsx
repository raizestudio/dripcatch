"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { UserSubscriptionRow } from "./types";
import {
  calculate12MonthForecast,
  calculateCategoryBreakdown,
  getNormalizedMonthly,
  getSubNetCost,
} from "./utils";
import { ZombieWarningBanner } from "./analytics/zombie-warning-banner";
import { AnalyticsKpiCards } from "./analytics/analytics-kpi-cards";
import { OutflowForecastChart } from "./analytics/outflow-forecast-chart";
import { CategoryDonutChart } from "./analytics/category-donut-chart";

const emptySubscribe = () => () => {};

export function LedgerAnalytics({
  subscriptions,
  baseCurrency = "EUR",
}: {
  subscriptions: UserSubscriptionRow[];
  baseCurrency?: string;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted || subscriptions.length === 0) return null;

  const isDark = resolvedTheme === "dark";
  const todayStr = new Date().toISOString().split("T")[0];

  const activeBilledSubs = subscriptions.filter(
    (s) =>
      s.status !== "cancelled" &&
      (!s.first_billed_date || s.first_billed_date <= todayStr),
  );

  const forecastData = calculate12MonthForecast(subscriptions);
  const categoryData = calculateCategoryBreakdown(activeBilledSubs);

  // 1. Paid & In Use
  const activeSubs = activeBilledSubs.filter((s) => !s.is_zombie);
  const monthlyActiveUsed = activeSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0,
  );

  // 2. Paid but Unused (Zombie)
  const zombieSubs = activeBilledSubs.filter((s) => s.is_zombie);
  const zombieMonthlyLeak = zombieSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0,
  );
  const zombieAnnualLeak = zombieMonthlyLeak * 12;

  // 3. Covered by Splits
  const monthlyGross = activeBilledSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(Number(s.cost), s.interval),
    0,
  );
  const monthlyCovered = Math.max(
    0,
    monthlyGross - (monthlyActiveUsed + zombieMonthlyLeak),
  );

  return (
    <div className="space-y-4">
      {zombieSubs.length > 0 && (
        <ZombieWarningBanner
          count={zombieSubs.length}
          monthlyLeak={zombieMonthlyLeak}
          annualLeak={zombieAnnualLeak}
          currency={baseCurrency}
        />
      )}

      <AnalyticsKpiCards
        activeUsed={monthlyActiveUsed}
        zombieLeak={zombieMonthlyLeak}
        zombieCount={zombieSubs.length}
        covered={monthlyCovered}
        currency={baseCurrency}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OutflowForecastChart
            data={forecastData}
            covered={monthlyCovered}
            isDark={isDark}
            currency={baseCurrency}
          />
        </div>

        <div className="lg:col-span-1">
          <CategoryDonutChart data={categoryData} currency={baseCurrency} />
        </div>
      </div>
    </div>
  );
}
