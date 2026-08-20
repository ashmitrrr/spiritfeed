import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const PHOTO_BUCKET = "photos"
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour; feed reloads refresh them

export type FeedComment = {
  id: string
  authorId: string
  authorName: string
  authorAnimal: string
  body: string
  createdAt: string
}

export type FeedPost = {
  id: string
  authorId: string
  authorName: string
  authorAnimal: string
  authorNickname: string | null
  authorAdjective: string | null
  postType: "photo" | "status"
  caption: string | null
  /** Signed URL for the photo, or null for status posts / unresolvable photos. */
  photoUrl: string | null
  /** True when the post has a photo we couldn't produce a URL for. */
  photoMissing: boolean
  createdAt: string
  isTimeCapsule: boolean
  reactionCounts: Record<string, number>
  myReactions: string[]
  /** Flat, unthreaded — oldest first, matches how they render. */
  comments: FeedComment[]
  /** Set when this post is a Prompt-of-the-Day submission. */
  dailyPromptId: string | null
  /** Fire-approval progress for prompt submissions; null for normal posts. */
  promptProgress: {
    count: number
    threshold: number
    approved: boolean
  } | null
}

type AuthorEmbed = {
  display_name: string
  spirit_animal: string
  animal_nickname: string | null
  animal_adjective: string | null
} | null

type CommentAuthorEmbed = {
  display_name: string
  spirit_animal: string
} | null

function firstAuthor<T>(value: T | T[]): T {
  return Array.isArray(value) ? (value[0] as T) : value
}

// Posts are ephemeral (BeReal-style): a regular post vanishes from the feed 24h
// after it was posted. Time capsules are exempt — they follow their own
// unlock_at gating instead.
export const POST_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Loads the reverse-chronological feed for the signed-in user. Visibility:
 *   - regular posts (is_time_capsule = false): shown only while < 24h old
 *   - time capsules (is_time_capsule = true): shown once unlock_at has passed
 * Includes author info, signed photo URLs, reaction tallies (with which
 * emojis the current user has used), and comments. Returns [] if there's no
 * session.
 *
 * The 24h cutoff here is instant: a post disappears the moment it crosses 24h,
 * independent of when the daily reaper job (which permanently deletes it) runs.
 */
export async function getFeed(): Promise<FeedPost[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const nowIso = new Date().toISOString()
  const cutoffIso = new Date(Date.now() - POST_TTL_MS).toISOString()

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, caption, photo_path, post_type, created_at, is_time_capsule, unlock_at, daily_prompt_id, author:profiles!posts_author_id_fkey(display_name, spirit_animal, animal_nickname, animal_adjective)",
    )
    .or(
      `and(is_time_capsule.eq.false,created_at.gt.${cutoffIso}),and(is_time_capsule.eq.true,unlock_at.lte.${nowIso})`,
    )
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !posts || posts.length === 0) return []

  const postIds = posts.map((p) => p.id)

  // Reactions for all visible posts, aggregated in memory (tiny scale).
  const { data: reactions } = await supabase
    .from("reactions")
    .select("post_id, emoji, user_id")
    .in("post_id", postIds)

  const countsByPost = new Map<string, Record<string, number>>()
  const mineByPost = new Map<string, string[]>()
  // Distinct 🔥 reactors per post (used for prompt-approval progress).
  const fireReactorsByPost = new Map<string, Set<string>>()
  for (const r of reactions ?? []) {
    const counts = countsByPost.get(r.post_id) ?? {}
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
    countsByPost.set(r.post_id, counts)
    if (r.user_id === user.id) {
      const mine = mineByPost.get(r.post_id) ?? []
      mine.push(r.emoji)
      mineByPost.set(r.post_id, mine)
    }
    if (r.emoji === "🔥") {
      const set = fireReactorsByPost.get(r.post_id) ?? new Set<string>()
      set.add(r.user_id)
      fireReactorsByPost.set(r.post_id, set)
    }
  }

  // Comments for all visible posts — flat, oldest first, tiny scale like
  // reactions above, so one query + in-memory grouping is plenty.
  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id, post_id, author_id, body, created_at, author:profiles!comments_author_id_fkey(display_name, spirit_animal)",
    )
    .in("post_id", postIds)
    .order("created_at", { ascending: true })

  const commentsByPost = new Map<string, FeedComment[]>()
  for (const c of comments ?? []) {
    const author = firstAuthor<CommentAuthorEmbed>(c.author)
    const list = commentsByPost.get(c.post_id) ?? []
    list.push({
      id: c.id,
      authorId: c.author_id,
      authorName: author?.display_name ?? "Unknown",
      authorAnimal: author?.spirit_animal ?? "",
      body: c.body,
      createdAt: c.created_at,
    })
    commentsByPost.set(c.post_id, list)
  }

  // Approval threshold only needed if a prompt submission is on screen.
  const hasPromptPost = posts.some((p) => p.daily_prompt_id)
  let fireThreshold = 0
  if (hasPromptPost) {
    const admin = createAdminClient()
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
    fireThreshold = Math.ceil((count ?? 0) / 2)
  }

  // Signed URLs for photos, generated with the service-role client (the bucket
  // is private with no RLS policies for the anon key).
  const photoPaths = posts
    .map((p) => p.photo_path)
    .filter((path): path is string => Boolean(path))

  const signedByPath = new Map<string, string>()
  if (photoPaths.length > 0) {
    const admin = createAdminClient()
    const { data: signed } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(photoPaths, SIGNED_URL_TTL_SECONDS)
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) signedByPath.set(item.path, item.signedUrl)
    }
  }

  return posts.map((p) => {
    const author = firstAuthor<AuthorEmbed>(p.author)
    const photoUrl = p.photo_path
      ? signedByPath.get(p.photo_path) ?? null
      : null

    let promptProgress: FeedPost["promptProgress"] = null
    if (p.daily_prompt_id) {
      const reactors = fireReactorsByPost.get(p.id)
      let count = 0
      if (reactors) {
        for (const uid of reactors) if (uid !== p.author_id) count++
      }
      promptProgress = {
        count,
        threshold: fireThreshold,
        approved: fireThreshold > 0 && count >= fireThreshold,
      }
    }

    return {
      id: p.id,
      authorId: p.author_id,
      authorName: author?.display_name ?? "Unknown",
      authorAnimal: author?.spirit_animal ?? "",
      authorNickname: author?.animal_nickname ?? null,
      authorAdjective: author?.animal_adjective ?? null,
      postType: p.post_type === "status" ? "status" : "photo",
      caption: p.caption,
      photoUrl,
      photoMissing: Boolean(p.photo_path) && photoUrl === null,
      createdAt: p.created_at,
      isTimeCapsule: p.is_time_capsule,
      reactionCounts: countsByPost.get(p.id) ?? {},
      myReactions: mineByPost.get(p.id) ?? [],
      comments: commentsByPost.get(p.id) ?? [],
      dailyPromptId: p.daily_prompt_id,
      promptProgress,
    }
  })
}
