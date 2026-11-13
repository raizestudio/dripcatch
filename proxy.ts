import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_ROUTES = ["/ledger", "/settings"];
const AUTH_ROUTES = ["/login"];

function redirectWithCookies(url: URL, sourceResponse: NextResponse) {
  const redirectRes = NextResponse.redirect(url);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectRes.cookies.set(cookie);
  });
  return redirectRes;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Extra safety guard: never run i18n logic on API or Auth callback routes
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // 2. Run next-intl first to resolve locale rewrites/redirects & headers
  const response = handleI18nRouting(request);

  // 3. Initialize Supabase SSR client & sync refreshed tokens onto the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired & verify user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Resolve active locale & clean path using your routing config
  const localesPattern = routing.locales.join("|");
  const localeRegex = new RegExp(`^\\/(${localesPattern})(?=\\/|$)`);
  const localeMatch = pathname.match(localeRegex);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = pathname.replace(localeRegex, "") || "/";

  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`),
  );

  const isAuthPage = AUTH_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`),
  );

  // 5. Bounce unauthenticated guests away from protected routes
  if (!user && isProtected) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl, response);
  }

  // 6. Bounce already logged-in users away from login/register pages
  if (user && isAuthPage) {
    return redirectWithCookies(new URL(`/${locale}/ledger`, request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
