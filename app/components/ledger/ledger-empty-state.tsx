"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { AddSubscriptionModal, CatalogItem } from "./add-subscription-modal";

interface LedgerEmptyStateProps {
  catalog: CatalogItem[];
  baseCurrency?: string;
}

export function LedgerEmptyState({
  catalog,
  baseCurrency = "EUR",
}: LedgerEmptyStateProps) {
  const t = useTranslations("Dashboard");

  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-12 text-center transition-colors dark:border-zinc-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
        <Sparkles className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
        {t("emptyState.title")}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {t("emptyState.desc")}
      </p>

      <div className="mt-5">
        <AddSubscriptionModal catalog={catalog} baseCurrency={baseCurrency} />
      </div>
    </section>
  );
}
