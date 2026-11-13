"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getErrorMessage } from "@/app/lib/utils";
import type { TablesInsert } from "@/app/lib/supabase/database.types";
import type { BugReportMetadata } from "@/app/lib/db/schema";

export type BugCategory =
  "ledger" | "splits" | "analytics" | "account" | "other";

export interface BugReportInput {
  category: BugCategory;
  title: string;
  description: string;
  contactEmail?: string;
  metadata: BugReportMetadata;
}

type ActionResponse = { success: true } | { success: false; error: string };

const ALLOWED_CATEGORIES: ReadonlySet<BugCategory> = new Set([
  "ledger",
  "splits",
  "analytics",
  "account",
  "other",
]);

export async function submitBugReport(
  input: BugReportInput,
): Promise<ActionResponse> {
  try {
    const title = input.title?.trim();
    const description = input.description?.trim();

    if (!title || title.length > 150) {
      return {
        success: false,
        error: "Please provide a brief summary (max 150 characters).",
      };
    }

    if (!description || description.length > 2000) {
      return {
        success: false,
        error: "Please describe the issue (max 2000 characters).",
      };
    }

    const category: BugCategory = ALLOWED_CATEGORIES.has(input.category)
      ? input.category
      : "other";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const metadata: BugReportMetadata = {
      pathname: String(input.metadata?.pathname || "").slice(0, 255),
      locale: String(input.metadata?.locale || "en").slice(0, 10),
      userAgent: String(input.metadata?.userAgent || "").slice(0, 500),
      viewport: String(input.metadata?.viewport || "").slice(0, 50),
    };

    const payload: TablesInsert<"bug_reports"> = {
      user_id: user?.id ?? null,
      email: user?.email ?? (input.contactEmail?.trim() || null),
      category,
      title,
      description,
      metadata,
    };

    const { error } = await supabase.from("bug_reports").insert(payload);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, "Failed to submit bug report."),
    };
  }
}
