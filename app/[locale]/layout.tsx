import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

import { Navbar } from "@/app/components/ui/navbar";
import { Footer } from "@/app/components/ui/footer";
import { SyncHtmlLang } from "@/app/components/ui/sync-html-lang";

export const instant = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dripcatch.eu";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "DripCatch — Subscription & Shared Expense Tracker",
    template: "%s | DripCatch",
  },
  description:
    "Track recurring subscriptions, eliminate zombie expenses, detect unexpected price hikes, and split costs seamlessly with friends.",
  applicationName: "DripCatch",
  authors: [{ name: "DripCatch", url: baseUrl }],
  creator: "DripCatch",
  publisher: "DripCatch",
  openGraph: {
    title: {
      default: "DripCatch — Subscription & Shared Expense Tracker",
      template: "%s | DripCatch",
    },
    description:
      "Track recurring subscriptions, eliminate zombie expenses, detect unexpected price hikes, and split costs seamlessly with friends.",
    siteName: "DripCatch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "DripCatch — Subscription & Shared Expense Tracker",
      template: "%s | DripCatch",
    },
    description:
      "Track recurring subscriptions, eliminate zombie expenses, detect unexpected price hikes, and split costs seamlessly with friends.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SyncHtmlLang locale={locale} />
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
