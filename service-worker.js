const CACHE_NAME = "inventaria-pwa-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

try {
  importScripts(
    "./firebase-config.js",
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
  );
  if (self.INVENTARIA_FIREBASE?.enabled && self.firebase?.apps?.length === 0) {
    self.firebase.initializeApp(self.INVENTARIA_FIREBASE.config);
    const messaging = self.firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const notification = payload.notification || {};
      const data = payload.data || {};
      self.registration.showNotification(notification.title || data.title || "INVENTARIA", {
        body: notification.body || data.body || "Hay una novedad en el sistema.",
        icon: "https://i.imgur.com/YMqwuaR.png",
        badge: "https://i.imgur.com/YMqwuaR.png",
        tag: data.tag || "inventaria",
        data: {
          url: data.url || "./"
        }
      });
    });
  }
} catch (error) {
  // Firebase es opcional: sin configuracion, la PWA sigue funcionando.
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/firebase-config.js")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"))
    ))
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = {
      title: "INVENTARIA",
      body: event.data.text()
    };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "INVENTARIA", {
      body: payload.body || "Hay una novedad en el sistema.",
      icon: "https://i.imgur.com/YMqwuaR.png",
      badge: "https://i.imgur.com/YMqwuaR.png",
      tag: payload.tag || "inventaria",
      data: {
        url: payload.url || "./"
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const visible = clients.find((client) => client.url.startsWith(self.location.origin));
      if (visible) {
        visible.focus();
        return visible.navigate(targetUrl);
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
