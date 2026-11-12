import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

function LoginFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mx-auto h-6 w-36 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="mx-auto h-4 w-56 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-950" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-950" />
            </div>
            <div className="h-10 w-full animate-pulse rounded-lg bg-emerald-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function LoginContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginForm />;
}

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent params={params} />
    </Suspense>
  );
}
