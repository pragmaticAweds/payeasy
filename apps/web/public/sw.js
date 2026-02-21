const CACHE_NAME = "payeasy-api-cache-v1";

// We want to specifically target API routes
const API_ROUTE_REGEX = /\/api\//;

// Static assets we might want to pre-cache (optional, minimizing here to focus on API)
const PRECACHE_ASSETS = ["/", "/browse"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort pre-cache of core routes
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Pre-cache warning (safe to ignore):", err);
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith("payeasy-api-cache-")) {
            console.log("Clearing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of clients immediately
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // If this is an API request, use Stale-While-Revalidate
  if (API_ROUTE_REGEX.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Only cache valid standard responses (not errors or opaque responses)
              if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === "basic"
              ) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.warn("Network fetch failed for API, relying solely on cache:", err);
              // We could return a custom fallback JSON here if we wanted
            });

          // Return cached response instantly if available, OR wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
