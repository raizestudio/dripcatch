// app/components/ledger/utils.ts
import { UserSubscriptionRow, SubscriptionSplit } from "./types";

interface NetCostInput {
  cost: number | string;
  user_id?: string;
  is_owner?: boolean;
  effective_cost?: number;
  splits?: SubscriptionSplit[];
  subscription_splits?: SubscriptionSplit[];
}

/**
 * Safely parses YYYY-MM without timezone offset shifts.
 */
function parseYearMonth(
  dateStr?: string | null,
): { year: number; month: number } | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1, // 0-indexed (0 = Jan, 11 = Dec)
    };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Checks whether a subscription's first billing month has arrived as of a given date.
 */
export function hasFirstBillOccurred(
  sub: UserSubscriptionRow,
  asOfDate: Date = new Date(),
): boolean {
  const dateStr = sub.first_billed_date || sub.next_billing_date;
  if (!dateStr) return true;
  const parsed = parseYearMonth(dateStr);
  if (!parsed) return true;

  const asOfTotalMonths = asOfDate.getFullYear() * 12 + asOfDate.getMonth();
  const firstTotalMonths = parsed.year * 12 + parsed.month;
  return asOfTotalMonths >= firstTotalMonths;
}

export function getSubNetCost(
  sub: NetCostInput,
  currentUserId?: string,
  currentUserEmail?: string,
): number {
  const cost = Number(sub.cost) || 0;
  const splits = sub.subscription_splits || sub.splits || [];

  // 1. If effective_cost is already precomputed and valid, use it
  if (typeof sub.effective_cost === "number" && !isNaN(sub.effective_cost)) {
    return sub.effective_cost;
  }

  // 2. Determine ownership: default to owner unless explicitly proven otherwise
  let isOwner = true;
  if (typeof sub.is_owner === "boolean") {
    isOwner = sub.is_owner;
  } else if (currentUserId && sub.user_id) {
    isOwner = sub.user_id === currentUserId;
  }

  // 3. For participant: return their assigned portion
  if (!isOwner) {
    if (splits.length > 0) {
      const mySplit = splits.find(
        (s) =>
          (currentUserId && s.user_id === currentUserId) ||
          (currentUserEmail &&
            s.email &&
            s.email.toLowerCase() === currentUserEmail.toLowerCase()),
      );
      if (mySplit) return Number(mySplit.amount);
      return Number(splits[0].amount);
    }
    return cost;
  }

  // 4. For owner: total minus accepted splits AND manual splits (splits without emails)
  const covered = splits
    .filter(
      (s) =>
        s.status === "accepted" ||
        (!s.email && s.status !== "rejected") ||
        s.status === undefined,
    )
    .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

  return Math.max(0, cost - covered);
}

export function getNormalizedMonthly(cost: number, interval: string): number {
  switch (interval) {
    case "yearly":
      return cost / 12;
    case "quarterly":
      return cost / 3;
    case "weekly":
      return (cost * 52) / 12;
    case "monthly":
    default:
      return cost;
  }
}

export function calculateLedgerMetrics(
  subscriptions: UserSubscriptionRow[],
  currentUserId?: string,
) {
  // Only evaluate active subscriptions that have started as of this month
  const activeSubs = subscriptions.filter(
    (s) => s.status === "active" && hasFirstBillOccurred(s),
  );

  // Gross total (Plan total for owner; personal share for participant)
  const grossMonthlyBurn = activeSubs.reduce((acc, sub) => {
    const isOwner =
      typeof sub.is_owner === "boolean"
        ? sub.is_owner
        : currentUserId
          ? sub.user_id === currentUserId
          : true;
    const baseCost = isOwner
      ? Number(sub.cost)
      : getSubNetCost(sub, currentUserId);
    return acc + getNormalizedMonthly(baseCost, sub.interval);
  }, 0);

  // Net monthly burn (what you actually pay out of pocket after splits)
  const monthlyBurn = activeSubs.reduce((acc, sub) => {
    return (
      acc +
      getNormalizedMonthly(getSubNetCost(sub, currentUserId), sub.interval)
    );
  }, 0);

  const totalMonthlyRecovered = Math.max(0, grossMonthlyBurn - monthlyBurn);

  // Sum actual scheduled outflows across the next 12 months (includes future start dates)
  const forecastPoints = calculate12MonthForecast(subscriptions, currentUserId);
  const projectedAnnual = parseFloat(
    forecastPoints.reduce((acc, pt) => acc + pt.net, 0).toFixed(2),
  );

  const zombiesCount = activeSubs.filter((s) => s.is_zombie).length;
  const hikesCount = activeSubs.filter(
    (s) => s.original_cost && Number(s.cost) > Number(s.original_cost),
  ).length;

  return {
    monthlyBurn,
    grossMonthlyBurn,
    totalMonthlyRecovered,
    projectedAnnual,
    zombiesCount,
    hikesCount,
  };
}

