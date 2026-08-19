"use client"

import { useEffect, useState } from "react"

import { removePushSubscription, savePushSubscription } from "@/app/_actions/push"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// Convert a base64url VAPID key into the Uint8Array PushManager expects.
// Backed by an explicit ArrayBuffer so it satisfies BufferSource.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

type State = "unsupported" | "loading" | "off" | "on" | "denied" | "busy"

export function NotificationToggle() {
  const [state, setState] = useState<State>("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        Boolean(VAPID_PUBLIC_KEY)
      if (!supported) {
        if (!cancelled) setState("unsupported")
        return
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied")
        return
      }
      // Reflect any existing subscription for this browser.
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (!cancelled) setState(sub ? "on" : "off")
      } catch {
        if (!cancelled) setState("off")
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [])

  async function enable() {
    setError(null)
    setState("busy")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off")
        return
      }
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      })
      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      const result = await savePushSubscription({
        endpoint: json.endpoint ?? "",
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      })
      if (!result.ok) {
        setError(result.error)
        setState("off")
        return
      }
      setState("on")
    } catch {
      setError("Couldn't enable notifications.")
      setState("off")
    }
  }

  async function disable() {
    setError(null)
    setState("busy")
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const sub = await registration?.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setState("off")
    } catch {
      setError("Couldn't turn off notifications.")
      setState("on")
    }
  }

  if (state === "unsupported") return null

  const label =
    state === "on"
      ? "🔔 On"
      : state === "denied"
        ? "🔕 Blocked"
        : state === "busy" || state === "loading"
          ? "…"
          : "🔔 Notify me"

  return (
    <button
      type="button"
      onClick={state === "on" ? disable : state === "off" ? enable : undefined}
      disabled={state === "denied" || state === "busy" || state === "loading"}
      aria-pressed={state === "on"}
      title={
        state === "denied"
          ? "Notifications are blocked in your browser settings."
          : error ?? undefined
      }
      className="pixel-chip text-xs disabled:opacity-60"
    >
      {label}
    </button>
  )
}
