import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { spiritAnimalEmoji } from "@/lib/spirit-animals"
import { SignOutButton } from "./_components/SignOutButton"

// Authenticated home. The middleware already gates this route; the profile
// check is a defensive backstop. This is a Phase 1 shell — the real feed lands
// in Phase 2 and replaces the placeholder card below.
export default async function Home() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {spiritAnimalEmoji(profile.spirit_animal)}
          </span>
          <div>
            <p className="text-sm text-foreground/50">Signed in as</p>
            <p className="font-medium">{profile.display_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {profile.is_admin && (
            <Link
              href="/admin"
              className="text-sm text-foreground/60 underline underline-offset-4 hover:text-foreground"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      <section className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          You&apos;re in, {profile.display_name}.
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Your spirit animal is set. The feed, posting, and reactions arrive in
          the next phase.
        </p>
      </section>

      <p className="text-center text-xs text-foreground/40">
        Phase 1 · auth &amp; onboarding complete
      </p>
    </main>
  )
}
