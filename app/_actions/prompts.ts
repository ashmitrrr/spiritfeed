"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { submitTodaysPrompt, type SubmitPromptResult } from "@/lib/prompts"

/**
 * The currently-assigned member submits today's prompt text. Ownership + window
 * are re-checked server-side in `submitTodaysPrompt` so a stale UI can't post
 * out of turn or after the deadline.
 */
export async function submitPromptAction(
  formData: FormData,
): Promise<SubmitPromptResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You're signed out. Sign in and retry." }

  const text = String(formData.get("promptText") ?? "")
  const result = await submitTodaysPrompt(user.id, text)
  if (result.ok) revalidatePath("/")
  return result
}
