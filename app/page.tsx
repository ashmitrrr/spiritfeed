import { createClient } from "@/lib/supabase/server"

// This is a placeholder landing shell for Phase 0. It also doubles as a live
// connectivity check: it counts available spirit animals from Supabase so we
// can confirm the app is actually wired to the database. Phase 1 replaces the
// call-to-action here with real auth (login / invite) and Phase 2 with the feed.
export default async function Home() {
  let status: { ok: true; available: number } | { ok: false; message: string }

  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("spirit_animals")
      .select("*", { count: "exact", head: true })
      .is("taken_by", null)

    if (error) throw error
    status = { ok: true, available: count ?? 0 }
  } catch (err) {
    status = {
      ok: false,
      message: err instanceof Error ? err.message : "Unknown error",
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">SpiritFeed</h1>
        <p className="max-w-sm text-sm text-foreground/60">
          A tiny, private clubhouse for the group. Share a photo, set a status,
          pick your spirit animal.
        </p>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-4 text-sm">
        {status.ok ? (
          <p className="text-foreground/70">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 align-middle" />
            Connected to Supabase ·{" "}
            <span className="font-medium text-foreground">
              {status.available}
            </span>{" "}
            spirit animals available
          </p>
        ) : (
          <p className="text-foreground/70">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />
            Not connected: {status.message}
          </p>
        )}
      </div>

      <p className="text-xs text-foreground/40">
        Phase 0 · scaffold only — auth &amp; feed coming next
      </p>
    </main>
  )
}
