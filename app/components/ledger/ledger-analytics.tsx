"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  CheckCircle2,
  Ghost,
  PieChart as PieIcon,
} from "lucide-react";
import { UserSubscriptionRow } from "./types";
import {
  calculate12MonthForecast,
  calculateCategoryBreakdown,
  getNormalizedMonthly,
  getSubNetCost,
} from "./utils";
import { formatCurrency } from "@/app/lib/currency";

const PALETTE = [
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
];

const renderActiveSector = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g>
      {/* Outer ambient glow ring */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 2}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      {/* Expanded Main Slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const emptySubscribe = () => () => {};

export function LedgerAnalytics({
  subscriptions,
  baseCurrency = "EUR",
}: {
  subscriptions: UserSubscriptionRow[];
  baseCurrency?: string;
}) {
  const t = useTranslations("Dashboard");
  const { resolvedTheme } = useTheme();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
    null,
  );

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted || subscriptions.length === 0) return null;

  const isDark = resolvedTheme === "dark";
  const todayStr = new Date().toISOString().split("T")[0];

  // Active subscriptions as of today
  const activeBilledSubs = subscriptions.filter(
    (s) => !s.first_billed_date || s.first_billed_date <= todayStr,
  );

  // 12-month 3-part forecast data
  const forecastData = calculate12MonthForecast(subscriptions);

  // Category distribution
  const categoryData = calculateCategoryBreakdown(activeBilledSubs);

  const totalCategorySpend = categoryData.reduce((acc, c) => acc + c.amount, 0);
  const activeCategory =
    activeCategoryIndex !== null ? categoryData[activeCategoryIndex] : null;

  // 1. Paid & In Use (Non-zombie Net share)
  const activeSubs = activeBilledSubs.filter((s) => !s.is_zombie);
  const monthlyActiveUsed = activeSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0,
  );

  // 2. Paid but Unused (Zombie Leak Net share)
  const zombieSubs = activeBilledSubs.filter((s) => s.is_zombie);
  const zombieMonthlyLeak = zombieSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(getSubNetCost(s), s.interval),
    0,
  );
  const zombieAnnualLeak = zombieMonthlyLeak * 12;

  // 3. Paid by Others (Covered by splits)
  const monthlyGross = activeBilledSubs.reduce(
    (acc, s) => acc + getNormalizedMonthly(Number(s.cost), s.interval),
    0,
  );
  const monthlyCovered = Math.max(
    0,
    monthlyGross - (monthlyActiveUsed + zombieMonthlyLeak),
  );

  const renderSector = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, index } =
      props;
    const fill = PALETTE[(index ?? 0) % PALETTE.length];
    const isActive = activeCategoryIndex === index;
    const isDimmed = activeCategoryIndex !== null && !isActive;

    if (isActive) {
      return (
        <g className="cursor-pointer transition-all duration-200">
          {/* Outer ambient glow ring */}
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={outerRadius + 2}
            outerRadius={outerRadius + 5}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            opacity={0.3}
          />
          {/* Expanded Main Slice */}
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius - 2}
            outerRadius={outerRadius + 4}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
        </g>
      );
    }

    // Normal / Dimmed Slice
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={isDimmed ? 0.35 : 1}
        className="cursor-pointer transition-opacity duration-200"
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Zombie Warning Banner */}
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

      {/* 3-Part KPI Snapshot Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Metric 1: Active & Used */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Paid & In Use</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(monthlyActiveUsed, baseCurrency)}
            <span className="text-xs font-normal text-zinc-400">/mo</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Active recurring utility
          </p>
        </div>

        {/* Metric 2: Paid but Unused (Zombie) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Paid but Unused</span>
            <Ghost className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {formatCurrency(zombieMonthlyLeak, baseCurrency)}
            <span className="text-xs font-normal text-zinc-400">/mo</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {zombieSubs.length} zombie{" "}
            {zombieSubs.length === 1 ? "subscription" : "subscriptions"}
          </p>
        </div>

        {/* Metric 3: Paid by Others */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Paid by Others</span>
            <Users className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
            {formatCurrency(monthlyCovered, baseCurrency)}
            <span className="text-xs font-normal text-zinc-400">/mo</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Covered by splits & friends
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Stacked Area Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                {t("analytics.title")}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                12-month projection showing utilized vs wasted vs split costs
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Paid & Used</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Paid & Unused (Zombie)</span>
            </div>
            {monthlyCovered > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>Paid by Others</span>
              </div>
            )}
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecastData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>

                  <linearGradient id="colorZombie" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>

                  <linearGradient id="colorCovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

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
                    stroke: isDark ? "#52525b" : "#d4d4d8",
                    strokeDasharray: "4 4",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]
                        .payload as (typeof forecastData)[0];
                      return (
                        <div className="rounded-xl border border-zinc-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 text-xs min-w-48">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                            {data.month} Forecast
                          </p>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                              <span>Paid & Used:</span>
                              <span className="font-bold">
                                {formatCurrency(data.active, baseCurrency)}
                              </span>
                            </div>

                            {data.zombie > 0 && (
                              <div className="flex justify-between gap-4 text-amber-600 dark:text-amber-400">
                                <span>Unused (Zombie):</span>
                                <span className="font-bold">
                                  +{formatCurrency(data.zombie, baseCurrency)}
                                </span>
                              </div>
                            )}

                            {data.covered > 0 && (
                              <div className="flex justify-between gap-4 text-sky-600 dark:text-sky-400">
                                <span>Paid by Others:</span>
                                <span>
                                  +{formatCurrency(data.covered, baseCurrency)}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1.5 mt-1 flex justify-between gap-4 text-zinc-900 dark:text-zinc-100 font-semibold">
                              <span>Your Net Outflow:</span>
                              <span>
                                {formatCurrency(data.net, baseCurrency)}
                              </span>
                            </div>

                            {data.covered > 0 && (
                              <div className="flex justify-between gap-4 text-zinc-400 text-[10px]">
                                <span>Total Plan Value:</span>
                                <span>
                                  {formatCurrency(data.gross, baseCurrency)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="outflow"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorActive)"
                />
                <Area
                  type="monotone"
                  dataKey="zombie"
                  stackId="outflow"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorZombie)"
                />
                <Area
                  type="monotone"
                  dataKey="covered"
                  stackId="outflow"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#colorCovered)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t("analytics.categoryTitle")}
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t("analytics.categorySubtitle")}
                </p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <PieIcon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="relative mt-2 flex h-48 w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    shape={renderSector}
                    onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center HUD Overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="max-w-[105px] truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {activeCategory ? activeCategory.category : "Total Burn"}
                </span>
                <span className="font-mono text-base font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-lg">
                  {formatCurrency(
                    activeCategory ? activeCategory.amount : totalCategorySpend,
                    baseCurrency,
                  )}
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {activeCategory
                    ? `${activeCategory.percentage}%`
                    : `${categoryData.length} categories`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend with Micro Progress Bars */}
          <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 pt-2">
            {categoryData.map((cat, idx) => {
              const isSelected = activeCategoryIndex === idx;
              const color = PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={cat.category}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  onMouseLeave={() => setActiveCategoryIndex(null)}
                  className={`group cursor-pointer rounded-lg p-1.5 transition-all ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800/80 scale-[1.02]"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className={`truncate font-medium transition-colors ${
                          isSelected
                            ? "text-zinc-950 dark:text-white font-semibold"
                            : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {cat.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {formatCurrency(cat.amount, baseCurrency)}
                      </span>
                      <span className="min-w-[28px] text-right font-bold text-zinc-900 dark:text-zinc-200">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: color,
                        opacity:
                          activeCategoryIndex !== null && !isSelected
                            ? 0.35
                            : 1,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
