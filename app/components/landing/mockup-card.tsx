import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"

export function MockupCard() {
  const t = useTranslations("Landing")

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950 transition-colors">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("mockup.monthlyBurn")}
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
            $184.20<span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">/mo</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          2 hikes
        </span>
      </div>

      {/* Row Items */}
      <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800/40 text-sm">
        {/* Creeping Subscription */}
        <div className="flex items-center justify-between py-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Cloud Storage</span>
              <span className="rounded border border-rose-500/20 bg-rose-500/10 px-1 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {t("mockup.hikeAlert")}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Monthly • Was $9.99</p>
          </div>
          <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">$13.99</span>
        </div>

        {/* Normalization Item */}
        <div className="flex items-center justify-between py-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Streaming Plus</span>
              <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {t("mockup.dueSoon")}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Annual ($180/yr)</p>
          </div>
          <span className="font-mono font-medium tabular-nums text-zinc-500 dark:text-zinc-400">$15.00/mo</span>
        </div>

        {/* Regular Item */}
        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">AI Coding Assistant</p>
            <p className="text-xs text-zinc-500">Monthly</p>
          </div>
          <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">$20.00</span>
        </div>
      </div>
    </div>
  )
}
