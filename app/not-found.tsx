// app/not-found.tsx
import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Flame className="h-3.5 w-3.5" />
        <span>404 • Missing Outflow</span>
      </div>

      <div className="mb-2 select-none font-mono text-7xl font-extrabold tracking-tighter sm:text-9xl">
        <span className="bg-gradient-to-b from-zinc-900 to-zinc-400 bg-clip-text text-transparent dark:from-white dark:to-zinc-600">
          404
        </span>
      </div>

      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
        This page leaked away
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        The requested URL does not exist or has been moved.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
