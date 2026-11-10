import { Suspense } from "react";
import { connection } from "next/server";
import { Link } from "@/i18n/navigation";
import { Flame } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import { LocaleSwitcher } from "@/app/components/ui/locale-switcher";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";
import { UserNav } from "@/app/components/ui/user-nav";
import { NotificationsDropdown } from "@/app/components/ui/notifications-dropdown";

export function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 transition group-hover:scale-105 group-hover:bg-emerald-500/20 dark:text-emerald-400">
              <Flame className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-white">
              DripCatch
            </span>
          </Link>

          {/* Desktop App Link */}
          {/*<Link
            href="/ledger"
            className="hidden sm:inline-block text-xs font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Ledger
          </Link>*/}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Dynamic User Area streamed via Suspense */}
          <Suspense fallback={<NavbarAuthSkeleton />}>
            <NavbarUserArea />
          </Suspense>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
  );
}

async function NavbarUserArea() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center gap-2">
      {user && <NotificationsDropdown />}
      <UserNav user={user} />
    </div>
  );
}

function NavbarAuthSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
    </div>
  );
}
