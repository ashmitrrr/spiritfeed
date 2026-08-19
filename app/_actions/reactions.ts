"use server"

import { createClient } from "@/lib/supabase/server"
import { isReactionEmoji } from "@/lib/reactions"
import { evaluatePromptFire } from "@/lib/prompts"
import { pushAfterResponse, sendPushToUser } from "@/lib/push"

const FIRE_EMOJI = "🔥"

export type ToggleReactionResult =
  | { ok: true; reacted: boolean }
  | { ok: false; error: string }

/**
 * Toggles the current user's reaction of `emoji` on `post`. Uses the
 * authenticated client so RLS guarantees a user can only touch their own
 * reactions. No revalidation — the client bar updates optimistically.
 */
export async function toggleReaction(
  postId: string,
  emoji: string,
): Promise<ToggleReactionResult> {
  if (!isReactionEmoji(emoji)) {
    return { ok: false, error: "Unknown reaction." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Signed out." }

  const { data: existing, error: lookupError } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle()
  if (lookupError) return { ok: false, error: "Couldn't update reaction." }

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id)
    if (error) return { ok: false, error: "Couldn't remove reaction." }
    return { ok: true, reacted: false }
  }

  const { error } = await supabase.from("reactions").insert({
    post_id: postId,
    user_id: user.id,
    emoji,
  })
  if (error) return { ok: false, error: "Couldn't add reaction." }

  // A 🔥 might approve a Prompt-of-the-Day submission → award the poster a fire
  // (and maybe the crown). Evaluated lazily here; best-effort, never blocks.
  if (emoji === FIRE_EMOJI) {
    await evaluatePromptFire(postId)
  }

  // Notify the post's author — but only on this reactor's FIRST reaction to the
  // post (any emoji), so a popular post doesn't fire a push per emoji tap.
  // Fire-and-forget: runs after the response, never delays the reaction.
  pushAfterResponse(async () => {
    await notifyAuthorOfReaction(postId, user.id)
  })

  return { ok: true, reacted: true }
}

/**
 * Sends the post author a push about a new reaction, gated to the reactor's
 * first reaction on that post (skips self-reactions). Best-effort; runs after
 * the response. Uses the service-role client via the shared helpers.
 */
async function notifyAuthorOfReaction(
  postId: string,
  reactorId: string,
): Promise<void> {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle()
  if (!post || post.author_id === reactorId) return // no post, or self-reaction

  // First reaction from this user on this post? (The row we just inserted is
  // included, so "first" means exactly one.)
  const { count } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("user_id", reactorId)
  if ((count ?? 0) !== 1) return

  const { data: reactor } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", reactorId)
    .maybeSingle()
  const who = reactor?.display_name ?? "Someone"

  await sendPushToUser(post.author_id, {
    title: "New reaction",
    body: `${who} reacted to your post`,
    url: "/",
  })
}
