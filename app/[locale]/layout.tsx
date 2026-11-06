import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dripcatch.eu";

  const languageAlternates = routing.locales.reduce<Record<string, string>>(
    (acc, loc) => {
      acc[loc] = `${baseUrl}/${loc}`;
      return acc;
    },
    { "x-default": `${baseUrl}/${routing.defaultLocale}` },
  );

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t("title"),
      template: `%s | DripCatch`,
    },
    description: t("description"),
    applicationName: "DripCatch",
    authors: [{ name: "DripCatch", url: baseUrl }],
    creator: "DripCatch",
    publisher: "DripCatch",
    keywords: [
      "subscription tracker",
      "split subscriptions",
      "shared expenses",
      "subscription manager",
      "track recurring expenses",
      "zombie subscription detector",
      "price hike alert",
      "dripcatch",
    ],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: languageAlternates,
    },
    openGraph: {
      title: {
        default: t("title"),
        template: `%s | DripCatch`,
      },
      description: t("description"),
      url: `${baseUrl}/${locale}`,
      siteName: "DripCatch",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
      // images: [
      //   {
      //     url: "/og-image.png",
      //     width: 1200,
      //     height: 630,
      //     alt: "DripCatch - Subscription & Shared Expense Tracker",
      //   },
      // ],
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: t("title"),
        template: `%s | DripCatch`,
      },
      description: t("description"),
      // images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

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
      <Navbar />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
