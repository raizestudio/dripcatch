import { useTranslations } from "next-intl"
import { TrendingUp, Calculator, Ghost } from "lucide-react"

export function Features() {
  const t = useTranslations("Landing")

  const featureItems = [
    {
      icon: TrendingUp,
      title: t("features.hikeTitle"),
      desc: t("features.hikeDesc"),
      color: "rose",
    },
    {
      icon: Calculator,
      title: t("features.normalizationTitle"),
      desc: t("features.normalizationDesc"),
      color: "emerald",
    },
    {
      icon: Ghost,
      title: t("features.zombieTitle"),
      desc: t("features.zombieDesc"),
      color: "amber",
    },
  ] as const

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-16 sm:px-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
          {t("features.title")}
        </h2>
        <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {featureItems.map((item, idx) => {
          const Icon = item.icon
          const iconColorStyles = {
            rose: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
            emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            amber: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          }[item.color]

          return (
            <div
              key={idx}
              className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 transition-colors"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg border ${iconColorStyles}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{item.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
