"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { deletePostAsAdmin } from "@/app/_actions/posts"

/**
 * Admin-only control shown on every post in the feed, not just the admin's
 * own. Two-stage confirm (click "Delete" reveals "Confirm"/"Cancel") so a
 * stray tap can't nuke someone's post — lighter-weight than the
 * type-to-confirm used for removing a whole user, since deleting one post is
 * a smaller blast radius.
 */
export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function remove() {
    setError(null)
    startTransition(async () => {
      const res = await deletePostAsAdmin(postId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 text-xs text-ink/40 hover:text-error"
        aria-label="Delete post (admin)"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {error && <span className="text-xs text-error">{error}</span>}
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="pixel-chip px-2 py-0.5 text-xs"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="pixel-chip px-2 py-0.5 text-xs"
        style={{ background: "var(--error)", color: "var(--white)" }}
      >
        {isPending ? "…" : "Confirm"}
      </button>
    </div>
  )
}
