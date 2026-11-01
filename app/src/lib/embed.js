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

function withStart(url, startAt) {
  const seconds = Number(startAt);
  if (Number.isFinite(seconds) && seconds > MIN_RESUME_SECONDS) {
    url.searchParams.set('startAt', String(Math.floor(seconds)));
  }
  return url.toString();
}

/** URL della pagina player per un film: `/movie/{id}`. */
export function moviePlayerUrl(id, { startAt = 0 } = {}) {
  return withStart(new URL(`${BASE}/movie/${id}`), startAt);
}

/** URL della pagina player per un episodio: `/tv/{id}/{season}/{episode}`. */
export function tvPlayerUrl(id, season, episode, { startAt = 0 } = {}) {
  return withStart(new URL(`${BASE}/tv/${id}/${season}/${episode}`), startAt);
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
 * In entrambi i casi serve un gesto utente: i browser bloccano l'apertura
 * automatica di nuove schede.
 */
export function openPlayer(url) {
  if (!url) return;

  const sameTab = isIos() && isStandalone();

  if (sameTab) {
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
