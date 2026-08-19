import { parseMentions } from "@/lib/mentions"

/**
 * Renders caption/status text with @mentions styled as pixel tags. Pure
 * rendering — no linking or notifications (there's no notification system yet).
 */
export function RichText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const parts = parseMentions(text)
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.type === "mention" ? (
          <span key={i} className="pixel-tag">
            {part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  )
}
