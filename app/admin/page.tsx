import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { spiritAnimalTagline } from "@/lib/spirit-animals"
import { Avatar } from "../_components/Avatar"
import { CopyButton } from "./_components/CopyButton"
import { RemoveUserButton } from "./_components/RemoveUserButton"
import { generateInviteAction } from "./actions"

async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

export default async function AdminPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  if (!profile.is_admin) redirect("/")

  const admin = createAdminClient()
  const [{ data: invites }, { data: profiles }, baseUrl] = await Promise.all([
    admin
      .from("invites")
      .select("token, created_at, used_at, used_by")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select(
        "id, username, display_name, spirit_animal, animal_nickname, animal_adjective, is_admin",
      )
      .order("display_name"),
    getBaseUrl(),
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const members = profiles ?? []
  const pending = (invites ?? []).filter((i) => !i.used_at)
  const used = (invites ?? []).filter((i) => i.used_at)

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-8 px-5 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg tracking-tight">Admin</h1>
        <Link
          href="/"
          className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
        >
          Back to feed
        </Link>
      </header>

      <form action={generateInviteAction}>
        <button
          type="submit"
          className="pixel-btn pixel-btn-primary w-full px-4 py-2.5 text-sm"
        >
          Generate new invite link
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink/70">
          Members ({members.length})
        </h2>
        <ul className="space-y-2">
          {members.map((member) => {
            const isSelf = member.id === profile.id
            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-2 border-ink bg-white px-3 py-2"
              >
                <Avatar animalKey={member.spirit_animal} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {member.display_name}
                    {member.is_admin && (
                      <span className="ml-1.5 text-xs text-ink/40">admin</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-olive-dark">
                    {spiritAnimalTagline(
                      member.spirit_animal,
                      member.animal_nickname,
                      member.animal_adjective,
                    )}
                  </p>
                </div>
                {isSelf ? (
                  <span className="shrink-0 text-xs text-ink/40">You</span>
                ) : (
                  <RemoveUserButton
                    targetId={member.id}
                    username={member.username}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink/70">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ink/50">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((invite) => {
              const url = `${baseUrl}/join/${invite.token}`
              return (
                <li
                  key={invite.token}
                  className="flex items-center gap-2 border-2 border-ink bg-white px-3 py-2"
                >
                  <code className="flex-1 truncate text-xs text-ink/70">
                    {url}
                  </code>
                  <CopyButton value={url} />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink/70">
          Used ({used.length})
        </h2>
        {used.length === 0 ? (
          <p className="text-sm text-ink/50">No invites used yet.</p>
        ) : (
          <ul className="space-y-2">
            {used.map((invite) => {
              const member = invite.used_by
                ? profileById.get(invite.used_by)
                : undefined
              return (
                <li
                  key={invite.token}
                  className="flex items-center gap-2.5 border-2 border-ink/40 bg-white px-3 py-2 text-sm"
                >
                  {member ? (
                    <Avatar animalKey={member.spirit_animal} size="sm" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink">
                      {member?.display_name ?? "someone"}
                    </p>
                    {member && (
                      <p className="truncate text-xs text-olive-dark">
                        {spiritAnimalTagline(
                          member.spirit_animal,
                          member.animal_nickname,
                          member.animal_adjective,
                        )}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-ink/40">
                    {invite.used_at
                      ? new Date(invite.used_at).toLocaleDateString()
                      : ""}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
