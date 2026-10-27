/**
 * Sessione TMDB dell'utente (port di itaflix-tvos/src/user.js)
 * Salvata in localStorage: { sessionId, accountId, username }.
 */

const STORAGE_KEY = 'itaflix-tmdb-session';
const EVENT_NAME = 'itaflix-user-change';

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.sessionId || !parsed.accountId) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

let session = read();

function broadcast() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: session }));
}

export function getSession() {
  return session;
}

export function isAuthenticated() {
  return Boolean(session && session.sessionId && session.accountId);
}

export function getSessionId() {
  return session ? session.sessionId : null;
}

export function getAccountId() {
  return session ? session.accountId : null;
}

export function setSession({ sessionId, accountId, username }) {
  session = { sessionId, accountId, username: username || '' };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    /* storage non disponibile */
  }

  broadcast();
  return session;
}

export function clearSession() {
  session = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    /* storage non disponibile */
  }

  broadcast();
}

export function subscribe(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
