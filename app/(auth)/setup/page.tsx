import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAnimalOptions } from "@/lib/animals"
import { OnboardingForm } from "../_components/OnboardingForm"
import { setupAction } from "./actions"

// Must re-check the profiles table on every request so setup disables itself
// once the first account exists — never statically cache this page.
export const dynamic = "force-dynamic"

// One-time bootstrap for the very first account (the app owner). Since
// invites.created_by requires an existing profile, the first admin can't come
// through the normal invite flow — this route fills that gap. It only works
// while the profiles table is empty, so it disables itself permanently the
// moment setup completes.
export default async function SetupPage() {
  const admin = createAdminClient()
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })

  if ((count ?? 0) > 0) {
    // Setup already done — nothing to bootstrap.
    redirect("/login")
  }

  const animals = await getAnimalOptions()

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-lg tracking-tight text-olive-dark">
          Welcome to SpiritFeed
        </h1>
        <p className="text-sm text-ink/70">
          Set up the first account — this one becomes the admin.
        </p>
      </div>

      <OnboardingForm
        action={setupAction}
        animals={animals}
        submitLabel="Create admin account"
      />
    </div>
  )
}
