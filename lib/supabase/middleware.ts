import { NextResponse, type NextRequest } from "next/server"

import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/** Paths reachable without a session (auth screens + auth/API endpoints). */
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/auth") ||
    // API routes do their own auth (e.g. the cron reaper checks CRON_SECRET);
    // they must not be redirected to the HTML login page.
    pathname.startsWith("/api")
  )
}

/** Auth screens an already-signed-in user shouldn't sit on. */
function isAuthOnlyForGuests(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/setup")
  )
}

/**
 * Keeps the Supabase auth session fresh on every request (rotating the auth
 * cookies) and gates routes:
 *   - no session + private path        → redirect to /login
 *   - has session + guest-only path     → redirect to / (the feed)
 * Public paths are the auth screens (/login, /join, /setup) and the /auth
 * endpoints (e.g. sign-out).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Touching getUser() triggers the token refresh + cookie rotation above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthOnlyForGuests(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return response
}
