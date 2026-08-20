import Image from "next/image"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import spiritfeedWordmark from "@/logo_home.png"
import { LoginForm } from "./LoginForm"

export default async function LoginPage() {
  // Already signed in? Skip the form.
  const profile = await getCurrentProfile()
  if (profile) redirect("/")

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Image
          src={spiritfeedWordmark}
          alt="spiritfeed"
          priority
          className="mx-auto block h-11 w-auto"
        />
        <p className="text-sm text-ink/70">Welcome back — sign in.</p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-ink/50">
        No account? You&apos;ll need an invite link from the group.
      </p>
    </div>
  )
}
