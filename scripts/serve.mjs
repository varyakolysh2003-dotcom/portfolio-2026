import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createReadersApi } from './readers-api.mjs';
import { tbankApi } from './tbank-api.mjs';
const readersApi = createReadersApi();
const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/lavka/readers') { await readersApi(req, res); return; }
    if (pathname.startsWith('/api/tbank/')) { await tbankApi(req,res,pathname); return; }
    if (pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(403).end(); return; }
    let relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (relative === 'yandex-lavka') { res.writeHead(302, { Location: '/yandex-lavka/' }).end(); return; }
    if (relative === 't-bank') { res.writeHead(302, { Location: '/t-bank/' }).end(); return; }
    if (relative.endsWith('/')) relative += 'index.html';
    if (root === resolve('.') && relative.startsWith('yandex-lavka/')) relative = relative.replace('yandex-lavka/', 'Yandex Lavka/');
    if (root === resolve('.') && relative.startsWith('t-bank/')) relative = relative.replace('t-bank/', 'T-Bank/');
    const asset = root === resolve('.') && /^(assets|fonts)\//.test(relative) ? `public/${relative}` : relative;
    const file = resolve(root, asset);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const data = await readFile(file);
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    if (relative === 'T-Bank/index.html' || relative === 't-bank/index.html') {
      headers['Cache-Control'] = 'no-store';
      headers['Set-Cookie'] = 'tbank_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
    }
    if (range) {
      const start = Number(range[1]); const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start > end) { res.writeHead(416).end(); return; }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1 });
      res.end(data.subarray(start, end + 1));
    } else { res.writeHead(200, { ...headers, 'Content-Length': data.length }); res.end(data); }
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Portfolio: http://localhost:${port}`));
