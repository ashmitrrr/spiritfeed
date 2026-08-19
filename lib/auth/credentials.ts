// Rules for the invite-only username/password auth model.
//
// We don't collect real emails. Supabase Auth is email/password under the hood,
// so we map each username to a synthetic, non-routable email
// (`<username>@spiritfeed.local`). No mail is ever sent to it; it's just the
// unique login handle Supabase Auth needs.

export const SYNTHETIC_EMAIL_DOMAIN = "spiritfeed.local"

export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const PASSWORD_MIN = 8

// Personality naming (Phase: spirit animal personality system). Capped so the
// "[Adjective] [Nickname] the [Animal]" tagline can't blow out the layout.
// No profanity filter by design — this is a private friend group.
export const ANIMAL_NICKNAME_MAX = 24
export const ANIMAL_ADJECTIVE_MAX = 24

const USERNAME_RE = new RegExp(`^[a-z0-9_]{${USERNAME_MIN},${USERNAME_MAX}}$`)

/** Lowercase + trim; usernames are case-insensitive for login. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`
}

/** Returns an error message, or null if valid. */
export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters, using only lowercase letters, numbers, and underscores.`
  }
  return null
}

/** Returns an error message, or null if valid. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`
  }
  return null
}

/**
 * Validates the animal nickname + adjective. Both are required (they're part of
 * onboarding) and length-capped; whitespace-only counts as empty. Returns an
 * error message, or null if valid.
 */
export function validateAnimalPersona(
  nickname: string,
  adjective: string,
): string | null {
  const name = nickname.trim()
  const adj = adjective.trim()
  if (!name) return "Give your animal a name."
  if (name.length > ANIMAL_NICKNAME_MAX) {
    return `That name is too long (max ${ANIMAL_NICKNAME_MAX} characters).`
  }
  if (!adj) return "Choose an adjective for your animal."
  if (adj.length > ANIMAL_ADJECTIVE_MAX) {
    return `That adjective is too long (max ${ANIMAL_ADJECTIVE_MAX} characters).`
  }
  return null
}
