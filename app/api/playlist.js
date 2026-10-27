import { fetchAndRewritePlaylist, fetchKey, isAllowedHost } from '../server/playlistProxy.js';

/**
 * GET /api/playlist?u=<url assoluto su vixsrc.to>
 *
 * Proxy di manifest/chiave, usato solo quando `VIX_PLAYLIST_PROXY=1`
 * (situazioni in cui il browser non può raggiungere vixsrc.to per un blocco
 * DNS dell'ISP). I segmenti video restano diretti sulla CDN.
 */
export default async function handler(req, res) {
  const target = req.query && req.query.u;

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!target) return res.status(400).json({ error: 'parametro "u" mancante' });

  let parsed;
  try {
    parsed = new URL(target);
  } catch (error) {
    return res.status(400).json({ error: 'URL non valido' });
  }

  if (!isAllowedHost(parsed.host)) {
    return res.status(400).json({ error: `host non consentito: ${parsed.host}` });
  }

  try {
    if (/\.key$/.test(parsed.pathname)) {
      const buffer = await fetchKey(parsed.toString());
      res.setHeader('content-type', 'application/octet-stream');
      res.setHeader('cache-control', 'no-store');
      return res.status(200).send(buffer);
    }

    const playlist = await fetchAndRewritePlaylist(parsed.toString());
    res.setHeader('content-type', 'application/vnd.apple.mpegurl');
    res.setHeader('cache-control', 'no-store');
    return res.status(200).send(playlist);
  } catch (error) {
    console.error('[api/playlist]', parsed.toString(), error.message);
    return res.status(502).json({ error: error.message });
  }
}
