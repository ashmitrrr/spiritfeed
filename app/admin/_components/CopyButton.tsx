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
      className="pixel-chip shrink-0 px-2 py-1 text-xs"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  )
}
