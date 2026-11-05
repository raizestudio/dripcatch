"use client";

import { useTranslations } from "next-intl";
import { UserSubscriptionRow } from "./types";
import { calculateLedgerMetrics } from "./utils";
import { LedgerKpiCards } from "./ledger-kpi-cards";
import { LedgerTable } from "./ledger-table";
import { LedgerEmptyState } from "./ledger-empty-state";
import { AddSubscriptionModal, CatalogItem } from "./add-subscription-modal";
import { LedgerAnalytics } from "./ledger-analytics";
import { CurrencySwitcher } from "./currency-switcher";

interface LedgerViewProps {
  subscriptions: UserSubscriptionRow[];
  catalog: CatalogItem[];
  baseCurrency: string;
}

export function LedgerView({
  subscriptions,
  catalog,
  baseCurrency,
}: LedgerViewProps) {
  const t = useTranslations("Dashboard");
  const metrics = calculateLedgerMetrics(subscriptions);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <CurrencySwitcher currentCurrency={baseCurrency} />
          <AddSubscriptionModal catalog={catalog} baseCurrency={baseCurrency} />
        </div>
      </header>

      <LedgerKpiCards {...metrics} baseCurrency={baseCurrency} />

      {subscriptions.length > 0 && (
        <LedgerAnalytics
          subscriptions={subscriptions}
          baseCurrency={baseCurrency}
        />
      )}

      {subscriptions.length === 0 ? (
        <LedgerEmptyState catalog={catalog} />
      ) : (
        <LedgerTable
          subscriptions={subscriptions}
          baseCurrency={baseCurrency}
        />
      )}
    </div>
  );
}
