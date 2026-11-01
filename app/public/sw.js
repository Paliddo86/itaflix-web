/*
 * Service worker minimale di ITAFlix.
 * Serve a rendere l'app installabile (Chrome richiede un SW con fetch handler)
 * e a mostrare la shell anche offline. Le chiamate /api non vengono mai messe
 * in cache: lo stream deve sempre essere risolto dal server.
 */

// Bump ad ogni release: invalida la shell in cache dei client gia installati.
const CACHE = 'itaflix-shell-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo.png', './icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // niente cache per API e per risorse di altre origini (CDN video, TMDB, …)
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  // navigazioni: rete prima, fallback alla shell in cache (offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('./index.html')),
      ),
    );
    return;
  }

  // asset statici: cache-first con aggiornamento in background
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
