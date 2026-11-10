import { useTranslations } from "next-intl";
import { PlusCircle, UserCheck, ShieldAlert } from "lucide-react";

export function HowItWorks() {
  const t = useTranslations("Landing.howItWorks");

  const steps = [
    {
      num: "01",
      icon: PlusCircle,
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      num: "02",
      icon: UserCheck,
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      num: "03",
      icon: ShieldAlert,
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-100/40 px-4 py-16 dark:border-zinc-800/60 dark:bg-zinc-900/20 sm:px-6 sm:py-24 transition-colors">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t("badge")}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative space-y-3">
                <span className="font-mono text-3xl font-black text-zinc-300 dark:text-zinc-800">
                  {step.num}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
