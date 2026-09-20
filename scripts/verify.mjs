import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.goto('http://localhost:5173');
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
await page.waitForFunction(() => [...document.querySelectorAll('video')].every(v => v.readyState >= 2));
const media = await page.evaluate(() => [...document.querySelectorAll('video')].map(v => ({ src: v.getAttribute('src'), width: v.videoWidth, height: v.videoHeight, duration: v.duration, playing: !v.paused })));
await page.locator('.sound').click();
const soundWorks = await page.evaluate(() => document.querySelector('.sound').getAttribute('aria-pressed') === 'false' && localStorage.getItem('portfolio-sound-enabled') === 'false');
await page.locator('.sound').click();
// Compare the exact Figma poster frames; live playback varies with capture time.
await page.evaluate(() => { for (const video of document.querySelectorAll('video')) { const img = document.createElement('img'); img.className = video.className; img.src = video.poster; video.replaceWith(img); } });
const layouts = [];
for (const width of [1200, 375, 320, 768, 1024]) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => { for (const img of document.querySelectorAll('.concept-media')) { img.src = img.src.replace(/(-mobile)?\.png$/, innerWidth <= 963 ? '-mobile.png' : '.png'); } });
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
  layouts.push(await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, fontLoaded: document.fonts.check('14px Geist') })));
  if (width === 1200 || width === 375) await page.screenshot({ path: `verification/browser-${width === 1200 ? 'desktop' : 'mobile'}.png`, fullPage: true });
}
await page.setViewportSize({ width: 1200, height: 900 });
await page.evaluate(() => window.scrollTo(0, 500));
const stickyWorks = await page.locator('.profile').evaluate(e => e.getBoundingClientRect().top === 0);
const report = { errors, media, soundWorks, stickyWorks, layouts };
await writeFile('verification/checks.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || !soundWorks || !stickyWorks || layouts.some(l => l.width > l.viewport || !l.fontLoaded)) process.exitCode = 1;
