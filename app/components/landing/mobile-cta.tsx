import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ChevronRight } from "lucide-react"

export function MobileStickyCta() {
  const t = useTranslations("Landing")

  return (
    <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-zinc-200 bg-white/90 p-3 backdrop-blur-md sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90 transition-colors">
      <Link
        href="/ledger"
        className="flex h-11 w-full items-center justify-between rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 shadow-md active:scale-98"
      >
        <span>{t("ctaPrimary")}</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
