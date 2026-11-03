import { setRequestLocale } from "next-intl/server"
import { Hero } from "@/app/components/landing/hero"
import { Stats } from "@/app/components/landing/stats"
import { Features } from "@/app/components/landing/features"
import { MobileStickyCta } from "@/app/components/landing/mobile-cta"

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-emerald-500/20 selection:text-emerald-500 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:text-emerald-400 transition-colors">
      <main>
        <Hero />
        <Stats />
        <Features />
      </main>
      <MobileStickyCta />
    </div>
  )
}
