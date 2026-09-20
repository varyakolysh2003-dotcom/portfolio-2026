import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless:true, ...(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport:{ width:1200, height:900 } });
const base = process.env.TEST_URL || 'http://localhost:5173';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
try {
  await page.goto(base);
  await page.locator('a[data-link=lavka]').click();
  await page.waitForURL('**/yandex-lavka/');
  assert.match(await page.title(), /Shared Cart in Yandex Lavka/);
  await page.getByRole('tab', { name:'Process', exact:true }).click();
  assert.match(await page.locator('#case-description').textContent(), /20\+ in-depth interviews/);
  await page.getByRole('tab', { name:'Process', exact:true }).press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name:'Result', exact:true }).getAttribute('aria-selected'), 'true');
  assert.match(await page.locator('#case-description').textContent(), /User testing/);
  await page.getByRole('tab', { name:'Context', exact:true }).click();
  await page.locator('.sound').click();
  assert.equal(await page.locator('.sound').getAttribute('aria-pressed'), 'false');
  await page.reload();
  assert.equal(await page.locator('.sound').getAttribute('aria-pressed'), 'false');
  const layouts = [];
  for (const width of [1200,375,320,768,1024]) {
    await page.setViewportSize({ width, height:900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => img.loading = 'eager');
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
    });
    const layout = await page.evaluate(() => ({ viewport:innerWidth, width:document.documentElement.scrollWidth, height:document.documentElement.scrollHeight, fontLoaded:document.fonts.check('14px Geist'), articles:[...document.querySelectorAll('.case-article')].filter(el => el.offsetHeight).length }));
    assert.equal(layout.width, width);
    assert.ok(layout.fontLoaded);
    assert.equal(layout.articles, width <= 963 ? 14 : 13);
    layouts.push(layout);
    if (width === 1200 || width === 375) await page.screenshot({ path:`verification/lavka-browser-${width}.png`, fullPage:true });
  }
  await page.setViewportSize({ width:1200, height:900 });
  await page.evaluate(() => scrollTo(0,1000));
  assert.equal(await page.locator('.profile').evaluate(el => el.getBoundingClientRect().top), 0);
  await page.locator('.cart-button').click();
  await page.waitForFunction(() => /You're one of [\d,]+ who made it to the end!/.test(document.querySelector('#cart-status').textContent));
  await page.getByRole('link', { name:'Back to portfolio' }).click();
  await page.waitForURL(base + '/');
  assert.equal(await page.locator('.sound').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(errors, []);
  const report = { errors, layouts, navigation:true, tabsAndKeyboard:true, soundPreference:true, cartFeedback:true, stickySidebar:true };
  await writeFile('verification/lavka-checks.json', JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
