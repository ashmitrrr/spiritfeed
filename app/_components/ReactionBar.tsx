"use client"

import { useState } from "react"

import { REACTION_EMOJIS } from "@/lib/reactions"
import { toggleReaction } from "@/app/_actions/reactions"

type Props = {
  postId: string
  initialCounts: Record<string, number>
  initialMine: string[]
}

export function ReactionBar({ postId, initialCounts, initialMine }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
  const [mine, setMine] = useState<Set<string>>(new Set(initialMine))
  const [busy, setBusy] = useState<Set<string>>(new Set())

  async function onTap(emoji: string) {
    if (busy.has(emoji)) return
    const wasMine = mine.has(emoji)

    // Optimistic update
    setMine((prev) => {
      const next = new Set(prev)
      if (wasMine) next.delete(emoji)
      else next.add(emoji)
      return next
    })
    setCounts((prev) => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (wasMine ? -1 : 1)),
    }))
    setBusy((prev) => new Set(prev).add(emoji))

    const res = await toggleReaction(postId, emoji)

    setBusy((prev) => {
      const next = new Set(prev)
      next.delete(emoji)
      return next
    })

    if (!res.ok) {
      // Revert on failure
      setMine((prev) => {
        const next = new Set(prev)
        if (wasMine) next.add(emoji)
        else next.delete(emoji)
        return next
      })
      setCounts((prev) => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] ?? 0) + (wasMine ? 1 : -1)),
      }))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0
        const active = mine.has(emoji)
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onTap(emoji)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
              active
                ? "border-foreground/40 bg-foreground/[0.08]"
                : "border-foreground/10 hover:border-foreground/25"
            }`}
          >
            <span aria-hidden>{emoji}</span>
            {count > 0 && (
              <span className="text-xs text-foreground/60">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
