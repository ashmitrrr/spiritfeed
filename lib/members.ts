import "server-only"

import { createClient } from "@/lib/supabase/server"

export type GroupMember = {
  id: string
  displayName: string
  spiritAnimal: string
  nickname: string | null
  adjective: string | null
  isAdmin: boolean
}

/**
 * The full member roster for the "Members" panel in the header menu. Same
 * read pattern as `getMentionableUsers` — RLS lets any signed-in user read
 * all profiles, since this is shared group data, not private-per-user.
 * Returns [] if there's no session.
 */
export async function getGroupMembers(): Promise<GroupMember[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, spirit_animal, animal_nickname, animal_adjective, is_admin")
    .order("display_name")

  return (data ?? []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    spiritAnimal: p.spirit_animal,
    nickname: p.animal_nickname,
    adjective: p.animal_adjective,
    isAdmin: p.is_admin,
  }))
}
