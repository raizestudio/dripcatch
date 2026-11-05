"use client";

import { useTranslations } from "next-intl";
import { Activity, TrendingUp, Ghost } from "lucide-react";

interface LedgerKpiCardsProps {
  monthlyBurn: number;
  projectedAnnual: number;
  hikesCount: number;
  zombiesCount: number;
}

export function LedgerKpiCards({
  monthlyBurn,
  projectedAnnual,
  hikesCount,
  zombiesCount,
}: LedgerKpiCardsProps) {
  const t = useTranslations("Dashboard");

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* Monthly Burn */}
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

      {/* Projected Annual */}
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

      {/* Creep / Price Hikes */}
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

      {/* Zombie Subs */}
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
  );
}
