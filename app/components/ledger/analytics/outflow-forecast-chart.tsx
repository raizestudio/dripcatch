"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { MonthlyForecastPoint } from "../utils";
import { formatCurrency } from "@/app/lib/currency";

interface OutflowForecastChartProps {
  data: MonthlyForecastPoint[];
  covered: number;
  isDark: boolean;
  currency: string;
}

export function OutflowForecastChart({
  data,
  covered,
  isDark,
  currency,
}: OutflowForecastChartProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50">
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
        {covered > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span>Paid by Others</span>
          </div>
        )}
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
                  const pt = payload[0].payload as MonthlyForecastPoint;
                  return (
                    <div className="min-w-48 rounded-xl border border-zinc-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 text-xs">
                      <p className="mb-2 border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                        {pt.month} Forecast
                      </p>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                          <span>Paid & Used:</span>
                          <span className="font-bold">
                            {formatCurrency(pt.active, currency)}
                          </span>
                        </div>

                        {pt.zombie > 0 && (
                          <div className="flex justify-between gap-4 text-amber-600 dark:text-amber-400">
                            <span>Unused (Zombie):</span>
                            <span className="font-bold">
                              +{formatCurrency(pt.zombie, currency)}
                            </span>
                          </div>
                        )}

                        {pt.covered > 0 && (
                          <div className="flex justify-between gap-4 text-sky-600 dark:text-sky-400">
                            <span>Paid by Others:</span>
                            <span>+{formatCurrency(pt.covered, currency)}</span>
                          </div>
                        )}

                        <div className="mt-1 flex justify-between gap-4 border-t border-zinc-200 pt-1.5 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                          <span>Your Net Outflow:</span>
                          <span>{formatCurrency(pt.net, currency)}</span>
                        </div>

                        {pt.covered > 0 && (
                          <div className="flex justify-between gap-4 text-[10px] text-zinc-400">
                            <span>Total Plan Value:</span>
                            <span>{formatCurrency(pt.gross, currency)}</span>
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
  );
}
