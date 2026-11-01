/**
 * VixSrc extractor — port 1:1 di itaflix-tvos/src/extractors/vixsrc.js
 * (VixSrc Extractor by Pal0X).
 *
 * Differenze rispetto all'originale, necessarie lato server:
 *  - niente `eval`: gli object literal presenti nell'HTML vengono convertiti in
 *    JSON con una trasformazione deterministica e poi letti con JSON.parse;
 *  - `fetch` (Node 22) con timeout e senza Referer/Origin, così il WAF di
 *    vixsrc non blocca le richieste;
 *  - espone anche la lista dei server alternativi (`window.streams`).
 */

import { fetchJson, fetchText } from './http.js';

export const DEFAULT_BASE_URL = process.env.VIX_BASE_URL || 'https://vixsrc.to';

const JSON_HEADERS = { Accept: 'application/json' };

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.info('[vixsrc]', ...args);
};

/* ------------------------------------------------------------------------- */
/* Parsing helpers (porting di findObjectEnd / extractWindowObject / ...)      */
/* ------------------------------------------------------------------------- */

/**
 * Trova la fine del blocco bilanciato (`{...}` oppure `[...]`) rispettando
 * stringhe ed escape. Equivalente di `findObjectEnd` dell'app tvOS.
 * @param {string} str stringa che inizia con `{` o `[`
 * @returns {number} indice esclusivo di fine blocco
 */
export function findBalancedEnd(str) {
  const open = str[0];
  const close = open === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];

    if (inString) {
      if (char === '\\') {
        i += 1;
        continue;
      }
      if (char === stringChar) inString = false;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
    } else if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }

  return str.length;
}

/** Alias storico dell'app tvOS. */
export function findObjectEnd(str) {
  return findBalancedEnd(str);
}

/**
 * Estrae il blocco `window.<key> = { ... }` dall'HTML.
 * @returns {string|null}
 */
export function extractWindowObject(code, key) {
  const assignPattern = new RegExp(`window\\.${key}\\s*=\\s*\\{`);
  const assignMatch = assignPattern.exec(code);
  if (!assignMatch) return null;

  const startIdx = assignMatch.index + assignMatch[0].length - 1;
  const rest = code.slice(startIdx);
  const endIdx = findBalancedEnd(rest);
  if (endIdx === 0) return null;

  return rest.slice(0, endIdx);
}

/**
 * Estrae il blocco `window.<key> = [ ... ]` dall'HTML.
 * @returns {string|null}
 */
export function extractWindowArray(code, key) {
  const assignPattern = new RegExp(`window\\.${key}\\s*=\\s*\\[`);
  const assignMatch = assignPattern.exec(code);
  if (!assignMatch) return null;

  const startIdx = assignMatch.index + assignMatch[0].length - 1;
  const rest = code.slice(startIdx);
  const endIdx = findBalancedEnd(rest);
  if (endIdx === 0) return null;

  return rest.slice(0, endIdx);
}

/**
 * Estrae il valore primitivo `window.<key> = <valore>`.
 */
export function extractWindowPrimitive(code, key) {
  const pattern = new RegExp(`window\\.${key}\\s*=\\s*([^;\\n]+)`);
  const match = pattern.exec(code);
  if (!match) return undefined;

  const value = match[1].trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value))) return Number(value);

  return value.replace(/^['"]|['"]$/g, '');
}

/**
 * Converte un object literal JS (quello presente nell'HTML di vixsrc) in JSON:
 * chiavi senza apici, stringhe con apici singoli, virgole finali.
 */
export function parseJsObjectLiteral(source) {
  if (!source) return null;

  const jsonish = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n\r]*/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, body) =>
      JSON.stringify(body.replace(/\\'/g, "'").replace(/\\\\/g, '\\')),
    )
    .replace(/,\s*([}\]])/g, '$1');

  return JSON.parse(jsonish);
}

function parseJsonArray(source) {
  if (!source) return null;
  try {
    return JSON.parse(source);
  } catch (error) {
    return parseJsObjectLiteral(source);
  }
}

/* ------------------------------------------------------------------------- */
/* Estrazione URL                                                             */
/* ------------------------------------------------------------------------- */

/**
 * Estrae i dati di riproduzione dall'HTML dell'embed.
 * @param {string} html
 * @returns {{ masterPlaylist: any, canPlayFHD: boolean, servers: Array, thumbnailsUrl?: string }}
 */
