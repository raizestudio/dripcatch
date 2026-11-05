import { UserSubscriptionRow } from "./types";

export function getSubNetCost(sub: any, currentUserId?: string): number {
  const cost = Number(sub.cost);
  const splits = sub.subscription_splits || sub.splits || [];

  // 1. If effective_cost was already computed by getSubscriptions(), use it directly
  if (sub.effective_cost !== undefined) {
    return Number(sub.effective_cost);
  }

  // 2. Determine ownership reliably
  let isOwner = true;
  if (typeof sub.is_owner === "boolean") {
    isOwner = sub.is_owner;
  } else if (currentUserId) {
    isOwner = sub.user_id === currentUserId;
  } else if (sub.is_owner === undefined && splits.length > 0) {
    // If undefined but splits exist, look for participant split
    isOwner = false;
  }

  // 3. For participant: their cost is their specific split amount
  if (!isOwner) {
    if (currentUserId && splits.length > 0) {
      const mySplit = splits.find(
        (s: any) =>
          s.user_id === currentUserId ||
          (s.email && sub.user_email && s.email.toLowerCase() === sub.user_email.toLowerCase())
      );
      if (mySplit) return Number(mySplit.amount);
    }
    return splits.length > 0 ? Number(splits[0].amount) : cost;
  }

  // 4. For owner: their expense is total minus accepted splits
  const covered = splits
    .filter((s: any) => s.status === undefined || s.status === "accepted")
    .reduce((acc: number, s: any) => acc + Number(s.amount), 0);

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
  currentUserId?: string
) {
  // Gross total (Plan total for owner; personal share for participant)
  const grossMonthlyBurn = subscriptions.reduce((acc, sub) => {
    const isOwner =
      typeof (sub as any).is_owner === "boolean"
        ? (sub as any).is_owner
        : currentUserId
        ? sub.user_id === currentUserId
        : true;
    const baseCost = isOwner ? Number(sub.cost) : getSubNetCost(sub, currentUserId);
    return acc + getNormalizedMonthly(baseCost, sub.interval);
  }, 0);

  // Net monthly burn (what you actually pay out of pocket after splits)
  const monthlyBurn = subscriptions.reduce((acc, sub) => {
    return acc + getNormalizedMonthly(getSubNetCost(sub, currentUserId), sub.interval);
  }, 0);

  const totalMonthlyRecovered = Math.max(0, grossMonthlyBurn - monthlyBurn);
  const projectedAnnual = monthlyBurn * 12;
  const zombiesCount = subscriptions.filter((s) => s.is_zombie).length;
  const hikesCount = subscriptions.filter(
    (s) => s.original_cost && Number(s.cost) > Number(s.original_cost)
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
  gross: number;
  net: number;
  covered: number;
  zombie: number;
}

export function calculate12MonthForecast(
  subscriptions: UserSubscriptionRow[],
  currentUserId?: string
): MonthlyForecastPoint[] {
  const points: MonthlyForecastPoint[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = targetDate.toLocaleDateString("en-US", { month: "short" });

    let monthGross = 0;
    let monthNet = 0;
    let monthZombie = 0;

    subscriptions.forEach((sub) => {
      const isOwner =
        typeof (sub as any).is_owner === "boolean"
          ? (sub as any).is_owner
          : currentUserId
          ? sub.user_id === currentUserId
          : true;

      const netCost = getSubNetCost(sub, currentUserId);
      const grossCost = isOwner ? Number(sub.cost) : netCost;
      let willCharge = false;

      if (sub.interval === "monthly") {
        willCharge = true;
      } else if (sub.interval === "weekly") {
        const weeklyGross = (grossCost * 52) / 12;
        const weeklyNet = (netCost * 52) / 12;
        monthGross += weeklyGross;
        monthNet += weeklyNet;
        if (sub.is_zombie) monthZombie += weeklyNet;
        return;
      } else if (sub.interval === "yearly" && sub.next_billing_date) {
        const renewalDate = new Date(sub.next_billing_date);
        if (renewalDate.getMonth() === targetDate.getMonth()) {
          willCharge = true;
        }
      } else if (sub.interval === "quarterly" && sub.next_billing_date) {
        const renewalDate = new Date(sub.next_billing_date);
        const diff = Math.abs(targetDate.getMonth() - renewalDate.getMonth());
        if (diff % 3 === 0) {
          willCharge = true;
        }
      }

      if (willCharge) {
        monthGross += grossCost;
        monthNet += netCost;
        if (sub.is_zombie) monthZombie += netCost;
      }
    });

    const covered = Math.max(0, monthGross - monthNet);

    points.push({
      month: monthKey,
      gross: parseFloat(monthGross.toFixed(2)),
      net: parseFloat(monthNet.toFixed(2)),
      covered: parseFloat(covered.toFixed(2)),
      zombie: parseFloat(monthZombie.toFixed(2)),
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
  currentUserId?: string
): CategoryBreakdownPoint[] {
  const totals: Record<string, number> = {};
  let totalAll = 0;

  subscriptions.forEach((sub) => {
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
