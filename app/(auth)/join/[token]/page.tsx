import Link from "next/link"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAnimalOptions } from "@/lib/animals"
import { OnboardingForm } from "../../_components/OnboardingForm"
import { joinAction } from "./actions"

// Invite validity (used / expired) changes over time — always check fresh.
export const dynamic = "force-dynamic"

type InviteCheck =
  | { ok: true }
  | { ok: false; reason: "invalid" | "used" | "expired" }

async function checkInvite(token: string): Promise<InviteCheck> {
  const admin = createAdminClient()
  const { data: invite, error } = await admin
    .from("invites")
    .select("used_at, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (error || !invite) return { ok: false, reason: "invalid" }
  if (invite.used_at) return { ok: false, reason: "used" }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { ok: false, reason: "expired" }
  }
  return { ok: true }
}

const INVALID_COPY: Record<string, { title: string; body: string }> = {
  invalid: {
    title: "This invite isn't valid",
    body: "We couldn't find this invite. Double-check the link, or ask whoever invited you for a fresh one.",
  },
  used: {
    title: "This invite was already used",
    body: "Looks like someone already joined with this link. Ask for a new invite if this wasn't you.",
  },
  expired: {
    title: "This invite has expired",
    body: "This link is past its expiry date. Ask whoever invited you to send a new one.",
  },
}

export default async function JoinPage({
  params,
}: PageProps<"/join/[token]">) {
  const { token } = await params
  const check = await checkInvite(token)

  if (!check.ok) {
    const copy = INVALID_COPY[check.reason]
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl" aria-hidden>
          🐾
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-foreground/60">{copy.body}</p>
        <Link
          href="/login"
          className="inline-block text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground"
        >
          Go to login
        </Link>
      </div>
    )
  }

  const animals = await getAnimalOptions()

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          You&apos;re invited
        </h1>
        <p className="text-sm text-foreground/60">
          Set up your account and pick your spirit animal.
        </p>
      </div>

      <OnboardingForm
        action={joinAction}
        animals={animals}
        submitLabel="Join SpiritFeed"
        hiddenFields={{ token }}
      />
    </div>
  )
}
