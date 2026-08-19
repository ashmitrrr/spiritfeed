import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const PHOTO_BUCKET = "photos"
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour; feed reloads refresh them

export type FeedPost = {
  id: string
  authorId: string
  authorName: string
  authorAnimal: string
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
}

type AuthorEmbed = { display_name: string; spirit_animal: string } | null

function firstAuthor(value: AuthorEmbed | AuthorEmbed[]): AuthorEmbed {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/**
 * Loads the reverse-chronological feed for the signed-in user: all posts whose
 * time capsule (if any) has unlocked, with author info, signed photo URLs, and
 * reaction tallies including which emojis the current user has used.
 * Returns [] if there's no session.
 */
export async function getFeed(): Promise<FeedPost[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const nowIso = new Date().toISOString()

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, caption, photo_path, post_type, created_at, is_time_capsule, unlock_at, author:profiles!posts_author_id_fkey(display_name, spirit_animal)",
    )
    .or(`is_time_capsule.eq.false,unlock_at.lte.${nowIso}`)
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
  for (const r of reactions ?? []) {
    const counts = countsByPost.get(r.post_id) ?? {}
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
    countsByPost.set(r.post_id, counts)
    if (r.user_id === user.id) {
      const mine = mineByPost.get(r.post_id) ?? []
      mine.push(r.emoji)
      mineByPost.set(r.post_id, mine)
    }
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
    const author = firstAuthor(p.author as AuthorEmbed | AuthorEmbed[])
    const photoUrl = p.photo_path
      ? signedByPath.get(p.photo_path) ?? null
      : null
    return {
      id: p.id,
      authorId: p.author_id,
      authorName: author?.display_name ?? "Unknown",
      authorAnimal: author?.spirit_animal ?? "",
      postType: p.post_type === "status" ? "status" : "photo",
      caption: p.caption,
      photoUrl,
      photoMissing: Boolean(p.photo_path) && photoUrl === null,
      createdAt: p.created_at,
      isTimeCapsule: p.is_time_capsule,
      reactionCounts: countsByPost.get(p.id) ?? {},
      myReactions: mineByPost.get(p.id) ?? [],
    }
  })
}
