/* ==========================================================================
   Renegade Reader - Service Worker (PWA Offline Engine v26)
   Precaches core app shell, provides Cache-First instant offline reader for
   all 2,093 chapters, and enables complete offline use without restrictions.
   ========================================================================== */

const CACHE_NAME = 'renegade-reader-v26';

// Base core assets to precache for offline shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/download',
  '/download.html',
  '/chapters',
  '/chapters.html',
  '/account',
  '/account.html',
  '/manifest.webmanifest',
  '/meta/chapters.json',
  '/meta/books.json',
  '/meta/stats.json',
  '/assets/themes.css',
  '/assets/landing.css',
  '/assets/reader.css',
  '/assets/reader.js',
  '/assets/offline-sync.js',
  '/assets/anime.min.js',
  '/assets/waline.css',
  '/assets/waline-config.js',
  '/assets/account.css',
  '/assets/account.js',
  '/assets/giscus.css',
  '/assets/giscus-config.js',
  '/assets/cover.webp',
  '/assets/cover.jpg',
  '/assets/bg-desktop.webp',
  '/assets/bg-desktop.jpg',
  '/assets/bg-waner.webp',
  '/assets/bg-waner.jpg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/favicon.png'
];

// Offline HTML fallback when an un-cached page is requested without network
const OFFLINE_PAGE_HTML = `<!DOCTYPE html>
<html lang="en" data-theme="slaughter">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Offline - Renegade Reader</title>
  <link rel="stylesheet" href="/assets/themes.css">
  <link rel="stylesheet" href="/assets/landing.css">
  <style>
    .offline-box {
      max-width: 600px;
      margin: 80px auto;
      padding: 36px 28px;
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
      You are currently offline. Any chapters you downloaded or opened are accessible with zero restrictions.
    </p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/" class="btn-primary" style="text-decoration:none;">Library Home</a>
      <a href="/chapters" class="btn-secondary" style="text-decoration:none;">Chapters Index</a>
      <a href="/download" class="btn-secondary" style="text-decoration:none;">Offline Storage</a>
    </div>
  </div>
</body>
</html>`;

// Helper: match request against cache with clean URL and .html fallbacks
async function getCachedResponse(request, url) {
  let cached = await caches.match(request);
  if (cached) return cached;

  const cleanPath = url.pathname.replace(/\/$/, '') || '/';
  cached = await caches.match(cleanPath) || await caches.match(`${cleanPath}/`);
  if (cached) return cached;

  const htmlPath = `${cleanPath}.html`;
  cached = await caches.match(htmlPath);
  if (cached) return cached;

  return null;
}

// Install event: Precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use allSettled so individual transient network hiccups do not fail installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up previous cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Cache-First for chapters & static assets, Network-First for dynamic navigation
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Avoid intercepting third-party or extension requests
  if (url.origin !== self.location.origin) return;

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    const isChapter = url.pathname.includes('/read/');

    // Chapters are completed & immutable: Cache-First for 0ms latency and 100% offline reading
    if (isChapter) {
      event.respondWith((async () => {
        const cached = await getCachedResponse(request, url);
        if (cached) return cached;

        // If not cached, fetch from network and store in cache
        try {
          const networkResponse = await fetch(request.url, { credentials: request.credentials });
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            const clone = networkResponse.clone();
            cache.put(request, clone);

            const cleanPath = url.pathname.replace(/\/$/, '');
            if (!cleanPath.endsWith('.html')) {
              cache.put(`${cleanPath}.html`, networkResponse.clone());
            }
          }
          return networkResponse;
        } catch (err) {
          // Both cache and network failed: offline fallback
          return new Response(OFFLINE_PAGE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      })());
      return;
    }

    // App shell routes (/, /chapters, /download, /account): Network-first when online, immediate cache when offline
    event.respondWith((async () => {
      if (!navigator.onLine) {
        const cached = await getCachedResponse(request, url);
        if (cached) return cached;
      }

      try {
        const networkResponse = await fetch(request.url, { credentials: request.credentials });
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await getCachedResponse(request, url);
        if (cached) return cached;

        return new Response(OFFLINE_PAGE_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Handle static assets (CSS, JS, images, fonts, metadata JSON): Cache-First
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
