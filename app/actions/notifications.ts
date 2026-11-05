// app/actions/notifications.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export interface DBNotification {
  id: string;
  subscription_id: string | null;
  split_id: string | null; // ✅ Included
  type: "renewal" | "hike" | "zombie" | "split_invite";
  title: string;
  message: string;
  is_read: boolean;
  scheduled_for: string;
  created_at: string;
}

export async function getUserNotifications(): Promise<{
  notifications: DBNotification[];
  unreadCount: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], unreadCount: 0 };

  const { data, error } = await supabase
    .from("notifications")
    .select("id, subscription_id, split_id, type, title, message, is_read, scheduled_for, created_at") // ✅ split_id fetched
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return { notifications: [], unreadCount: 0 };
  }

  const unreadCount = data.filter((n) => !n.is_read).length;

  return {
    notifications: data as DBNotification[],
    unreadCount,
  };
}

export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/[locale]/ledger", "page");
  return { success: true };
}
