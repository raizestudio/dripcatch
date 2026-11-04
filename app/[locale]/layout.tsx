// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

import { Navbar } from "@/app/components/ui/navbar";
import { Footer } from "@/app/components/ui/footer";
import { SyncHtmlLang } from "@/app/components/ui/sync-html-lang";

// Opt the i18n layout segment out of instant shell validation.
// Descendant routes (e.g. /ledger) remain independently validated and streamable.
export const instant = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
