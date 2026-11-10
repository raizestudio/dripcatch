import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Flame, ShieldCheck } from "lucide-react";

export function CtaBanner() {
  const t = useTranslations("Landing.bottomCta");

  return (
    <section className="px-4 pb-20 pt-8 sm:px-6 sm:pb-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 via-zinc-900/5 to-transparent p-8 text-center dark:from-emerald-500/15 dark:via-zinc-900/40 sm:p-14">
        {/* Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="mx-auto max-w-xl space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Flame className="h-5 w-5" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl text-balance">
            {t("title")}
          </h2>

          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-3 sm:flex-row">
            <Link
              href="/ledger"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-xs font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-95 sm:w-auto"
            >
              <span>{t("cta")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t("guarantee")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
