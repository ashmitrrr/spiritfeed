"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type SavePushResult = { ok: true } | { ok: false; error: string }

type BrowserSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/**
 * Registers (or refreshes) the current user's browser push subscription.
 * Deduped on `endpoint` — re-subscribing from the same browser updates the row
 * and, if the endpoint had been claimed by a different account on this device,
 * reassigns it to the now-signed-in user. Uses the service-role client so the
 * upsert's UPDATE branch works regardless of who previously owned the endpoint
 * (the RLS insert/delete policies still guard direct client access).
 */
export async function savePushSubscription(
  sub: BrowserSubscription,
): Promise<SavePushResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Signed out." }

  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { ok: false, error: "Invalid subscription." }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  )
  if (error) return { ok: false, error: "Couldn't save the subscription." }

  return { ok: true }
}

/** Removes a subscription by endpoint (called when the user disables push). */
export async function removePushSubscription(
  endpoint: string,
): Promise<SavePushResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Signed out." }
  if (!endpoint) return { ok: false, error: "Invalid subscription." }

  const admin = createAdminClient()
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)

  return { ok: true }
}
