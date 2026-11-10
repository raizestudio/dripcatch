"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";

interface ZombieWarningBannerProps {
  count: number;
  monthlyLeak: number;
  annualLeak: number;
  currency: string;
}

export function ZombieWarningBanner({
  count,
  monthlyLeak,
  annualLeak,
  currency,
}: ZombieWarningBannerProps) {
  const t = useTranslations("Dashboard");

  return (
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
              annualAmount: formatCurrency(annualLeak, currency),
              count,
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-center font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
        <TrendingDown className="h-4 w-4" />
        <span>-{formatCurrency(monthlyLeak, currency)}/mo</span>
      </div>
    </div>
  );
}
