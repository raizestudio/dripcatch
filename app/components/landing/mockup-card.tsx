"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Ghost,
  AlertTriangle,
  Play,
  Pause,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface TimelineFrame {
  month: string;
  monthShort: string;
  total: number;
  creepAmount: number;
  hikesCount: number;
  zombiesCount: number;
  tagline: string;
  items: {
    name: string;
    detail: string;
    cost: string;
    costNum: number;
    badge?: string;
    badgeColor?: "rose" | "amber" | "emerald";
    isHiked?: boolean;
    isZombie?: boolean;
  }[];
}

const TIMELINE: TimelineFrame[] = [
  {
    month: "January (Baseline)",
    monthShort: "Jan",
    total: 124.0,
    creepAmount: 0,
    hikesCount: 0,
    zombiesCount: 0,
    tagline: "Healthy subscription baseline",
    items: [
      {
        name: "Cloud Storage",
        detail: "Monthly • 2TB Tier",
        cost: "$9.99",
        costNum: 9.99,
      },
      {
        name: "Streaming 4K",
        detail: "Annual ($180/yr)",
        cost: "$15.00/mo",
        costNum: 15.0,
      },
      {
        name: "AI Copilot",
        detail: "Pro Developer",
        cost: "$20.00",
        costNum: 20.0,
      },
      {
        name: "Fitness Gym Pass",
        detail: "Monthly access",
        cost: "$39.00",
        costNum: 39.0,
      },
    ],
  },
  {
    month: "May (Stealth Hike)",
    monthShort: "May",
    total: 144.0,
    creepAmount: 20.0,
    hikesCount: 1,
    zombiesCount: 0,
    tagline: "+$5.00/mo unannounced price hike",
    items: [
      {
        name: "Cloud Storage",
        detail: "Was $9.99 • Stealth increase",
        cost: "$14.99",
        costNum: 14.99,
        badge: "Hike +50%",
        badgeColor: "rose",
        isHiked: true,
      },
      {
        name: "Streaming 4K",
        detail: "Annual ($180/yr)",
        cost: "$15.00/mo",
        costNum: 15.0,
      },
      {
        name: "AI Copilot",
        detail: "Pro Developer",
        cost: "$20.00",
        costNum: 20.0,
      },
      {
        name: "Fitness Gym Pass",
        detail: "Monthly access",
        cost: "$39.00",
        costNum: 39.0,
      },
    ],
  },
  {
    month: "September (Zombie Leak)",
    monthShort: "Sep",
    total: 189.98,
    creepAmount: 65.98,
    hikesCount: 1,
    zombiesCount: 1,
    tagline: "Zombie service: 90 days unopened",
    items: [
      {
        name: "Cloud Storage",
        detail: "Hiked earlier this year",
        cost: "$14.99",
        costNum: 14.99,
        badge: "Hike +50%",
        badgeColor: "rose",
        isHiked: true,
      },
      {
        name: "Streaming 4K",
        detail: "Price update notice",
        cost: "$17.99/mo",
        costNum: 17.99,
        badge: "+$2.99",
        badgeColor: "amber",
        isHiked: true,
      },
      {
        name: "AI Copilot",
        detail: "Pro Developer",
        cost: "$20.00",
        costNum: 20.0,
      },
      {
        name: "Fitness Gym Pass",
        detail: "0 visits logged in 90 days",
        cost: "$39.00",
        costNum: 39.0,
        badge: "Zombie 👻",
        badgeColor: "amber",
        isZombie: true,
      },
    ],
  },
  {
    month: "December (Annual Bleed)",
    monthShort: "Dec",
    total: 242.8,
    creepAmount: 118.8,
    hikesCount: 2,
    zombiesCount: 1,
    tagline: "Outflow creep peaked at +$118/mo",
    items: [
      {
        name: "Cloud Storage",
        detail: "Hiked rate locked in",
        cost: "$14.99",
        costNum: 14.99,
        badge: "Hike +50%",
        badgeColor: "rose",
        isHiked: true,
      },
      {
        name: "Streaming 4K",
        detail: "Annual renewal upcoming",
        cost: "$17.99/mo",
        costNum: 17.99,
        badge: "Hiked",
        badgeColor: "amber",
      },
      {
        name: "AI Copilot",
        detail: "Extra team seat auto-added",
        cost: "$35.00",
        costNum: 35.0,
        badge: "+$15.00",
        badgeColor: "amber",
      },
      {
        name: "Fitness Gym Pass",
        detail: "Forgotten auto-renewal",
        cost: "$39.00",
        costNum: 39.0,
        badge: "Zombie 👻",
        badgeColor: "rose",
        isZombie: true,
      },
    ],
  },
];

