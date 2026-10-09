const CACHE_NAME = 'tbv-calculator-v2';
const PAGE_URL = './index.html';
const APP_SHELL = [
  PAGE_URL,
  './manifest.json',
  './Icon(192).jpg',
  './Icon(512).jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('tbv-calculator-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy)));
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        if (request.mode === 'navigate') {
          const cachedPage = await caches.match(PAGE_URL);
          if (cachedPage) return cachedPage;
        }

        return Response.error();
      })
  );
});
