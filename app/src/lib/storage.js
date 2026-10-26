/**
 * Persistenza locale: posizione di riproduzione e preferiti.
 * (L'app tvOS salvava questi dati lato servizio; qui stanno in localStorage.)
 */

const RESUME_KEY = 'itaflix-resume';
const FAVORITES_KEY = 'itaflix-favorites';

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* storage non disponibile */
  }
}

/** Chiave univoca per film / episodio. */
export function contentKey({ type, id, season, episode }) {
  if (type === 'tv') return `tv:${id}:${season}:${episode}`;
  return `movie:${id}`;
}

export function getResume(key) {
  const positions = readJson(RESUME_KEY, {});
  const value = positions[key];
  return typeof value === 'number' && value > 0 ? value : 0;
}

export function setResume(key, seconds) {
  if (!key) return;
  const positions = readJson(RESUME_KEY, {});
  positions[key] = Math.max(0, Math.floor(seconds));
  writeJson(RESUME_KEY, positions);
}

export function clearResume(key) {
  const positions = readJson(RESUME_KEY, {});
  delete positions[key];
  writeJson(RESUME_KEY, positions);
}

export function getFavorites() {
  return readJson(FAVORITES_KEY, []);
}

export function isFavorite(key) {
  return getFavorites().some((item) => item.key === key);
}

/**
 * Aggiunge/rimuove un contenuto dai preferiti locali.
 * @returns {boolean} true se ora è tra i preferiti
 */
export function toggleFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.some((entry) => entry.key === item.key);

  if (exists) {
    writeJson(
      FAVORITES_KEY,
      favorites.filter((entry) => entry.key !== item.key),
    );
    return false;
  }

  writeJson(FAVORITES_KEY, [{ ...item, addedAt: Date.now() }, ...favorites]);
  return true;
}
