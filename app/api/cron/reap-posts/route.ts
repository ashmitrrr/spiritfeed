import { NextResponse } from "next/server"

import { reapExpiredPosts } from "@/lib/reaper"

// Never cache — this mutates data and must run fresh each invocation.
export const dynamic = "force-dynamic"

/**
 * Daily reaper (triggered by the Vercel Cron job in vercel.json). Deletes
 * regular posts older than 24h, archiving them into post_archive first.
 *
 * Protected by CRON_SECRET: Vercel Cron automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when that env var is set, so random
 * callers without the secret get a 401. Fails closed if the secret is unset.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await reapExpiredPosts()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reaper failed."
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
