"use server"

import { redirect } from "next/navigation"

import { createAccount } from "@/lib/auth/onboarding"
import { signInWithUsername } from "@/lib/auth/signin"
import type { OnboardingState } from "../_components/OnboardingForm"

export async function setupAction(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")
  const animalKey = String(formData.get("animalKey") ?? "")
  const animalNickname = String(formData.get("animalNickname") ?? "")
  const animalAdjective = String(formData.get("animalAdjective") ?? "")

  const result = await createAccount({
    username,
    password,
    animalKey,
    animalNickname,
    animalAdjective,
    isAdmin: true,
    requireNoExistingProfiles: true,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  const signIn = await signInWithUsername(result.username, password)
  if (!signIn.ok) {
    // Account exists; just send them to login rather than dead-ending here.
    redirect("/login")
  }

  redirect("/")
}
