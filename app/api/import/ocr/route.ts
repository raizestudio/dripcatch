import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { checkRateLimit } from "@/app/lib/rate-limit";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const OCR_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 }; // 10 req / 10 min

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const VALID_INTERVALS = new Set([
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const);

const VALID_CONFIDENCE = new Set(["high", "medium", "low"] as const);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

export interface ExtractedOcrSubscription {
  name: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  nextBillingDate: string | null;
  confidence: "high" | "medium" | "low";
}

function matchesImageMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12) return false;

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    const riff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;
    return riff && webp;
  }

  return false;
}

function sanitizeExtractedItems(rawItems: unknown): ExtractedOcrSubscription[] {
  if (!Array.isArray(rawItems)) return [];

  const sanitized: ExtractedOcrSubscription[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;

    const name =
      typeof record.name === "string" ? record.name.trim().slice(0, 120) : "";
    const cost = Number(record.cost);

    if (!name || !Number.isFinite(cost) || cost <= 0) continue;

    const rawCurrency =
      typeof record.currency === "string"
        ? record.currency.trim().toUpperCase()
        : "EUR";
    const currency = CURRENCY_RE.test(rawCurrency) ? rawCurrency : "EUR";

    const rawInterval =
      typeof record.interval === "string"
        ? record.interval.trim().toLowerCase()
        : "monthly";
    const interval = VALID_INTERVALS.has(
      rawInterval as ExtractedOcrSubscription["interval"],
    )
      ? (rawInterval as ExtractedOcrSubscription["interval"])
      : "monthly";

    const rawDate =
      typeof record.nextBillingDate === "string"
        ? record.nextBillingDate.trim()
        : null;
    const nextBillingDate =
      rawDate && ISO_DATE_RE.test(rawDate) ? rawDate : null;

    const rawConfidence =
      typeof record.confidence === "string"
        ? record.confidence.trim().toLowerCase()
        : "medium";
    const confidence = VALID_CONFIDENCE.has(
      rawConfidence as ExtractedOcrSubscription["confidence"],
    )
      ? (rawConfidence as ExtractedOcrSubscription["confidence"])
      : "medium";

    sanitized.push({
      name,
      cost: Math.round(cost * 100) / 100,
      currency,
      interval,
      nextBillingDate,
      confidence,
    });
  }

  return sanitized;
}

async function extractSubscriptionsFromImage(
  base64Data: string,
  mimeType: string,
): Promise<ExtractedOcrSubscription[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_OCR_MODEL || "gemini-3-flash-preview";
  const todayIso = new Date().toISOString().slice(0, 10);

  const systemPrompt = [
    "You extract recurring subscription details from mobile or desktop billing screenshots",
    "(e.g., iOS Settings > Apple ID > Subscriptions, Google Play Payments & subscriptions, or SaaS billing pages).",
    `Current reference date: ${todayIso}.`,
    "Rules:",
    "- Extract every visible active or renewing subscription line item.",
    "- Normalize currency symbols (€ -> EUR, $ -> USD, £ -> GBP, CHF -> CHF, CA$ -> CAD, A$ -> AUD).",
    "- Map billing cadence to one of: weekly, monthly, quarterly, yearly.",
    "- Format nextBillingDate as YYYY-MM-DD when a renewal or next billing date is visible; otherwise return null.",
    "- Ignore expired/canceled items unless no active items exist, and ignore promotional banners or totals.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: "Extract all recurring subscriptions visible in this screenshot.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              subscriptions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    cost: { type: "NUMBER" },
                    currency: { type: "STRING" },
                    interval: {
                      type: "STRING",
                      enum: ["weekly", "monthly", "quarterly", "yearly"],
                    },
                    nextBillingDate: {
                      type: "STRING",
                      nullable: true,
                    },
                    confidence: {
                      type: "STRING",
                      enum: ["high", "medium", "low"],
                    },
                  },
                  required: [
                    "name",
                    "cost",
                    "currency",
                    "interval",
                    "nextBillingDate",
                    "confidence",
                  ],
                },
              },
            },
            required: ["subscriptions"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Vision API returned status ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawJsonText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJsonText) return [];

  const parsed = JSON.parse(rawJsonText) as { subscriptions?: unknown };
  return sanitizeExtractedItems(parsed.subscriptions);
}

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_OCR !== "true") {
    return NextResponse.json(
      { error: "Screenshot OCR import is currently disabled." },
      { status: 503 },
    );
  }

  // 1. Require authenticated Supabase session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Enforce per-user rate limit (10 requests / 10 minutes)
  const rateLimit = checkRateLimit(`import:ocr:${user.id}`, OCR_RATE_LIMIT);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many screenshot scans. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  // 3. Validate multipart image upload before touching external vision API
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data." },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Missing image file field." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
    return NextResponse.json(
      { error: "Unsupported file format. Upload PNG, JPEG, or WebP." },
      { status: 400 },
    );
  }

  if (fileEntry.size <= 0 || fileEntry.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Image must be between 1 byte and 5 MB." },
      { status: 400 },
    );
  }

  // 4. Read into ephemeral buffer, verify signature, extract, and discard immediately
  let base64Image: string | null = null;
  try {
    const arrayBuffer = await fileEntry.arrayBuffer();
    if (
      arrayBuffer.byteLength <= 0 ||
      arrayBuffer.byteLength > MAX_FILE_BYTES
    ) {
      return NextResponse.json(
        { error: "Image exceeds the 5 MB limit." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(arrayBuffer);
    if (!matchesImageMagicBytes(bytes, fileEntry.type)) {
      return NextResponse.json(
        { error: "Invalid or corrupted image file." },
        { status: 400 },
      );
    }

    base64Image = Buffer.from(bytes).toString("base64");
    const subscriptions = await extractSubscriptionsFromImage(
      base64Image,
      fileEntry.type,
    );

    return NextResponse.json({ subscriptions });
  } catch (err) {
    console.error(
      "[import/ocr] Extraction failed:",
      err instanceof Error ? err.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to extract subscriptions from screenshot." },
      { status: 502 },
    );
  } finally {
    base64Image = null;
  }
}
