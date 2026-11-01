/**
 * Utility PWA: stato di installazione, piattaforma e "non ora".
 */

const DISMISS_KEY = 'itaflix-install-dismissed';
const DISMISS_DAYS = 7;

/** L'app gira già come app installata (standalone)? */
export function isStandalone() {
  if (typeof window === 'undefined') return false;

  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  return standaloneMedia || window.navigator.standalone === true;
}

/** iPhone / iPad (incluso iPadOS che si presenta come Mac). */
export function isIos() {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const iPadOs = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;

  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

/** L'utente ha scelto "non ora" di recente? */
export function isInstallDismissed() {
  try {
    const until = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch (error) {
    return false;
  }
}

export function dismissInstall() {
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch (error) {
    /* storage non disponibile */
  }
}

/** Apre il banner di installazione da un altro punto dell'app (es. Impostazioni). */
export function requestInstall() {
  window.dispatchEvent(new CustomEvent('itaflix-install-open'));
}
