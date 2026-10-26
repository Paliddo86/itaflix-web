import { DEFAULT_BASE_URL } from '../server/vixsrc.js';

/**
 * GET /api/health → diagnostica rapida (usata anche per verificare il deploy).
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    service: 'itaflix-web',
    node: process.version,
    vixBaseUrl: DEFAULT_BASE_URL,
    timestamp: new Date().toISOString(),
  });
}
