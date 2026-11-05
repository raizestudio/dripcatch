// app/components/ui/notifications-dropdown.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Bell,
  Calendar,
  Ghost,
  TrendingUp,
  UserPlus,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  DBNotification,
} from "@/app/actions/notifications";
import { getUserSettings, updateReminderDays } from "@/app/actions/settings";
import { respondToSplitInvitation } from "@/app/actions/subscriptions";

const REMINDER_OPTIONS = [1, 2, 5, 10, 15];

export function NotificationsDropdown() {
  const t = useTranslations("Notifications");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminderDays, setReminderDays] = useState(3);
  const [isPending, startTransition] = useTransition();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    try {
      const [notifsData, settings] = await Promise.all([
        getUserNotifications(),
        getUserSettings(),
      ]);
      setNotifications(notifsData.notifications);
      setUnreadCount(notifsData.unreadCount);
      setReminderDays(settings.reminder_days);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvitationResponse(
    e: React.MouseEvent,
    splitId: string,
    accept: boolean,
  ) {
    e.stopPropagation();
    setRespondingId(splitId);
    try {
      await respondToSplitInvitation(splitId, accept);
      await loadData();
    } finally {
      setRespondingId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  }

  async function handleItemClick(notif: DBNotification) {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationAsRead(notif.id);
    }
    setOpen(false);
    router.push("/ledger");
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    if (target && !target.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  }

  function handleReminderChange(days: number) {
    setReminderDays(days);
    startTransition(async () => {
      await updateReminderDays(days);
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) loadData();
        }}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-xs transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 font-mono text-[10px] font-bold text-zinc-950 ring-2 ring-white dark:ring-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl transition-all animate-in fade-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-950 dark:text-white">
                {t("title")}
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <CheckCheck className="h-3 w-3" />
                <span>{t("markAllRead")}</span>
              </button>
            )}
          </div>

          {/* Reminder Days Setting Slider */}
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-950/60">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              {t("alertWindow")}:
            </span>
            <div className="flex items-center gap-1">
              {REMINDER_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleReminderChange(days)}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold transition-all ${
                    reminderDays === days
                      ? "bg-emerald-500 text-zinc-950 shadow-xs"
                      : "text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {days}
                  {t("daysSuffix")}
                </button>
              ))}
              {isPending && (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-zinc-400" />
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="mt-2.5 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("empty")}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t("emptySubtitle")}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 transition-all ${
                    item.is_read
                      ? "bg-transparent opacity-65 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      : "bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {/* Category Icon */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {item.type === "renewal" && (
                      <Calendar className="h-3.5 w-3.5" />
                    )}
                    {item.type === "zombie" && (
                      <Ghost className="h-3.5 w-3.5" />
                    )}
                    {item.type === "hike" && (
                      <TrendingUp className="h-3.5 w-3.5" />
                    )}
                    {item.type === "split_invite" && (
                      <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {item.message}
                    </p>

                    {/* Split Invitation Action Buttons */}
                    {item.type === "split_invite" &&
                      item.split_id &&
                      !item.is_read && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={respondingId === item.split_id}
                            onClick={(e) =>
                              handleInvitationResponse(e, item.split_id!, true)
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
                          >
                            {respondingId === item.split_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={respondingId === item.split_id}
                            onClick={(e) =>
                              handleInvitationResponse(e, item.split_id!, false)
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                            Decline
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Delete Notification Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-2.5 right-2 rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
