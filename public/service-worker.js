/* Bindicator PWA Service Worker */
const CACHE_NAME = 'bindicator-static-v1';
const CORE_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-48.png',
  '/icons/icon-96.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k.startsWith('bindicator-static-') && k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      return resp;
    });
  });
}

function networkFirst(request) {
  return fetch(request)
    .then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      return resp;
    })
    .catch(() => caches.match(request));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Navigation requests: prefer fresh network (keeps index.html up to date)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || Response.error();
      })
    );
    return;
  }

  // Static assets: cache-first (Vite assets are hashed)
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Icons and manifest: cache-first
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(networkFirst(request));
});

