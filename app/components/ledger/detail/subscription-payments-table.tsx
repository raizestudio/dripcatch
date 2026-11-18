"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import {
  addSubscriptionPayment,
  updateSubscriptionPayment,
  deleteSubscriptionPayment,
} from "@/app/actions/payments";
import { SubscriptionPaymentRow } from "../types";
import { formatCurrency } from "@/app/lib/currency";

interface SubscriptionPaymentsTableProps {
  subscriptionId: string;
  payments: SubscriptionPaymentRow[];
  defaultAmount: number;
  currency: string;
  isOwner: boolean;
}

const SOURCE_BADGE_STYLES: Record<string, string> = {
  manual: "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  csv_import: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  email_receipt:
    "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  screenshot_ocr:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  open_banking:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function SubscriptionPaymentsTable({
  subscriptionId,
  payments,
  defaultAmount,
  currency,
  isOwner,
}: SubscriptionPaymentsTableProps) {
  const t = useTranslations("Payments");

  const todayIso = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(todayIso);
  const [newAmount, setNewAmount] = useState(defaultAmount.toFixed(2));
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalRecorded = payments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0,
  );

  function getSourceLabel(source?: string): string {
    switch (source) {
      case "csv_import":
        return t("sources.csv_import");
      case "email_receipt":
        return t("sources.email_receipt");
      case "screenshot_ocr":
        return t("sources.screenshot_ocr");
      case "open_banking":
        return t("sources.open_banking");
      default:
        return t("sources.manual");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsAdding(true);

    const res = await addSubscriptionPayment(subscriptionId, {
      billedDate: newDate,
      amount: parseFloat(newAmount),
      currency,
    });

    setIsAdding(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setNewDate(todayIso);
    setNewAmount(defaultAmount.toFixed(2));
  }

  function startEditing(payment: SubscriptionPaymentRow) {
    setError(null);
    setEditingId(payment.id);
    setEditDate(payment.billed_date);
    setEditAmount(Number(payment.amount).toFixed(2));
  }

  function cancelEditing() {
    setEditingId(null);
    setError(null);
  }

  async function handleSaveEdit(paymentId: string) {
    setError(null);
    setSavingEdit(true);

    const res = await updateSubscriptionPayment(paymentId, {
      billedDate: editDate,
      amount: parseFloat(editAmount),
    });

    setSavingEdit(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setEditingId(null);
  }

  async function handleDelete(paymentId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;

    setError(null);
    setDeletingId(paymentId);
    try {
      const res = await deleteSubscriptionPayment(paymentId);
      if (!res.success) {
        setError(res.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* Header & Inline Log Payment Bar */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              {t("title")}
            </h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {payments.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t("subtitle", {
              total: formatCurrency(totalRecorded, currency),
            })}
          </p>
        </div>

        {isOwner && (
          <form
            onSubmit={handleAdd}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              aria-label={t("dateLabel")}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div className="relative w-28">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                aria-label={t("amountLabel")}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-10 pl-2.5 font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <span className="pointer-events-none absolute top-1.5 right-2.5 text-[11px] text-zinc-400">
                {currency}
              </span>
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-xs transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>{t("logButton")}</span>
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">{t("table.date")}</th>
                <th className="px-4 py-3 font-medium">{t("table.source")}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("table.amount")}
                </th>
                {isOwner && (
                  <th className="px-4 py-3 text-right font-medium">
                    {t("table.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {payments.map((payment) => {
                const isEditing = editingId === payment.id;
                const isDeleting = deletingId === payment.id;
                const sourceKey = payment.source || "manual";

                return (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    {/* Date */}
                    <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      ) : (
                        payment.billed_date
                      )}
                    </td>

                    {/* Source Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                          SOURCE_BADGE_STYLES[sourceKey] ||
                          SOURCE_BADGE_STYLES.manual
                        }`}
                      >
                        {getSourceLabel(sourceKey)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 rounded-md border border-zinc-300 bg-white px-2 py-1 text-right font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      ) : (
                        formatCurrency(
                          Number(payment.amount),
                          payment.currency || currency,
                        )
                      )}
                    </td>

                    {/* Owner Actions */}
                    {isOwner && (
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(payment.id)}
                              disabled={savingEdit}
                              aria-label={t("saveButton")}
                              className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                            >
                              {savingEdit ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                              aria-label={t("cancelButton")}
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEditing(payment)}
                              aria-label={t("editButton")}
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(payment.id)}
                              disabled={isDeleting}
                              aria-label={t("deleteButton")}
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50 dark:hover:text-rose-400"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
