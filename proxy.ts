import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { updateSession } from "@/app/lib/supabase/proxy"
import { NextRequest, NextResponse } from "next/server"

const handleI18nRouting = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. Let next-intl create the response with all locale headers/rewrites
  const response = handleI18nRouting(request)

  // 2. Update Supabase session directly on that response
  const { user } = await updateSession(request, response)

  const pathname = request.nextUrl.pathname
  const segments = pathname.split("/")
  const currentLocale = routing.locales.includes(segments[1] as any)
    ? segments[1]
    : routing.defaultLocale

  // 3. Protect `/ledger` route
  const isLedgerRoute = pathname.includes("/ledger")
  if (isLedgerRoute && !user) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 4. Redirect away from `/login` if already authenticated
  const isLoginRoute = pathname.includes("/login")
  if (isLoginRoute && user) {
    const ledgerUrl = new URL(`/${currentLocale}/ledger`, request.url)
    return NextResponse.redirect(ledgerUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/(en|fr)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
}
