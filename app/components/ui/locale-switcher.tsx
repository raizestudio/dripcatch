"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { ChangeEvent, useTransition } from "react"
import { Globe } from "lucide-react"

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
      <select
        defaultValue={locale}
        onChange={onSelectChange}
        disabled={isPending}
        className="appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-6 pl-7 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <option value="en">EN</option>
        <option value="fr">FR</option>
      </select>
      <div className="pointer-events-none absolute right-2 flex items-center text-zinc-400 dark:text-zinc-500">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
