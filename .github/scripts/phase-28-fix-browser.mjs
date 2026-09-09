import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:4000';
const chromeCandidates = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].filter(Boolean);
const executablePath = chromeCandidates.find(p => fs.existsSync(p));
if (!executablePath) throw new Error('Chrome not found');

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.setDefaultTimeout(12000);

let current = 'bootstrap';
const pageErrors = [];
page.on('pageerror', e => {
  const entry = { test: current, message: e.message, stack: e.stack || '' };
  pageErrors.push(entry);
  console.error(`[PAGEERROR][${current}] ${entry.stack || entry.message}`);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (v, m) => { if (!v) throw new Error(m); };
const checkpoint = () => pageErrors.length;
const assertNoNewErrors = (before, label) => {
  const fresh = pageErrors.slice(before);
  if (fresh.length) throw new Error(`${label}: ${fresh.map(e => e.message).join(' | ')}`);
};

async function goto(path = '/') {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2' });
  await sleep(500);
}

async function clickPjax(selector, expectedPath) {
  await page.evaluate(sel => document.querySelector(sel)?.click(), selector);
  await page.waitForFunction(path => location.pathname === path, { timeout: 12000 }, expectedPath);
  await sleep(600);
}

current = 'home-load';
let mark = checkpoint();
await goto('/');
await page.waitForSelector('#recent-posts');
assert(!(await page.$('#rightMenu')), 'right menu should remain disabled');
assertNoNewErrors(mark, current);

current = 'local-search';
mark = checkpoint();
await page.evaluate(() => document.querySelector('#search-button > .search')?.click());
await page.waitForSelector('#local-search-input input', { visible: true });
await page.type('#local-search-input input', 'WordPress');
await page.waitForFunction(() => document.querySelectorAll('.local-search__hit-item').length > 0, { timeout: 8000 });
assert((await page.$$eval('.local-search__hit-item', els => els.length)) > 0, 'search returned no results');
await page.keyboard.press('Escape');
await sleep(400);
assertNoNewErrors(mark, current);

current = 'dark-mode';
mark = checkpoint();
const beforeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await page.evaluate(() => document.getElementById('darkmode')?.click());
await sleep(400);
const afterTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
assert(beforeTheme !== afterTheme, 'dark mode did not toggle');
assertNoNewErrors(mark, current);

current = 'pjax-post-qrcode';
mark = checkpoint();
const postHref = await page.$eval('#recent-posts .recent-post-item a[href^="/20"]', a => a.getAttribute('href'));
await page.evaluate(href => {
  const link = [...document.querySelectorAll('#recent-posts .recent-post-item a')].find(a => a.getAttribute('href') === href);
  link?.click();
}, postHref);
const postPath = new URL(postHref, BASE).pathname;
await page.waitForFunction(path => location.pathname === path, { timeout: 12000 }, postPath);
await page.waitForSelector('#article-container');
await page.waitForFunction(() => {
  const root = document.getElementById('qrcode');
  return !!root && !!root.querySelector('canvas, img') && typeof window.QRCode !== 'undefined';
}, { timeout: 10000 });
assertNoNewErrors(mark, current);

current = 'copy-fallback';
mark = checkpoint();
const copyResult = await page.evaluate(async () => {
  let fallbackCalled = false;
  const oldExec = document.execCommand;
  document.execCommand = command => {
    if (command === 'copy') fallbackCalled = true;
    return command === 'copy';
  };
  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
    });
  } catch {}
  const result = await anzhiyu.copyPageUrl('https://example.com/fallback-test');
  document.execCommand = oldExec;
  return { result, fallbackCalled };
});
assert(copyResult.result === true && copyResult.fallbackCalled, `copy fallback failed: ${JSON.stringify(copyResult)}`);
assertNoNewErrors(mark, current);

current = 'post-to-music';
mark = checkpoint();
await clickPjax('a[href="/music/"]', '/music/');
await page.waitForSelector('#anMusic-page-meting .aplayer', { timeout: 18000 });
await page.waitForFunction(() => document.querySelectorAll('#anMusic-page-meting .aplayer-list li').length > 0, { timeout: 18000 });
assertNoNewErrors(mark, current);

current = 'music-history';
mark = checkpoint();
await clickPjax('a[href="/link/"]', '/link/');
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => location.pathname === '/music/', { timeout: 12000 });
  await page.waitForSelector('#anMusic-page-meting .aplayer', { timeout: 18000 });
  await page.waitForFunction(() => document.querySelectorAll('#anMusic-page-meting .aplayer-list li').length > 0, { timeout: 18000 });
  await sleep(500);
  await page.evaluate(() => history.forward());
  await page.waitForFunction(() => location.pathname === '/link/', { timeout: 12000 });
  await page.waitForSelector('#article-container, .flink-list');
  await sleep(500);
}
assertNoNewErrors(mark, current);

current = 'nav-music';
mark = checkpoint();
await goto('/');
await page.waitForSelector('#nav-music .aplayer', { timeout: 18000 });
await page.waitForFunction(() => !!document.querySelector('#nav-music .aplayer-title')?.textContent?.trim(), { timeout: 18000 });
await page.evaluate(() => document.getElementById('nav-music-hoverTips')?.click());
await sleep(800);
assertNoNewErrors(mark, current);

current = 'mobile-menu';
mark = checkpoint();
await page.setViewport({ width: 390, height: 844 });
await goto('/');
await page.evaluate(() => document.getElementById('toggle-menu')?.click());
await page.waitForFunction(() => document.getElementById('sidebar-menus')?.classList.contains('open'));
await page.evaluate(() => document.getElementById('menu-mask')?.click());
await page.waitForFunction(() => !document.getElementById('sidebar-menus')?.classList.contains('open'));
assertNoNewErrors(mark, current);

console.log(JSON.stringify({ ok: true, pageErrors }, null, 2));
await browser.close();
