// SpiritFeed service worker — push notifications only (no offline/caching for
// now). Kept minimal on purpose.

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // Non-JSON payload — fall back to plain text as the body.
    payload = { body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "SpiritFeed"
  const body = payload.body || ""
  const url = payload.url || "/"

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab/window on that URL if one is open.
        for (const client of clientList) {
          const clientPath = new URL(client.url).pathname
          const targetPath = new URL(targetUrl, self.location.origin).pathname
          if (clientPath === targetPath && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise focus any open client and navigate it, or open a new one.
        if (clientList.length > 0 && "navigate" in clientList[0]) {
          return clientList[0].focus().then((c) => c.navigate(targetUrl))
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      }),
  )
})
