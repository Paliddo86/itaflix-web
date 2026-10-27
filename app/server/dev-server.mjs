/**
 * Dev server delle API: emula il minimo indispensabile di Vercel
 * (`req.query`, `res.status().json().end()`) così da poter avviare la UI
 * con `npm run dev` + `npm run dev:api` senza installare la CLI di Vercel.
 *
 *   node server/dev-server.mjs [porta]        (default 3001)
 */

import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/** Carica .env.local (se presente) senza dipendenze esterne. */
function loadEnv() {
  const envPath = resolve(rootDir, '.env.local');
  if (!existsSync(envPath)) return;

  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || line.trim().startsWith('#')) return;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    });
}

loadEnv();

const port = Number(process.argv[2] || process.env.PORT || 3001);

const routes = {
  '/api/stream': (await import('../api/stream.js')).default,
  '/api/health': (await import('../api/health.js')).default,
  '/api/playlist': (await import('../api/playlist.js')).default,
};

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('content-type')) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
    return res;
  };
  // come `res.send` di Vercel: supporta stringhe e buffer (chiave AES)
  res.send = (body) => {
    if (body instanceof ArrayBuffer) {
      res.end(Buffer.from(body));
    } else if (Buffer.isBuffer(body)) {
      res.end(body);
    } else {
      res.end(String(body));
    }
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  decorateResponse(res);

  const { pathname, searchParams } = new URL(req.url, `http://localhost:${port}`);
  const handler = routes[pathname];

  if (!handler) {
    res.status(404).json({ error: `Route non trovata: ${pathname}` });
    return;
  }

  req.query = Object.fromEntries(searchParams.entries());

  try {
    await handler(req, res);
  } catch (error) {
    console.error('[dev-server]', error);
    if (!res.writableEnded) {
      res.status(500).json({ error: error.message });
    }
  }
});

server.listen(port, () => {
  console.log(`\n  ITAFlix API dev server → http://localhost:${port}`);
  console.log(`  prova: curl http://localhost:${port}/api/stream?type=movie&id=27205\n`);
});
