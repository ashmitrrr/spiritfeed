import { cookies } from "next/headers"

import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Bridges the auth session to Next's cookie store.
 *
 * The `setAll` call can throw when invoked from a Server Component (cookies are
 * read-only there); that's expected and safe to ignore because session
 * refreshing is handled by the middleware.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore, middleware refreshes.
        }
      },
    },
  })
}
