import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { createAdminClient } from "@/lib/supabase/admin"
import { sendPushToUser } from "@/lib/push"
import { parseMentions, type MentionPart, type Mentionable } from "@/lib/mentions"

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

/**
 * Fire-and-forget push to everyone @mentioned in a caption/status. Excludes a
 * self-mention and anything not matching a real username (mentions are
 * pattern-based, not validated at write time — see `parseMentions`). Follows
 * the same best-effort contract as the rest of the push helpers: never throws,
 * safe to call from inside `pushAfterResponse` without blocking post creation.
 */
export async function notifyMentionedUsers(
  admin: ReturnType<typeof createAdminClient>,
  authorId: string,
  text: string,
): Promise<void> {
  try {
    const usernames = Array.from(
      new Set(
        parseMentions(text)
          .filter(
            (p): p is Extract<MentionPart, { type: "mention" }> =>
              p.type === "mention",
          )
          .map((p) => p.username),
      ),
    )
    if (usernames.length === 0) return

    const [{ data: mentioned }, { data: author }] = await Promise.all([
      admin
        .from("profiles")
        .select("id")
        .in("username", usernames)
        .neq("id", authorId),
      admin.from("profiles").select("display_name").eq("id", authorId).maybeSingle(),
    ])
    if (!mentioned || mentioned.length === 0) return

    const authorName = author?.display_name ?? "Someone"
    await Promise.all(
      mentioned.map((p) =>
        sendPushToUser(p.id, {
          title: "You were mentioned",
          body: `${authorName} mentioned you in a post`,
          url: "/",
        }),
      ),
    )
  } catch {
    // Never let mention bookkeeping break post creation.
  }
}
