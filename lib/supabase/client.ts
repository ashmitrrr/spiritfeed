import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/database.types"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Supabase client for use in Client Components (browser).
 * Reads/writes the auth session from cookies via @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
