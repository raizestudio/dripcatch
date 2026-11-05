"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X, Loader2 } from "lucide-react";
import { updateSubscription } from "@/app/actions/subscriptions";
import { UserSubscriptionRow } from "./types";

export function EditSubscriptionModal({
  subscription,
}: {
  subscription: UserSubscriptionRow;
}) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(subscription.name);
  const [category, setCategory] = useState(subscription.category);
  const [cost, setCost] = useState(subscription.cost.toString());
  const [currency, setCurrency] = useState(subscription.currency || "USD");
  const [interval, setInterval] = useState(subscription.interval);
  const [nextBillingDate, setNextBillingDate] = useState(
    subscription.next_billing_date,
  );
  const [isZombie, setIsZombie] = useState(subscription.is_zombie);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateSubscription(subscription.id, {
        name,
        category,
        cost: parseFloat(cost),
        currency,
        interval,
        next_billing_date: nextBillingDate,
        is_zombie: isZombie,
      });
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label={t("actions.edit")}
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[94vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                {t("editModal.title")}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("editModal.subtitle")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleUpdate} className="mt-4 space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t("modal.nameLabel")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("modal.costLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-mono text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("modal.intervalLabel")}
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="monthly">{t("badges.monthly")}</option>
                  <option value="yearly">{t("badges.yearly")}</option>
                  <option value="quarterly">{t("badges.quarterly")}</option>
                  <option value="weekly">{t("badges.weekly")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("modal.categoryLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("modal.billingDateLabel")}
                </label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Zombie subscription toggle */}
            <label className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors dark:border-zinc-800 dark:bg-zinc-950 cursor-pointer">
              <input
                type="checkbox"
                checked={isZombie}
                onChange={(e) => setIsZombie(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 select-none">
                {t("actions.markZombie")}
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {t("actions.cancel")}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? t("actions.saving") : t("actions.save")}</span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
