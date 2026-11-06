/* LofiTalk service worker: Web Push notifications only.
   There is deliberately no fetch handler and no offline cache, so a new deploy
   is always picked up immediately. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Only same-origin paths may be opened from a notification.
const toSafeUrl = (value) => {
  try {
    const url = new URL(value || "/", self.location.origin);
    return url.origin === self.location.origin ? url.href : self.location.origin + "/";
  } catch {
    return self.location.origin + "/";
  }
};

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof data.title === "string" && data.title ? data.title : "LofiTalk";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      icon: "/icon-192.png",
      badge: "/favicon.png",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      renotify: Boolean(data.tag),
      data: { url: toSafeUrl(data.url) },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = toSafeUrl(event.notification.data && event.notification.data.url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        // The app navigates itself (client-side routing, no reload).
        existing.postMessage({ type: "lofitalk:navigate", url });
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
