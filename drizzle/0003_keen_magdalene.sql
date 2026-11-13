CREATE TABLE "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bug_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Anyone can submit bug reports" ON "bug_reports" AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = "bug_reports"."user_id" or "bug_reports"."user_id" is null);