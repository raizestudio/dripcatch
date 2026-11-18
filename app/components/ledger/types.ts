// app/components/ledger/types.ts

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
  last_billed_date?: string | null;
  next_billing_date: string;
  is_zombie: boolean;
  status: string;
  is_owner?: boolean;
  effective_cost?: number;
  splits?: SubscriptionSplit[];
  subscription_splits?: SubscriptionSplit[];
}

export interface SubscriptionPaymentRow {
  id: string;
  amount: number;
  currency: string;
  billed_date: string;
  source?: string;
}

export interface DetectedPaymentItem {
  billedDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
}

export interface SubscriptionImportDraft {
  tempId: string;
  source:
    | "catalog_quick_pick"
    | "csv_statement"
    | "email_receipt"
    | "screenshot_ocr"
    | "open_banking";
  catalogId: string | null;
  planId: string | null;
  name: string;
  category: string;
  cost: number;
  currency: string;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  status?: "active" | "paused" | "canceled";
  firstBilledDate?: string | null;
  lastBilledDate?: string | null;
  nextBillingDate: string | null; // YYYY-MM-DD (nullable when paused/canceled)
  originalCost?: number | null;
  lastHikeDate?: string | null;
  payments?: DetectedPaymentItem[];
  confidence: "high" | "medium" | "low";
  selected: boolean;
}
