"use server"

import { redirect } from "next/navigation"

import { createAccount } from "@/lib/auth/onboarding"
import { signInWithUsername } from "@/lib/auth/signin"
import type { OnboardingState } from "../../_components/OnboardingForm"

export async function joinAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const token = String(formData.get("token") ?? "")
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")
  const animalKey = String(formData.get("animalKey") ?? "")

  if (!token) {
    return { error: "This invite link is missing its token." }
  }

  const result = await createAccount({
    username,
    password,
    animalKey,
    inviteToken: token,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  const signIn = await signInWithUsername(result.username, password)
  if (!signIn.ok) {
    redirect("/login")
  }

  redirect("/")
}
