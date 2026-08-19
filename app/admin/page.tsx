import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { CopyButton } from "./_components/CopyButton"
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
    admin.from("profiles").select("id, display_name"),
    getBaseUrl(),
  ])

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
  const pending = (invites ?? []).filter((i) => !i.used_at)
  const used = (invites ?? []).filter((i) => i.used_at)

  return (
    <main className="mx-auto w-full max-w-lg flex-1 space-y-8 px-5 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Admin · Invites</h1>
        <Link
          href="/"
          className="text-sm text-foreground/60 underline underline-offset-4 hover:text-foreground"
        >
          Back to feed
        </Link>
      </header>

      <form action={generateInviteAction}>
        <button
          type="submit"
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          Generate new invite link
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/70">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-foreground/40">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((invite) => {
              const url = `${baseUrl}/join/${invite.token}`
              return (
                <li
                  key={invite.token}
                  className="flex items-center gap-2 rounded-lg border border-foreground/10 px-3 py-2"
                >
                  <code className="flex-1 truncate text-xs text-foreground/70">
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
        <h2 className="text-sm font-medium text-foreground/70">
          Used ({used.length})
        </h2>
        {used.length === 0 ? (
          <p className="text-sm text-foreground/40">No invites used yet.</p>
        ) : (
          <ul className="space-y-2">
            {used.map((invite) => (
              <li
                key={invite.token}
                className="flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2 text-sm"
              >
                <span className="text-foreground/50">
                  Joined by{" "}
                  <span className="text-foreground/80">
                    {invite.used_by
                      ? nameById.get(invite.used_by) ?? "someone"
                      : "someone"}
                  </span>
                </span>
                <span className="text-xs text-foreground/30">
                  {invite.used_at
                    ? new Date(invite.used_at).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
