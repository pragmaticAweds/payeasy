/**
 * Utility function to register the Service Worker for client-side API response caching.
 * Must only be called on the client side (e.g. within a useEffect hook).
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registration successful with scope: ", registration.scope);

          // Optional: Force update check
          registration.update();
        })
        .catch((error) => {
          console.warn("Service Worker registration failed: ", error);
        });
    });
  }
}

/**
 * Utility to unregister the Service Worker entirely
 */
export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
