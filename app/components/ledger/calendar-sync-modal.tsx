"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import {
  rotateCalendarFeedToken,
  revokeCalendarFeedToken,
} from "@/app/actions/calendar";

interface CalendarSyncModalProps {
  initialToken: string | null;
}

const emptySubscribe = () => () => {};
const fallbackOrigin =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.dripcatch.fr";

export function CalendarSyncModal({ initialToken }: CalendarSyncModalProps) {
  const t = useTranslations("CalendarSync");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken);
  const [prevInitialToken, setPrevInitialToken] = useState<string | null>(
    initialToken,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (initialToken !== prevInitialToken) {
    setPrevInitialToken(initialToken);
    setToken(initialToken);
  }

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => fallbackOrigin,
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmReset(false);
      setError(null);
      setCopied(false);
    }
  }

  const httpsUrl = token
    ? `${origin}/api/calendar/${token}/renewals.ics?locale=${locale}`
    : "";
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");

  async function handleGenerateOrRotate() {
    setLoading(true);
    setError(null);

    const res = await rotateCalendarFeedToken();
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setToken(res.token);
    setConfirmReset(false);
    setCopied(false);
  }

  async function handleRevoke() {
    setLoading(true);
    setError(null);

    const res = await revokeCalendarFeedToken();
    setLoading(false);

    if (!res.success) {
      setError(res.error);
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
      setError(t("errorCopy"));
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title={t("triggerLabel")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <CalendarPlus className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">{t("triggerLabel")}</span>
          {token && (
            <span
              className="h-2 w-2 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[94vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                {t("modalTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("modalSubtitle")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("close")}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!token ? (
              <>
                <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300">
                  <p className="leading-relaxed">{t("emptyDescription")}</p>
                  <ul className="space-y-1 text-zinc-500 dark:text-zinc-400">
                    <li>• {t("featureNativeAlerts")}</li>
                    <li>• {t("featureNetShare")}</li>
                    <li>• {t("featurePrivateToken")}</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {t("cancel")}
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={handleGenerateOrRotate}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CalendarPlus className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {loading ? t("generating") : t("generateButton")}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* One-click Webcal CTA */}
                <div className="space-y-1.5">
                  <a
                    href={webcalUrl}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t("openInCalendar")}</span>
                  </a>
                  <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("webcalHint")}
                  </p>
                </div>

                {/* HTTPS URL for Google Calendar */}
                <div className="space-y-1">
                  <label
                    htmlFor="calendar-feed-url"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    {t("googleCalendarLabel")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="calendar-feed-url"
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
                          <span>{t("copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t("copy")}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("googleCalendarHint")}
                  </p>
                </div>

                {/* Token Rotation & Revocation */}
                <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {!confirmReset ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {t("securityNote")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{t("resetLink")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRevoke}
                          disabled={loading}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{t("disableFeed")}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                      <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{t("resetWarning")}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          disabled={loading}
                          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateOrRotate}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                        >
                          {loading && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          <span>
                            {loading ? t("resetting") : t("confirmReset")}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
