"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

// Tables whose changes should trigger a feed re-fetch. Kept in sync with what
// getFeed() / getPromptContext() actually read.
const WATCHED_TABLES = [
  "posts",
  "reactions",
  "daily_prompts",
  "prompt_assignments",
  "spirit_crown",
  "statuses",
] as const

// Coalesce bursts of events (e.g. a post + its first reaction) into one refresh.
const DEBOUNCE_MS = 700

/**
 * Mounted once in the authenticated shell. Opens a single Supabase Realtime
 * channel listening for INSERT/UPDATE/DELETE on the feed-relevant tables and,
 * on any change, debounces then calls router.refresh() so the server
 * re-derives the feed. We deliberately do NOT patch state from the realtime
 * payload — getFeed()/getPromptContext() own the 24h expiry, time-capsule
 * gating, signed photo URLs, reaction aggregation and prompt state machine, and
 * re-deriving that on the client would risk subtle drift. Realtime is purely a
 * "something changed, refetch" nudge.
 *
 * Also refetches on visibility/pageshow — mobile PWAs (iOS Safari standalone
 * in particular) freeze backgrounded tabs, realtime socket included, so
 * tapping a push notification just un-suspends the page as it last was rather
 * than delivering whatever happened while it was backgrounded. Refetching
 * whenever the tab becomes visible again (notification tap, app-switcher,
 * unlocking the phone, etc.) means you always land on current data instead of
 * a stale snapshot from before it was backgrounded.
 *
 * NOTE: requires Realtime replication enabled on these tables (done via the
 * `enable_realtime_on_feed_tables` migration — ALTER PUBLICATION supabase_realtime).
 */
export function RealtimeRefresh() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        router.refresh()
      }, DEBOUNCE_MS)
    }

    const channel = supabase.channel("feed-changes")
    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      )
    }
    channel.subscribe()

    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("pageshow", onVisible)

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("pageshow", onVisible)
    }
  }, [router])

  return null
}
