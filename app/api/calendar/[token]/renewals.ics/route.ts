import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";

type BillingInterval = "weekly" | "monthly" | "quarterly" | "yearly";

const RRULE_MAP: Record<BillingInterval, string> = {
  weekly: "FREQ=WEEKLY;INTERVAL=1",
  monthly: "FREQ=MONTHLY;INTERVAL=1",
  quarterly: "FREQ=MONTHLY;INTERVAL=3",
  yearly: "FREQ=YEARLY;INTERVAL=1",
};

const INTERVAL_LABELS: Record<"en" | "fr", Record<BillingInterval, string>> = {
  en: {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  },
  fr: {
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    quarterly: "Trimestriel",
    yearly: "Annuel",
  },
};

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line: string): string {
  const maxBytes = 75;
  if (Buffer.byteLength(line, "utf8") <= maxBytes) return line;

  const chunks: string[] = [];
  let current = "";

  for (const char of line) {
    const candidate = current + char;
    if (Buffer.byteLength(candidate, "utf8") > maxBytes) {
      chunks.push(current);
      current = ` ${char}`;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks.join("\r\n");
}

function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function addOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + 1));
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatIcsTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatAmount(
  amount: number,
  currency: string,
  locale: "en" | "fr",
): string {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Reject malformed tokens before touching Supabase
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale: "en" | "fr" = localeParam === "fr" ? "fr" : "en";

  const supabase = createAdminClient();

  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("user_id, reminder_days")
    .eq("calendar_feed_token", token)
    .maybeSingle();

  if (settingsError || !settings) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { data: subscriptions, error: subsError } = await supabase
    .from("user_subscriptions")
    .select(
      "id, name, category, cost, currency, interval, next_billing_date, notes",
    )
    .eq("user_id", settings.user_id)
    .eq("status", "active")
    .not("next_billing_date", "is", null);

  if (subsError) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  const activeSubs = subscriptions ?? [];
  const subIds = activeSubs.map((s) => s.id);

  // Fetch accepted splits so events show the user's actual out-of-pocket share
  const splitsBySub = new Map<string, number>();
  if (subIds.length > 0) {
    const { data: splits } = await supabase
      .from("subscription_splits")
      .select("subscription_id, amount")
      .in("subscription_id", subIds)
      .eq("status", "accepted");

    for (const split of splits ?? []) {
      const prev = splitsBySub.get(split.subscription_id) ?? 0;
      splitsBySub.set(split.subscription_id, prev + Number(split.amount));
    }
  }

  const dtStamp = formatIcsTimestamp(new Date());
  const reminderDays = Math.max(1, settings.reminder_days ?? 2);
  const calName =
    locale === "fr" ? "DripCatch — Renouvellements" : "DripCatch — Renewals";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DripCatch//Subscription Renewals//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const sub of activeSubs) {
    if (!sub.next_billing_date) continue;
    const grossCost = Number(sub.cost);
    const coveredBySplits = splitsBySub.get(sub.id) ?? 0;
    const netCost = Math.max(0, grossCost - coveredBySplits);
    const isShared = coveredBySplits > 0;

    const formattedNet = formatAmount(netCost, sub.currency, locale);
    const formattedGross = formatAmount(grossCost, sub.currency, locale);

    const summary = isShared
      ? locale === "fr"
        ? `${sub.name} (${formattedNet} part personnelle)`
        : `${sub.name} (${formattedNet} personal share)`
      : `${sub.name} (${formattedNet})`;

    const intervalKey = (
      sub.interval in RRULE_MAP ? sub.interval : "monthly"
    ) as BillingInterval;
    const intervalLabel = INTERVAL_LABELS[locale][intervalKey];

    const descParts =
      locale === "fr"
        ? [
            `Abonnement : ${sub.name}`,
            `Fréquence : ${intervalLabel}`,
            isShared
              ? `Votre part : ${formattedNet} (Total : ${formattedGross})`
              : `Montant : ${formattedNet}`,
            `Catégorie : ${sub.category}`,
            sub.notes ? `Notes : ${sub.notes}` : null,
          ]
        : [
            `Subscription: ${sub.name}`,
            `Billing cycle: ${intervalLabel}`,
            isShared
              ? `Your share: ${formattedNet} (Total: ${formattedGross})`
              : `Amount: ${formattedNet}`,
            `Category: ${sub.category}`,
            sub.notes ? `Notes: ${sub.notes}` : null,
          ];

    const description = descParts.filter(Boolean).join("\n");
    const dtStart = formatIcsDate(sub.next_billing_date);
    const dtEnd = addOneDay(sub.next_billing_date);
    const rrule = RRULE_MAP[intervalKey];

    lines.push(
      "BEGIN:VEVENT",
      `UID:dripcatch-sub-${sub.id}@dripcatch.fr`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `RRULE:${rrule}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(summary)}`,
      `TRIGGER:-P${reminderDays}D`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  const body = lines.map(foldIcsLine).join("\r\n") + "\r\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="renewals.ics"',
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