export function MockupCard({
  mouseX = 0,
  mouseY = 0,
}: {
  mouseX?: number;
  mouseY?: number;
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance timeline
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % TIMELINE.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const frame = TIMELINE[frameIdx];

  // 3D Parallax tilt calculations
  const maxTilt = 12; // degrees
  const rotateX = -mouseY * maxTilt;
  const rotateY = mouseX * maxTilt;

  // Glare position following the mouse
  const glareX = (mouseX + 1) * 50;
  const glareY = (mouseY + 1) * 50;

  return (
    <div
      className="relative mx-auto max-w-xl [perspective:1200px]"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Floating Badge Left: Zombie Alert (Reacts to 3D depth) */}
      <div
        className="pointer-events-none absolute -top-6 -left-4 z-20 hidden rounded-xl border border-rose-500/20 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-transform duration-200 ease-out sm:flex sm:items-center sm:gap-2.5 dark:border-rose-500/30 dark:bg-zinc-900/95"
        style={{
          transform: `translate3d(${mouseX * -18}px, ${mouseY * -18}px, 45px)`,
        }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
          <Ghost className="h-4 w-4" />
        </div>
        <div className="text-left font-mono">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Zombie Detected
          </p>
          <p className="text-xs font-bold text-zinc-900 dark:text-white">
            -$39.00/mo unused
          </p>
        </div>
      </div>

      {/* Floating Badge Right: Hike Caught */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-4 z-20 hidden rounded-xl border border-amber-500/20 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-transform duration-200 ease-out sm:flex sm:items-center sm:gap-2.5 dark:border-amber-500/30 dark:bg-zinc-900/95"
        style={{
          transform: `translate3d(${mouseX * 22}px, ${mouseY * 22}px, 50px)`,
        }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-left font-mono">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Stealth Hike Caught
          </p>
          <p className="text-xs font-bold text-zinc-900 dark:text-white">
            +$5.00/mo unannounced
          </p>
        </div>
      </div>

      {/* Main 3D Tilted Card Body */}
      <div
        className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900/95 sm:p-6"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic Specular Glare Overlay */}
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-40 transition-opacity duration-300 dark:opacity-25"
          style={{
            background: `radial-gradient(circle 320px at ${glareX}% ${glareY}%, rgba(255,255,255,0.7), transparent 80%)`,
          }}
        />

        {/* Top Interactive Timeline Scrubber */}
        <div className="relative z-10 mb-5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                12-Month Outflow Simulator
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-2.5 w-2.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-2.5 w-2.5" /> Play
                </>
              )}
            </button>
          </div>

          {/* Month Segment Pills */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {TIMELINE.map((step, idx) => {
              const isActive = idx === frameIdx;
              return (
                <button
                  key={step.monthShort}
                  type="button"
                  onClick={() => {
                    setFrameIdx(idx);
                    setIsPlaying(false);
                  }}
                  className={`group relative overflow-hidden rounded-lg py-1.5 text-center text-xs font-mono font-bold transition-all ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{step.monthShort}</span>
                  {isActive && isPlaying && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-400 animate-[progress_3.4s_linear]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Header & Dynamic Monthly Burn */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Net Monthly Outflow • {frame.month}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tabular-nums tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                ${frame.total.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500">/mo</span>

              {frame.creepAmount > 0 && (
                <span className="inline-flex items-center gap-0.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +${frame.creepAmount.toFixed(2)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {frame.tagline}
            </p>
          </div>

          {/* Alert Pills */}
          <div className="flex flex-col items-end gap-1.5 font-mono">
            {frame.hikesCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                {frame.hikesCount} {frame.hikesCount === 1 ? "Hike" : "Hikes"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Optimized
              </span>
            )}

            {frame.zombiesCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Ghost className="h-3 w-3" /> 1 Zombie
              </span>
            )}
          </div>
        </div>

        {/* Live List Items */}
        <div className="relative z-10 mt-5 divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {frame.items.map((item) => {
            const badgeClasses = {
              rose: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
              amber:
                "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
              emerald:
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            }[item.badgeColor || "rose"];

            return (
              <div
                key={item.name}
                className={`flex items-center justify-between py-2.5 transition-colors ${
                  item.isHiked || item.isZombie
                    ? "bg-rose-500/[0.03] px-2 -mx-2 rounded-lg"
                    : ""
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span
                        className={`rounded-md border px-1.5 py-0.2 text-[10px] font-mono font-bold ${badgeClasses}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.detail}
                  </p>
                </div>

                <span
                  className={`font-mono text-xs font-bold tabular-nums ${
                    item.isHiked
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  {item.cost}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee inside Card */}
        <div className="relative z-10 mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-[11px] dark:bg-zinc-950/60">
          <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
            Auto-checks renewal dates
          </span>
          <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Privacy Guaranteed
          </span>
        </div>
      </div>
    </div>
  );
}
