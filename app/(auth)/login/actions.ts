"use server"

import { redirect } from "next/navigation"

import { signInWithUsername } from "@/lib/auth/signin"

export type LoginState = { error: string | null }

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!username || !password) {
    return { error: "Enter your username and password." }
  }

  const result = await signInWithUsername(username, password)
  if (!result.ok) {
    return { error: result.error }
  }

  redirect("/")
}
