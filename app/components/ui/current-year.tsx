// app/components/ui/current-year.tsx
"use client";

import { useState, useEffect, startTransition } from "react";

export function CurrentYear({ fallback = 2026 }: { fallback?: number }) {
  const [year, setYear] = useState<number>(fallback);

  useEffect(() => {
    startTransition(() => {
      setYear(new Date().getFullYear());
    });
  }, []);

  return <>{year}</>;
}
