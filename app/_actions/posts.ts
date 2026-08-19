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
  const { error } = await admin.from("posts").insert({
    author_id: user.id,
    post_type: "status",
    caption: text,
    photo_path: null,
  })
  if (error) {
    return { ok: false, error: "Couldn't save your status. Please try again." }
  }

  revalidatePath("/")
  return { ok: true }
}
