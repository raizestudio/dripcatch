// app/components/ui/footer.tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flame, ShieldCheck, ArrowUpRight } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { CurrentYear } from "@/app/components/ui/current-year";
import { ReportBugModal } from "@/app/components/feedback/report-bug-modal";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-zinc-200/80 bg-white backdrop-blur-md pt-12 pb-24 text-zinc-600 transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-400 sm:pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5 md:gap-10">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Flame className="h-4 w-4" />
              </div>
              <span className="font-semibold tracking-tight text-zinc-950 dark:text-white">
                DripCatch
              </span>
            </Link>

            <p className="max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("tagline")}
            </p>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t("privacyBadge")}</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              {t("columns.product")}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/ledger"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.ledger")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#splits"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.splits")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Trust */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              {t("columns.legal")}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.security")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              {t("columns.community")}
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-zinc-950 dark:hover:text-white"
                >
                  <SiGithub className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@dripcatch.fr"
                  className="transition hover:text-zinc-950 dark:hover:text-white"
                >
                  {t("links.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/80 pt-6 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-500 sm:flex-row">
          <p>
            © <CurrentYear /> DripCatch. {t("copyright")}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("statusOperational")}</span>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <SiGithub className="h-4 w-4" />
            </a>
            <div className="flex items-center gap-4">
              <ReportBugModal />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
