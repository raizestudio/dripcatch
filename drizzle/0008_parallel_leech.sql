ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_subscription_id_user_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_payments" DROP CONSTRAINT "subscription_payments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_subscription_payments_user_date" ON "subscription_payments" USING btree ("user_id","billed_date");--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_amount_check" CHECK (amount >= (0)::numeric);--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'csv_import'::text, 'email_receipt'::text, 'screenshot_ocr'::text, 'open_banking'::text]));