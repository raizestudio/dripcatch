import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Plus, TrendingUp, Ghost, Activity } from "lucide-react"

const MOCK_SUBS = [
  { id: "1", name: "Netflix", plan: "Premium (4K)", category: "Entertainment", cost: 22.99, interval: "monthly", isZombie: false, isHiked: true, originalCost: 19.99, nextBillingDate: "2026-11-15" },
  { id: "2", name: "GitHub Copilot", plan: "Individual Yearly", category: "Developer Tools", cost: 100.00, interval: "yearly", isZombie: false, isHiked: false, originalCost: 100.00, nextBillingDate: "2027-02-10" },
  { id: "3", name: "Adobe Creative Cloud", plan: "All Apps", category: "Design", cost: 59.99, interval: "monthly", isZombie: true, isHiked: false, originalCost: 59.99, nextBillingDate: "2026-11-28" },
  { id: "4", name: "Spotify", plan: "Duo", category: "Entertainment", cost: 16.99, interval: "monthly", isZombie: false, isHiked: true, originalCost: 14.99, nextBillingDate: "2026-11-05" },
]

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <LedgerView />
}

function LedgerView() {
  const t = useTranslations("Dashboard")

  const monthlyBurn = MOCK_SUBS.reduce((acc, sub) => {
    return acc + (sub.interval === "yearly" ? sub.cost / 12 : sub.cost)
  }, 0)

  const projectedAnnual = monthlyBurn * 12
  const zombiesCount = MOCK_SUBS.filter((s) => s.isZombie).length
  const hikesCount = MOCK_SUBS.filter((s) => s.isHiked).length

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 text-zinc-900 dark:text-zinc-100 sm:p-8 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header & Primary Action */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
          </div>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95">
            <Plus className="h-4 w-4" />
            {t("newSub")}
          </button>
        </header>

        {/* Top KPI Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{t("kpi.monthly")}</span>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
              ${monthlyBurn.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-2 text-zinc-500 dark:text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">{t("kpi.annual")}</span>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
              ${projectedAnnual.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400/80">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{t("kpi.hikes")}</span>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {hikesCount}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400/80">
              <Ghost className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{t("kpi.zombies")}</span>
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {zombiesCount}
            </p>
          </div>
        </section>

        {/* Ledger Table */}
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.service")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.interval")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.cost")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.normalized")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("table.renewal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {MOCK_SUBS.map((sub) => {
                  const normalized = sub.interval === "yearly" ? sub.cost / 12 : sub.cost

                  return (
                    <tr
                      key={sub.id}
                      className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {sub.name}
                          </span>
                          {sub.isHiked && (
                            <span className="inline-flex items-center rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              +${(sub.cost - sub.originalCost).toFixed(2)} {t("badges.hike")}
                            </span>
                          )}
                          {sub.isZombie && (
                            <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {t("badges.zombie")}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500">{sub.plan}</span>
                          <span className="text-[10px] text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="text-xs text-zinc-500">{sub.category}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {sub.interval === "yearly" ? t("badges.yearly") : t("badges.monthly")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                        ${sub.cost.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-500">
                        ${normalized.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {sub.nextBillingDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
