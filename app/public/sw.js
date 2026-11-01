/*
 * Service worker di ITAFlix.
 *
 * Obiettivo: rendere l'app installabile e disponibile offline SENZA costringere
 * l'utente a rimuovere e ri-aggiungere il segnalibro ad ogni release.
 *
 * Come ci riesce:
 *  - versione della cache derivata dall'hash del bundle (vedi BUILD_ID nel
 *    messaggio di build), quindi cambia da sola ad ogni release;
 *  - `index.html` è NETWORK-FIRST: con rete si prende sempre l'ultima shell,
 *    la copia in cache serve solo offline;
 *  - asset con hash nel nome (immutabili) sono cache-first: se cambia il
 *    contenuto cambia l'URL, quindi non restano mai stantii;
 *  - il client viene avvisato quando una nuova versione è pronta e ricarica
 *    da solo (vedi src/lib/pwa.js), tranne mentre sta guardando un video.
 */

// Placeholder sostituito in build (vite.config.js): senza build resta 'dev'.
const BUILD_ID = '__BUILD_ID__';

const CACHE = `itaflix-shell-${BUILD_ID}`;

// Solo asset stabili e senza hash: la shell HTML non va precachata come
// "verità", la gestiamo network-first nel fetch handler.
const PRECACHE = ['./manifest.webmanifest', './logo.png', './icon-192.png'];

// Non intercettare né mettere in cache queste richieste.
function isBypassed(url) {
  return (
    url.pathname.includes('/api/') ||
    /\.(m3u8|ts|m4s|mp4|key|vtt|srt)$/i.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      // La nuova versione prende il controllo subito, senza aspettare la chiusura
      // di tutte le schede.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim())
      // Chi ha già una pagina aperta viene avvisato: la ricarica lui.
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED', buildId: BUILD_ID })))
      .catch(() => undefined),
  );
});

// Il client può chiedere di attivare subito una nuova versione in attesa.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'SW_VERSION', buildId: BUILD_ID });
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Origini esterne (TMDB, CDN video, embed VixSrc): mai intercettate.
  if (url.origin !== self.location.origin) return;
  if (isBypassed(url)) return;

  // Navigazioni e shell HTML: prima la rete, cache solo come fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Asset con hash nel nome: immutabili, cache-first puro.
  if (/\/assets\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Tutto il resto (icone, manifest, sw, file radice): rete prima.
  event.respondWith(networkFirst(request));
});

/** Rete prima; se la rete non risponde si usa la cache. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      // `cache.put` non attende: non blocca la risposta.
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Ultima spiaggia per le navigazioni: la shell più recente in cache.
    const shell = await cache.match('./index.html');
    if (shell) return shell;

    throw error;
  }
}

/** Cache-first, con riempimento in background. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}
