"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Search } from "lucide-react";
import type { CatalogItem } from "../add-subscription-modal";
import type { SubscriptionImportDraft } from "../types";

interface QuickPickTabProps {
  catalog: CatalogItem[];
  baseCurrency: string;
  defaultBillingDate: string;
  onDraftsReady: (drafts: SubscriptionImportDraft[]) => void;
}

export function QuickPickTab({
  catalog,
  baseCurrency,
  defaultBillingDate,
  onDraftsReady,
}: QuickPickTabProps) {
  const t = useTranslations("Import.quickPick");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  // Map of catalogId -> chosen planId (or "" if catalog item has no plans)
  const [pickedPlans, setPickedPlans] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const unique = Array.from(new Set(catalog.map((c) => c.category))).sort();
    return ["ALL", ...unique];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesCat =
        selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [catalog, query, selectedCategory]);

  const pickedCount = Object.keys(pickedPlans).length;

  function toggleCatalogItem(item: CatalogItem) {
    setPickedPlans((prev) => {
      if (item.id in prev) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      const defaultPlanId = item.catalog_subscription_plans[0]?.id ?? "";
      return { ...prev, [item.id]: defaultPlanId };
    });
  }

  function changeItemPlan(catalogId: string, planId: string) {
    setPickedPlans((prev) => ({ ...prev, [catalogId]: planId }));
  }

  function handleContinueToReview() {
    const drafts: SubscriptionImportDraft[] = [];

    for (const [catalogId, planId] of Object.entries(pickedPlans)) {
      const item = catalog.find((c) => c.id === catalogId);
      if (!item) continue;

      const plan = item.catalog_subscription_plans.find((p) => p.id === planId);

      drafts.push({
        tempId: `quick-${item.id}`,
        source: "catalog_quick_pick",
        catalogId: item.id,
        planId: plan?.id ?? null,
        name: plan ? `${item.name} (${plan.name})` : item.name,
        category: item.category,
        cost: plan ? Number(plan.default_cost) : 0,
        currency: baseCurrency,
        interval: plan?.interval ?? "monthly",
        nextBillingDate: defaultBillingDate,
        confidence: "high",
        selected: true,
      });
    }

    onDraftsReady(drafts);
  }

  return (
    <div className="space-y-3.5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {cat === "ALL" ? t("allCategories") : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Catalog Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {t("noMatches")}
        </div>
      ) : (
        <div className="grid max-h-[44vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredCatalog.map((item) => {
            const isSelected = item.id in pickedPlans;
            const selectedPlanId = pickedPlans[item.id] ?? "";
            const plans = item.catalog_subscription_plans;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/5 dark:border-emerald-500/70 dark:bg-emerald-500/10"
                    : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleCatalogItem(item)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.category}
                    </p>
                  </div>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </span>
                </button>

                {isSelected && plans.length > 0 && (
                  <select
                    value={selectedPlanId}
                    onChange={(e) => changeItemPlan(item.id, e.target.value)}
                    aria-label={`${item.name} plan`}
                    className="mt-2.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {plan.default_cost} {baseCurrency}/
                        {plan.interval}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("pickedCount", { count: pickedCount })}
        </span>

        <button
          type="button"
          onClick={handleContinueToReview}
          disabled={pickedCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{t("reviewButton", { count: pickedCount })}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
