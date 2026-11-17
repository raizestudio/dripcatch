// app/lib/auth/admin.ts
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import type { AppRole } from "@/app/lib/db/schema";

export interface StaffSession {
  user: {
    id: string;
    email?: string;
  };
  role: AppRole;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const adminSupabase = createAdminClient();
  const { data: roleRow } = await adminSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleRow?.role === "admin" || roleRow?.role === "moderator") {
    return {
      user: { id: user.id, email: user.email },
      role: roleRow.role,
    };
  }

  // Optional break-glass / initial setup fallback via BOOTSTRAP_ADMIN_EMAIL
  const bootstrapEmail =
    process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail && user.email?.toLowerCase() === bootstrapEmail) {
    return {
      user: { id: user.id, email: user.email },
      role: "admin",
    };
  }

  return null;
}

/**
 * Allows both "admin" and "moderator" (for bug triage and catalog edits).
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Strictly requires "admin" (for granting/revoking team roles).
 */
export async function requireAdmin(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden: Admin role required.");
  }
  return session;
}
