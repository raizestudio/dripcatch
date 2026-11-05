"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { AddSubscriptionModal, CatalogItem } from "./add-subscription-modal";

export function LedgerEmptyState({ catalog }: { catalog: CatalogItem[] }) {
  const t = useTranslations("Dashboard");

  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
        {t("emptyState.title")}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {t("emptyState.desc")}
      </p>
      <div className="mt-5">
        <AddSubscriptionModal catalog={catalog} />
      </div>
    </section>
  );
}
