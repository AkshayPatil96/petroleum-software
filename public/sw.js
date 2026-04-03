// ─── Service Worker ──────────────────────────────────────────────────────────
// ROOT CAUSE OF BLANK SCREEN:
//   The old SW cached index.html with a cache-first strategy. After a new
//   Netlify deploy, the SW served stale HTML that referenced old content-hashed
//   JS chunks. Those chunks no longer existed on the server → ChunkLoadError
//   → blank screen. Hard-refresh bypassed the SW cache, hence it "worked".
//
// STRATEGY:
//   A) Hashed /assets/* chunks  →  Cache-first (immutable, safe forever)
//   B) Everything else (HTML, manifest, SW itself) → Network-first
//      → fall back to cache ONLY when completely offline
//
// BUMP SW_VERSION on every significant release so activate() purges old caches.
// ─────────────────────────────────────────────────────────────────────────────
const SW_VERSION = 'shreyafuel-v2';

// Vite outputs hashed filenames like /assets/index-B7dUjdwq.js
// These are truly immutable — safe to cache forever.
const IMMUTABLE_ASSET_RE = /\/assets\/.*\.(js|css)(\?.*)?$/;

// ── Install: skip waiting so the new SW activates immediately without
//    requiring all tabs to be closed first.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate: delete ALL caches from previous SW versions so no stale
//    assets linger after a deployment.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SW_VERSION)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
      // Immediately take control of all open clients so they get fresh assets
      // without needing a page reload after SW update.
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests; let everything else pass through.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (IMMUTABLE_ASSET_RE.test(url.pathname)) {
    // ── Strategy A: Cache-first for hashed Vite chunks ─────────────────────
    // Content hash guarantees the file never changes under the same URL,
    // so serving from cache is always correct and avoids a network round-trip.
    event.respondWith(
      caches.open(SW_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
  } else {
    // ── Strategy B: Network-first for HTML / manifest / icons ───────────────
    // Always try the network so users receive the latest index.html after a
    // deployment. Only fall back to cache when the device is offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Opportunistically cache successful responses for offline use.
          if (response.ok) {
            caches
              .open(SW_VERSION)
              .then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || Response.error())
        )
    );
  }
});
