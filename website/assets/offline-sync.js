/* ==========================================================================
   Renegade Reader - Offline Storage & Sync Engine
   Pre-caches all novel chapters into Cache Storage for 100% offline use.
   ========================================================================== */

(function () {
  'use strict';

  const CACHE_NAME = 'renegade-reader-v26';
  const STORAGE_KEY_OFFLINE_READY = 'renegade_offline_ready';
  const TOTAL_CHAPTERS = 2093;

  let isDownloading = false;
  let abortController = null;

  const OfflineManager = {
    cacheName: CACHE_NAME,
    totalChapters: TOTAL_CHAPTERS,

    // Check if browser supports Cache Storage & Service Worker
    isSupported: function () {
      return ('caches' in window) && ('serviceWorker' in navigator);
    },

    // Check if app is running in installed standalone mode (PWA)
    isStandalone: function () {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    },

    // Request persistent storage so browser eviction algorithms never wipe novel data
    requestPersistence: async function () {
      if (navigator.storage && navigator.storage.persist) {
        try {
          return await navigator.storage.persist();
        } catch (e) {
          return false;
        }
      }
      return false;
    },

    // Check if storage is already persisted
    isPersisted: async function () {
      if (navigator.storage && navigator.storage.persisted) {
        try {
          return await navigator.storage.persisted();
        } catch (e) {
          return false;
        }
      }
      return false;
    },

    // Query current offline status: count cached chapters and check readiness
    getStatus: async function () {
      if (!this.isSupported()) {
        return { supported: false, cached: 0, total: TOTAL_CHAPTERS, ready: false, percent: 0, persisted: false, isDownloading: false };
      }
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const chapterSet = new Set();
        keys.forEach(k => {
          const match = k.url.match(/\/read\/ch_(\d+)(\.html)?$/);
          if (match) chapterSet.add(parseInt(match[1], 10));
        });
        const cachedCount = chapterSet.size;
        const ready = cachedCount >= TOTAL_CHAPTERS || localStorage.getItem(STORAGE_KEY_OFFLINE_READY) === 'true';
        const persisted = await this.isPersisted();
        const percent = Math.min(100, Math.round((cachedCount / TOTAL_CHAPTERS) * 100));

        return {
          supported: true,
          cached: cachedCount,
          total: TOTAL_CHAPTERS,
          ready: ready,
          percent: percent,
          persisted: persisted,
          isDownloading: isDownloading
        };
      } catch (e) {
        return { supported: true, cached: 0, total: TOTAL_CHAPTERS, ready: false, percent: 0, persisted: false, isDownloading: false };
      }
    },

    // Download and cache all chapters in concurrent batches
    downloadAll: async function (onProgress, onComplete, onError) {
      if (isDownloading) return;
      if (!this.isSupported()) {
        if (onError) onError(new Error('Offline caching is not supported in this browser.'));
        return;
      }

      isDownloading = true;
      abortController = new AbortController();

      try {
        await this.requestPersistence();
        const cache = await caches.open(CACHE_NAME);

        // Fetch chapters list or generate 1..TOTAL_CHAPTERS
        let chapters = [];
        try {
          const metaRes = await fetch('/meta/chapters.json');
          if (metaRes.ok) {
            const data = await metaRes.json();
            chapters = data.map(c => c.chapter);
          }
        } catch (e) {
          // Fallback to sequential numbers
        }
        if (!chapters.length) {
          for (let i = 1; i <= TOTAL_CHAPTERS; i++) chapters.push(i);
        }

        // Check which chapters are already in cache
        const keys = await cache.keys();
        const existing = new Set();
        keys.forEach(k => {
          const match = k.url.match(/\/read\/ch_(\d+)(\.html)?$/);
          if (match) existing.add(parseInt(match[1], 10));
        });

        const toFetch = chapters.filter(num => !existing.has(num));
        let completed = existing.size;
        const total = chapters.length;

        if (onProgress) {
          onProgress({
            completed,
            total,
            percent: Math.round((completed / total) * 100),
            currentChapter: null
          });
        }

        if (toFetch.length === 0) {
          localStorage.setItem(STORAGE_KEY_OFFLINE_READY, 'true');
          isDownloading = false;
          if (onProgress) onProgress({ completed: total, total, percent: 100, currentChapter: null });
          if (onComplete) onComplete();
          return;
        }

        // Concurrency pool (16 parallel workers)
        const concurrency = 16;
        let queueIndex = 0;

        const worker = async () => {
          while (queueIndex < toFetch.length) {
            if (abortController.signal.aborted) break;
            const chNum = toFetch[queueIndex++];
            const url = `/read/ch_${chNum}.html`;
            const cleanUrl = `/read/ch_${chNum}`;

            try {
              const res = await fetch(url, { signal: abortController.signal });
              if (res.ok) {
                const text = await res.text();
                const headers = { 'Content-Type': 'text/html; charset=utf-8' };
                await cache.put(url, new Response(text, { headers }));
                await cache.put(cleanUrl, new Response(text, { headers }));
              }
            } catch (err) {
              if (abortController.signal.aborted) throw err;
            }

            completed++;
            if (onProgress && (completed % 4 === 0 || completed === total)) {
              onProgress({
                completed: Math.min(completed, total),
                total,
                percent: Math.round((Math.min(completed, total) / total) * 100),
                currentChapter: chNum
              });
            }
          }
        };

        const workers = [];
        for (let w = 0; w < Math.min(concurrency, toFetch.length); w++) {
          workers.push(worker());
        }

        await Promise.all(workers);

        if (!abortController.signal.aborted) {
          localStorage.setItem(STORAGE_KEY_OFFLINE_READY, 'true');
          isDownloading = false;
          if (onProgress) onProgress({ completed: total, total, percent: 100, currentChapter: null });
          if (onComplete) onComplete();
        }
      } catch (err) {
        isDownloading = false;
        if (!abortController.signal.aborted && onError) {
          onError(err);
        }
      } finally {
        isDownloading = false;
      }
    },

    // Abort active download
    cancelDownload: function () {
      if (abortController) {
        abortController.abort();
        isDownloading = false;
      }
    },

    // Clear all offline chapters from cache to free space
    clearOfflineData: async function () {
      if (!this.isSupported()) return;
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        for (const k of keys) {
          if (k.url.includes('/read/ch_')) {
            await cache.delete(k);
          }
        }
        localStorage.removeItem(STORAGE_KEY_OFFLINE_READY);
      } catch (e) {
        console.error('Failed to clear offline cache:', e);
      }
    },

    // Quietly prefetch upcoming N chapters when reader is on chapterNum
    prefetchUpcoming: async function (currentNum, count = 8) {
      if (!this.isSupported() || !navigator.onLine) return;
      try {
        const cache = await caches.open(CACHE_NAME);
        const curr = parseInt(currentNum, 10);
        if (isNaN(curr)) return;

        for (let i = curr + 1; i <= Math.min(curr + count, TOTAL_CHAPTERS); i++) {
          const cleanUrl = `/read/ch_${i}`;
          const existing = await cache.match(cleanUrl);
          if (!existing) {
            const htmlUrl = `/read/ch_${i}.html`;
            fetch(htmlUrl).then(async res => {
              if (res.ok) {
                const text = await res.text();
                const headers = { 'Content-Type': 'text/html; charset=utf-8' };
                cache.put(cleanUrl, new Response(text, { headers }));
                cache.put(htmlUrl, new Response(text, { headers }));
              }
            }).catch(() => {});
          }
        }
      } catch (e) {}
    },

    // Automatically synchronize novel chapters if running as an installed PWA
    autoSyncIfInstalled: function () {
      if (!this.isSupported() || !navigator.onLine) return;
      if (navigator.connection && navigator.connection.saveData) return;

      if (this.isStandalone()) {
        this.getStatus().then(status => {
          if (!status.ready && status.cached < TOTAL_CHAPTERS) {
            this.downloadAll(null, () => {
              console.debug('Renegade Reader: Offline sync complete for installed PWA.');
            });
          }
        });
      }
    }
  };

  window.OfflineManager = OfflineManager;

  // Run auto-sync on load or when PWA is installed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineManager.autoSyncIfInstalled());
  } else {
    OfflineManager.autoSyncIfInstalled();
  }

  window.addEventListener('appinstalled', () => {
    OfflineManager.autoSyncIfInstalled();
  });
})();
