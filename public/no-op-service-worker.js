// This service worker intentionally caches nothing: freshness comes from the
// Cache-Control headers configured in firebase.json. It exists so that a new
// deploy takes over immediately, and so that caches left behind by any older
// service worker are cleared out.

self.addEventListener('install', () => {
  // Skip over the "waiting" lifecycle state, to ensure that our
  // new service worker is activated immediately, even if there's
  // another tab open controlled by our older service worker code.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    ))
  );
});
