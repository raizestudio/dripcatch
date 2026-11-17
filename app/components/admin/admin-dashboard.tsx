"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Bug,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import {
  BugReportStatus,
  deleteCatalogPlan,
  deleteCatalogService,
  updateBugReportStatus,
  upsertCatalogPlan,
  upsertCatalogService,
} from "@/app/actions/admin";
import type { BugReportMetadata } from "@/app/lib/db/schema";

export interface AdminBugReport {
  id: string;
  user_id: string | null;
  email: string | null;
  category: string;
  title: string;
  description: string;
  metadata: Partial<BugReportMetadata> & { appVersion?: string };
  status: BugReportStatus;
  created_at: string;
}

export interface AdminCatalogPlan {
  id: string;
  name: string;
  default_cost: number;
  currency: string;
  interval: string;
}

export interface AdminCatalogService {
  id: string;
  name: string;
  slug: string;
  category: string;
  catalog_subscription_plans: AdminCatalogPlan[];
}

interface AdminDashboardProps {
  bugReports: AdminBugReport[];
  catalog: AdminCatalogService[];
  locale: string;
}

type AdminTab = "bugs" | "catalog";

const STATUS_BADGES: Record<BugReportStatus, string> = {
  open: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  closed: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export function AdminDashboard({
  bugReports,
  catalog,
  locale,
}: AdminDashboardProps) {
  const t = useTranslations("Admin");
  const [activeTab, setActiveTab] = useState<AdminTab>("bugs");
  const [bugFilter, setBugFilter] = useState<BugReportStatus | "all">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Catalog Service Editor State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [serviceCategory, setServiceCategory] = useState("entertainment");

  // Plan Form State (for selected service)
  const [planName, setPlanName] = useState("");
  const [planCost, setPlanCost] = useState("");
  const [planCurrency, setPlanCurrency] = useState("EUR");
  const [planInterval, setPlanInterval] = useState("monthly");

  const openBugsCount = useMemo(
    () => bugReports.filter((b) => b.status === "open").length,
    [bugReports],
  );

  const totalPlansCount = useMemo(
    () =>
      catalog.reduce(
        (acc, item) => acc + (item.catalog_subscription_plans?.length || 0),
        0,
      ),
    [catalog],
  );

  const filteredBugs = useMemo(() => {
    if (bugFilter === "all") return bugReports;
    return bugReports.filter((b) => b.status === bugFilter);
  }, [bugReports, bugFilter]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [catalog, searchQuery]);

  const selectedService = useMemo(
    () => catalog.find((c) => c.id === editingServiceId) ?? null,
    [catalog, editingServiceId],
  );

  const startNewService = () => {
    setEditingServiceId(null);
    setServiceName("");
    setServiceSlug("");
    setServiceCategory("entertainment");
    setErrorMessage(null);
  };

  const selectServiceForEdit = (service: AdminCatalogService) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceSlug(service.slug);
    setServiceCategory(service.category);
    setErrorMessage(null);
  };

  const handleStatusChange = (id: string, status: BugReportStatus) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateBugReportStatus(id, status);
      if (!res.success && res.error) setErrorMessage(res.error);
    });
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await upsertCatalogService({
        id: editingServiceId ?? undefined,
        name: serviceName,
        slug: serviceSlug,
        category: serviceCategory,
      });
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      } else if (!editingServiceId) {
        startNewService();
      }
    });
  };

  const handleDeleteService = (id: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteCatalogService(id);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      } else if (editingServiceId === id) {
        startNewService();
      }
    });
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await upsertCatalogPlan({
        catalog_id: editingServiceId,
        name: planName,
        default_cost: parseFloat(planCost),
        currency: planCurrency,
        interval: planInterval,
      });
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      } else {
        setPlanName("");
        setPlanCost("");
      }
    });
  };

  const handleDeletePlan = (planId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteCatalogPlan(planId);
      if (!res.success && res.error) setErrorMessage(res.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Summary Counters */}
        <div className="flex gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {t("stats.openBugs")}
            </p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
              {openBugsCount}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {t("stats.catalogServices")}
            </p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
              {catalog.length}{" "}
              <span className="text-xs font-normal text-zinc-400">
                ({totalPlansCount} plans)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("bugs")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            activeTab === "bugs"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
          }`}
        >
          <Bug className="h-4 w-4" />
          {t("tabs.bugs")}
          <span className="rounded-full bg-zinc-500/20 px-1.5 py-0.5 font-mono text-xs tabular-nums">
            {bugReports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            activeTab === "catalog"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
          }`}
        >
          <Layers className="h-4 w-4" />
          {t("tabs.catalog")}
          <span className="rounded-full bg-zinc-500/20 px-1.5 py-0.5 font-mono text-xs tabular-nums">
            {catalog.length}
          </span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* TAB 1: BUG REPORTS TRIAGE */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(
              ["open", "in_progress", "resolved", "closed", "all"] as const
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setBugFilter(status)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  bugFilter === status
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/70"
                }`}
              >
                {t(`bugs.status.${status}`)}
              </button>
            ))}
          </div>

          {filteredBugs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              {t("bugs.empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBugs.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGES[report.status]}`}
                        >
                          {t(`bugs.status.${report.status}`)}
                        </span>
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {report.category}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {new Date(report.created_at).toLocaleString(locale)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {report.title}
                      </h3>
                      <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                        {report.description}
                      </p>
                    </div>

                    <select
                      aria-label={t("bugs.changeStatus")}
                      disabled={isPending}
                      value={report.status}
                      onChange={(e) =>
                        handleStatusChange(
                          report.id,
                          e.target.value as BugReportStatus,
                        )
                      }
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="open">{t("bugs.status.open")}</option>
                      <option value="in_progress">
                        {t("bugs.status.in_progress")}
                      </option>
                      <option value="resolved">
                        {t("bugs.status.resolved")}
                      </option>
                      <option value="closed">{t("bugs.status.closed")}</option>
                    </select>
                  </div>

                  {/* Captured Diagnostics Metadata */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-2.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
                    {report.email && <span>email: {report.email}</span>}
                    {report.metadata?.appVersion && (
                      <span>v{report.metadata.appVersion}</span>
                    )}
                    {report.metadata?.pathname && (
                      <span>route: {report.metadata.pathname}</span>
                    )}
                    {report.metadata?.locale && (
                      <span>locale: {report.metadata.locale}</span>
                    )}
                    {report.metadata?.viewport && (
                      <span>viewport: {report.metadata.viewport}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG & PLANS MANAGER */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Searchable Service List */}
          <div className="space-y-3 lg:col-span-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
              <button
                type="button"
                onClick={startNewService}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                {t("catalog.newService")}
              </button>
            </div>

            <div className="max-h-[34rem] divide-y divide-zinc-200 overflow-y-auto rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60">
              {filteredCatalog.map((service) => {
                const isSelected = service.id === editingServiceId;
                return (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between px-4 py-3 transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectServiceForEdit(service)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium">
                        {service.name}
                      </p>
                      <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {service.slug} • {service.category} •{" "}
                        {service.catalog_subscription_plans?.length || 0} plans
                      </p>
                    </button>

                    <div className="ml-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => selectServiceForEdit(service)}
                        aria-label={t("catalog.edit")}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteService(service.id)}
                        aria-label={t("catalog.delete")}
                        className="rounded p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Service Form, Live Light/Dark Preview & Plans */}
          <div className="space-y-6 lg:col-span-7">
            {/* Service Details Form */}
            <form
              onSubmit={handleSaveService}
              className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <h2 className="text-sm font-semibold">
                {editingServiceId
                  ? t("catalog.editServiceTitle")
                  : t("catalog.createServiceTitle")}
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("catalog.fields.name")}
                  </label>
                  <input
                    required
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Spotify"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("catalog.fields.slug")}
                  </label>
                  <input
                    type="text"
                    value={serviceSlug}
                    onChange={(e) => setServiceSlug(e.target.value)}
                    placeholder="spotify"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    {t("catalog.fields.category")}
                  </label>
                  <input
                    required
                    type="text"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    placeholder="entertainment"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Side-by-Side Live Card Preview (Light & Dark) */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-zinc-500">
                  {t("catalog.livePreview")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Light Mode Card */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-zinc-900">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                      <span>Light</span>
                      <Sun className="h-3 w-3" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          {serviceName.trim() || "Service Name"}
                        </p>
                        <p className="text-xs capitalize text-zinc-500">
                          {serviceCategory || "category"}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-zinc-400">
                        {selectedService?.catalog_subscription_plans?.[0]
                          ? `${selectedService.catalog_subscription_plans[0].default_cost} ${selectedService.catalog_subscription_plans[0].currency}`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Dark Mode Card */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-zinc-100">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      <span>Dark</span>
                      <Moon className="h-3 w-3" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          {serviceName.trim() || "Service Name"}
                        </p>
                        <p className="text-xs capitalize text-zinc-400">
                          {serviceCategory || "category"}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-zinc-500">
                        {selectedService?.catalog_subscription_plans?.[0]
                          ? `${selectedService.catalog_subscription_plans[0].default_cost} ${selectedService.catalog_subscription_plans[0].currency}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {editingServiceId
                    ? t("catalog.saveService")
                    : t("catalog.createService")}
                </button>
              </div>
            </form>

            {/* Pricing Plans Manager (shown when editing an existing service) */}
            {selectedService && (
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-sm font-semibold">
                  {t("catalog.plansFor", { name: selectedService.name })}
                </h3>

                {selectedService.catalog_subscription_plans.length > 0 && (
                  <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {selectedService.catalog_subscription_plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                      >
                        <div>
                          <span className="font-medium">{plan.name}</span>
                          <span className="ml-2 font-mono text-xs text-zinc-500">
                            {plan.default_cost} {plan.currency} /{" "}
                            {plan.interval}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeletePlan(plan.id)}
                          aria-label={t("catalog.deletePlan")}
                          className="rounded p-1 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleAddPlan}
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-5"
                >
                  <input
                    required
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Individual"
                    className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 sm:col-span-1"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={planCost}
                    onChange={(e) => setPlanCost(e.target.value)}
                    placeholder="10.99"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <input
                    required
                    type="text"
                    maxLength={3}
                    value={planCurrency}
                    onChange={(e) => setPlanCurrency(e.target.value)}
                    placeholder="EUR"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs uppercase dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <select
                    value={planInterval}
                    onChange={(e) => setPlanInterval(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="quarterly">quarterly</option>
                    <option value="yearly">yearly</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 sm:col-span-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("catalog.addPlan")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
