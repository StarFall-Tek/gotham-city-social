/* Gotham City Social web app — network-first service worker.
   Always tries the live site first (so new deploys show up immediately);
   falls back to the last cached copy when offline. */
const CACHE = "gcs-app-v4";
const CORE = ["./", "./index.html", "./app/", "./manifest.webmanifest", "./favicon.svg",
  "./assets/app/icon-192.png", "./assets/app/icon-512.png", "./assets/app/app-art-720.jpg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./")))
  );
});
