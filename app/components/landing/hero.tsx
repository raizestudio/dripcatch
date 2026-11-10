"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TrendingUp, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { MockupCard } from "./mockup-card";

export function Hero() {
  const t = useTranslations("Landing");
  const heroRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    // Normalize coordinates between -1 and 1
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  }

  function handleMouseLeave() {
    setMousePos({ x: 0, y: 0 });
  }

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-6 sm:pt-20 sm:pb-28"
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[120px] transition-transform duration-300 ease-out dark:bg-emerald-500/20"
        style={{
          left: `${(mousePos.x + 1) * 50}%`,
          top: `${(mousePos.y + 1) * 50}%`,
        }}
      />

      {/* Ambient Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] dark:opacity-40" />

      <div className="mx-auto max-w-4xl space-y-6 text-center">
        {/* Animated Tag Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 backdrop-blur-xs transition hover:bg-emerald-500/15 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
          <span>{t("badge")}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl dark:text-white text-balance">
          {t("heroTitle1")}{" "}
          <span className="relative whitespace-nowrap">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300">
              {t("heroTitle2")}
            </span>
            <svg
              className="absolute -bottom-2 left-0 -z-10 h-3 w-full text-emerald-500/25"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M0 15 Q 50 0 100 15"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
              />
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400 text-pretty">
          {t("heroSubtitle")}
        </p>

        {/* CTA & Trust Badges */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
          <Link
            href="/ledger"
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-7 font-semibold text-zinc-950 shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-400 hover:shadow-emerald-500/35 active:scale-98 sm:w-auto"
          >
            <span>{t("ctaPrimary")}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("noBankRequired")}</span>
          </div>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:inline-block dark:bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>12-Month Outflow Radar</span>
          </div>
        </div>
      </div>

      {/* 3D Parallax Mockup Card */}
      <div className="mt-12 sm:mt-16">
        <MockupCard mouseX={mousePos.x} mouseY={mousePos.y} />
      </div>
    </section>
  );
}
