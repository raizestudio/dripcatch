import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { getStaffSession } from "@/app/lib/auth/admin";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await connection();

  const staff = await getStaffSession();
  if (!staff) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
