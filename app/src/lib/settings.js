/**
 * Impostazioni utente — port di itaflix-tvos/src/settings.js
 * Stessa chiave di storage dell'app (`itaflix-settings`) così le preferenze
 * hanno la stessa forma.
 */

const STORAGE_KEY = 'itaflix-settings';
const EVENT_NAME = 'itaflix-settings-change';

export const params = {
  LANGUAGE: 'language',
};

const defaults = {
  [params.LANGUAGE]: 'it',
};

export const SERVICE_ID_MAP = {
  NETFLIX: '8',
  PRIME_VIDEO: '119',
  DISNEY: '337',
  APPLE: '350',
  HBO: '49',
  NOW: '39',
};

export const services = [
  { id: SERVICE_ID_MAP.NETFLIX, name: 'Netflix' },
  { id: SERVICE_ID_MAP.PRIME_VIDEO, name: 'Prime Video' },
  { id: SERVICE_ID_MAP.DISNEY, name: 'Disney+' },
  { id: SERVICE_ID_MAP.NOW, name: 'Now TV' },
  { id: SERVICE_ID_MAP.APPLE, name: 'Apple TV' },
  { id: SERVICE_ID_MAP.HBO, name: 'HBO Max' },
];

function readStorage() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaults, ...stored };
  } catch (error) {
    return { ...defaults };
  }
}

let settings = readStorage();

export function getAll() {
  return { ...settings };
}

export function get(key) {
  return settings[key];
}

export function set(key, value) {
  if (!Object.values(params).includes(key)) {
    throw new Error(`Unsupported settings param "${key}"`);
  }

  const previous = settings[key];
  settings = { ...settings, [key]: value };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    /* storage non disponibile (Safari privato): si mantiene solo in memoria */
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: { key, value, previous } }),
  );

  return settings[key];
}

export function subscribe(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

