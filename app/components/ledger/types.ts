export interface SubscriptionSplit {
  id?: string;
  name: string;
  email?: string | null;
  amount: number;
  user_id?: string | null;
  status?: "pending" | "accepted" | "rejected";
}

export interface UserSubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  original_cost: number | null;
  first_billed_date: string;
  next_billing_date: string;
  is_zombie: boolean;
  status: string;
  is_owner?: boolean;
  effective_cost?: number;
  splits?: SubscriptionSplit[];
  subscription_splits?: SubscriptionSplit[];
}
