import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { LoginForm } from "./LoginForm"

export default async function LoginPage() {
  // Already signed in? Skip the form.
  const profile = await getCurrentProfile()
  if (profile) redirect("/")

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl lowercase tracking-tight text-olive-dark">
          spiritfeed
        </h1>
        <p className="text-sm text-ink/70">Welcome back — sign in.</p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-ink/50">
        No account? You&apos;ll need an invite link from the group.
      </p>
    </div>
  )
}
