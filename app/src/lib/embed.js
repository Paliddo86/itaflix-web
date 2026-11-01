/**
 * URL e apertura del player ufficiale VixSrc.
 *
 * PERCHÉ NON UN IFRAME
 * --------------------
 * VixSrc blocca con 403 (Cloudflare "Sorry, you have been blocked") i referer
 * dei domini di hosting gratuito: `*.vercel.app`, `*.netlify.app`,
 * `*.github.io`, `*.web.app`, `*.workers.dev`.
 * Un iframe manda sempre il referer del sito che lo ospita → da Vercel il
 * player non parte.
 *
 * Aprendo invece il player in una navigazione **senza header Referer** il WAF
 * lo accetta (verificato: 200 e video in riproduzione). Nel progetto concorrono
 * due cose: `<meta name="referrer" content="no-referrer">` in `index.html` e
 * `rel="noreferrer"` sul link che apriamo.
 *
 * Il player mantiene i propri controlli nativi: play, pausa, seek, volume,
 * qualità, sottotitoli, schermo intero.
 */

import { isIos, isStandalone } from './pwa.js';

const BASE = 'https://vixsrc.to';

// Sotto i 5 secondi la ripresa è inutile e fastidiosa.
const MIN_RESUME_SECONDS = 5;

/**
 * Aggiunge i parametri che il player legge all'avvio:
 *  - `autoplay=true` → `autostart: true` nel setup del player
 *  - `startAt=<secondi>` → `seek(startAt)` all'evento `ready`
 */
function withPlaybackParams(url, { startAt = 0, autoplay = true } = {}) {
  if (autoplay) url.searchParams.set('autoplay', 'true');

  const seconds = Number(startAt);
  if (Number.isFinite(seconds) && seconds > MIN_RESUME_SECONDS) {
    url.searchParams.set('startAt', String(Math.floor(seconds)));
  }
  return url.toString();
}

/** URL della pagina player per un film: `/movie/{id}`. */
export function moviePlayerUrl(id, { startAt = 0, autoplay = true } = {}) {
  return withPlaybackParams(new URL(`${BASE}/movie/${id}`), { startAt, autoplay });
}

/** URL della pagina player per un episodio: `/tv/{id}/{season}/{episode}`. */
export function tvPlayerUrl(id, season, episode, { startAt = 0, autoplay = true } = {}) {
  return withPlaybackParams(new URL(`${BASE}/tv/${id}/${season}/${episode}`), {
    startAt,
    autoplay,
  });
}

/**
 * Apre il player senza inviare l'header `Referer`.
 *
 * Comportamento:
 *  - **iOS in standalone** (app aggiunta alla Home): stessa scheda, così
 *    l'utente resta dentro la PWA e non finisce in Safari.
 *  - **altrove**: nuova scheda, così l'app resta aperta e si torna indietro
 *    chiudendo la scheda del player.
 *
 * L'avvio automatico della riproduzione è nel player (`?autoplay=true`).
 * Lo schermo intero **non** viene forzato: la Fullscreen API vale solo per il
 * documento che la chiama e non è applicabile a una scheda cross-origin, quindi
 * si usa il pulsante a schermo intero dei controlli del player.
 *
 * Serve un gesto utente: i browser bloccano l'apertura automatica di nuove
 * schede.
 *
 * @param {string} url
 */
export function openPlayer(url) {
  if (!url) return;

  if (isIos() && isStandalone()) {
    // Il meta referrer `no-referrer` della pagina evita l'invio dell'header.
    window.location.assign(url);
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noreferrer noopener';
  link.target = '_blank';

  document.body.appendChild(link);
  link.click();
  link.remove();
}
