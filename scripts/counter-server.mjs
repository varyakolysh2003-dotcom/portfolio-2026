import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { redisReaderStore } from './readers-redis.mjs';

const allowedOrigin =
  'https://varyakolysh2003-dotcom.github.io';

createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');

  const send = (status, data) => {
    res.writeHead(status);
    res.end(JSON.stringify(data));
  };

  if (req.url === '/' && req.method === 'GET') {
    return send(200, { ok: true });
  }

  if (req.url !== '/api/lavka/readers') {
    return send(404, { error: 'Not found' });
  }

  const origin = req.headers.origin;
  if (origin && origin !== allowedOrigin) {
    return send(403, { error: 'Origin denied' });
  }

  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Reader-ID');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return send(405, { error: 'Method not allowed' });
  }

  const id = req.headers['x-reader-id'];
  const validId = typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (req.method === 'POST' &&
      (origin !== allowedOrigin || !validId)) {
    return send(400, { error: 'Invalid reader request' });
  }

  try {
    const hash = createHash('sha256')
      .update(validId ? id : 'read-only')
      .digest('hex');

    const result = await redisReaderStore(req.method, hash);
    send(200, result);
  } catch {
    send(503, { error: 'Counter temporarily unavailable' });
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
