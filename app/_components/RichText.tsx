import { parseMentions } from "@/lib/mentions"

/**
 * Renders caption/status/comment text with @mentions styled as pixel tags.
 * Pure rendering — mention pushes are handled separately server-side
 * (see notifyMentionedUsers), this component only styles the tag.
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
