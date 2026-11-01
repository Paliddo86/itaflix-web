// Helper HTTP lato server.
//
// IMPORTANTE: queste richieste NON devono mai inviare l'header `Referer`
// (né `Origin`/`Sec-Fetch-*`): vixsrc.to è protetto da un WAF Cloudflare che
// risponde 403 "Sorry, you have been blocked" quando il Referer è di un
// dominio terzo o quando la richiesta arriva da un iframe.
// `fetch` di Node non aggiunge questi header: è esattamente ciò che ci serve.
//
// Si replicano invece gli header dell'app tvOS (`itaflix-tvos/src/extractors/
// vixsrc.js`): `Origin` self-referenziato e `X-Requested-With` fanno
// classificare la richiesta come XHR legittimo del sito stesso.

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15';

const DEFAULT_TIMEOUT = 15000;

/**
 * Origine "self" usata per gli header: il WAF di vixsrc.to accetta richieste
 * che si dichiarano provenire dal sito stesso. Configurabile via env.
 */
function selfOrigin() {
  const base = (process.env.VIX_BASE_URL || 'https://vixsrc.to').trim().replace(/\/+$/, '');
  return base || 'https://vixsrc.to';
}

function buildHeaders(extra = {}) {
  return {
    'User-Agent': USER_AGENT,
    'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
    // Header replicati da itaflix-tvos (app tvOS che parla con lo stesso WAF).
    Origin: selfOrigin(),
    'X-Requested-With': 'XMLHttpRequest',
    ...extra,
  };
}

/**
 * GET testuale con timeout.
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeout?: number }} [options]
 * @returns {Promise<{ status: number, text: string, url: string }>}
 */
export async function fetchText(url, { headers = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: buildHeaders(headers),
      signal: controller.signal,
      redirect: 'follow',
    });

    const text = await response.text();
    return { status: response.status, text, url: response.url };
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error(`Timeout (${timeout}ms) su ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET JSON con timeout e controllo dello status.
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeout?: number }} [options]
 * @returns {Promise<any>}
 */
export async function fetchJson(url, options) {
  const { status, text } = await fetchText(url, options);

  if (status < 200 || status >= 300) {
    throw new Error(`HTTP ${status} su ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Risposta JSON non valida da ${url}`);
  }
}

/**
 * GET binario con timeout (usato per la chiave AES del proxy playlist).
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeout?: number }} [options]
 * @returns {Promise<{ status: number, buffer: ArrayBuffer }>}
 */
export async function fetchBuffer(url, { headers = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: buildHeaders(headers),
      signal: controller.signal,
      redirect: 'follow',
    });

    const buffer = await response.arrayBuffer();
    return { status: response.status, buffer };
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error(`Timeout (${timeout}ms) su ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
