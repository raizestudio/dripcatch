import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Flame } from "lucide-react"
import { LocaleSwitcher } from "@/app/components/ui/locale-switcher"
import { ThemeToggle } from "@/app/components/ui/theme-toggle"

export function Navbar() {
  const t = useTranslations("Landing")

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Flame className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-zinc-900 dark:text-white">
            DripCatch
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LocaleSwitcher />

          <Link
            href="/ledger"
            className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </nav>
  )
}
