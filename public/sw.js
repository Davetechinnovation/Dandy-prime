// --- Constants ---
const DB_NAME = "dandyprime-db";
const DB_VERSION = 1;
const WATCHLIST_STORE = "watchlist";
const SYNC_WATCHLIST_TAG = "sync-watchlist";

// --- IndexedDB helper for offline watchlist ---
/**
 * Save a single watchlist item to IndexedDB. Each item must have a unique 'id'.
 * Overwrites if the id already exists.
 */
function saveToIndexedDB(data) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(WATCHLIST_STORE)) {
      db.createObjectStore(WATCHLIST_STORE, { keyPath: "id" });
    }
  };
  request.onerror = function (event) {
    console.error("IndexedDB open error:", event.target.error);
  };
  request.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(WATCHLIST_STORE, "readwrite");
    tx.onerror = function (event) {
      console.error("IndexedDB transaction error:", event.target.error);
    };
    const store = tx.objectStore(WATCHLIST_STORE);
    store.onerror = function (event) {
      console.error("IndexedDB store error:", event.target.error);
    };
    store.put(data);
  };
}

/**
 * Get all watchlist items from IndexedDB.
 */
function getAllWatchlistItems() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = function (event) {
      console.error("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
    request.onsuccess = function (event) {
      const db = event.target.result;
      const tx = db.transaction(WATCHLIST_STORE, "readonly");
      const store = tx.objectStore(WATCHLIST_STORE);
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = function () {
        resolve(getAllRequest.result);
      };
      getAllRequest.onerror = function (event) {
        console.error("IndexedDB getAll error:", event.target.error);
        reject(event.target.error);
      };
    };
  });
}

/**
 * Clear all watchlist items from IndexedDB.
 */
function clearWatchlist() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = function (event) {
    console.error("IndexedDB open error:", event.target.error);
  };
  request.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction(WATCHLIST_STORE, "readwrite");
    tx.onerror = function (event) {
      console.error("IndexedDB transaction error:", event.target.error);
    };
    const store = tx.objectStore(WATCHLIST_STORE);
    store.onerror = function (event) {
      console.error("IndexedDB store error:", event.target.error);
    };
    store.clear();
  };
}

// --- Listen for messages from client to save watchlist ---
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SAVE_WATCHLIST") {
    saveToIndexedDB(event.data.payload);
  }
});

// --- Background sync for watchlist ---
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_WATCHLIST_TAG) {
    event.waitUntil(
      getAllWatchlistItems()
        .then((watchlistData) => {
          if (watchlistData && watchlistData.length > 0) {
            return fetch("/api/sync-watchlist", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // 'Authorization': 'Bearer ...' // Add if needed
              },
              body: JSON.stringify(watchlistData),
            }).then((response) => {
              if (!response.ok) {
                console.error(
                  "Watchlist sync failed:",
                  response.status,
                  response.statusText
                );
                throw new Error(`Sync failed: ${response.status}`);
              }
              return response.json();
            });
          } else {
            console.log("No watchlist data to sync.");
            return Promise.resolve();
          }
        })
        .then(() => {
          console.log("Watchlist synced successfully!");
          return clearWatchlist();
        })
        .catch((error) => {
          console.error("Error syncing watchlist:", error);
          // Do NOT clear the watchlist here! Sync failed.
        })
    );
  }
});

// --- Periodic cache update ---
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-cache") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        // Add all frequently accessed resources
        return Promise.all([
          cache.add("/"),
          cache.add("/api/home/hero"),
          cache.add("/api/home/all"),
          cache.add("/api/home/search"),
          cache.add("/api/home/bollywood"),
          cache.add("/api/home/hollywood"),
          cache.add("/api/home/nollywood"),
          cache.add("/api/home/asian"),
          // Add more endpoints as needed
        ]);
      })
    );
  }
});

const CACHE_NAME = "dandyprime-cache-v5"; // Increment for EVERY deployment

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache all static assets in public folder
        return cache.addAll([
          "/",
          "/site.webmanifest",
          "/favicon.ico",
          "/favicon-16x16.png",
          "/favicon-32x32.png",
          "/android-chrome-192x192.png",
          "/android-chrome-512x512.png",
          "/apple-touch-icon.png",
          "/next.svg",
          "/vercel.svg",
          "/window.svg",
          "/file.svg",
          "/globe.svg",
          // Add more as needed
        ]);
      })
      .catch((error) => {
        console.error("Error caching static assets during install:", error);
        // Optionally: throw error to fail installation, or proceed with limited cache
        // throw error;
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .catch((error) => {
        console.error("Error cleaning up old caches during activate:", error);
      })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Offline fallback for navigation requests (HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the page
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((res) => res || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Network-first strategy for API responses to prevent stale data
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache if it's a successful response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Add cache expiry (5 minutes for API responses)
              const headers = new Headers(responseToCache.headers);
              headers.set('sw-cache-timestamp', Date.now().toString());
              const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              cache.put(event.request, modifiedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Check if cached response is still fresh (5 minutes)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
              if (cacheTimestamp) {
                const age = Date.now() - parseInt(cacheTimestamp);
                const maxAge = 5 * 60 * 1000; // 5 minutes
                if (age < maxAge) {
                  return cachedResponse;
                }
              }
            }
            // Return a fallback or null if cache is stale
            return null;
          });
        })
    );
    return;
  }

  // Network-first for JavaScript/CSS files to prevent stale code
  if (url.pathname.includes('/_next/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (images, icons, etc.)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match("/offline.html"));
    })
  );
});
