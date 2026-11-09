// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getCurrencyForLocale } from "@/app/lib/currency";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const currency = getCurrencyForLocale(locale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    formats: {
      number: {
        currency: {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        },
      },
    },
  };
});
