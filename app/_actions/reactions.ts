"use server"

import { createClient } from "@/lib/supabase/server"
import { isReactionEmoji } from "@/lib/reactions"
import { evaluatePromptFire } from "@/lib/prompts"

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

  return { ok: true, reacted: true }
}
