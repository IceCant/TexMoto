const CACHE_VERSION = "texmoto-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/pwa/icon/192",
  "/pwa/icon/512",
  "/pwa/icon/512?maskable=1",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/motorcycles/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then(async (response) => {
        if (!response.ok) return response;
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone());
        return response;
      });
    }),
  );
});
