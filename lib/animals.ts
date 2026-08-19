import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { AnimalOption } from "@/lib/spirit-animals"

/**
 * All spirit animals for the onboarding picker, each tagged with the display
 * name of whoever already has it (null if available), sorted by label.
 *
 * Uses the service-role client because RLS doesn't allow reading spirit_animals
 * before the user has an account (the picker is shown pre-auth).
 */
export async function getAnimalOptions(): Promise<AnimalOption[]> {
  const admin = createAdminClient()

  const [{ data: animals }, { data: profiles }] = await Promise.all([
    admin
      .from("spirit_animals")
      .select("key, label, image_path, personality_blurb, taken_by")
      .order("label"),
    admin.from("profiles").select("id, display_name"),
  ])

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))

  return (animals ?? []).map((a) => ({
    key: a.key,
    label: a.label,
    imagePath: a.image_path,
    personalityBlurb: a.personality_blurb,
    takenByName: a.taken_by ? nameById.get(a.taken_by) ?? "Taken" : null,
  }))
}
