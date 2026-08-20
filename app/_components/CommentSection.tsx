"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import type { FeedComment } from "@/lib/posts"
import { COMMENT_MAX } from "@/lib/upload-limits"
import { addComment, deleteComment } from "@/app/_actions/comments"
import { Avatar } from "./Avatar"
import { RichText } from "./RichText"

/**
 * Flat, unthreaded comments under a post — deliberately restrained (one line,
 * no editing, no replies-to-replies) to match the app's low-pressure design.
 * Posting/deleting just triggers a router.refresh() rather than splicing
 * local state, same pattern the Composer uses for new posts.
 */
export function CommentSection({
  postId,
  comments,
  currentUserId,
}: {
  postId: string
  comments: FeedComment[]
  currentUserId: string
}) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const text = body.trim()
    if (!text) return
    setError(null)
    const fd = new FormData()
    fd.append("body", text)
    startTransition(async () => {
      const res = await addComment(postId, fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setBody("")
      router.refresh()
    })
  }

  function remove(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2 border-t-2 border-ink/10 pt-2">
      {comments.length > 0 && (
        <ul className="space-y-1.5">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-1.5 text-sm">
              <Avatar animalKey={c.authorAnimal} size="sm" />
              <div className="min-w-0 flex-1">
                <span className="font-medium">{c.authorName}</span>{" "}
                <RichText
                  text={c.body}
                  className="inline whitespace-pre-wrap break-words"
                />
              </div>
              {c.authorId === currentUserId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={isPending}
                  className="shrink-0 text-xs text-ink/40 hover:text-error disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submit()
            }
          }}
          maxLength={COMMENT_MAX}
          placeholder="Say something..."
          aria-label="Add a comment"
          disabled={isPending}
          className="pixel-input flex-1 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || body.trim().length === 0}
          className="pixel-chip px-2.5 py-1 text-xs"
        >
          Post
        </button>
      </div>
      {error && <p className="pixel-alert px-2 py-1 text-xs">{error}</p>}
    </div>
  )
}