export interface MonthlyForecastPoint {
  month: string;
  active: number;
  gross: number;
  net: number;
  covered: number;
  zombie: number;
}

export function calculate12MonthForecast(
  subscriptions: UserSubscriptionRow[],
  currentUserId?: string,
): MonthlyForecastPoint[] {
  const points: MonthlyForecastPoint[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = targetDate.toLocaleDateString("en-US", { month: "short" });

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetTotalMonths = targetYear * 12 + targetMonth;

    let monthGross = 0;
    let monthActive = 0;
    let monthZombie = 0;

    subscriptions.forEach((sub) => {
      // 1. Skip cancelled subscriptions
      if (sub.status !== "active") return;

      // 2. Exclude from this forecast month if prior to the first bill
      const startStr = sub.first_billed_date || sub.next_billing_date;
      const startParsed = parseYearMonth(startStr);

      if (startParsed) {
        const startTotalMonths = startParsed.year * 12 + startParsed.month;
        if (targetTotalMonths < startTotalMonths) {
          return;
        }
      }

      const isOwner =
        typeof sub.is_owner === "boolean"
          ? sub.is_owner
          : currentUserId
            ? sub.user_id === currentUserId
            : true;

      const netCost = getSubNetCost(sub, currentUserId);
      const grossCost = isOwner ? Number(sub.cost) : netCost;
      let willCharge = false;

      // 3. Resolve billing cadence
      if (sub.interval === "monthly") {
        willCharge = true;
      } else if (sub.interval === "weekly") {
        const weeklyGross = (grossCost * 52) / 12;
        const weeklyNet = (netCost * 52) / 12;
        monthGross += weeklyGross;
        if (sub.is_zombie) {
          monthZombie += weeklyNet;
        } else {
          monthActive += weeklyNet;
        }
        return;
      } else if (sub.interval === "yearly") {
        const anchor = parseYearMonth(sub.next_billing_date) || startParsed;
        if (anchor) {
          const anchorTotalMonths = anchor.year * 12 + anchor.month;
          if ((targetTotalMonths - anchorTotalMonths) % 12 === 0) {
            willCharge = true;
          }
        }
      } else if (sub.interval === "quarterly") {
        const anchor = parseYearMonth(sub.next_billing_date) || startParsed;
        if (anchor) {
          const anchorTotalMonths = anchor.year * 12 + anchor.month;
          if ((targetTotalMonths - anchorTotalMonths) % 3 === 0) {
            willCharge = true;
          }
        }
      }

      if (willCharge) {
        monthGross += grossCost;
        if (sub.is_zombie) {
          monthZombie += netCost;
        } else {
          monthActive += netCost;
        }
      }
    });

    const monthNet = monthActive + monthZombie;
    const covered = Math.max(0, monthGross - monthNet);

    points.push({
      month: monthKey,
      active: parseFloat(monthActive.toFixed(2)),
      zombie: parseFloat(monthZombie.toFixed(2)),
      covered: parseFloat(covered.toFixed(2)),
      net: parseFloat(monthNet.toFixed(2)),
      gross: parseFloat(monthGross.toFixed(2)),
    });
  }

  return points;
}

export interface CategoryBreakdownPoint {
  category: string;
  amount: number;
  percentage: number;
}

