"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  scriptProps,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const resolvedScriptProps =
    typeof window === "undefined"
      ? scriptProps
      : ({ type: "application/json", ...scriptProps } as const);

  return (
    <NextThemesProvider {...props} scriptProps={resolvedScriptProps}>
      {children}
    </NextThemesProvider>
  );
}
