/**
 * Tascorr Service Worker — Phase 1 & 2 (Caching + Offline Read Support)
 *
 * Strategy:
 *  - Static assets (JS, CSS, HTML, images): Cache-First — served from cache
 *    instantly, updated in background.
 *  - API GET requests: Network-First with Cache Fallback — always try the
 *    server; if offline or server fails, serve the last known cached response.
 *  - API POST/PATCH/DELETE requests: Network-only (no caching of mutations).
 */

const CACHE_VERSION = 'tascorr-v1';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  'index.html',
];

// API endpoints whose GET responses should be cached for offline use
const CACHEABLE_API_PATHS = [
  '/api/tasks',
  '/api/tasks/workload',
  '/api/users',
  '/api/departments',
  '/api/notifications',
  '/api/auth/me',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately without waiting for old tabs to close
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Non-fatal: some assets may not be available during dev
        console.warn('[SW] Pre-cache error (non-fatal):', err);
      });
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          // Delete old cache versions
          if (key !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const apiIndex = url.pathname.indexOf('/api/');
  if (apiIndex !== -1) {
    const apiPath = url.pathname.substring(apiIndex);
    // Only cache GET requests; let mutations (POST/PATCH/DELETE) pass through
    if (request.method === 'GET') {
      const isCacheable = CACHEABLE_API_PATHS.some((p) =>
        apiPath.startsWith(p)
      );

      if (isCacheable) {
        event.respondWith(networkFirstWithCache(request));
        return;
      }
    }
    // Non-cacheable API: pure network passthrough
    return;
  }

  // ── Static Assets (JS, CSS, HTML, images, fonts) ─────────────────────────
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }
});

/**
 * Network-First strategy with Cache Fallback.
 * Used for API GET requests — always tries to fetch fresh data.
 * If the network fails, serves the last cached response.
 */
async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse && networkResponse.ok) {
      // Update cache with fresh response (clone before consuming)
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Network failed — try serving from cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Offline: serving cached API response for', request.url);
      return cached;
    }
    // Nothing cached — return a graceful offline JSON response
    return new Response(
      JSON.stringify({ error: 'You are offline and no cached data is available.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache-First strategy with Network Fallback.
 * Used for static assets — serves from cache for instant load,
 * fetches from network if not cached yet.
 */
async function cacheFirstWithNetworkFallback(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) {
    // Serve from cache immediately, refresh in background (stale-while-revalidate)
    fetch(request.clone())
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {}); // Ignore network errors during background refresh
    return cached;
  }

  // Not in cache — fetch from network and cache it
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // Truly offline and nothing cached
    return new Response('Offline', { status: 503 });
  }
}
