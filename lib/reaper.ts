import "server-only"

import type { TablesInsert } from "@/lib/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { PHOTO_BUCKET, POST_TTL_MS } from "@/lib/posts"

export type ReapResult = {
  /** Number of expired posts removed. */
  reaped: number
  /** Number of post_archive rows written. */
  archived: number
  /** The post marked is_top_of_day this run, or null if nothing expired. */
  topOfDayPostId: string | null
}

/**
 * Permanently removes regular posts older than 24h (time capsules are exempt —
 * they follow unlock_at gating and are never reaped here), archiving each into
 * post_archive first. The single highest-reaction post of the batch (ties broken
 * by earliest created_at) is marked is_top_of_day, and its photo is copied to a
 * permanent `archive/{id}.{ext}` path before all originals are deleted.
 *
 * Service-role only. Idempotent-ish: if it runs twice, the second run simply
 * finds nothing older than the cutoff (the first run already deleted them).
 */
export async function reapExpiredPosts(): Promise<ReapResult> {
  const admin = createAdminClient()
  const cutoffIso = new Date(Date.now() - POST_TTL_MS).toISOString()

  // 1. Expiring posts: non-capsule, at least 24h old. Ascending by created_at
  //    so the earliest post naturally wins a top-of-day tie.
  const { data: expiring, error } = await admin
    .from("posts")
    .select("id, author_id, post_type, caption, photo_path, created_at")
    .eq("is_time_capsule", false)
    .lte("created_at", cutoffIso)
    .order("created_at", { ascending: true })
  if (error) {
    throw new Error(`reaper: failed to load expiring posts: ${error.message}`)
  }
  if (!expiring || expiring.length === 0) {
    return { reaped: 0, archived: 0, topOfDayPostId: null }
  }

  const ids = expiring.map((p) => p.id)

  // 2. Total reaction count per expiring post.
  const { data: reactions, error: reactionError } = await admin
    .from("reactions")
    .select("post_id")
    .in("post_id", ids)
  if (reactionError) {
    throw new Error(`reaper: failed to count reactions: ${reactionError.message}`)
  }
  const countByPost = new Map<string, number>()
  for (const r of reactions ?? []) {
    countByPost.set(r.post_id, (countByPost.get(r.post_id) ?? 0) + 1)
  }

  // 3. Top of day: highest count wins; earliest created_at breaks ties (the
  //    array is ascending, so a strict `>` keeps the earliest on a tie).
  let topPost = expiring[0]
  let topCount = countByPost.get(topPost.id) ?? 0
  for (const p of expiring) {
    const c = countByPost.get(p.id) ?? 0
    if (c > topCount) {
      topPost = p
      topCount = c
    }
  }
  const topId = topPost.id

  // 4. Copy the top post's photo (if any) to a permanent archive path.
  let topArchivePhotoPath: string | null = null
  if (topPost.photo_path) {
    const ext = topPost.photo_path.split(".").pop() || "jpg"
    const dest = `archive/${topId}.${ext}`
    const { error: copyError } = await admin.storage
      .from(PHOTO_BUCKET)
      .copy(topPost.photo_path, dest)
    if (copyError) {
      throw new Error(`reaper: failed to copy top photo: ${copyError.message}`)
    }
    topArchivePhotoPath = dest
  }

  // 5. Write archive rows.
  const rows: TablesInsert<"post_archive">[] = expiring.map((p) => ({
    original_post_id: p.id,
    author_id: p.author_id,
    post_type: p.post_type,
    caption: p.caption,
    reaction_count: countByPost.get(p.id) ?? 0,
    posted_at: p.created_at,
    is_top_of_day: p.id === topId,
    photo_path: p.id === topId ? topArchivePhotoPath : null,
  }))
  const { error: insertError } = await admin.from("post_archive").insert(rows)
  if (insertError) {
    throw new Error(`reaper: failed to write archive: ${insertError.message}`)
  }

  // 6. Delete all original photos from storage (including the top-of-day one —
  //    its permanent copy already exists at the archive path).
  const originalPhotoPaths = expiring
    .map((p) => p.photo_path)
    .filter((path): path is string => Boolean(path))
  if (originalPhotoPaths.length > 0) {
    const { error: removeError } = await admin.storage
      .from(PHOTO_BUCKET)
      .remove(originalPhotoPaths)
    if (removeError) {
      throw new Error(`reaper: failed to remove photos: ${removeError.message}`)
    }
  }

  // 7. Delete the posts (reactions cascade via FK).
  const { error: deleteError } = await admin.from("posts").delete().in("id", ids)
  if (deleteError) {
    throw new Error(`reaper: failed to delete posts: ${deleteError.message}`)
  }

  return {
    reaped: expiring.length,
    archived: rows.length,
    topOfDayPostId: topId,
  }
}
