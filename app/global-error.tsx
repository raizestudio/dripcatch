"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-4 text-center font-sans text-zinc-100 selection:bg-rose-500/20 selection:text-rose-400">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
          <AlertOctagon className="h-3.5 w-3.5" />
          <span>System Failure</span>
        </div>

        <div className="relative mb-2 select-none font-mono text-7xl font-extrabold tracking-tighter text-white sm:text-9xl">
          500
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Critical application error
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          A fundamental error halted the application shell. Please refresh or
          retry.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reload application</span>
        </button>
      </body>
    </html>
  );
}