export function calculateCategoryBreakdown(
  subscriptions: UserSubscriptionRow[],
  currentUserId?: string,
): CategoryBreakdownPoint[] {
  const totals: Record<string, number> = {};
  let totalAll = 0;

  // Only consider active subscriptions whose first bill has already arrived
  const activeSubs = subscriptions.filter(
    (s) => s.status === "active" && hasFirstBillOccurred(s),
  );

  activeSubs.forEach((sub) => {
    const net = getSubNetCost(sub, currentUserId);
    const normalized = getNormalizedMonthly(net, sub.interval);
    totals[sub.category] = (totals[sub.category] || 0) + normalized;
    totalAll += normalized;
  });

  if (totalAll === 0) return [];

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: Math.round((amount / totalAll) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

interface CalendarDate {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  day: number; // 1-31
  hasExplicitDay: boolean;
}

/**
 * Parses YYYY-MM-DD or YYYY-MM into calendar components without timezone shifts.
 */
function parseCalendarDate(dateStr?: string | null): CalendarDate | null {
  if (!dateStr) return null;

  const match = dateStr.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const hasExplicitDay = Boolean(match[3]);
    const rawDay = match[3] ? parseInt(match[3], 10) : 1;
    const maxDay = new Date(year, month + 1, 0).getDate();

    return {
      year,
      month,
      day: Math.min(Math.max(1, rawDay), maxDay),
      hasExplicitDay,
    };
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hasExplicitDay: true,
  };
}

/**
 * Counts exact completed billing cycles between a start date and asOfDate (inclusive).
 * Handles leap years, month-end clamping (e.g., Jan 31 -> Feb 28), and DST-safe weekly math.
 */
function countBillingCycles(
  start: CalendarDate,
  asOfDate: Date,
  interval: string,
): { cycles: number; elapsedMonths: number; isUpcoming: boolean } {
  const endYear = asOfDate.getFullYear();
  const endMonth = asOfDate.getMonth();
  const endDay = asOfDate.getDate();

  const startUtcMs = Date.UTC(start.year, start.month, start.day);
  const endUtcMs = Date.UTC(endYear, endMonth, endDay);

  if (startUtcMs > endUtcMs) {
    return { cycles: 0, elapsedMonths: 0, isUpcoming: true };
  }

  let completedMonths = (endYear - start.year) * 12 + (endMonth - start.month);
  if (start.hasExplicitDay) {
    const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
    const effectiveBillingDay = Math.min(start.day, daysInEndMonth);
    if (endDay < effectiveBillingDay) {
      completedMonths -= 1;
    }
  }
  completedMonths = Math.max(0, completedMonths);

  let cycles = 1;
  switch (interval) {
    case "weekly": {
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      const elapsedDays = Math.floor((endUtcMs - startUtcMs) / MS_PER_DAY);
      cycles = Math.floor(elapsedDays / 7) + 1;
      break;
    }
    case "yearly":
      cycles = Math.floor(completedMonths / 12) + 1;
      break;
    case "quarterly":
      cycles = Math.floor(completedMonths / 3) + 1;
      break;
    case "monthly":
    default:
      cycles = completedMonths + 1;
      break;
  }

  return {
    cycles,
    elapsedMonths: completedMonths,
    isUpcoming: false,
  };
}

export interface LifetimeSpendResult {
  cycles: number;
  netPaid: number;
  grossPaid: number;
  coveredPaid: number;
  elapsedMonths: number;
  years: number;
  months: number;
  isUpcoming: boolean;
}

/**
 * Calculates cumulative lifetime spend for a single subscription from first_billed_date.
 * Returns null if first_billed_date is omitted so UI elements can hide gracefully.
 */
export function calculateLifetimeSpend(
  sub: UserSubscriptionRow,
  currentUserId?: string,
  currentUserEmail?: string,
  asOfDate: Date = new Date(),
): LifetimeSpendResult | null {
  const asOfIso = `${asOfDate.getFullYear()}-${String(asOfDate.getMonth() + 1).padStart(2, "0")}-${String(asOfDate.getDate()).padStart(2, "0")}`;

  const recordedPayments = (sub.subscription_payments ?? [])
    .filter((p) => p.billed_date <= asOfIso)
    .sort((a, b) => a.billed_date.localeCompare(b.billed_date));

  const startStr =
    sub.first_billed_date ?? recordedPayments[0]?.billed_date ?? null;
  const start = parseCalendarDate(startStr);
  if (!start) return null;

  // Cap elapsed duration at last_billed_date when paused or canceled
  let effectiveEndDate = asOfDate;
  if (sub.status !== "active") {
    const stopStr =
      sub.last_billed_date ??
      recordedPayments[recordedPayments.length - 1]?.billed_date ??
      null;
    const stopParsed = parseCalendarDate(stopStr);
    if (stopParsed) {
      const stopDate = new Date(
        stopParsed.year,
        stopParsed.month,
        stopParsed.day,
      );
      if (stopDate < effectiveEndDate) {
        effectiveEndDate = stopDate;
      }
    }
  }

  const {
    cycles: estimatedCycles,
    elapsedMonths,
    isUpcoming,
  } = countBillingCycles(start, effectiveEndDate, sub.interval);

  const isOwner =
    typeof sub.is_owner === "boolean"
      ? sub.is_owner
      : currentUserId
        ? sub.user_id === currentUserId
        : true;

  const netPerCycle = getSubNetCost(sub, currentUserId, currentUserEmail);
  const grossPerCycle = isOwner ? Number(sub.cost) || 0 : netPerCycle;
  const coveredPerCycle = Math.max(0, grossPerCycle - netPerCycle);

  // Prefer actual recorded payment rows when available
  if (sub.subscription_payments !== undefined) {
    if (recordedPayments.length === 0) {
      return {
        cycles: 0,
        netPaid: 0,
        grossPaid: 0,
        coveredPaid: 0,
        elapsedMonths,
        years: Math.floor(elapsedMonths / 12),
        months: elapsedMonths % 12,
        isUpcoming,
      };
    }

    let grossPaid = 0;
    let coveredPaid = 0;
    let netPaid = 0;

    for (const payment of recordedPayments) {
      const amt = Number(payment.amount) || 0;
      if (isOwner) {
        const covered = Math.min(amt, coveredPerCycle);
        grossPaid += amt;
        coveredPaid += covered;
        netPaid += Math.max(0, amt - covered);
      } else {
        const share = Math.min(amt, netPerCycle);
        grossPaid += share;
        netPaid += share;
      }
    }

    return {
      cycles: recordedPayments.length,
      netPaid: parseFloat(netPaid.toFixed(2)),
      grossPaid: parseFloat(grossPaid.toFixed(2)),
      coveredPaid: parseFloat(coveredPaid.toFixed(2)),
      elapsedMonths,
      years: Math.floor(elapsedMonths / 12),
      months: elapsedMonths % 12,
      isUpcoming: false,
    };
  }

  // Fallback when subscription_payments was not joined
  const netPaid = parseFloat((netPerCycle * estimatedCycles).toFixed(2));
  const grossPaid = parseFloat((grossPerCycle * estimatedCycles).toFixed(2));
  const coveredPaid = parseFloat(
    (coveredPerCycle * estimatedCycles).toFixed(2),
  );

  return {
    cycles: estimatedCycles,
    netPaid,
    grossPaid,
    coveredPaid,
    elapsedMonths,
    years: Math.floor(elapsedMonths / 12),
    months: elapsedMonths % 12,
    isUpcoming,
  };
}

export interface SubscriptionLifetimeItem {
  subscription: UserSubscriptionRow;
  lifetime: LifetimeSpendResult;
}

export interface LedgerLifetimeMetrics {
  totalNetPaid: number;
  totalGrossPaid: number;
  totalSplitSavings: number;
  totalZombieLeaked: number;
  totalBillsPaid: number;
  trackedCount: number;
  untrackedCount: number;
  items: SubscriptionLifetimeItem[];
}

/**
 * Aggregates lifetime spend, split savings, zombie leaks, and a ranked breakdown
 * across all user subscriptions for the /ledger/history view.
 */
export function calculateLedgerLifetimeMetrics(
  subscriptions: UserSubscriptionRow[],
  currentUserId?: string,
  currentUserEmail?: string,
  asOfDate: Date = new Date(),
): LedgerLifetimeMetrics {
  let totalNetPaid = 0;
  let totalGrossPaid = 0;
  let totalSplitSavings = 0;
  let totalZombieLeaked = 0;
  let totalBillsPaid = 0;
  let untrackedCount = 0;
  const items: SubscriptionLifetimeItem[] = [];

  for (const sub of subscriptions) {
    const lifetime = calculateLifetimeSpend(
      sub,
      currentUserId,
      currentUserEmail,
      asOfDate,
    );

    if (!lifetime) {
      untrackedCount += 1;
      continue;
    }

    totalNetPaid += lifetime.netPaid;
    totalGrossPaid += lifetime.grossPaid;
    totalSplitSavings += lifetime.coveredPaid;
    totalBillsPaid += lifetime.cycles;

    if (sub.is_zombie) {
      totalZombieLeaked += lifetime.netPaid;
    }

    items.push({ subscription: sub, lifetime });
  }

  items.sort((a, b) => b.lifetime.netPaid - a.lifetime.netPaid);

  return {
    totalNetPaid: parseFloat(totalNetPaid.toFixed(2)),
    totalGrossPaid: parseFloat(totalGrossPaid.toFixed(2)),
    totalSplitSavings: parseFloat(totalSplitSavings.toFixed(2)),
    totalZombieLeaked: parseFloat(totalZombieLeaked.toFixed(2)),
    totalBillsPaid,
    trackedCount: items.length,
    untrackedCount,
    items,
  };
}
