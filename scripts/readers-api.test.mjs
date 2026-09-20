import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createReadersApi } from './readers-api.mjs';
import { redisReaderStore } from './readers-redis.mjs';

async function serve(t, handler) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('local counting persists and deduplicates concurrent visits', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-readers-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'readers.json');
  const url = await serve(t, createReadersApi(file));
  const first = await fetch(url);
  const cookie = first.headers.get('set-cookie').split(';')[0];
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await first.json(), { count: 0, counted: false });
  const visits = await Promise.all(Array.from({ length: 8 }, async () =>
    (await fetch(url, { method: 'POST', headers: { cookie } })).json()));
  assert.ok(visits.every(data => data.count === 1 && data.counted));
  const second = await fetch(url);
  const otherCookie = second.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await fetch(url, { method: 'POST', headers: { cookie: otherCookie } })).json()).count, 2);
  const restarted = await serve(t, createReadersApi(file));
  assert.deepEqual(await (await fetch(restarted, { headers: { cookie } })).json(), { count: 2, counted: true });
  assert.equal((await fetch(url, { method: 'POST', headers: { origin: 'https://other.example' } })).status, 403);
  assert.equal((await fetch(url, { method: 'DELETE' })).status, 405);
});

test('cloud handler returns 503 on storage failure without a false success', async t => {
  const url = await serve(t, createReadersApi(undefined, { store: async () => { throw new Error('offline'); } }));
  const response = await fetch(url, { method: 'POST' });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Counter temporarily unavailable' });
});

test('Redis REST adapter uses an atomic operation and validates upstream replies', async t => {
  const oldUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  t.after(() => {
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL; else process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN; else process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = oldToken;
  });
  let reply = { result: [42, 1] };
  let command;
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = await serve(t, async (req, res) => {
    assert.equal(req.headers.authorization, 'Bearer test-token');
    let body = '';
    for await (const chunk of req) body += chunk;
    command = JSON.parse(body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(reply));
  });
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = 'test-token';
  assert.deepEqual(await redisReaderStore('POST', 'visitor-hash'), { count: 42, counted: true });
  assert.equal(command[0], 'EVAL');
  assert.match(command[1], /SADD/);
  assert.deepEqual(command.slice(-2), ['POST', 'visitor-hash']);
  reply = { error: 'invalid token' };
  await assert.rejects(redisReaderStore('GET', 'visitor-hash'));
  reply = { result: [-1, 1] };
  await assert.rejects(redisReaderStore('GET', 'visitor-hash'));
});
