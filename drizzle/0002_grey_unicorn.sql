CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar
);
--> statement-breakpoint
DROP INDEX "idx_notifications_dedup";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notifications_dedup" ON "notifications" USING btree (user_id,subscription_id,COALESCE(split_id, '00000000-0000-0000-0000-000000000000'::uuid,type);