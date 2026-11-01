/**
 * Client delle API interne (Vercel Functions in produzione, dev-server in locale).
 */

const REQUEST_TIMEOUT = 45000;

// Permette di servire la UI da un host statico (es. GitHub Pages) chiamando le
// API su un altro host (es. Vercel): `VITE_API_BASE=https://xxx.vercel.app`.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

/** Costruisce l'URL di un endpoint API rispettando l'eventuale base remota. */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * Risolve l'URL di riproduzione (m3u8) per un film o un episodio.
 *
 * @param {{ type: 'movie'|'tv', id: number|string, season?: number|string,
 *           episode?: number|string }} params
 * @returns {Promise<{ url: string, expires: number, servers: Array, canPlayFHD: boolean, cached: boolean }>}
 */
export async function getStream({ type, id, season, episode }) {
  const query = new URLSearchParams({ type, id: String(id) });
  if (type === 'tv') {
    query.set('season', String(season));
    query.set('episode', String(episode));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(apiUrl(`/api/stream?${query.toString()}`), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Errore ${response.status}`);
    }
    if (!payload.url) {
      throw new Error('URL di riproduzione non disponibile');
    }

    // Con API remote il proxy playlist è un path relativo al server: lo assolutizza.
    if (payload.proxyUrl && payload.proxyUrl.startsWith('/') && API_BASE) {
      return { ...payload, proxyUrl: apiUrl(payload.proxyUrl) };
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: il servizio di streaming non ha risposto');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
