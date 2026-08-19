"use client"

import { useEffect, useRef, useState } from "react"

import { activeMentionQuery, type Mentionable } from "@/lib/mentions"

type Props = {
  value: string
  onChange: (value: string) => void
  mentionables: Mentionable[]
  multiline?: boolean
  maxLength?: number
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

const MAX_SUGGESTIONS = 6

/**
 * Text input / textarea with a lightweight @mention autocomplete. When the caret
 * is inside an @token, it shows a filtered dropdown of usernames; picking one
 * inserts "@username ". Filtering is client-side over the (small) passed list.
 */
export function MentionInput({
  value,
  onChange,
  mentionables,
  multiline = false,
  maxLength,
  placeholder,
  rows,
  className,
  disabled,
  "aria-label": ariaLabel,
}: Props) {
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const setFieldRef = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRef.current = el
  }
  const caretToRestore = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [tokenStart, setTokenStart] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)

  const q = query.toLowerCase()
  const suggestions = mentionables
    .filter(
      (m) =>
        m.username.toLowerCase().startsWith(q) ||
        m.displayName.toLowerCase().startsWith(q),
    )
    .slice(0, MAX_SUGGESTIONS)

  const showDropdown = open && suggestions.length > 0

  // Restore the caret after a programmatic value change (mention insertion).
  useEffect(() => {
    if (caretToRestore.current != null && fieldRef.current) {
      const pos = caretToRestore.current
      fieldRef.current.focus()
      fieldRef.current.setSelectionRange(pos, pos)
      caretToRestore.current = null
    }
  })

  function syncMentionState(text: string, caret: number | null) {
    const token = caret == null ? null : activeMentionQuery(text, caret)
    if (token) {
      setTokenStart(token.start)
      setQuery(token.query)
      setActiveIndex(0)
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const text = e.target.value
    onChange(text)
    syncMentionState(text, e.target.selectionStart)
  }

  function insertMention(username: string) {
    const field = fieldRef.current
    const caret = field?.selectionEnd ?? value.length
    const insert = `@${username} `
    let next = value.slice(0, tokenStart) + insert + value.slice(caret)
    if (maxLength && next.length > maxLength) next = next.slice(0, maxLength)
    const newCaret = Math.min(tokenStart + insert.length, next.length)

    onChange(next)
    setOpen(false)
    caretToRestore.current = newCaret
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      insertMention(suggestions[activeIndex].username)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  // Caret moved without a value change (arrow keys / click) — recheck.
  function handleSelect(
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const el = e.currentTarget
    syncMentionState(el.value, el.selectionStart)
  }

  const commonProps = {
    ref: setFieldRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onClick: handleSelect,
    onKeyUp: handleSelect,
    // Delay so a dropdown item's click lands before we close.
    onBlur: () => setTimeout(() => setOpen(false), 120),
    maxLength,
    placeholder,
    disabled,
    className,
    "aria-label": ariaLabel,
  }

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input {...commonProps} type="text" />
      )}

      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto border-2 border-ink bg-white pixel-shadow-sm">
          {suggestions.map((m, i) => (
            <li key={m.username}>
              <button
                type="button"
                // Keep focus in the field so selection/caret stay intact.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMention(m.username)}
                className={`flex w-full items-baseline gap-2 px-2 py-1.5 text-left text-sm ${
                  i === activeIndex ? "bg-olive text-white" : "text-ink"
                }`}
              >
                <span className="font-medium">@{m.username}</span>
                <span
                  className={`truncate text-xs ${
                    i === activeIndex ? "text-white/80" : "text-ink/50"
                  }`}
                >
                  {m.displayName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
