"use server"

import { randomBytes } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

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
