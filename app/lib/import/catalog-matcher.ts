export interface CatalogPlanOption {
  id: string;
  name?: string;
  default_cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
}

export interface CatalogSubscriptionOption {
  id: string;
  name: string;
  category: string;
  plans?: CatalogPlanOption[];
}

export interface CatalogMatchResult {
  catalogId: string | null;
  planId: string | null;
  canonicalName: string;
  category: string;
}

const NOISE_SUFFIXES_RE =
  /\b(subscription|abonnement|premium|plus|pro|plan|monthly|annual|yearly|basic|standard|family|individual|duo|student|membership|app)\b/g;

function normalizeServiceName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(NOISE_SUFFIXES_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.slice(i, i + 2));
  }
  return bigrams;
}

function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const setA = getBigrams(a);
  const setB = getBigrams(b);
  let intersection = 0;

  for (const gram of setA) {
    if (setB.has(gram)) intersection += 1;
  }

  return (2 * intersection) / (setA.size + setB.size);
}

function inferFallbackCategory(normalizedName: string): string {
  if (
    /(netflix|disney|prime video|hbo|max|hulu|youtube|apple tv|crunchyroll|canal|paramount)/.test(
      normalizedName,
    )
  ) {
    return "Streaming";
  }
  if (
    /(spotify|apple music|deezer|tidal|audible|soundcloud)/.test(normalizedName)
  ) {
    return "Music";
  }
  if (
    /(icloud|google one|dropbox|onedrive|proton|nordvpn|expressvpn|1password|bitwarden)/.test(
      normalizedName,
    )
  ) {
    return "Cloud & Security";
  }
  if (
    /(chatgpt|openai|claude|anthropic|midjourney|perplexity|github|copilot|cursor)/.test(
      normalizedName,
    )
  ) {
    return "AI & Dev";
  }
  if (
    /(strava|peloton|whoop|headspace|calm|duolingo|fitness)/.test(
      normalizedName,
    )
  ) {
    return "Health & Fitness";
  }
  if (
    /(adobe|figma|notion|canva|microsoft 365|office|slack|zoom)/.test(
      normalizedName,
    )
  ) {
    return "Productivity";
  }
  return "Other";
}

export function matchCatalogSubscription(
  extractedName: string,
  interval: "weekly" | "monthly" | "quarterly" | "yearly",
  cost: number,
  catalog: CatalogSubscriptionOption[],
): CatalogMatchResult {
  const cleanExtracted = normalizeServiceName(extractedName);

  let bestItem: CatalogSubscriptionOption | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const cleanCatalog = normalizeServiceName(item.name);
    if (!cleanCatalog || !cleanExtracted) continue;

    let score = 0;
    if (cleanCatalog === cleanExtracted) {
      score = 1;
    } else if (
      cleanExtracted.includes(cleanCatalog) ||
      cleanCatalog.includes(cleanExtracted)
    ) {
      score = 0.88;
    } else {
      score = diceSimilarity(cleanExtracted, cleanCatalog);
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (!bestItem || bestScore < 0.65) {
    return {
      catalogId: null,
      planId: null,
      canonicalName: extractedName.trim(),
      category: inferFallbackCategory(cleanExtracted),
    };
  }

  // Match closest plan by interval and cost if plans were joined
  let matchedPlanId: string | null = null;
  if (bestItem.plans && bestItem.plans.length > 0) {
    const sameIntervalPlans = bestItem.plans.filter(
      (p) => p.interval === interval,
    );
    const candidates =
      sameIntervalPlans.length > 0 ? sameIntervalPlans : bestItem.plans;

    const closestPlan = candidates.reduce((prev, curr) =>
      Math.abs(Number(curr.default_cost) - cost) <
      Math.abs(Number(prev.default_cost) - cost)
        ? curr
        : prev,
    );
    matchedPlanId = closestPlan.id;
  }

  return {
    catalogId: bestItem.id,
    planId: matchedPlanId,
    canonicalName: bestItem.name,
    category: bestItem.category,
  };
}
