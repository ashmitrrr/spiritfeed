// Shared @mention helpers. Pure (no server-only imports) so both the client
// composer and the server-rendered feed can use them.

/** One person that can be @mentioned in a caption/status. */
export type Mentionable = { username: string; displayName: string }

// Matches @username where username is the stored charset ([a-z0-9_], up to 20).
// Case-insensitive so "@Priya" still tags, but usernames are lowercase.
const MENTION_RE = /@([a-z0-9_]{1,20})/gi

export type MentionPart =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; username: string }

/**
 * Splits text into plain-text and mention segments for rendering. Purely
 * pattern-based — it tags anything shaped like @username; it doesn't check the
 * name against the real user list (visual tagging only, no linking).
 */
export function parseMentions(text: string): MentionPart[] {
  const parts: MentionPart[] = []
  const re = new RegExp(MENTION_RE) // own lastIndex, safe to iterate
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) })
    }
    parts.push({
      type: "mention",
      value: match[0],
      username: match[1].toLowerCase(),
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) })
  }
  return parts
}

/**
 * Given the text and caret position, returns the in-progress @mention token the
 * caret sits in (for the composer autocomplete), or null. The token must start
 * at a word boundary (start of string or whitespace).
 */
export function activeMentionQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const match = /(?:^|\s)@([a-z0-9_]*)$/i.exec(before)
  if (!match) return null
  const query = match[1]
  return { start: caret - query.length - 1, query }
}
