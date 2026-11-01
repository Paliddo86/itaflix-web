import { DEFAULT_BASE_URL } from '../server/vixsrc.js';

/**
 * GET /api/debug-egress
 *
 * Diagnostica del blocco su vixsrc.to. Mostra:
 *  - IP pubblico di uscita della funzione (quindi l'AS datacenter usato)
 *  - status + primi byte della risposta di vixsrc.to SENZA Referer (come in produzione)
 *  - status + primi byte CON Referer del dominio corrente (simula una richiesta browser)
 *
 * Serve a distinguere un blocco per IP/AS da un blocco per header.
 * Rimuovibile in qualsiasi momento: non è usato dall'app.
 */

const TIMEOUT = 12000;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15';

async function probe(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8', ...headers },
      signal: controller.signal,
      redirect: 'follow',
    });

    const text = await response.text();
    const body = text.replace(/\s+/g, ' ').trim().slice(0, 300);

    return {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      accessControlAllowOrigin: response.headers.get('access-control-allow-origin'),
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      looksLikeCloudflareBlock: /you have been blocked|cf-error|Attention Required/i.test(body),
      body,
    };
  } catch (error) {
    return { error: error.name === 'AbortError' ? `timeout ${TIMEOUT}ms` : error.message };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const base = DEFAULT_BASE_URL;
  const target = `${base}/api/movie/155`;

  // Host dell'app (se presente) usato per simulare il Referer di un browser.
  const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');

  const [egress, plain, withReferer] = await Promise.all([
    probe('https://api.ipify.org?format=json'),
    probe(target),
    origin ? probe(target, { Referer: `${origin}/`, Origin: origin }) : Promise.resolve(null),
  ]);

  let egressIp = null;
  if (egress && typeof egress.body === 'string') {
    try {
      egressIp = JSON.parse(egress.body).ip || null;
    } catch {
      egressIp = egress.body.slice(0, 60);
    }
  }

  return res.status(200).json({
    node: process.version,
    vixBaseUrl: base,
    target,
    egressIp,
    plain,
    withReferer,
    verdict: !plain
      ? 'plain: nessun risultato'
      : plain.status === 200
        ? 'plain OK → il backend puo leggere vixsrc: il problema e altrove (CORS lato browser)'
        : plain.looksLikeCloudflareBlock
          ? 'BLOCCO CLOUDFLARE sulla funzione: serve un egress non bloccato (relay)'
          : `plain ha risposto ${plain.status}: controlla il body`,
  });
}
