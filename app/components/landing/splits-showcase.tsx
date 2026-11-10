import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Mail,
} from "lucide-react";

export function SplitsShowcase() {
  const t = useTranslations("Landing.splitsShowcase");

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Copy Side */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Users className="h-3.5 w-3.5" />
              <span>{t("badge")}</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl text-balance">
              {t("title")}
            </h2>

            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
              {t("description")}
            </p>

            <ul className="space-y-3 pt-2 text-xs text-zinc-700 dark:text-zinc-300 sm:text-sm">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{t("point1")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{t("point2")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{t("point3")}</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/ledger"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400 sm:text-sm"
              >
                <span>{t("cta")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Card Mockup */}
          <div className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl transition-all dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 -z-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

            {/* Mock Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 font-bold text-white shadow-inner dark:bg-white dark:text-zinc-950">
                  N
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Netflix Premium (4K)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Entertainment • Monthly
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  19.99 €
                </p>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Plan Total
                </span>
              </div>
            </div>

            {/* Split Breakdown Area */}
            <div className="my-4 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Split Distribution (4 members)
              </p>

              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-950/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    You
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">
                    You (Host)
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  4.99 €/mo
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-zinc-50/60 p-2.5 text-xs dark:bg-zinc-950/30">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    S
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Sarah (Roommate)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    +5.00 €
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-zinc-50/60 p-2.5 text-xs dark:bg-zinc-950/30">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    M
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">Marc</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    +5.00 €
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-dashed border-zinc-200 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    <Mail className="h-3 w-3" />
                  </span>
                  <span className="text-zinc-500">Alex (Invite sent)</span>
                </div>
                <span className="font-mono text-zinc-400 dark:text-zinc-500">
                  +5.00 €
                </span>
              </div>
            </div>

            {/* Bottom Net Outflow Highlight */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Your Out-of-Pocket Net:
              </span>
              <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                4.99 € <span className="text-[10px] font-normal">(-75%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
