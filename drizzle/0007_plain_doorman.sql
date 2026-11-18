ALTER TABLE "user_subscriptions" ALTER COLUMN "next_billing_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "last_billed_date" date;