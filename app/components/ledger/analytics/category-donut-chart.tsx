"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ResponsiveContainer, PieChart, Pie, Sector } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { CategoryBreakdownPoint } from "../utils";
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

interface CategoryDonutChartProps {
  data: CategoryBreakdownPoint[];
  currency: string;
}

interface DonutSectorProps {
  cx?: number;
  cy?: number;
  innerRadius: number;
  outerRadius: number;
  startAngle?: number;
  endAngle?: number;
  index?: number;
}

export function CategoryDonutChart({
  data,
  currency,
}: CategoryDonutChartProps) {
  const t = useTranslations("Dashboard");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalSpend = data.reduce((acc, c) => acc + c.amount, 0);
  const activeCategory = activeIndex !== null ? data[activeIndex] : null;

  const renderSector = (props: DonutSectorProps) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, index } =
      props;
    const fill = PALETTE[(index ?? 0) % PALETTE.length];
    const isSelected = activeIndex === index;
    const isDimmed = activeIndex !== null && !isSelected;

    if (isSelected) {
      return (
        <g className="cursor-pointer transition-all duration-200">
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
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/50">
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
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                shape={renderSector}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                isAnimationActive={true}
                animationDuration={600}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="max-w-[105px] truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {activeCategory ? activeCategory.category : "Total Burn"}
            </span>
            <span className="font-mono text-base font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-lg">
              {formatCurrency(
                activeCategory ? activeCategory.amount : totalSpend,
                currency,
              )}
            </span>
            <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {activeCategory
                ? `${activeCategory.percentage}%`
                : `${data.length} categories`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 pt-2">
        {data.map((cat, idx) => {
          const isSelected = activeIndex === idx;
          const color = PALETTE[idx % PALETTE.length];

          return (
            <div
              key={cat.category}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`group cursor-pointer rounded-lg p-1.5 transition-all ${
                isSelected
                  ? "bg-zinc-100 scale-[1.02] dark:bg-zinc-800/80"
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
                        ? "font-semibold text-zinc-950 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {cat.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {formatCurrency(cat.amount, currency)}
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
                    opacity: activeIndex !== null && !isSelected ? 0.35 : 1,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
