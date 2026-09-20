import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const directory = await mkdtemp(join(tmpdir(), 'lavka-readers-'));
const port = 5198;
const base = `http://localhost:${port}`;
let server;
async function start() {
  server = spawn(process.execPath, ['scripts/serve.mjs'], { env:{ ...process.env, PORT:String(port), READER_STORE:join(directory, 'readers.json') }, stdio:['ignore','pipe','inherit'] });
  await once(server.stdout, 'data');
}
async function stop() { const exited = once(server, 'exit'); server.kill(); await exited; }
const browser = await chromium.launch({ headless:true, ...(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH } : {}) });
const errors = [];
async function newPage(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/yandex-lavka/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('lavka-cursor'));
  return page;
}
async function count(page) { return page.evaluate(async () => (await (await fetch('/api/lavka/readers')).json()).count); }
async function finish(page, total, tap = false) {
  const response = page.waitForResponse(r => r.url().endsWith('/api/lavka/readers') && r.request().method() === 'POST');
  if (tap) await page.locator('.cart-button').tap(); else await page.locator('.cart-button').hover();
  await response;
  await page.waitForFunction(n => document.querySelector('#cart-status').textContent.includes(`one of ${n} `), total);
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lavka-cursor')), false);
  assert.equal(await page.locator('.cart-button').evaluate(el => getComputedStyle(el).cursor), 'default');
}
try {
  await start();
  const first = await newPage({ viewport:{ width:1200,height:900 } });
  assert.equal(await count(first), 0);
  const cursor = await first.locator('body').evaluate(el => getComputedStyle(el).cursor);
  assert.match(cursor, /item-[1-5]\.png/);
  await finish(first, 1);
  await first.locator('.cart-button').click();
  assert.equal(await count(first), 1);
  await first.mouse.move(0,0);
  await first.reload();
  await first.waitForFunction(() => document.documentElement.classList.contains('lavka-cursor'));
  assert.notEqual(await first.locator('body').evaluate(el => getComputedStyle(el).cursor), cursor);
  await finish(first, 1);
  const second = await newPage({ viewport:{ width:1200,height:900 } });
  assert.equal(await count(second), 1);
  await finish(second, 2);
  const mobile = await newPage({ viewport:{ width:375,height:812 }, isMobile:true, hasTouch:true });
  assert.equal(await mobile.locator('body').evaluate(el => getComputedStyle(el).cursor), 'auto');
  await finish(mobile, 3, true);
  const responses = await first.evaluate(async () => Promise.all(Array.from({ length:8 }, async () => (await (await fetch('/api/lavka/readers', { method:'POST' })).json()).count)));
  assert.ok(responses.every(value => value === 3));
  await stop(); await start();
  assert.equal(await count(first), 3);
  await first.goto(base);
  assert.doesNotMatch(await first.locator('body').evaluate(el => getComputedStyle(el).cursor), /item-/);
  assert.equal((await first.request.get(`${base}/.data/lavka-readers.json`)).status(), 403);
  await second.screenshot({ path:'verification/lavka-reader-finished.png' });
  assert.deepEqual(errors, []);
  const report = { errors, cursorVariants:5, randomCursorChangesOnReload:true, cursorRestoredAtCart:true, uniqueBrowserCounting:true, touchCounting:true, repeatAndConcurrentRequestsDeduplicated:true, persistsAfterServerRestart:true, homeCursorUnchanged:true };
  await writeFile('verification/readers-checks.json', JSON.stringify(report,null,2));
  console.log(report);
} finally { await browser.close(); if (server && server.exitCode === null) await stop(); await rm(directory, { recursive:true, force:true }); }
