// Pure constants shared between server (lib/prompts.ts) and client components
// (composer/prompt card). No server-only imports here.

/** How long an assigned member has to write the prompt before we re-roll. */
export const ASSIGN_WINDOW_MS = 4 * 60 * 60 * 1000 // 4 hours
/** How long a live prompt accepts submissions. */
export const PROMPT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
/** Max length of the prompt text an assignee can write. */
export const PROMPT_TEXT_MAX = 200
