-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "catalog_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"website_url" text,
	"logo_path" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "catalog_subscriptions_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "catalog_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscription_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"notes" text,
	CONSTRAINT "subscription_price_history_cost_check" CHECK (cost >= (0)::numeric)
);
--> statement-breakpoint
ALTER TABLE "subscription_price_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"reminder_days" integer DEFAULT 3 NOT NULL,
	CONSTRAINT "user_settings_reminder_days_check" CHECK (reminder_days = ANY (ARRAY[1, 2, 5, 10, 15]))
);
--> statement-breakpoint
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "catalog_subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" text NOT NULL,
	"default_cost" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"interval" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "catalog_subscription_plans_interval_check" CHECK ("interval" = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text]))
);
--> statement-breakpoint
ALTER TABLE "catalog_subscription_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"catalog_id" uuid,
	"name" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"interval" text NOT NULL,
	"first_billed_date" date,
	"next_billing_date" date NOT NULL,
	"original_cost" numeric(10, 2),
	"last_hike_date" date,
	"is_zombie" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"plan_id" uuid,
	CONSTRAINT "user_subscriptions_cost_check" CHECK (cost >= (0)::numeric),
	CONSTRAINT "user_subscriptions_interval_check" CHECK ("interval" = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])),
	CONSTRAINT "user_subscriptions_status_check" CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'canceled'::text]))
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscription_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "subscription_splits_amount_check" CHECK (amount >= (0)::numeric),
	CONSTRAINT "subscription_splits_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))
);
--> statement-breakpoint
ALTER TABLE "subscription_splits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"type" text DEFAULT 'renewal' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"scheduled_for" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"split_id" uuid,
	CONSTRAINT "notifications_type_check" CHECK (type = ANY (ARRAY['renewal'::text, 'hike'::text, 'zombie'::text, 'split_invite'::text]))
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_price_history" ADD CONSTRAINT "subscription_price_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_price_history" ADD CONSTRAINT "subscription_price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_subscription_plans" ADD CONSTRAINT "catalog_subscription_plans_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."catalog_subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_splits" ADD CONSTRAINT "subscription_splits_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_splits" ADD CONSTRAINT "subscription_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "public"."subscription_splits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notifications_dedup" ON "notifications" USING btree (user_id text_ops,subscription_id uuid_ops,COALESCE(split_id, '00000000-0000-0000-0000-000000000000'::uuid uuid_ops,type uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notifications_renewal_dedup" ON "notifications" USING btree ("user_id" text_ops,"subscription_id" text_ops,"scheduled_for" date_ops,"type" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_user_lookup" ON "notifications" USING btree ("user_id" timestamptz_ops,"is_read" uuid_ops,"created_at" bool_ops);--> statement-breakpoint
CREATE POLICY "Public read catalog" ON "catalog_subscriptions" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can view their own price history" ON "subscription_price_history" AS PERMISSIVE FOR ALL TO "authenticated" USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can insert their own settings" ON "user_settings" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can update their own settings" ON "user_settings" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own settings" ON "user_settings" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Public read catalog plans" ON "catalog_subscription_plans" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can manage their own subscriptions" ON "user_subscriptions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can read subscriptions they own or share" ON "user_subscriptions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Invited members can view their split records" ON "subscription_splits" AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR (email = (auth.jwt() ->> 'email'::text))));--> statement-breakpoint
CREATE POLICY "Owners can manage splits for their subscriptions" ON "subscription_splits" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Participants can update their own split status" ON "subscription_splits" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own notifications" ON "notifications" AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can update read state on their own notifications" ON "notifications" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own notifications" ON "notifications" AS PERMISSIVE FOR SELECT TO public;
*/