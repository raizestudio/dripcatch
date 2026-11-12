import { relations } from "drizzle-orm/relations";
import { userSubscriptions, subscriptionPriceHistory, usersInAuth, userSettings, catalogSubscriptions, catalogSubscriptionPlans, subscriptionSplits, notifications } from "./schema";

export const subscriptionPriceHistoryRelations = relations(subscriptionPriceHistory, ({one}) => ({
	userSubscription: one(userSubscriptions, {
		fields: [subscriptionPriceHistory.subscriptionId],
		references: [userSubscriptions.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [subscriptionPriceHistory.userId],
		references: [usersInAuth.id]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one, many}) => ({
	subscriptionPriceHistories: many(subscriptionPriceHistory),
	catalogSubscription: one(catalogSubscriptions, {
		fields: [userSubscriptions.catalogId],
		references: [catalogSubscriptions.id]
	}),
	catalogSubscriptionPlan: one(catalogSubscriptionPlans, {
		fields: [userSubscriptions.planId],
		references: [catalogSubscriptionPlans.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [userSubscriptions.userId],
		references: [usersInAuth.id]
	}),
	subscriptionSplits: many(subscriptionSplits),
	notifications: many(notifications),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	subscriptionPriceHistories: many(subscriptionPriceHistory),
	userSettings: many(userSettings),
	userSubscriptions: many(userSubscriptions),
	subscriptionSplits: many(subscriptionSplits),
	notifications: many(notifications),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userSettings.userId],
		references: [usersInAuth.id]
	}),
}));

export const catalogSubscriptionPlansRelations = relations(catalogSubscriptionPlans, ({one, many}) => ({
	catalogSubscription: one(catalogSubscriptions, {
		fields: [catalogSubscriptionPlans.catalogId],
		references: [catalogSubscriptions.id]
	}),
	userSubscriptions: many(userSubscriptions),
}));

export const catalogSubscriptionsRelations = relations(catalogSubscriptions, ({many}) => ({
	catalogSubscriptionPlans: many(catalogSubscriptionPlans),
	userSubscriptions: many(userSubscriptions),
}));

export const subscriptionSplitsRelations = relations(subscriptionSplits, ({one, many}) => ({
	userSubscription: one(userSubscriptions, {
		fields: [subscriptionSplits.subscriptionId],
		references: [userSubscriptions.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [subscriptionSplits.userId],
		references: [usersInAuth.id]
	}),
	notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	subscriptionSplit: one(subscriptionSplits, {
		fields: [notifications.splitId],
		references: [subscriptionSplits.id]
	}),
	userSubscription: one(userSubscriptions, {
		fields: [notifications.subscriptionId],
		references: [userSubscriptions.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [notifications.userId],
		references: [usersInAuth.id]
	}),
}));