"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
// import { Link, useRouter } from "@/i18n/routing";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Users,
  Shield,
  TrendingUp,
  Calendar,
  CreditCard,
  Activity,
  Wallet,
} from "lucide-react";
import {
  deleteSubscription,
  type SubscriptionDetailRow,
} from "@/app/actions/subscriptions";
import { calculateLifetimeSpend, getNormalizedMonthly } from "../utils";
import { formatCurrency } from "@/app/lib/currency";
import { EditSubscriptionModal } from "../edit-subscription-modal";
import { SubscriptionPaymentsTable } from "./subscription-payments-table";

interface SubscriptionDetailViewProps {
  subscription: SubscriptionDetailRow;
  baseCurrency: string;
}

export function SubscriptionDetailView({
  subscription,
  baseCurrency,
}: SubscriptionDetailViewProps) {
  const t = useTranslations("Dashboard");
  const tDetail = useTranslations("SubscriptionDetail");
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = subscription.is_owner;
  const isPaused = subscription.status === "paused";
  const isCanceled = subscription.status === "canceled";
  const isInactive = isPaused || isCanceled;

  const grossCost = Number(subscription.cost);
  const netCost = Number(subscription.effective_cost);
  const normalizedMonthly = getNormalizedMonthly(
    netCost,
    subscription.interval,
  );
  const lifetime = calculateLifetimeSpend(subscription);

  const originalCostNum = subscription.original_cost
    ? Number(subscription.original_cost)
    : grossCost;
  const hasHike = originalCostNum < grossCost;

  const splits = subscription.subscription_splits || [];

  async function handleDelete() {
    if (!window.confirm(t("actions.deleteConfirm"))) return;

    setIsDeleting(true);
    try {
      const res = await deleteSubscription(subscription.id);
      if (!res.success) {
        alert(res.error);
        setIsDeleting(false);
        return;
      }
      router.push("/ledger");
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/ledger"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{tDetail("backToLedger")}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {subscription.name}
            </h1>

            {/* Lifecycle Status Badge */}
            <span
              className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
                isCanceled
                  ? "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                  : isPaused
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {t(`badges.${subscription.status}`)}
            </span>

            {!isOwner && (
              <span className="inline-flex items-center gap-1 rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <Users className="h-3 w-3" />
                {tDetail("sharedWithYou")}
              </span>
            )}

            {hasHike && (
              <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <TrendingUp className="h-3 w-3" />+
                {formatCurrency(grossCost - originalCostNum, baseCurrency)}{" "}
                {t("badges.hike")}
              </span>
            )}

            {subscription.is_zombie && !isCanceled && (
              <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t("badges.zombie")}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {subscription.category} · {t(`badges.${subscription.interval}`)}
          </p>
        </div>

        {/* Owner Actions */}
        {isOwner ? (
          <div className="flex items-center gap-2">
            <EditSubscriptionModal
              subscription={subscription}
              baseCurrency={baseCurrency}
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label={t("actions.delete")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{t("actions.delete")}</span>
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Shield className="h-3.5 w-3.5" />
            {tDetail("viewOnly")}
          </span>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">{tDetail("kpi.cycleCost")}</span>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {formatCurrency(netCost, baseCurrency)}
          </p>
          {netCost !== grossCost && (
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {tDetail("kpi.planTotal", {
                amount: formatCurrency(grossCost, baseCurrency),
              })}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">{tDetail("kpi.monthlyRate")}</span>
            <Activity className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {isInactive ? (
              <span className="text-zinc-400">—</span>
            ) : (
              <>
                {formatCurrency(normalizedMonthly, baseCurrency)}
                <span className="font-sans text-xs font-normal text-zinc-400">
                  /mo
                </span>
              </>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">{tDetail("kpi.lifetimePaid")}</span>
            <Wallet className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {formatCurrency(lifetime?.netPaid ?? 0, baseCurrency)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {tDetail("kpi.paymentsCount", {
              count: lifetime?.cycles ?? 0,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">
              {isInactive
                ? tDetail("kpi.lastBilled")
                : tDetail("kpi.nextRenewal")}
            </span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {isInactive
              ? (subscription.last_billed_date ?? "—")
              : (subscription.next_billing_date ?? "—")}
          </p>
        </div>
      </div>

      {/* Metadata & Splits Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Billing & Lifecycle Details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
            {tDetail("details.title")}
          </h2>

          <dl className="mt-3 divide-y divide-zinc-100 text-xs dark:divide-zinc-800/60">
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {tDetail("details.firstBilled")}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                {subscription.first_billed_date ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {tDetail("details.lastBilled")}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                {subscription.last_billed_date ?? "—"}
              </dd>
            </div>

            <div className="flex justify-between py-2">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {tDetail("details.nextRenewal")}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                {subscription.next_billing_date ?? "—"}
              </dd>
            </div>

            {hasHike && (
              <div className="flex justify-between py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {tDetail("details.priceHistory")}
                </dt>
                <dd className="font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(originalCostNum, baseCurrency)} →{" "}
                  {formatCurrency(grossCost, baseCurrency)}
                  {subscription.last_hike_date
                    ? ` (${subscription.last_hike_date})`
                    : ""}
                </dd>
              </div>
            )}

            {subscription.notes && (
              <div className="py-2">
                <dt className="mb-1 text-zinc-500 dark:text-zinc-400">
                  {tDetail("details.notes")}
                </dt>
                <dd className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {subscription.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Splits Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              {tDetail("splits.title")}
            </h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {splits.length}
            </span>
          </div>

          {splits.length === 0 ? (
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              {tDetail("splits.empty")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100 text-xs dark:divide-zinc-800/60">
              {splits.map((split) => (
                <li
                  key={split.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {split.name}
                    </p>
                    {split.email && (
                      <p className="text-[11px] text-zinc-500">{split.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                        split.status === "accepted"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : split.status === "rejected"
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {split.status}
                    </span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(Number(split.amount), baseCurrency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Interactive Payment History Table */}
      <SubscriptionPaymentsTable
        subscriptionId={subscription.id}
        payments={subscription.subscription_payments || []}
        defaultAmount={grossCost}
        currency={baseCurrency}
        isOwner={isOwner}
      />
    </div>
  );
}
