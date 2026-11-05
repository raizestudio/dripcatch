export interface SubscriptionSplit {
  id?: string;
  name: string;
  email?: string | null;
  amount: number;
}

export interface UserSubscriptionRow {
  id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  original_cost: number | null;
  next_billing_date: string;
  is_zombie: boolean;
  status: string;
  subscription_splits?: SubscriptionSplit[];
}
