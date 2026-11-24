const CACHE_NAME = 'tbv-calculator-v6';
const PAGE_URL = './index.html';
const APP_SHELL = [
  PAGE_URL,
  './manifest.json',
  './Icon(192).png',
  './Icon(512).png',
  './apple-touch-icon.png'
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

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
        return response;
      }

      const cachedResponse = await getCachedResponse(request);
      return cachedResponse ?? response;
    } catch {
      return await getCachedResponse(request) ?? Response.error();
    }
  })());
});

async function getCachedResponse(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  if (request.mode === 'navigate') {
    return caches.match(PAGE_URL);
  }

  return undefined;
}
