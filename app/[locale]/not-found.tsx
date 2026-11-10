"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeft, Flame, LayoutDashboard, Search } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const router = useRouter();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-500/15" />

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Flame className="h-3.5 w-3.5" />
        <span>{t("badge")}</span>
      </div>

      <div className="relative mb-2 select-none font-mono text-7xl font-extrabold tracking-tighter text-zinc-950 dark:text-white sm:text-9xl">
        <span className="bg-gradient-to-b from-zinc-900 to-zinc-400 bg-clip-text text-transparent dark:from-white dark:to-zinc-600">
          404
        </span>
      </div>

      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {t("description")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("goBack")}</span>
        </button>

        <Link
          href="/ledger"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>{t("toLedger")}</span>
        </Link>
      </div>

      <div className="mt-12 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <Search className="h-3.5 w-3.5" />
        <span>{t("searchHint")}</span>
      </div>
    </div>
  );
}
