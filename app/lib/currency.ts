export interface CurrencyMeta {
  code: string;
  symbol: string;
  label: string;
}

export const DEFAULT_CURRENCIES: Record<string, string> = {
  en: "USD",
  fr: "EUR",
};

export function getCurrencyForLocale(locale: string): string {
  return DEFAULT_CURRENCIES[locale] || "EUR";
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "CAD", symbol: "CA$", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", symbol: "AU$", label: "AUD ($) - Australian Dollar" },
  { code: "CHF", symbol: "CHF", label: "CHF - Swiss Franc" },
  { code: "JPY", symbol: "¥", label: "JPY (¥) - Japanese Yen" },
];

export function formatCurrency(
  amount: number,
  currencyCode: string = "EUR",
  locale: string = "en",
): string {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
      maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
