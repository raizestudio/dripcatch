import { useTranslations } from "next-intl"

export function Stats() {
  const t = useTranslations("Landing")

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-100/60 dark:border-zinc-800/60 dark:bg-zinc-900/30 px-4 py-10 sm:px-6 transition-colors">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 text-center">
        <div className="p-4">
          <p className="font-mono text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400 sm:text-4xl">
            {t("stats.avgCreep", { amount: 38 })}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            {t("stats.avgCreepLabel")}
          </p>
        </div>
        <div className="border-l border-zinc-200 dark:border-zinc-800 p-4">
          <p className="font-mono text-3xl font-extrabold tabular-nums text-rose-600 dark:text-rose-400 sm:text-4xl">
            {t("stats.zombies")}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            {t("stats.zombiesLabel")}
          </p>
        </div>
      </div>
    </section>
  )
}
