"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { compressImage, ImageDecodeError } from "@/lib/image"
import {
  CAPTION_MAX,
  MAX_ORIGINAL_BYTES,
  MAX_UPLOAD_BYTES,
  STATUS_MAX,
  humanBytes,
} from "@/lib/upload-limits"
import { createPhotoPost, createStatusPost } from "@/app/_actions/posts"

type Mode = "photo" | "status"

export function Composer() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("photo")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // photo mode
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")

  // status mode
  const [status, setStatus] = useState("")

  function resetPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setCaption("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const picked = e.target.files?.[0]
    if (!picked) return
    if (picked.size > MAX_ORIGINAL_BYTES) {
      setError(`That image is too big (max ${humanBytes(MAX_ORIGINAL_BYTES)}).`)
      e.target.value = ""
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
  }

  function submitPhoto() {
    if (!file) {
      setError("Pick a photo first.")
      return
    }
    setError(null)
    startTransition(async () => {
      let blob: Blob
      try {
        blob = await compressImage(file)
      } catch (err) {
        // Some formats (e.g. iPhone HEIC on non-Safari) can't be decoded to a
        // canvas. Fall back to the original bytes if they're within the cap.
        if (err instanceof ImageDecodeError && file.size <= MAX_UPLOAD_BYTES) {
          blob = file
        } else {
          setError("Couldn't process this image. Try a different one.")
          return
        }
      }
      if (blob.size > MAX_UPLOAD_BYTES) {
        setError(
          `Image is still too large after processing (max ${humanBytes(MAX_UPLOAD_BYTES)}).`,
        )
        return
      }

      const fd = new FormData()
      fd.append("photo", blob, "photo.jpg")
      fd.append("caption", caption)
      const res = await createPhotoPost(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      resetPhoto()
      router.refresh()
    })
  }

  function submitStatus() {
    const text = status.trim()
    if (!text) {
      setError("Write a status first.")
      return
    }
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("status", text)
      const res = await createStatusPost(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setStatus("")
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-foreground/10 p-3">
      <div className="mb-3 flex gap-1 rounded-lg bg-foreground/[0.04] p-1 text-sm">
        {(["photo", "status"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setError(null)
            }}
            className={`flex-1 rounded-md px-3 py-1.5 capitalize transition ${
              mode === m
                ? "bg-background font-medium shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected preview"
                className="max-h-80 w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={resetPhoto}
                disabled={isPending}
                className="text-xs text-foreground/60 underline underline-offset-4 hover:text-foreground disabled:opacity-50"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center rounded-lg border border-dashed border-foreground/20 px-4 py-10 text-sm text-foreground/60 transition hover:border-foreground/40"
            >
              Tap to choose a photo
            </button>
          )}

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={CAPTION_MAX}
            placeholder="Add a caption (optional)"
            className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />

          <button
            type="button"
            onClick={submitPhoto}
            disabled={isPending || !file}
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Posting…" : "Post photo"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={STATUS_MAX}
            rows={2}
            placeholder="What's your status?"
            className="w-full resize-none rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/40">
              {status.length}/{STATUS_MAX}
            </span>
            <button
              type="button"
              onClick={submitStatus}
              disabled={isPending || status.trim().length === 0}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Posting…" : "Set status"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
