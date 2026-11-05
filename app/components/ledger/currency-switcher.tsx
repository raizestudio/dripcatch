"use client";

import { useState, useTransition } from "react";
import { Coins, Loader2 } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/app/lib/currency";
import { updateBaseCurrency } from "@/app/actions/settings";

export function CurrencySwitcher({
  currentCurrency,
}: {
  currentCurrency: string;
}) {
  const [currency, setCurrency] = useState(currentCurrency);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextCurrency: string) {
    setCurrency(nextCurrency);
    startTransition(async () => {
      await updateBaseCurrency(nextCurrency);
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <Coins className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
      <select
        value={currency}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select Base Currency"
        className="appearance-none rounded-lg border border-zinc-200 bg-white py-2 pr-7 pl-8 text-xs font-semibold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 focus:border-emerald-500 focus:outline-hidden disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.symbol})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 flex items-center text-zinc-400">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
