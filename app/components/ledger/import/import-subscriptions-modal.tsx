"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Layers, X } from "lucide-react";
import type { CatalogItem } from "../add-subscription-modal";
import type { SubscriptionImportDraft } from "../types";
import { QuickPickTab } from "./quick-pick-tab";
import { ImportReviewStep } from "./import-review-step";

interface ImportSubscriptionsModalProps {
  catalog: CatalogItem[];
  baseCurrency?: string;
  trigger?: React.ReactNode;
}

function getNextMonthFirstIso(): string {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return nextMonth.toISOString().slice(0, 10);
}

export function ImportSubscriptionsModal({
  catalog,
  baseCurrency = "EUR",
  trigger,
}: ImportSubscriptionsModalProps) {
  const t = useTranslations("Import");

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"source" | "review">("source");
  const [drafts, setDrafts] = useState<SubscriptionImportDraft[]>([]);
  const [defaultBillingDate, setDefaultBillingDate] = useState("2026-12-01");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDefaultBillingDate(getNextMonthFirstIso());
    } else {
      setStep("source");
      setDrafts([]);
    }
  }

  function handleDraftsReady(nextDrafts: SubscriptionImportDraft[]) {
    setDrafts(nextDrafts);
    setStep("review");
  }

  function handleImportSuccess() {
    setOpen(false);
    setStep("source");
    setDrafts([]);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Layers className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">{t("triggerLabel")}</span>
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                {step === "source" ? t("modalTitle") : t("reviewTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-zinc-500 dark:text-zinc-400">
                {step === "source" ? t("modalSubtitle") : t("reviewSubtitle")}
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

          <div className="mt-4">
            {step === "source" ? (
              <QuickPickTab
                catalog={catalog}
                baseCurrency={baseCurrency}
                defaultBillingDate={defaultBillingDate}
                onDraftsReady={handleDraftsReady}
              />
            ) : (
              <ImportReviewStep
                initialDrafts={drafts}
                onBack={() => setStep("source")}
                onSuccess={handleImportSuccess}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
