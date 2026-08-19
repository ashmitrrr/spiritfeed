"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { removeUserAction } from "../actions"

type Props = {
  targetId: string
  username: string
}

/**
 * Two-stage destructive control: click "Remove" to reveal a type-to-confirm
 * field, then type the exact username to enable the final delete. Nothing
 * happens on a single stray click.
 */
export function RemoveUserButton({ targetId, username }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const matches = typed.trim().toLowerCase() === username.toLowerCase()

  function cancel() {
    setConfirming(false)
    setTyped("")
    setError(null)
  }

  function remove() {
    if (!matches) return
    setError(null)
    startTransition(async () => {
      const res = await removeUserAction(targetId)
      if (!res.ok) {
        setError(res.error ?? "Couldn't remove this user.")
        return
      }
      // Row disappears from the list on refresh.
      router.refresh()
    })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="pixel-chip shrink-0 px-2 py-1 text-xs"
      >
        Remove
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 border-2 border-error bg-white p-2">
      <p className="text-xs text-ink/70">
        Type <span className="font-medium text-ink">{username}</span> to
        permanently remove this user and all their posts. This can&apos;t be
        undone.
      </p>
      <input
        type="text"
        value={typed}
        autoFocus
        autoCapitalize="none"
        spellCheck={false}
        placeholder={username}
        onChange={(e) => {
          setTyped(e.target.value)
          setError(null)
        }}
        className="pixel-input px-2 py-1 text-xs"
      />
      {error && <p className="pixel-alert px-2 py-1 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="pixel-btn pixel-btn-secondary flex-1 px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={!matches || isPending}
          className="pixel-btn flex-1 px-3 py-1.5 text-xs"
          style={{ background: "var(--error)", color: "var(--white)" }}
        >
          {isPending ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  )
}
