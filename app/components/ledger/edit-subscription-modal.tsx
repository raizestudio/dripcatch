"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X, Loader2, AlertCircle } from "lucide-react";
import { updateSubscription } from "@/app/actions/subscriptions";
import { UserSubscriptionRow } from "./types";

interface EditSubscriptionModalProps {
  subscription: UserSubscriptionRow;
  baseCurrency?: string;
}

export function EditSubscriptionModal({
  subscription,
  baseCurrency = "EUR",
}: EditSubscriptionModalProps) {
  const t = useTranslations("Dashboard");
  const tSplits = useTranslations("Splits");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(subscription.name);
  const [category, setCategory] = useState(subscription.category);
  const [cost, setCost] = useState(subscription.cost.toString());
  const [interval, setInterval] = useState(subscription.interval);
  const [nextBillingDate, setNextBillingDate] = useState(
    subscription.next_billing_date
  );
  const [isZombie, setIsZombie] = useState(subscription.is_zombie);

  // Splits State (now includes email)
  const initialSplits = subscription.subscription_splits || [];
  const [isSplitEnabled, setIsSplitEnabled] = useState(initialSplits.length > 0);
  const [splits, setSplits] = useState<
    { name: string; email: string; amount: string }[]
  >(
    initialSplits.map((s) => ({
      name: s.name,
      email: s.email || "",
      amount: s.amount.toString(),
    }))
  );

  const totalCostNum = parseFloat(cost) || 0;
  const totalCovered = splits.reduce(
    (acc, s) => acc + (parseFloat(s.amount) || 0),
    0
  );
  const isOverSplit = isSplitEnabled && totalCovered > totalCostNum;
  const yourNetCost = Math.max(0, totalCostNum - totalCovered);

  function resetState() {
    setName(subscription.name);
    setCategory(subscription.category);
    setCost(subscription.cost.toString());
    setInterval(subscription.interval);
    setNextBillingDate(subscription.next_billing_date);
    setIsZombie(subscription.is_zombie);

    const existingSplits = subscription.subscription_splits || [];
    setIsSplitEnabled(existingSplits.length > 0);
    setSplits(
      existingSplits.map((s) => ({
        name: s.name,
        email: s.email || "",
        amount: s.amount.toString(),
      }))
    );
    setError(null);
  }

  function addSplitPerson() {
    setSplits((prev) => [...prev, { name: "", email: "", amount: "" }]);
  }

  function updateSplit(
    index: number,
    field: "name" | "email" | "amount",
    value: string
  ) {
    setSplits((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeSplit(index: number) {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (isOverSplit) {
      setError("Split amounts cannot exceed the total subscription cost.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateSubscription(subscription.id, {
      name: name.trim(),
      category,
      cost: parseFloat(cost),
      currency: baseCurrency,
      interval,
      next_billing_date: nextBillingDate,
      is_zombie: isZombie,
      splits: isSplitEnabled
        ? splits
            .filter((s) => s.name.trim() && parseFloat(s.amount) > 0)
            .map((s) => ({
              name: s.name.trim(),
              email: s.email?.trim() || null,
              amount: parseFloat(s.amount),
            }))
        : [],
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetState();
      }}
    >
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
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
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

            {/* Cost & Interval */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("modal.costLabel")} ({baseCurrency})
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

            {/* Category & Next Billing Date */}
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

            {/* Split Configurator */}
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={isSplitEnabled}
                    onChange={(e) => {
                      setIsSplitEnabled(e.target.checked);
                      if (e.target.checked && splits.length === 0) {
                        addSplitPerson();
                      }
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {tSplits("toggle")}
                  </span>
                </label>
              </div>

              {isSplitEnabled && (
                <div className="space-y-2.5 pt-1">
                  {splits.map((split, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {/* Name */}
                      <input
                        type="text"
                        required
                        value={split.name}
                        onChange={(e) =>
                          updateSplit(index, "name", e.target.value)
                        }
                        placeholder={tSplits("namePlaceholder")}
                        className="w-1/3 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />

                      {/* Email (Optional, links DripCatch account) */}
                      <input
                        type="email"
                        value={split.email}
                        onChange={(e) =>
                          updateSplit(index, "email", e.target.value)
                        }
                        placeholder="Account email (optional)"
                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />

                      {/* Amount */}
                      <div className="relative w-24">
                        <span className="pointer-events-none absolute top-1.5 left-2 text-xs text-zinc-400">
                          {baseCurrency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={split.amount}
                          onChange={(e) =>
                            updateSplit(index, "amount", e.target.value)
                          }
                          placeholder="0.00"
                          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-2 pl-8 font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSplit(index)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={addSplitPerson}
                      className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      + {tSplits("addPerson")}
                    </button>

                    {totalCostNum > 0 && splits.length > 0 && (
                      <div className="text-right text-xs">
                        <span className="text-zinc-500">
                          {tSplits("netSummary")}{" "}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOverSplit
                              ? "text-rose-500"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {yourNetCost.toFixed(2)} {baseCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Zombie Flag */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-colors dark:border-zinc-800 dark:bg-zinc-950">
              <input
                type="checkbox"
                checked={isZombie}
                onChange={(e) => setIsZombie(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="select-none text-xs text-zinc-700 dark:text-zinc-300">
                {t("actions.markZombie")}
              </span>
            </label>

            {/* Actions */}
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
                disabled={loading || isOverSplit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
