import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Mentionable } from "@/lib/mentions"

/**
 * The list of people who can be @mentioned — every profile. Uses the
 * authenticated server client (RLS lets signed-in users read profiles, same as
 * the feed's author embed). The group is ~15-20 people, so we hand the whole
 * list to the composer for client-side filtering rather than searching server
 * side. Returns [] if not signed in.
 */
export async function getMentionableUsers(): Promise<Mentionable[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("profiles")
    .select("username, display_name")
    .order("username")

  return (data ?? []).map((p) => ({
    username: p.username,
    displayName: p.display_name,
  }))
}
