import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
import { SUPABASE_URL } from "@/lib/supabase/env"

/**
 * Privileged Supabase client using the service_role key. Bypasses RLS.
 *
 * ONLY import this from server-only code (Route Handlers / Server Actions).
 * The `server-only` import above makes the build fail if it ever gets pulled
 * into a Client Component bundle. Never expose the service_role key to the
 * browser.
 *
 * Used for the onboarding steps that RLS intentionally doesn't allow the anon
 * key to do: validating invite tokens, creating auth users + profiles, marking
 * a spirit animal taken, and marking an invite used.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it (non-NEXT_PUBLIC) to .env.local.",
    )
  }

  return createClient<Database>(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
