import { UserSubscriptionRow } from "./types";

export function getSubNetCost(sub: UserSubscriptionRow): number {
  const totalCost = Number(sub.cost);
  const splitsTotal = (sub.subscription_splits || []).reduce(
    (acc, split) => acc + Number(split.amount || 0),
    0,
  );
  return Math.max(0, totalCost - splitsTotal);
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

export function calculateLedgerMetrics(subscriptions: UserSubscriptionRow[]) {
  // Gross total (what services charge on paper)
  const grossMonthlyBurn = subscriptions.reduce((acc, sub) => {
    return acc + getNormalizedMonthly(Number(sub.cost), sub.interval);
  }, 0);

  // Net monthly burn (what you actually pay out of pocket after splits)
  const monthlyBurn = subscriptions.reduce((acc, sub) => {
    return acc + getNormalizedMonthly(getSubNetCost(sub), sub.interval);
  }, 0);

  const totalMonthlyRecovered = grossMonthlyBurn - monthlyBurn;
  const projectedAnnual = monthlyBurn * 12;
  const zombiesCount = subscriptions.filter((s) => s.is_zombie).length;
  const hikesCount = subscriptions.filter(
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
  gross: number;    // Total invoiced cost
  net: number;      // What you actually pay out of pocket
  covered: number;  // Offset covered by friends/splits
  zombie: number;   // Inactive/waste portion
}

export function calculate12MonthForecast(
  subscriptions: UserSubscriptionRow[]
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
      const grossCost = Number(sub.cost);
      const netCost = getSubNetCost(sub);
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
): CategoryBreakdownPoint[] {
  const totals: Record<string, number> = {};
  let totalAll = 0;

  subscriptions.forEach((sub) => {
    const normalized = getNormalizedMonthly(Number(sub.cost), sub.interval);
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
