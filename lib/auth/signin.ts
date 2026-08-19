import "server-only"

import { createClient } from "@/lib/supabase/server"
import { usernameToEmail } from "@/lib/auth/credentials"

export type SignInResult = { ok: true } | { ok: false; error: string }

/**
 * Signs a user in by username (mapped to the synthetic email) and password,
 * establishing the session cookie via the cookie-based server client. Used by
 * the login form and immediately after account creation in onboarding.
 */
export async function signInWithUsername(
  username: string,
  password: string,
): Promise<SignInResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  })
  if (error) {
    return { ok: false, error: "Incorrect username or password." }
  }
  return { ok: true }
}