export function extractUrl(html) {
  const masterStr = extractWindowObject(html, 'masterPlaylist');
  let masterPlaylist = null;

  if (masterStr) {
    try {
      masterPlaylist = parseJsObjectLiteral(masterStr);
    } catch (error) {
      throw new Error(`Errore nel parsing di masterPlaylist: ${error.message}`);
    }
  }

  const canPlayFHD = extractWindowPrimitive(html, 'canPlayFHD');
  const servers = parseJsonArray(extractWindowArray(html, 'streams')) || [];
  const thumbnailsUrl = extractWindowPrimitive(html, 'thumbnailsUrl');

  if (
    !masterPlaylist ||
    !masterPlaylist.url ||
    !masterPlaylist.params ||
    !masterPlaylist.params.token ||
    !masterPlaylist.params.expires
  ) {
    throw new Error('masterPlaylist incompleto');
  }

  return {
    masterPlaylist,
    canPlayFHD: Boolean(canPlayFHD),
    servers: Array.isArray(servers) ? servers : [],
    thumbnailsUrl: typeof thumbnailsUrl === 'string' ? thumbnailsUrl : undefined,
  };
}

/**
 * Costruisce l'URL finale di riproduzione (master playlist HLS).
 * @param {{ masterPlaylist: any, canPlayFHD: boolean }} parsed
 * @returns {string}
 */
export function buildFinalUrl({ masterPlaylist, canPlayFHD }) {
  if (!masterPlaylist || !masterPlaylist.url) {
    throw new Error("Dati insufficienti per costruire l'URL finale.");
  }

  const params = [];

  if (masterPlaylist.params && masterPlaylist.params.token) {
    params.push(`token=${encodeURIComponent(masterPlaylist.params.token)}`);
  }
  if (masterPlaylist.params && masterPlaylist.params.expires) {
    params.push(`expires=${encodeURIComponent(masterPlaylist.params.expires)}`);
  }
  // h=1 abilita la qualità FHD quando disponibile.
  if (canPlayFHD) params.push('h=1');

  const { url } = masterPlaylist;
  if (!params.length) return url;

  return url.includes('?') ? `${url}&${params.join('&')}` : `${url}?${params.join('&')}`;
}

export function buildApiUrl({ type, id, season, episode, baseUrl = DEFAULT_BASE_URL }) {
  if (type === 'tv') {
    return `${baseUrl}/api/tv/${id}/${season}/${episode}`;
  }
  return `${baseUrl}/api/movie/${id}`;
}

/* ------------------------------------------------------------------------- */
/* Estrazione completa (equivalente di getMovieUrl / getTvShowUrl)            */
/* ------------------------------------------------------------------------- */

const MAX_ATTEMPTS = 5;

/**
 * Restituisce l'URL m3u8 finale per un film o un episodio.
 * Ripete la richiesta dell'embed quando il server risponde 410 (token monouso).
 *
 * @param {{ type?: 'movie'|'tv', id: string|number, season?: string|number,
 *           episode?: string|number, baseUrl?: string }} params
 * @returns {Promise<{ url: string, expires: number, servers: Array, canPlayFHD: boolean }>}
 */
export async function getStreamUrl({
  type = 'movie',
  id,
  season,
  episode,
  baseUrl = DEFAULT_BASE_URL,
}) {
  const apiUrl = buildApiUrl({ type, id, season, episode, baseUrl });
  debug('api', apiUrl);

  let data = await fetchJson(apiUrl, { headers: JSON_HEADERS });
  if (!data || !data.src) throw new Error("Field 'src' mancante nel JSON.");

  let embedUrl = `${baseUrl}${data.src}`;
  let html = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetchText(embedUrl);
    debug('embed', attempt, response.status, embedUrl);

    if (response.status === 200) {
      html = response.text;
      break;
    }

    if (response.status === 410) {
      // Token monouso scaduto: si richiede un nuovo `src` e si riprova.
      data = await fetchJson(apiUrl, { headers: JSON_HEADERS });
      if (!data || !data.src) throw new Error("Field 'src' mancante nel JSON.");
      embedUrl = `${baseUrl}${data.src}`;
      continue;
    }

    throw new Error(`VixSrc ha risposto ${response.status}`);
  }

  if (!html) {
    throw new Error(`VixSrc: embed non disponibile dopo ${MAX_ATTEMPTS} tentativi`);
  }

  const parsed = extractUrl(html);
  const url = buildFinalUrl(parsed);

  return {
    url,
    expires: Number(parsed.masterPlaylist.params.expires) || 0,
    servers: parsed.servers,
    canPlayFHD: parsed.canPlayFHD,
  };
}
