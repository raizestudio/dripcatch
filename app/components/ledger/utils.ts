import { UserSubscriptionRow } from "./types";

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
  const monthlyBurn = subscriptions.reduce((acc, sub) => {
    return acc + getNormalizedMonthly(Number(sub.cost), sub.interval);
  }, 0);

  const projectedAnnual = monthlyBurn * 12;
  const zombiesCount = subscriptions.filter((s) => s.is_zombie).length;
  const hikesCount = subscriptions.filter(
    (s) => s.original_cost && Number(s.cost) > Number(s.original_cost)
  ).length;

  return { monthlyBurn, projectedAnnual, zombiesCount, hikesCount };
}

export interface MonthlyForecastPoint {
  month: string;
  active: number;
  zombie: number;
  total: number;
}

export function calculate12MonthForecast(
  subscriptions: UserSubscriptionRow[]
): MonthlyForecastPoint[] {
  const points: MonthlyForecastPoint[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = targetDate.toLocaleDateString("en-US", { month: "short" });

    let activeSpend = 0;
    let zombieSpend = 0;

    subscriptions.forEach((sub) => {
      const cost = Number(sub.cost);
      let willChargeThisMonth = false;

      if (sub.interval === "monthly") {
        willChargeThisMonth = true;
      } else if (sub.interval === "weekly") {
        const weeklyMonthlyEstimate = (cost * 52) / 12;
        if (sub.is_zombie) zombieSpend += weeklyMonthlyEstimate;
        else activeSpend += weeklyMonthlyEstimate;
        return;
      } else if (sub.interval === "yearly" && sub.next_billing_date) {
        const renewalDate = new Date(sub.next_billing_date);
        if (renewalDate.getMonth() === targetDate.getMonth()) {
          willChargeThisMonth = true;
        }
      } else if (sub.interval === "quarterly" && sub.next_billing_date) {
        const renewalDate = new Date(sub.next_billing_date);
        const monthDiff = Math.abs(targetDate.getMonth() - renewalDate.getMonth());
        if (monthDiff % 3 === 0) {
          willChargeThisMonth = true;
        }
      }

      if (willChargeThisMonth) {
        if (sub.is_zombie) zombieSpend += cost;
        else activeSpend += cost;
      }
    });

    points.push({
      month: monthKey,
      active: parseFloat(activeSpend.toFixed(2)),
      zombie: parseFloat(zombieSpend.toFixed(2)),
      total: parseFloat((activeSpend + zombieSpend).toFixed(2)),
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
  subscriptions: UserSubscriptionRow[]
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
