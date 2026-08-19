// Compact relative-time formatter for feed timestamps ("just now", "2h", "3d").
// Rendered server-side, so it can be slightly stale until the next load — fine
// for a low-frequency friends feed.

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" })

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.round((then - now) / 1000)
  const absSec = Math.abs(diffSec)

  if (absSec < 45) return "just now"
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), "minute")
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), "hour")
  if (absSec < 2592000) return rtf.format(Math.round(diffSec / 86400), "day")
  if (absSec < 31536000) return rtf.format(Math.round(diffSec / 2592000), "month")
  return rtf.format(Math.round(diffSec / 31536000), "year")
}
