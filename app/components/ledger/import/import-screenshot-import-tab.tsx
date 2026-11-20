"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Camera,
  // Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import {
  matchCatalogSubscription,
  type CatalogSubscriptionOption,
} from "@/app/lib/import/catalog-matcher";
import type { ExtractedOcrSubscription } from "@/app/api/import/ocr/route";
import type { SubscriptionImportDraft } from "../types";

const MAX_SCREENSHOTS = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type FileScanStatus = "queued" | "scanning" | "done" | "error";

interface QueuedScreenshot {
  id: string;
  file: File;
  previewUrl: string;
  status: FileScanStatus;
  extractedCount: number;
  error?: string;
}

interface ScreenshotImportTabProps {
  baseCurrency: string;
  catalog?: CatalogSubscriptionOption[];
  onDraftsReady: (drafts: SubscriptionImportDraft[]) => void;
}

export function ScreenshotImportTab({
  baseCurrency,
  catalog: providedCatalog,
  onDraftsReady,
}: ScreenshotImportTabProps) {
  const t = useTranslations("Import.screenshot");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<QueuedScreenshot[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [fetchedCatalog, setFetchedCatalog] = useState<
    CatalogSubscriptionOption[]
  >([]);

  const effectiveCatalog = providedCatalog ?? fetchedCatalog;

  // Fetch catalog_subscriptions once only if parent did not pass it down
  useEffect(() => {
    if (providedCatalog) return;

    let cancelled = false;
    async function loadCatalog() {
      const supabase = createClient();
      const { data } = await supabase
        .from("catalog_subscriptions")
        .select(
          "id, name, category, catalog_plans ( id, name, default_cost, currency, interval )",
        );

      if (!cancelled && data) {
        setFetchedCatalog(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            plans: Array.isArray(row.catalog_plans) ? row.catalog_plans : [],
          })),
        );
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [providedCatalog]);

  // Revoke all ephemeral preview URLs when component unmounts
  const itemsRef = useRef<QueuedScreenshot[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  function addFiles(incoming: FileList | File[]) {
    setGlobalError(null);
    const fileArray = Array.from(incoming);
    if (fileArray.length === 0) return;

    const remainingSlots = MAX_SCREENSHOTS - items.length;
    if (remainingSlots <= 0) {
      setGlobalError(t("errors.maxFiles", { max: MAX_SCREENSHOTS }));
      return;
    }

    const accepted: QueuedScreenshot[] = [];

    for (const file of fileArray.slice(0, remainingSlots)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setGlobalError(t("errors.invalidType"));
        continue;
      }
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
        setGlobalError(t("errors.fileTooLarge"));
        continue;
      }

      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        extractedCount: 0,
      });
    }

    if (fileArray.length > remainingSlots) {
      setGlobalError(t("errors.maxFiles", { max: MAX_SCREENSHOTS }));
    }

    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted]);
    }
  }

  function removeItem(id: string) {
    if (isScanning) return;
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleExtractAll() {
    if (items.length === 0 || isScanning) return;

    setIsScanning(true);
    setGlobalError(null);

    const allExtracted: ExtractedOcrSubscription[] = [];

    for (const current of items) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === current.id
            ? { ...item, status: "scanning", error: undefined }
            : item,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("file", current.file);

        const res = await fetch("/api/import/ocr", {
          method: "POST",
          body: formData,
        });

        const payload = (await res.json()) as {
          subscriptions?: ExtractedOcrSubscription[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error || t("errors.scanFailed"));
        }

        const found = payload.subscriptions ?? [];
        allExtracted.push(...found);

        setItems((prev) =>
          prev.map((item) =>
            item.id === current.id
              ? { ...item, status: "done", extractedCount: found.length }
              : item,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errors.scanFailed");
        setItems((prev) =>
          prev.map((item) =>
            item.id === current.id
              ? { ...item, status: "error", error: message }
              : item,
          ),
        );
      }
    }

    setIsScanning(false);

    if (allExtracted.length === 0) {
      setGlobalError(t("errors.noneDetected"));
      return;
    }

    // Deduplicate overlapping items across multiple screenshots and enrich with catalog
    const seenKeys = new Set<string>();
    const drafts: SubscriptionImportDraft[] = [];

    for (const raw of allExtracted) {
      const matched = matchCatalogSubscription(
        raw.name,
        raw.interval,
        raw.cost,
        effectiveCatalog,
      );

      const dedupeKey = `${matched.canonicalName.toLowerCase()}|${raw.cost.toFixed(2)}|${raw.interval}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      drafts.push({
        tempId: crypto.randomUUID(),
        source: "screenshot_ocr",
        catalogId: matched.catalogId,
        planId: matched.planId,
        name: matched.canonicalName,
        category: matched.category,
        cost: raw.cost,
        currency: raw.currency || baseCurrency,
        interval: raw.interval,
        status: "active",
        nextBillingDate: raw.nextBillingDate,
        confidence: matched.catalogId ? "high" : raw.confidence,
        selected: true,
      });
    }

    // Revoke local object URLs before handing off to ImportReviewStep
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setItems([]);

    onDraftsReady(drafts);
  }

  return (
    <div className="space-y-4">
      {/* Privacy & Supported Sources Banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-zinc-600 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {t("hintTitle")}
        </p>
        <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
          {t("hintBody")}
        </p>
      </div>

      {/* Dropzone */}
      {items.length < MAX_SCREENSHOTS && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-200 bg-zinc-50/60 hover:border-emerald-500/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/60"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Camera className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {t("dropzoneTitle")}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {t("dropzoneSubtitle", {
              remaining: MAX_SCREENSHOTS - items.length,
              max: MAX_SCREENSHOTS,
            })}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                addFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>
      )}

      {globalError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Selected Screenshot Previews & Per-Image Progress */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={`Screenshot ${idx + 1}`}
                className="h-36 w-full object-cover object-top"
              />

              {!isScanning && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={t("removeImage")}
                  className="absolute top-2 right-2 rounded-full bg-zinc-950/75 p-1 text-white transition hover:bg-zinc-950"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-2.5 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
                <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                  {item.file.name}
                </span>

                {item.status === "scanning" && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t("status.scanning")}
                  </span>
                )}

                {item.status === "done" && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("status.found", { count: item.extractedCount })}
                  </span>
                )}

                {item.status === "error" && (
                  <span
                    title={item.error}
                    className="inline-flex shrink-0 items-center gap-1 text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {t("status.failed")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      {items.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-500">{t("privacyNote")}</span>

          <button
            type="button"
            onClick={handleExtractAll}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("extractingButton")}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("extractButton", { count: items.length })}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
