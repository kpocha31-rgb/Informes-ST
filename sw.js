const CACHE_NAME = 'st-informes-pwa-v4-20260926-3';
const APP_ROOT = new URL('./', self.registration.scope);
const INDEX_URL = new URL('index.html', APP_ROOT).href;
const APP_URL = new URL('app.html', APP_ROOT).href;
const CORE_FILES = [
  INDEX_URL,
  APP_URL,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('icono-st-192.png', APP_ROOT).href,
  new URL('icono-st-512.png', APP_ROOT).href,
  new URL('icono-st-maskable-512.png', APP_ROOT).href
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('st-informes-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(APP_ROOT.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const app = await cache.match(INDEX_URL);
        if (app) return app;
      }
      throw error;
    }
  })());
});
