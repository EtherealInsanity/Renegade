/* ==========================================================================
   Renegade Reader - Service Worker (PWA Offline Engine)
   Precaches core app shell and dynamically caches read chapters for offline use
   ========================================================================== */

const CACHE_NAME = 'renegade-reader-v6';

// Base core assets to precache for offline shell
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './download.html',
  './chapters.html',
  './manifest.webmanifest',
  './assets/themes.css',
  './assets/landing.css',
  './assets/reader.css',
  './assets/reader.js',
  './assets/giscus.css',
  './assets/giscus-config.js',
  './assets/cover.webp',
  './assets/cover.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon.png'
];

// Offline HTML fallback when a page hasn't been cached yet
const OFFLINE_PAGE_HTML = `<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Renegade Reader</title>
  <link rel="stylesheet" href="./assets/themes.css">
  <link rel="stylesheet" href="./assets/landing.css">
  <style>
    .offline-box {
      max-width: 600px;
      margin: 80px auto;
      padding: 32px 24px;
      text-align: center;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div class="offline-box">
    <h1 style="color: var(--accent-color); margin-bottom: 12px;">Spiritual Qi Disconnected</h1>
    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 24px;">
      You are currently offline. You can still read any chapters you previously opened, or access the offline EPUB library.
    </p>
    <a href="./" class="btn-primary" style="text-decoration:none;">Return to Library</a>
  </div>
</body>
</html>`;

// Install event: Precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use map to ensure individual failures don't break whole install
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Stale-While-Revalidate for chapters & Cache-First for static assets
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Avoid intercepting browser extensions or external analytics
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // If found in cache, return cached response while fetching fresh in background
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline)
        if (cachedResponse) return cachedResponse;
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return new Response(OFFLINE_PAGE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
