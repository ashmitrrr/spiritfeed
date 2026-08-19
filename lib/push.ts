import "server-only"

import { after } from "next/server"
import webpush from "web-push"

import { createAdminClient } from "@/lib/supabase/admin"

export type PushPayload = {
  title: string
  body: string
  url?: string
}

/**
 * Runs push work AFTER the response is sent, so a slow/failed push never delays
 * or breaks the user-facing action it was triggered from. Falls back to a plain
 * fire-and-forget if called outside a request scope. Always swallows errors.
 */
export function pushAfterResponse(fn: () => Promise<void>): void {
  const safe = async () => {
    try {
      await fn()
    } catch {
      // best-effort
    }
  }
  try {
    after(safe)
  } catch {
    void safe()
  }
}

// Configure web-push once with the VAPID keys. Missing keys are tolerated (push
// simply no-ops) so the app still runs in envs where push isn't configured.
let vapidConfigured = false
function ensureVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  // The `mailto:` subject is required by the spec; the address is informational.
  webpush.setVapidDetails("mailto:rainaashmit@gmail.com", publicKey, privateKey)
  vapidConfigured = true
  return true
}

/**
 * Sends a push notification to every registered device of `userId`. Expired /
 * gone subscriptions (404/410) are pruned. Best-effort: this NEVER throws into
 * its caller — the same contract as evaluatePromptFire, so it can be fired from
 * inside a reaction / prompt flow without a slow or failed push ever delaying or
 * breaking the user-facing action. Call it fire-and-forget (don't await it in
 * the request path if you can avoid it).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    if (!ensureVapid()) return

    const admin = createAdminClient()
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)
    if (!subs || subs.length === 0) return

    const body = JSON.stringify(payload)
    const staleIds: string[] = []

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          )
        } catch (err) {
          const statusCode =
            err && typeof err === "object" && "statusCode" in err
              ? (err as { statusCode?: number }).statusCode
              : undefined
          // 404 Not Found / 410 Gone → the subscription is dead; prune it.
          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(sub.id)
          }
        }
      }),
    )

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds)
    }
  } catch {
    // Never let push bookkeeping break the caller.
  }
}
