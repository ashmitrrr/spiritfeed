// Fixed emoji reaction set. Small on purpose — reactions only, no comments, to
// keep posting low-pressure (see PRD). Final set is a taste decision Ashmit may
// tweak; this is a reasonable placeholder.
export const REACTION_EMOJIS = ["🔥", "❤️", "😂", "😮", "👀"] as const

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value)
}
