/**
 * Proxy opzionale delle playlist HLS.
 *
 * Serve solo se `vixsrc.to` è irraggiungibile dal browser (es. blocco DNS
 * dell'ISP): in quel caso si imposta `VIX_PLAYLIST_PROXY=1` e `/api/stream`
 * restituisce anche `proxyUrl`. Il proxy riscrive gli URL della playlist in
 * modo che manifest, rendition audio/sottotitoli e chiave AES passino da qui,
 * mentre i segmenti video restano diretti sulla CDN (nessun consumo di banda).
 */

import { fetchBuffer, fetchText } from './http.js';
import { DEFAULT_BASE_URL } from './vixsrc.js';

const BASE_HOST = (() => {
  try {
    return new URL(DEFAULT_BASE_URL).host;
  } catch (error) {
    return 'vixsrc.to';
  }
})();

export function isAllowedHost(host) {
  return host === BASE_HOST;
}

export function proxifyUrl(absoluteUrl) {
  return `/api/playlist?u=${encodeURIComponent(absoluteUrl)}`;
}

/**
 * Riscrive una playlist m3u8: gli URL che puntano al dominio del servizio
 * vengono fatti passare dal proxy, gli altri (CDN dei segmenti) restano intatti.
 */
export function rewritePlaylist(text, playlistUrl) {
  const base = new URL(playlistUrl);

  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (match, uri) => {
          let absolute;
          try {
            absolute = new URL(uri, base).toString();
          } catch (error) {
            return match;
          }

          return isAllowedHost(new URL(absolute).host)
            ? `URI="${proxifyUrl(absolute)}"`
            : `URI="${absolute}"`;
        });
      }

      let absolute;
      try {
        absolute = new URL(trimmed, base).toString();
      } catch (error) {
        return line;
      }

      return isAllowedHost(new URL(absolute).host) ? proxifyUrl(absolute) : absolute;
    })
    .join('\n');
}

export async function fetchAndRewritePlaylist(playlistUrl) {
  const { status, text } = await fetchText(playlistUrl);
  if (status !== 200) throw new Error(`Upstream ${status} su ${playlistUrl}`);
  return rewritePlaylist(text, playlistUrl);
}

export async function fetchKey(targetUrl) {
  const { status, buffer } = await fetchBuffer(targetUrl);
  if (status !== 200) throw new Error(`Upstream ${status} su ${targetUrl}`);
  return buffer;
}
