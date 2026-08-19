import { NextResponse, type NextRequest } from "next/server"

import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Keeps the Supabase auth session fresh on every request by rotating the auth
 * cookies. Route protection (redirecting unauthenticated users) is layered on
 * in Phase 1 once /login and /join exist — for now this just refreshes tokens
 * so the app is ready for auth without gating anything yet.
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
  await supabase.auth.getUser()

  return response
}
