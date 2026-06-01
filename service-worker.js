const CACHE_NAME = "wedding-hall-search-v20260601app31";
const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./register-pwa.js",
  "./웨딩홀_업로드_양식.xlsx",
  "./assets/icons/favicon.svg",
  "./assets/icons/app-icon.svg",
  "./assets/icons/app-icon-maskable.svg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/app-icon-maskable-512.png",
  "./assets/icons/apple-touch-icon-180.png",
  "./assets/icons/apple-touch-icon-167.png",
  "./assets/icons/apple-touch-icon-152.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-167x167.png",
  "./apple-touch-icon-152x152.png",
  "./weddingpick-touch-icon.png"
];

const LIVE_DATA_FILE_NAMES = new Set([
  "data.js",
  "웨딩홀 정보.xlsx",
  "seoul_wedding_master_final_pro.xlsx",
]);

const isLiveDataRequest = (requestUrl) => {
  const pathname = decodeURIComponent(requestUrl.pathname || "");
  const fileName = pathname.split("/").pop() || "";
  return LIVE_DATA_FILE_NAMES.has(fileName);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (!/^https?:$/.test(requestUrl.protocol)) {
    return;
  }

  if (isLiveDataRequest(requestUrl)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const networkRequest = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkRequest;
    })
  );
});
