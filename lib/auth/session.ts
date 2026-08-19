import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type Profile = Tables<"profiles">

/**
 * The signed-in user's profile, or null if not authenticated. Reads the session
 * from cookies via the server client. Safe to call from Server Components.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return profile ?? null
}
