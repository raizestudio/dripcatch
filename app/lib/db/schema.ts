import {
  pgTable,
  pgSchema,
  unique,
  pgPolicy,
  uuid,
  text,
  timestamp,
  foreignKey,
  check,
  numeric,
  integer,
  date,
  boolean,
  uniqueIndex,
  index,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

const authSchema = pgSchema("auth");

export const usersInAuth = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email"),
});

const users = authUsers;

export const catalogSubscriptions = pgTable(
  "catalog_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    category: text().notNull(),
    websiteUrl: text("website_url"),
    logoPath: text("logo_path"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("catalog_subscriptions_slug_key").on(table.slug),
    pgPolicy("Public read catalog", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
);

export const subscriptionPriceHistory = pgTable(
  "subscription_price_history",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    subscriptionId: uuid("subscription_id").notNull(),
    userId: uuid("user_id").notNull(),
    cost: numeric({ precision: 10, scale: 2 }).notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    notes: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [userSubscriptions.id],
      name: "subscription_price_history_subscription_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "subscription_price_history_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can view their own price history", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(auth.uid() = user_id)`,
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    check("subscription_price_history_cost_check", sql`cost >= (0)::numeric`),
  ],
);

export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid("user_id").primaryKey().notNull(),
    baseCurrency: text("base_currency").default("USD").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    reminderDays: integer("reminder_days").default(3).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_settings_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can insert their own settings", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can update their own settings", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Users can view their own settings", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check(
      "user_settings_reminder_days_check",
      sql`reminder_days = ANY (ARRAY[1, 2, 5, 10, 15])`,
    ),
  ],
);

export const catalogSubscriptionPlans = pgTable(
  "catalog_subscription_plans",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    catalogId: uuid("catalog_id").notNull(),
    name: text().notNull(),
    defaultCost: numeric("default_cost", { precision: 10, scale: 2 }).notNull(),
    currency: text().default("USD").notNull(),
    interval: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.catalogId],
      foreignColumns: [catalogSubscriptions.id],
      name: "catalog_subscription_plans_catalog_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Public read catalog plans", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
    check(
      "catalog_subscription_plans_interval_check",
      sql`"interval" = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])`,
    ),
  ],
);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    catalogId: uuid("catalog_id"),
    name: text().notNull(),
    category: text().default("Other").notNull(),
    cost: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default("USD").notNull(),
    interval: text().notNull(),
    firstBilledDate: date("first_billed_date"),
    nextBillingDate: date("next_billing_date").notNull(),
    originalCost: numeric("original_cost", { precision: 10, scale: 2 }),
    lastHikeDate: date("last_hike_date"),
    isZombie: boolean("is_zombie").default(false),
    status: text().default("active").notNull(),
    notes: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    planId: uuid("plan_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.catalogId],
      foreignColumns: [catalogSubscriptions.id],
      name: "user_subscriptions_catalog_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.planId],
      foreignColumns: [catalogSubscriptionPlans.id],
      name: "user_subscriptions_plan_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_subscriptions_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can manage their own subscriptions", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(auth.uid() = user_id)`,
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can read subscriptions they own or share", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check("user_subscriptions_cost_check", sql`cost >= (0)::numeric`),
    check(
      "user_subscriptions_interval_check",
      sql`"interval" = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])`,
    ),
    check(
      "user_subscriptions_status_check",
      sql`status = ANY (ARRAY['active'::text, 'paused'::text, 'canceled'::text])`,
    ),
  ],
);

export const subscriptionSplits = pgTable(
  "subscription_splits",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    subscriptionId: uuid("subscription_id").notNull(),
    userId: uuid("user_id"),
    name: text().notNull(),
    email: text(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    status: text().default("pending").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [userSubscriptions.id],
      name: "subscription_splits_subscription_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "subscription_splits_user_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Invited members can view their split records", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`((user_id = auth.uid()) OR (email = (auth.jwt() ->> 'email'::text)))`,
    }),
    pgPolicy("Owners can manage splits for their subscriptions", {
      as: "permissive",
      for: "all",
      to: ["public"],
    }),
    pgPolicy("Participants can update their own split status", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    check("subscription_splits_amount_check", sql`amount >= (0)::numeric`),
    check(
      "subscription_splits_status_check",
      sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])`,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    subscriptionId: uuid("subscription_id"),
    type: text().default("renewal").notNull(),
    title: text().notNull(),
    message: text().notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    scheduledFor: date("scheduled_for").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    splitId: uuid("split_id"),
  },
  (table) => [
    uniqueIndex("idx_notifications_dedup").using(
      "btree",
      sql`user_id`,
      sql`subscription_id`,
      sql`COALESCE(split_id, '00000000-0000-0000-0000-000000000000'::uuid`,
      sql`type`,
    ),
    uniqueIndex("idx_notifications_renewal_dedup").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.subscriptionId.asc().nullsLast().op("text_ops"),
      table.scheduledFor.asc().nullsLast().op("date_ops"),
      table.type.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_notifications_user_lookup").using(
      "btree",
      table.userId.asc().nullsLast().op("timestamptz_ops"),
      table.isRead.asc().nullsLast().op("uuid_ops"),
      table.createdAt.desc().nullsFirst().op("bool_ops"),
    ),
    foreignKey({
      columns: [table.splitId],
      foreignColumns: [subscriptionSplits.id],
      name: "notifications_split_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [userSubscriptions.id],
      name: "notifications_subscription_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notifications_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can delete their own notifications", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy("Users can update read state on their own notifications", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Users can view their own notifications", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check(
      "notifications_type_check",
      sql`type = ANY (ARRAY['renewal'::text, 'hike'::text, 'zombie'::text, 'split_invite'::text])`,
    ),
  ],
);

export type BugReportMetadata = {
  pathname: string;
  locale: string;
  userAgent: string;
  viewport: string;
};

export const bugReports = pgTable(
  "bug_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id"),
    email: text("email"),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata")
      .$type<BugReportMetadata>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    status: text("status").default("open").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    pgPolicy("Anyone can submit bug reports", {
      for: "insert",
      to: "public",
      withCheck: sql`auth.uid() = ${table.user_id} or ${table.user_id} is null`,
    }),
  ],
);

export type NewBugReport = typeof bugReports.$inferInsert;
