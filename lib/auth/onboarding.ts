import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  normalizeUsername,
  usernameToEmail,
  validatePassword,
  validateUsername,
} from "@/lib/auth/credentials"

export type CreateAccountParams = {
  username: string
  password: string
  animalKey: string
  /** Marks the new profile as the app owner. Used by the /setup bootstrap. */
  isAdmin?: boolean
  /** When set, the account is created via this invite token (marked used). */
  inviteToken?: string
  /**
   * Safety guard for the /setup bootstrap: only proceed if the profiles table
   * is still empty. Prevents a second person racing into the bootstrap route.
   */
  requireNoExistingProfiles?: boolean
}

export type CreateAccountResult =
  | { ok: true; userId: string; email: string; username: string }
  | { ok: false; error: string }

/**
 * Creates a SpiritFeed account end to end using the service-role client
 * (RLS intentionally forbids the anon key from doing these steps):
 *   1. validate inputs + preconditions (animal free, username free, invite valid)
 *   2. create the auth user
 *   3. insert the profile
 *   4. atomically claim the spirit animal (taken_by)
 *   5. mark the invite used (if this is an invite signup)
 *
 * On any failure after the auth user is created, best-effort cleanup runs so we
 * don't leave orphaned users/rows. It does NOT establish a session — the caller
 * signs the user in with the cookie-based client afterwards.
 */
export async function createAccount(
  params: CreateAccountParams,
): Promise<CreateAccountResult> {
  const admin = createAdminClient()

  const username = normalizeUsername(params.username)
  const displayName = params.username.trim()
  const password = params.password
  const animalKey = params.animalKey

  // 1. Input format
  const usernameError = validateUsername(username)
  if (usernameError) return { ok: false, error: usernameError }
  const passwordError = validatePassword(password)
  if (passwordError) return { ok: false, error: passwordError }
  if (!animalKey) return { ok: false, error: "Please pick a spirit animal." }

  // 1a. Bootstrap guard: only when profiles table is empty
  if (params.requireNoExistingProfiles) {
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
    if (error) return { ok: false, error: "Couldn't verify setup state." }
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Setup has already been completed." }
    }
  }

  // 2. Animal must exist and be available
  const { data: animal, error: animalError } = await admin
    .from("spirit_animals")
    .select("key, taken_by")
    .eq("key", animalKey)
    .maybeSingle()
  if (animalError) return { ok: false, error: "Couldn't check that animal." }
  if (!animal) return { ok: false, error: "That spirit animal doesn't exist." }
  if (animal.taken_by) {
    return { ok: false, error: "That spirit animal was just taken. Pick another." }
  }

  // 3. Username must be free
  const { data: existingProfile, error: usernameLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()
  if (usernameLookupError) {
    return { ok: false, error: "Couldn't check that username." }
  }
  if (existingProfile) {
    return { ok: false, error: "That username is taken. Try another." }
  }

  // 4. Invite must be valid (unused + unexpired) if this is an invite signup
  if (params.inviteToken) {
    const { data: invite, error: inviteError } = await admin
      .from("invites")
      .select("id, used_at, expires_at")
      .eq("token", params.inviteToken)
      .maybeSingle()
    if (inviteError) return { ok: false, error: "Couldn't check that invite." }
    if (!invite || invite.used_at) {
      return { ok: false, error: "This invite is no longer valid." }
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { ok: false, error: "This invite has expired." }
    }
  }

  // 5. Create the auth user (synthetic email, pre-confirmed)
  const email = usernameToEmail(username)
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    })
  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message ?? "Couldn't create the account.",
    }
  }
  const userId = created.user.id

  const cleanup = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
  }

  // 6. Insert the profile row
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    username,
    display_name: displayName,
    spirit_animal: animalKey,
    is_admin: params.isAdmin ?? false,
  })
  if (profileError) {
    await cleanup()
    return { ok: false, error: "Couldn't save your profile. Try again." }
  }

  // 7. Atomically claim the spirit animal (only if still free)
  const { data: claimed, error: claimError } = await admin
    .from("spirit_animals")
    .update({ taken_by: userId })
    .eq("key", animalKey)
    .is("taken_by", null)
    .select("key")
  if (claimError || !claimed || claimed.length === 0) {
    await admin.from("profiles").delete().eq("id", userId)
    await cleanup()
    return { ok: false, error: "That spirit animal was just taken. Pick another." }
  }

  // 8. Mark the invite used (atomic: only if still unused)
  if (params.inviteToken) {
    const { data: usedInvite, error: useError } = await admin
      .from("invites")
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq("token", params.inviteToken)
      .is("used_at", null)
      .select("id")
    if (useError || !usedInvite || usedInvite.length === 0) {
      await admin
        .from("spirit_animals")
        .update({ taken_by: null })
        .eq("key", animalKey)
      await admin.from("profiles").delete().eq("id", userId)
      await cleanup()
      return { ok: false, error: "This invite is no longer valid." }
    }
  }

  return { ok: true, userId, email, username }
}
