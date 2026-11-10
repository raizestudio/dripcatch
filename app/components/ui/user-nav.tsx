"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, Loader2 } from "lucide-react";

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface UserNavProps {
  user?: User | null;
}

export function UserNav({ user: initialUser }: UserNavProps = {}) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(initialUser === undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch client-side if the server did not provide initial user state
    if (initialUser === undefined) {
      async function checkUser() {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
      }
      checkUser();
    } else {
      setUser(initialUser);
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, initialUser]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
      >
        {t("signIn")}
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";
  const initials = getInitials(user.user_metadata?.full_name, user.email);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-0.5 ring-offset-2 transition-all hover:ring-2 hover:ring-emerald-500/50 focus:outline-none"
        aria-expanded={menuOpen}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {initials}
          </div>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900 z-50">
          {/* User Meta Info */}
          <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800/80">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/ledger"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-zinc-500" />
              <span>{t("ledger")}</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-zinc-100 pt-1 dark:border-zinc-800/80">
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
            >
              {isSigningOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span>{t("signOut")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
