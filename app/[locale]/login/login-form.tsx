// app/[locale]/login/login-form.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/app/lib/supabase/client";
import {
  Flame,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  MailCheck,
} from "lucide-react";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Strip any leading locale prefix so next-intl's router doesn't double-prefix (e.g. /fr/fr/ledger)
  const rawNext = searchParams.get("next");
  const localesPattern = routing.locales.join("|");
  const localeRegex = new RegExp(`^\\/(${localesPattern})(?=\\/|$)`);
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext.replace(localeRegex, "") || "/ledger"
      : "/ledger";

  const emailParam = searchParams.get("email");
  const signupParam = searchParams.get("signup");

  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(signupParam === "true");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state if query params change while already on /login (avoids useEffect cascading renders)
  const [prevParams, setPrevParams] = useState({ emailParam, signupParam });
  if (
    prevParams.emailParam !== emailParam ||
    prevParams.signupParam !== signupParam
  ) {
    setPrevParams({ emailParam, signupParam });
    if (emailParam) setEmail(emailParam);
    if (signupParam === "true") setIsSignUp(true);
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = isSignUp
    ? confirmPassword.length >= 6 && confirmPassword === password
    : true;
  const isFormValid = isEmailValid && isPasswordValid && isConfirmValid;

  const showPasswordLengthWarning = password.length > 0 && password.length < 6;
  const showMismatchWarning =
    isSignUp && confirmPassword.length > 0 && password !== confirmPassword;
  const showMatchSuccess =
    isSignUp && confirmPassword.length >= 6 && password === confirmPassword;

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const callbackNext = `/${locale}${nextPath === "/" ? "/ledger" : nextPath}`;
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
          },
        });
        if (error) throw error;
        setMessage(t("magicLinkSent"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  function handleModeToggle() {
    setIsSignUp((prev) => !prev);
    setError(null);
    setMessage(null);
    setConfirmPassword("");
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Flame className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl transition-colors dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur-sm">
          {emailParam && isSignUp && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <MailCheck className="h-4 w-4 shrink-0" />
              <span>{t("claimSplitNotice")}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t("emailLabel")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border bg-zinc-50 py-2 pr-10 pl-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 transition-colors ${
                    showPasswordLengthWarning
                      ? "border-amber-500/60 focus:border-amber-500"
                      : "border-zinc-200 focus:border-emerald-500 dark:border-zinc-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-hidden"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {showPasswordLengthWarning && (
                <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{t("minPasswordLength")}</span>
                </p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-lg border bg-zinc-50 py-2 pr-10 pl-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 transition-colors ${
                      showMismatchWarning
                        ? "border-rose-500/60 focus:border-rose-500"
                        : showMatchSuccess
                          ? "border-emerald-500/60 focus:border-emerald-500"
                          : "border-zinc-200 focus:border-emerald-500 dark:border-zinc-800"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? t("hidePassword")
                        : t("showPassword")
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-hidden"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {showMismatchWarning && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{t("passwordMismatch")}</span>
                  </p>
                )}
                {showMatchSuccess && (
                  <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{t("passwordsMatch")}</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-xs font-semibold text-zinc-950 shadow-md transition hover:bg-emerald-400 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {isSignUp ? t("signUpButton") : t("signInButton")}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleModeToggle}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              {isSignUp ? t("alreadyHaveAccount") : t("noAccountYet")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
