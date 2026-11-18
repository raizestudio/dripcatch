"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react";
import { createSubscriptionsBatch } from "@/app/actions/subscriptions";
import type { SubscriptionImportDraft } from "../types";

interface ImportReviewStepProps {
  initialDrafts: SubscriptionImportDraft[];
  onBack: () => void;
  onSuccess: (importedCount: number) => void;
}

export function ImportReviewStep({
  initialDrafts,
  onBack,
  onSuccess,
}: ImportReviewStepProps) {
  const t = useTranslations("Import");
  const tDash = useTranslations("Dashboard");

  const [drafts, setDrafts] =
    useState<SubscriptionImportDraft[]>(initialDrafts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = drafts.filter((d) => d.selected).length;

  function updateDraft<K extends keyof SubscriptionImportDraft>(
    tempId: string,
    field: K,
    value: SubscriptionImportDraft[K],
  ) {
    setDrafts((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleConfirmImport() {
    if (selectedCount === 0) return;
    setLoading(true);
    setError(null);

    const res = await createSubscriptionsBatch(drafts);
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    onSuccess(res.count);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("backToSelection")}</span>
        </button>

        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t("selectedSummary", { count: selectedCount, total: drafts.length })}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-h-[50vh] space-y-2.5 overflow-y-auto pr-1">
        {drafts.map((draft) => (
          <div
            key={draft.tempId}
            className={`rounded-xl border p-3 transition ${
              draft.selected
                ? "border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/70"
                : "border-zinc-200/60 bg-zinc-50/30 opacity-60 dark:border-zinc-800/60 dark:bg-zinc-950/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={draft.selected}
                onChange={(e) =>
                  updateDraft(draft.tempId, "selected", e.target.checked)
                }
                aria-label={draft.name}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />

              <input
                type="text"
                value={draft.name}
                disabled={!draft.selected}
                onChange={(e) =>
                  updateDraft(draft.tempId, "name", e.target.value)
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-emerald-500 focus:outline-hidden disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 pl-6">
              {/* Cost */}
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!draft.selected}
                  value={draft.cost}
                  onChange={(e) =>
                    updateDraft(
                      draft.tempId,
                      "cost",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-10 pl-2.5 font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <span className="pointer-events-none absolute top-1.5 right-2.5 text-[11px] text-zinc-400">
                  {draft.currency}
                </span>
              </div>

              {/* Interval */}
              <select
                disabled={!draft.selected}
                value={draft.interval}
                onChange={(e) =>
                  updateDraft(
                    draft.tempId,
                    "interval",
                    e.target.value as SubscriptionImportDraft["interval"],
                  )
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="monthly">{tDash("badges.monthly")}</option>
                <option value="yearly">{tDash("badges.yearly")}</option>
                <option value="quarterly">{tDash("badges.quarterly")}</option>
                <option value="weekly">{tDash("badges.weekly")}</option>
              </select>

              {/* Next Billing Date */}
              <input
                type="date"
                disabled={!draft.selected}
                value={draft.nextBillingDate}
                onChange={(e) =>
                  updateDraft(draft.tempId, "nextBillingDate", e.target.value)
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={handleConfirmImport}
          disabled={loading || selectedCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          <span>
            {loading
              ? t("importing")
              : t("importSelected", { count: selectedCount })}
          </span>
        </button>
      </div>
    </div>
  );
}
