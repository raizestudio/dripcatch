// app/components/ui/sonner.tsx
"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ),
        info: <InfoIcon className="size-4 text-sky-600 dark:text-sky-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-600 dark:text-rose-400" />
        ),
        loading: <Loader2Icon className="size-4 animate-spin text-zinc-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "bg-white! dark:bg-zinc-900! text-zinc-950! dark:text-zinc-100! border! border-solid! shadow-xl! rounded-xl!",
          description: "text-zinc-600! dark:text-zinc-400!",
          default: "border-zinc-200! dark:border-zinc-800!",
          success: "border-emerald-500/60! dark:border-emerald-500/50!",
          error: "border-rose-500/60! dark:border-rose-500/50!",
          warning: "border-amber-500/60! dark:border-amber-500/50!",
          info: "border-sky-500/60! dark:border-sky-500/50!",
          closeButton:
            "bg-white! dark:bg-zinc-900! border! border-solid! border-zinc-200! dark:border-zinc-800! text-zinc-500! hover:text-zinc-900! dark:hover:text-zinc-100!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
