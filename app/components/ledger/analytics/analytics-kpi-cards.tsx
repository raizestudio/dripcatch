"use client";

import { CheckCircle2, Ghost, Users } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";

interface AnalyticsKpiCardsProps {
  activeUsed: number;
  zombieLeak: number;
  zombieCount: number;
  covered: number;
  currency: string;
}

export function AnalyticsKpiCards({
  activeUsed,
  zombieLeak,
  zombieCount,
  covered,
  currency,
}: AnalyticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Metric 1: Active & Used */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Paid & In Use</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {formatCurrency(activeUsed, currency)}
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
          {formatCurrency(zombieLeak, currency)}
          <span className="text-xs font-normal text-zinc-400">/mo</span>
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {zombieCount} zombie{" "}
          {zombieCount === 1 ? "subscription" : "subscriptions"}
        </p>
      </div>

      {/* Metric 3: Paid by Others */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Paid by Others</span>
          <Users className="h-4 w-4 text-sky-500" />
        </div>
        <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
          {formatCurrency(covered, currency)}
          <span className="text-xs font-normal text-zinc-400">/mo</span>
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Covered by splits & friends
        </p>
      </div>
    </div>
  );
}
