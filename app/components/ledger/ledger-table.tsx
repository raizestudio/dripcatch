"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Loader2, Users } from "lucide-react";
import { deleteSubscription } from "@/app/actions/subscriptions";
import { UserSubscriptionRow } from "./types";
import { getNormalizedMonthly, getSubNetCost } from "./utils";
import { formatCurrency } from "@/app/lib/currency";
import { EditSubscriptionModal } from "./edit-subscription-modal";

export function LedgerTable({
  subscriptions,
  baseCurrency,
}: {
  subscriptions: UserSubscriptionRow[];
  baseCurrency: string;
}) {
  const t = useTranslations("Dashboard");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm(t("actions.deleteConfirm"))) return;

    setDeletingId(id);
    try {
      const res = await deleteSubscription(id);
      if (!res.success) {
        alert(res.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">{t("table.service")}</th>
              <th className="px-4 py-3 font-medium">{t("table.interval")}</th>
              <th className="px-4 py-3 text-right font-medium">
                {t("table.cost")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("table.normalized")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("table.renewal")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("table.status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {subscriptions.map((sub) => {
              const costNum = Number(sub.cost);
              const originalCostNum = sub.original_cost
                ? Number(sub.original_cost)
                : costNum;

              // Splits and Net Calculations
              const splits = sub.subscription_splits || [];
              const hasSplits = splits.length > 0;
              const netCost = getSubNetCost(sub);
              const normalizedNetMonthly = getNormalizedMonthly(
                netCost,
                sub.interval
              );

              const hasHike = originalCostNum < costNum;
              const isDeleting = deletingId === sub.id;

              return (
                <tr
                  key={sub.id}
                  className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  {/* Name & Badges */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {sub.name}
                      </span>

                      {/* Split Badge */}
                      {hasSplits && (
                        <span
                          title={splits
                            .map((s) => `${s.name}: ${formatCurrency(s.amount, baseCurrency)}`)
                            .join(", ")}
                          className="inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 cursor-help"
                        >
                          <Users className="h-3 w-3" />
                          {splits.length === 1
                            ? splits[0].name
                            : `${splits.length} people`}
                        </span>
                      )}

                      {/* Hike Badge */}
                      {hasHike && (
                        <span className="inline-flex items-center rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          +{formatCurrency(costNum - originalCostNum, baseCurrency)}{" "}
                          {t("badges.hike")}
                        </span>
                      )}

                      {/* Zombie Badge */}
                      {sub.is_zombie && (
                        <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          {t("badges.zombie")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{sub.category}</p>
                  </td>

                  {/* Interval */}
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {t(`badges.${sub.interval}`)}
                    </span>
                  </td>

                  {/* Outflow Cost (Net vs Gross) */}
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {hasSplits ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(netCost, baseCurrency)}
                        </span>
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatCurrency(costNum, baseCurrency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(costNum, baseCurrency)}
                      </span>
                    )}
                  </td>

                  {/* Normalized Net Out-of-Pocket / Month */}
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                    {formatCurrency(normalizedNetMonthly, baseCurrency)}
                    <span className="text-[10px] text-zinc-400 font-sans">/mo</span>
                  </td>

                  {/* Renewal Date */}
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {sub.next_billing_date}
                  </td>

                  {/* Row Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditSubscriptionModal
                        subscription={sub}
                        baseCurrency={baseCurrency}
                      />
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id)}
                        disabled={isDeleting}
                        aria-label={t("actions.delete")}
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50 dark:hover:text-rose-400"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
