const canRegisterServiceWorker =
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost");

const isNativeCapacitorApp =
  typeof window.Capacitor !== "undefined" &&
  typeof window.Capacitor.isNativePlatform === "function" &&
  window.Capacitor.isNativePlatform();

const applyDisplayModeClass = () => {
  const isStandaloneDisplayMode =
    isNativeCapacitorApp ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  document.documentElement.classList.toggle("is-standalone-app", isStandaloneDisplayMode);
  document.body.classList.toggle("is-standalone-app", isStandaloneDisplayMode);
};

applyDisplayModeClass();

const standaloneMedia = window.matchMedia("(display-mode: standalone)");

if (typeof standaloneMedia.addEventListener === "function") {
  standaloneMedia.addEventListener("change", applyDisplayModeClass);
} else if (typeof standaloneMedia.addListener === "function") {
  standaloneMedia.addListener(applyDisplayModeClass);
}

if (canRegisterServiceWorker && !isNativeCapacitorApp) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Ignore registration failure so the main app keeps working.
    });
  });
}
