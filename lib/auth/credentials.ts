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
