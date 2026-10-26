import { getStreamUrl } from '../server/vixsrc.js';

/**
 * GET /api/stream?type=movie&id=27205
 * GET /api/stream?type=tv&id=1396&season=1&episode=1
 *
 * Restituisce l'URL m3u8 finale (già con token ed expires) che il player
 * hls.js usa direttamente. La cache evita raffiche di richieste e mitiga
 * il problema dei token monouso (410).
 */

const cache = new Map();
const CACHE_MAX_ENTRIES = 100;
const MIN_TTL_MS = 60 * 1000;
const MAX_TTL_MS = 30 * 60 * 1000;

function json(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  // Utile solo se l'endpoint viene richiamato da un'altra origine.
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    return res.status(204).end();
  }

  const { type = 'movie', id, season, episode } = req.query || {};

  if (!id) return json(res, 400, { error: 'parametro "id" mancante' });
  if (type !== 'movie' && type !== 'tv') {
    return json(res, 400, { error: 'parametro "type" deve essere "movie" o "tv"' });
  }
  if (type === 'tv' && (!season || !episode)) {
    return json(res, 400, { error: 'per type=tv sono obbligatori "season" ed "episode"' });
  }

  const cacheKey = `${type}:${id}:${season || ''}:${episode || ''}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return json(res, 200, { ...cached.data, cached: true });
  }

  try {
    const data = await getStreamUrl({ type, id, season, episode });

    const ttl = Math.min(
      Math.max(data.expires * 1000 - Date.now(), MIN_TTL_MS),
      MAX_TTL_MS,
    );
    cache.set(cacheKey, { data, expiresAt: Date.now() + ttl });

    if (cache.size > CACHE_MAX_ENTRIES) {
      cache.delete(cache.keys().next().value);
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return json(res, 200, { ...data, cached: false });
  } catch (error) {
    console.error('[api/stream]', cacheKey, error.message);
    return json(res, 502, { error: error.message });
  }
}
