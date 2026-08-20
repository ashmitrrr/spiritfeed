"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyMentionedUsers } from "@/lib/mentions-server"
import { pushAfterResponse, sendPushToUser } from "@/lib/push"
import { COMMENT_MAX } from "@/lib/upload-limits"

export type CommentActionResult = { ok: true } | { ok: false; error: string }

/**
 * Adds a comment to a post. Deliberately restrained to match the rest of the
 * app: one flat line (no threading, no editing), same length-cap spirit as
 * status posts. Uses the authenticated client — RLS covers "any signed-in
 * user can read, only the author can write/delete their own row".
 */
export async function addComment(
  postId: string,
  formData: FormData,
): Promise<CommentActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Signed out." }

  const body = String(formData.get("body") ?? "").trim()
  if (!body) return { ok: false, error: "Write something first." }
  if (body.length > COMMENT_MAX) {
    return { ok: false, error: `Comments must be ${COMMENT_MAX} characters or fewer.` }
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body,
  })
  if (error) return { ok: false, error: "Couldn't post your comment." }

  // Notify the post's author (skip self-comments) and anyone @mentioned in
  // the comment body — same fire-and-forget contract as reactions/posts.
  pushAfterResponse(async () => {
    const admin = createAdminClient()

    const { data: post } = await admin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle()

    if (post && post.author_id !== user.id) {
      const { data: commenter } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
      await sendPushToUser(post.author_id, {
        title: "New comment",
        body: `${commenter?.display_name ?? "Someone"}: ${body}`,
        url: "/",
      })
    }

    await notifyMentionedUsers(admin, user.id, body)
  })

  revalidatePath("/")
  return { ok: true }
}

/** Deletes a comment. RLS restricts this to the comment's own author. */
export async function deleteComment(commentId: string): Promise<CommentActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Signed out." }

  const { error } = await supabase.from("comments").delete().eq("id", commentId)
  if (error) return { ok: false, error: "Couldn't delete comment." }

  revalidatePath("/")
  return { ok: true }
}
