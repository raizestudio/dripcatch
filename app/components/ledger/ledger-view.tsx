"use client";

import { useTranslations } from "next-intl";
import { UserSubscriptionRow } from "./types";
import { calculateLedgerMetrics } from "./utils";
import { LedgerKpiCards } from "./ledger-kpi-cards";
import { LedgerTable } from "./ledger-table";
import { LedgerEmptyState } from "./ledger-empty-state";
import { AddSubscriptionModal, CatalogItem } from "./add-subscription-modal";
import { LedgerAnalytics } from "./ledger-analytics";

interface LedgerViewProps {
  subscriptions: UserSubscriptionRow[];
  catalog: CatalogItem[];
}

export function LedgerView({ subscriptions, catalog }: LedgerViewProps) {
  const t = useTranslations("Dashboard");
  const metrics = calculateLedgerMetrics(subscriptions);

  return (
    <div className="space-y-8">
      {/* Header & Main Add Action */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <AddSubscriptionModal catalog={catalog} />
      </header>

      {/* Top 4 KPI Metrics */}
      <LedgerKpiCards {...metrics} />

      {/* Charts & 12-Month Outflow Predictions */}
      {subscriptions.length > 0 && (
        <LedgerAnalytics subscriptions={subscriptions} />
      )}

      {/* Dynamic Content: Empty State vs Ledger Table */}
      {subscriptions.length === 0 ? (
        <LedgerEmptyState catalog={catalog} />
      ) : (
        <LedgerTable subscriptions={subscriptions} />
      )}
    </div>
  );
}
