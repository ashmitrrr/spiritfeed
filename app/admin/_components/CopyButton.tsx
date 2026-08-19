"use client"

import { useState } from "react"

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-foreground/15 px-2 py-1 text-xs transition hover:bg-foreground/5"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  )
}
