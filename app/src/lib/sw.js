/**
 * Registrazione del service worker con aggiornamento automatico.
 *
 * Obiettivo: dopo un nuovo deploy l'app installata (segnalibro su schermata
 * Home) si aggiorna da sola, senza che l'utente debba rimuovere e ri-aggiungere
 * l'icona.
 *
 * Flusso:
 *  1. ad ogni apertura controlliamo se c'è una nuova versione del worker
 *     (`registration.update()`), e la ricontrolliamo quando l'app torna in
 *     primo piano e ogni volta che si torna online;
 *  2. il worker nuovo chiama `skipWaiting()` + `clients.claim()`, quindi prende
 *     il controllo senza aspettare la chiusura di tutte le schede;
 *  3. `public/sw.js` avvisa con `SW_UPDATED`; il client ricarica una volta sola,
 *     ma NON mentre un video è in riproduzione (perderebbe la posizione).
 */

const RELOAD_FLAG = 'itaflix-sw-reload';

/** Un video/embed è aperto? In quel caso rimandiamo il reload. */
function isPlaying() {
  return Boolean(document.querySelector('.player-overlay'));
}

/**
 * Registra il service worker e gestisce l'aggiornamento automatico.
 * @param {{ baseUrl?: string }} [options]
 */
export function registerServiceWorker({ baseUrl = '/' } = {}) {
  if (!('serviceWorker' in navigator)) return;

  const swUrl = `${baseUrl}sw.js`;

  // Versione già ricaricata una volta: evitiamo loop se qualcosa va storto.
  const alreadyReloaded = (() => {
    try {
      return sessionStorage.getItem(RELOAD_FLAG) === '1';
    } catch (error) {
      return false;
    }
  })();

  const reloadOnce = () => {
    if (alreadyReloaded || isPlaying()) return;

    try {
      sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch (error) {
      /* storage non disponibile */
    }
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};

    // Il worker appena attivato ci informa: la nuova versione è pronta.
    if (data.type === 'SW_UPDATED') reloadOnce();
  });

  // Quando un nuovo worker prende il controllo (senza passare da SW_UPDATED).
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(swUrl, {
        // Il browser aggiorna il worker ad ogni navigazione: nessuna cache HTTP.
        updateViaCache: 'none',
      });

      // Controllo esplicito ad ogni avvio: se c'è un deploy nuovo lo scarica.
      registration.update().catch(() => undefined);

      // Ritorno in primo piano (tipico quando si riapre l'app da Home).
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => undefined);
        }
      });

      window.addEventListener('online', () => {
        registration.update().catch(() => undefined);
      });

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          // `installed` + nessun controller = prima installazione (nessun reload).
          // Con un controller attivo invece è un aggiornamento: ricarichiamo.
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            reloadOnce();
          }
        });
      });
    } catch (error) {
      console.warn('[sw] registrazione fallita', error);
    }
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
