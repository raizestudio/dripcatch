"use client";

import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { updateLedgerSettings } from "@/app/actions/settings";
import {
  rotateCalendarFeedToken,
  revokeCalendarFeedToken,
} from "@/app/actions/calendar";

interface LedgerSettingsViewProps {
  userEmail: string;
  initialCurrency: string;
  initialReminderDays: number;
  initialCalendarToken: string | null;
}

const CURRENCIES = [
  { code: "EUR", label: "EUR (€) — Euro" },
  { code: "USD", label: "USD ($) — US Dollar" },
  { code: "GBP", label: "GBP (£) — British Pound" },
  { code: "CAD", label: "CAD ($) — Canadian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "AUD", label: "AUD ($) — Australian Dollar" },
  { code: "JPY", label: "JPY (¥) — Japanese Yen" },
];

const REMINDER_PRESETS = [1, 2, 5, 10, 15] as const;

const emptySubscribe = () => () => {};
const fallbackOrigin =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.dripcatch.fr";

export function LedgerSettingsView({
  userEmail,
  initialCurrency,
  initialReminderDays,
  initialCalendarToken,
}: LedgerSettingsViewProps) {
  const t = useTranslations("Settings");
  const tCal = useTranslations("CalendarSync");
  const locale = useLocale();

  // Preferences state
  const [baseCurrency, setBaseCurrency] = useState(initialCurrency);
  const [reminderDays, setReminderDays] = useState(initialReminderDays);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Calendar token state
  const [token, setToken] = useState<string | null>(initialCalendarToken);
  const [prevInitialToken, setPrevInitialToken] = useState<string | null>(
    initialCalendarToken,
  );
  const [calLoading, setCalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  if (initialCalendarToken !== prevInitialToken) {
    setPrevInitialToken(initialCalendarToken);
    setToken(initialCalendarToken);
  }

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => fallbackOrigin,
  );

  const httpsUrl = token
    ? `${origin}/api/calendar/${token}/renewals.ics?locale=${locale}`
    : "";
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");

  const hasUnsavedPrefs =
    baseCurrency !== initialCurrency || reminderDays !== initialReminderDays;

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsError(null);
    setPrefsSaved(false);

    const res = await updateLedgerSettings({
      baseCurrency,
      reminderDays,
    });

    setSavingPrefs(false);

    if (!res.success) {
      setPrefsError(res.error);
      return;
    }

    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  async function handleGenerateOrRotate() {
    setCalLoading(true);
    setCalError(null);

    const res = await rotateCalendarFeedToken();
    setCalLoading(false);

    if (!res.success) {
      setCalError(res.error);
      return;
    }

    setToken(res.token);
    setConfirmReset(false);
    setCopied(false);
  }

  async function handleRevoke() {
    setCalLoading(true);
    setCalError(null);

    const res = await revokeCalendarFeedToken();
    setCalLoading(false);

    if (!res.success) {
      setCalError(res.error);
      return;
    }

    setToken(null);
    setConfirmReset(false);
    setCopied(false);
  }

  async function handleCopyUrl() {
    if (!httpsUrl) return;
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCalError(tCal("errorCopy"));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/ledger"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("backToLedger")}</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Card 1: Ledger & Notification Preferences */}
      <form
        onSubmit={handleSavePreferences}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      >
        <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              {t("preferencesTitle")}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("preferencesSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {prefsError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{prefsError}</span>
            </div>
          )}

          {/* Base Currency */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-currency"
              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("baseCurrencyLabel")}
            </label>
            <select
              id="settings-currency"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("baseCurrencyHint")}
            </p>
          </div>

          {/* Reminder Lead Time */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {t("reminderDaysLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((days) => {
                const active = reminderDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setReminderDays(days)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {t("daysBefore", { days })}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("reminderDaysHint")}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {prefsSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                {t("saved")}
              </span>
            )}
            <button
              type="submit"
              disabled={savingPrefs || !hasUnsavedPrefs}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPrefs && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{savingPrefs ? t("saving") : t("saveChanges")}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Card 2: Calendar Sync */}
      <section
        id="calendar"
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                {tCal("modalTitle")}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {tCal("modalSubtitle")}
              </p>
            </div>
          </div>

          {token && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("activeBadge")}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {calError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{calError}</span>
            </div>
          )}

          {!token ? (
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {tCal("emptyDescription")}
              </p>
              <button
                type="button"
                onClick={handleGenerateOrRotate}
                disabled={calLoading}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
              >
                {calLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5" />
                )}
                <span>
                  {calLoading ? tCal("generating") : tCal("generateButton")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <a
                  href={webcalUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{tCal("openInCalendar")}</span>
                </a>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tCal("webcalHint")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="settings-calendar-url"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {tCal("googleCalendarLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="settings-calendar-url"
                    type="text"
                    readOnly
                    value={httpsUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{tCal("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{tCal("copy")}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tCal("googleCalendarHint")}
                </p>
              </div>

              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {!confirmReset ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {tCal("securityNote")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        disabled={calLoading}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{tCal("resetLink")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRevoke}
                        disabled={calLoading}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{tCal("disableFeed")}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{tCal("resetWarning")}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        disabled={calLoading}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {tCal("cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateOrRotate}
                        disabled={calLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                      >
                        {calLoading && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        <span>
                          {calLoading
                            ? tCal("resetting")
                            : tCal("confirmReset")}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Card 3: Account */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              {t("accountTitle")}
            </h2>
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {userEmail}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
