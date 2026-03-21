const canRegisterServiceWorker =
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost");

const isNativeCapacitorApp =
  typeof window.Capacitor !== "undefined" &&
  typeof window.Capacitor.isNativePlatform === "function" &&
  window.Capacitor.isNativePlatform();

const dispatchUpdateReady = (registration) => {
  window.dispatchEvent(
    new CustomEvent("weddingpick:update-ready", {
      detail: { registration },
    })
  );
};

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
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        const watchInstallingWorker = (worker) => {
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              dispatchUpdateReady(registration);
            }
          });
        };

        if (registration.waiting) {
          dispatchUpdateReady(registration);
        }

        if (registration.installing) {
          watchInstallingWorker(registration.installing);
        }

        registration.addEventListener("updatefound", () => {
          if (registration.installing) {
            watchInstallingWorker(registration.installing);
          }
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });

        window.setInterval(() => {
          registration.update().catch(() => {
            // Ignore periodic update failures.
          });
        }, 5 * 60 * 1000);
      })
      .catch(() => {
        // Ignore registration failure so the main app keeps working.
      });
  });
}
