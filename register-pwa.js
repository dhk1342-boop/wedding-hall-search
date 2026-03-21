const canRegisterServiceWorker =
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost");

const isNativeCapacitorApp =
  typeof window.Capacitor !== "undefined" &&
  typeof window.Capacitor.isNativePlatform === "function" &&
  window.Capacitor.isNativePlatform();

if (canRegisterServiceWorker && !isNativeCapacitorApp) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Ignore registration failure so the main app keeps working.
    });
  });
}
