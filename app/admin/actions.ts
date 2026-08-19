"use server"

import { randomBytes } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentProfile } from "@/lib/auth/session"
import { deleteUserCompletely } from "@/lib/auth/admin-users"
import { createAdminClient } from "@/lib/supabase/admin"

export type RemoveUserResult = { ok: boolean; error?: string }

/**
 * Removes a user (admin only). Guards: caller must be an admin, and cannot
 * remove their own account (avoids locking yourself out). The destructive
 * teardown lives in `deleteUserCompletely`.
 */
export async function removeUserAction(
  targetId: string,
): Promise<RemoveUserResult> {
  const profile = await getCurrentProfile()
  if (!profile || !profile.is_admin) {
    return { ok: false, error: "Only admins can remove users." }
  }
  if (!targetId) {
    return { ok: false, error: "No user selected." }
  }
  if (targetId === profile.id) {
    return {
      ok: false,
      error: "You can't remove your own account here.",
    }
  }

  const result = await deleteUserCompletely(targetId)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  revalidatePath("/admin")
  return { ok: true }
}

/** URL-safe random invite token. */
function generateToken(): string {
  return randomBytes(18).toString("base64url")
}

export async function generateInviteAction() {
  const profile = await getCurrentProfile()
  if (!profile || !profile.is_admin) {
    redirect("/")
  }

  const admin = createAdminClient()
  const { error } = await admin.from("invites").insert({
    token: generateToken(),
    created_by: profile.id,
  })

  if (error) {
    throw new Error("Couldn't create invite. Try again.")
  }

  revalidatePath("/admin")
}
