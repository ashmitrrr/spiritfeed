"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { PROMPT_TEXT_MAX } from "@/lib/prompt-constants"
import type { PromptRosterEntry, TodaysPrompt } from "@/lib/prompts"
import { submitPromptAction } from "@/app/_actions/prompts"

type Props = {
  state: TodaysPrompt
  roster: PromptRosterEntry[] | null
  currentUserId: string
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

function formatLeft(ms: number): string {
  if (ms <= 0) return "0m"
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

const STATUS_STYLE: Record<PromptRosterEntry["status"], string> = {
  approved: "border-ink bg-olive text-white",
  submitted: "border-ink bg-white text-ink",
  pending: "border-ink/30 bg-bone-dim text-ink/50",
}

const STATUS_LABEL: Record<PromptRosterEntry["status"], string> = {
  approved: "🔥",
  submitted: "✓",
  pending: "·",
}

function Roster({ roster }: { roster: PromptRosterEntry[] }) {
  const approved = roster.filter((r) => r.status === "approved").length
  const submitted = roster.filter((r) => r.status === "submitted").length
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink/70">
        Today · {approved} approved · {submitted} awaiting fire ·{" "}
        {roster.length - approved - submitted} not yet in
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {roster.map((r) => (
          <li
            key={r.userId}
            className={`inline-flex items-center gap-1 border-2 px-1.5 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}
            title={`${r.displayName} — ${r.status}`}
          >
            <span aria-hidden>{STATUS_LABEL[r.status]}</span>
            <span className="max-w-[8rem] truncate">{r.displayName}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PromptCard({ state, roster, currentUserId }: Props) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const isAwaiting = state.status === "awaiting"
  const now = useNow(true)

  function submit() {
    const value = text.trim()
    if (!value) {
      setError("Write a prompt first.")
      return
    }
    setError(null)
    setPending(true)
    ;(async () => {
      const fd = new FormData()
      fd.append("promptText", value)
      const res = await submitPromptAction(fd)
      setPending(false)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setText("")
      router.refresh()
    })()
  }

  // ── Awaiting: nobody has set today's prompt yet ──────────────────────────
  if (state.status === "awaiting") {
    const left = formatLeft(new Date(state.deadlineAt).getTime() - now)
    const iAmMaster = state.assigneeId === currentUserId

    if (iAmMaster) {
      return (
        <section className="pixel-panel space-y-3 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm text-olive-dark">
              You&apos;re today&apos;s prompt master
            </h2>
            <span
              className="shrink-0 text-xs text-ink/50"
              suppressHydrationWarning
            >
              {left} left
            </span>
          </div>
          <p className="text-xs text-ink/70">
            Set a task or challenge for the whole group (including you) to post
            proof of today.
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            maxLength={PROMPT_TEXT_MAX}
            rows={2}
            placeholder="e.g. Post a photo of your lunch"
            className="pixel-input resize-none px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink/50">
              {text.length}/{PROMPT_TEXT_MAX}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={pending || text.trim().length === 0}
              className="pixel-btn pixel-btn-primary px-4 py-2 text-sm"
            >
              {pending ? "Posting…" : "Set the prompt"}
            </button>
          </div>
          {error && <p className="pixel-alert px-3 py-2 text-sm">{error}</p>}
        </section>
      )
    }

    return (
      <section className="pixel-panel space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm text-olive-dark">
            Waiting on {state.assigneeName}
          </h2>
          <span className="shrink-0 text-xs text-ink/50" suppressHydrationWarning>
            {left} left
          </span>
        </div>
        <p className="text-xs text-ink/70">
          They&apos;re up to set today&apos;s prompt. If they don&apos;t in time,
          it passes to someone else.
        </p>
      </section>
    )
  }

  // ── Live: today's prompt is set ──────────────────────────────────────────
  void isAwaiting
  const left = formatLeft(new Date(state.windowEndsAt).getTime() - now)
  return (
    <section className="pixel-panel space-y-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm text-olive-dark">
            Today&apos;s Prompt
          </h2>
          <p className="text-[11px] text-ink/50">
            set by {state.authorName}
            {state.isBackup && " · backup prompt"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-ink/50" suppressHydrationWarning>
          {left} left
        </span>
      </div>

      <p className="border-2 border-ink bg-bone px-3 py-2 text-[15px] break-words">
        {state.promptText}
      </p>

      <p className="text-xs text-ink/60">
        Post proof and get 🔥 from the group to earn your fire for the day.
      </p>

      {roster && <Roster roster={roster} />}
    </section>
  )
}
