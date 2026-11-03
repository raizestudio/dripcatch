import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { TrendingUp, ArrowRight, ShieldCheck } from "lucide-react"
import { MockupCard } from "./mockup-card"

export function Hero() {
  const t = useTranslations("Landing")

  return (
    <section className="relative px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        {/* Tag Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{t("badge")}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-6xl text-balance">
          {t("heroTitle1")}{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300 bg-clip-text text-transparent">
            {t("heroTitle2")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
          {t("heroSubtitle")}
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/ledger"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-98"
          >
            <span>{t("ctaPrimary")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          <span>{t("noBankRequired")}</span>
        </div>
      </div>

      <MockupCard />
    </section>
  )
}
