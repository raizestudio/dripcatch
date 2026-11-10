"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";

export function Faq() {
  const t = useTranslations("Landing.faq");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>FAQ</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-10 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="transition-colors">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-zinc-900 transition hover:text-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-400 sm:text-sm"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 animate-in fade-in-50">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
