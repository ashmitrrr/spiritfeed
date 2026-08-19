"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PHOTO_BUCKET } from "@/lib/posts"
import {
  CAPTION_MAX,
  MAX_UPLOAD_BYTES,
  STATUS_MAX,
  humanBytes,
} from "@/lib/upload-limits"

export type PostActionResult = { ok: true } | { ok: false; error: string }

function extensionFor(type: string): string {
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  if (type === "image/heic" || type === "image/heif") return "heic"
  return "jpg"
}

type PromptResolution =
  | { ok: true; dailyPromptId: string | null }
  | { ok: false; error: string }

/**
 * Validates an optional "submit as today's prompt" tag on a new post: the prompt
 * must exist and still be inside its window, and the user can only submit once
 * per prompt. Returns the id to attach (or null if the post isn't a submission).
 */
async function resolvePromptSubmission(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  formData: FormData,
): Promise<PromptResolution> {
  const promptId = String(formData.get("dailyPromptId") ?? "").trim()
  if (!promptId) return { ok: true, dailyPromptId: null }

  const { data: prompt } = await admin
    .from("daily_prompts")
    .select("id, window_ends_at")
    .eq("id", promptId)
    .maybeSingle()
  if (!prompt) {
    return { ok: false, error: "Today's prompt is no longer available." }
  }
  if (new Date(prompt.window_ends_at).getTime() <= Date.now()) {
    return { ok: false, error: "The prompt window has closed." }
  }

  const { data: existing } = await admin
    .from("posts")
    .select("id")
    .eq("daily_prompt_id", promptId)
    .eq("author_id", userId)
    .maybeSingle()
  if (existing) {
    return { ok: false, error: "You've already submitted for today's prompt." }
  }

  return { ok: true, dailyPromptId: promptId }
}

// NOTE: we deliberately do NOT send a push notification for every new post
// (photo/status) in v1 — for a 15-20 person group that's the highest-spam-risk
// notification. Realtime already updates open feeds live. A possible fast-follow
// is an opt-in "notify me about new posts" preference; left out on purpose here.

/** Create a photo post: upload the (already client-compressed) image, then row. */
export async function createPhotoPost(
  formData: FormData,
): Promise<PostActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You're signed out. Sign in and retry." }

  const photo = formData.get("photo")
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: "Pick a photo first." }
  }
  if (photo.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That image is too large (max ${humanBytes(MAX_UPLOAD_BYTES)}). Try a smaller one.`,
    }
  }

  const rawCaption = String(formData.get("caption") ?? "").trim()
  if (rawCaption.length > CAPTION_MAX) {
    return { ok: false, error: `Caption must be ${CAPTION_MAX} characters or fewer.` }
  }
  const caption = rawCaption.length > 0 ? rawCaption : null

  const admin = createAdminClient()

  const prompt = await resolvePromptSubmission(admin, user.id, formData)
  if (!prompt.ok) return { ok: false, error: prompt.error }

  const postId = randomUUID()
  const path = `${user.id}/${postId}.${extensionFor(photo.type)}`

  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, {
      contentType: photo.type || "image/jpeg",
      upsert: false,
    })
  if (uploadError) {
    return { ok: false, error: "Photo upload failed. Please try again." }
  }

  const { error: insertError } = await admin.from("posts").insert({
    id: postId,
    author_id: user.id,
    post_type: "photo",
    photo_path: path,
    caption,
    daily_prompt_id: prompt.dailyPromptId,
  })
  if (insertError) {
    // Roll back the orphaned upload so storage doesn't accumulate junk.
    await admin.storage.from(PHOTO_BUCKET).remove([path])
    return { ok: false, error: "Couldn't save your post. Please try again." }
  }

  revalidatePath("/")
  return { ok: true }
}

/** Create a status post (text only). */
export async function createStatusPost(
  formData: FormData,
): Promise<PostActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You're signed out. Sign in and retry." }

  const text = String(formData.get("status") ?? "").trim()
  if (text.length === 0) {
    return { ok: false, error: "Write a status first." }
  }
  if (text.length > STATUS_MAX) {
    return { ok: false, error: `Status must be ${STATUS_MAX} characters or fewer.` }
  }

  const admin = createAdminClient()

  const prompt = await resolvePromptSubmission(admin, user.id, formData)
  if (!prompt.ok) return { ok: false, error: prompt.error }

  const { error } = await admin.from("posts").insert({
    author_id: user.id,
    post_type: "status",
    caption: text,
    photo_path: null,
    daily_prompt_id: prompt.dailyPromptId,
  })
  if (error) {
    return { ok: false, error: "Couldn't save your status. Please try again." }
  }

  revalidatePath("/")
  return { ok: true }
}
