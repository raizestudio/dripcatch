import { useTranslations } from "next-intl";
import {
  TrendingUp,
  Calculator,
  Ghost,
  Users,
  LineChart,
  ShieldCheck,
} from "lucide-react";

export function Features() {
  const t = useTranslations("Landing.features");

  const featureItems = [
    {
      icon: TrendingUp,
      title: t("hikeTitle"),
      desc: t("hikeDesc"),
      color: "rose",
    },
    {
      icon: Calculator,
      title: t("normalizationTitle"),
      desc: t("normalizationDesc"),
      color: "emerald",
    },
    {
      icon: Ghost,
      title: t("zombieTitle"),
      desc: t("zombieDesc"),
      color: "amber",
    },
    {
      icon: Users,
      title: t("splitTitle"),
      desc: t("splitDesc"),
      color: "sky",
    },
    {
      icon: LineChart,
      title: t("forecastTitle"),
      desc: t("forecastDesc"),
      color: "indigo",
    },
    {
      icon: ShieldCheck,
      title: t("privacyTitle"),
      desc: t("privacyDesc"),
      color: "teal",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-4 py-16 sm:px-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureItems.map((item, idx) => {
          const Icon = item.icon;
          const colorStyles = {
            rose: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
            emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            amber: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
            sky: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
            indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
            teal: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400",
          }[item.color];

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
            >
              <div className="space-y-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorStyles}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
