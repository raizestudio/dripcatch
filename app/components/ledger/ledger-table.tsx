"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2, Loader2 } from "lucide-react"
import { deleteSubscription } from "@/app/actions/subscriptions"
import { UserSubscriptionRow } from "./types"
import { getNormalizedMonthly } from "./utils"
import { EditSubscriptionModal } from "./edit-subscription-modal"

export function LedgerTable({
  subscriptions,
}: {
  subscriptions: UserSubscriptionRow[]
}) {
  const t = useTranslations("Dashboard")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!window.confirm(t("actions.deleteConfirm"))) return

    setDeletingId(id)
    try {
      await deleteSubscription(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">{t("table.service")}</th>
              <th className="px-4 py-3 font-medium">{t("table.interval")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("table.cost")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("table.normalized")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("table.renewal")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("table.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {subscriptions.map((sub) => {
              const costNum = Number(sub.cost)
              const originalCostNum = sub.original_cost
                ? Number(sub.original_cost)
                : costNum
              const normalized = getNormalizedMonthly(costNum, sub.interval)
              const hasHike = originalCostNum < costNum
              const isDeleting = deletingId === sub.id

              return (
                <tr
                  key={sub.id}
                  className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {sub.name}
                      </span>
                      {hasHike && (
                        <span className="inline-flex items-center rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          +${(costNum - originalCostNum).toFixed(2)} {t("badges.hike")}
                        </span>
                      )}
                      {sub.is_zombie && (
                        <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          {t("badges.zombie")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{sub.category}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {t(`badges.${sub.interval}`)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                    ${costNum.toFixed(2)}
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-500">
                    ${normalized.toFixed(2)}
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {sub.next_billing_date}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditSubscriptionModal subscription={sub} />
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
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
