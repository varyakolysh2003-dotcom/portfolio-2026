import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

// One persistent store shared by dev and preview, never copied into dist.
export function createReadersApi(file = resolve(process.env.READER_STORE || '.data/lavka-readers.json')) {
  let queue = Promise.resolve();
  return async function readersApi(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    if (!['GET', 'POST'].includes(req.method)) {
      res.writeHead(405, { Allow:'GET, POST' }).end(); return;
    }
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) {
      res.writeHead(403).end(); return;
    }
    const cookie = req.headers.cookie?.match(/(?:^|;\s*)lavka_reader=([a-f0-9-]{36})(?:;|$)/)?.[1];
    const visitor = cookie || randomUUID();
    if (!cookie) res.setHeader('Set-Cookie', `lavka_reader=${visitor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=34560000${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
    const hash = createHash('sha256').update(visitor).digest('hex');
    const operation = queue.then(async () => {
      let state;
      try { state = JSON.parse(await readFile(file, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; state = { visitors:[] }; }
      if (!Array.isArray(state.visitors)) throw new Error('Invalid reader store');
      const visitors = new Set(state.visitors);
      if (req.method === 'POST' && !visitors.has(hash)) {
        visitors.add(hash);
        await mkdir(dirname(file), { recursive:true });
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify({ visitors:[...visitors] }), { mode:0o600 });
        await rename(temporary, file);
      }
      return { count:visitors.size, counted:visitors.has(hash) };
    });
    queue = operation.catch(() => {});
    try { res.end(JSON.stringify(await operation)); }
    catch { res.writeHead(503).end(JSON.stringify({ error:'Counter temporarily unavailable' })); }
  };
}
