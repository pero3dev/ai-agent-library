#!/usr/bin/env node
// Tests the exported article renderer, not an iOS Simulator or native application.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(path.join(root, 'ios/tools/package.json'));
const { chromium } = require('@playwright/test');
const content = path.join(root, 'ios/AILibrary/Content');
const manifest = JSON.parse(await readFile(path.join(content, 'manifest.json'), 'utf8'));
const evidence = path.join(root, '.local/ios-evidence');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, offline: true });
  await context.addInitScript(() => {
    window.__readerMessages = [];
    window.webkit = { messageHandlers: { reader: { postMessage: message => window.__readerMessages.push(message) } } };
  });
  const page = await context.newPage();
  const errors = [];
  const remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
  for (const article of manifest.articles) {
    await page.goto(pathToFileURL(path.join(content, article.html_path)).href);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), article.title);
    assert.equal(await page.locator('main h1').count(), 1);
    assert.ok(await page.locator('main h2').count() > 0);
    const codeBlocks = await page.locator('pre code').count();
    if (!article.id.includes('transformer')) assert.ok(codeBlocks > 0);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => decodeURIComponent(link.hash.slice(1))).filter(id => id && !document.getElementById(id)));
    assert.deepEqual(brokenAnchors, [], `${article.id}: broken anchors`);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        for (const scale of [1.6, 2.5]) {
          await page.evaluate(value => window.reader.setFontScale(value), scale);
          assert.ok(await page.evaluate(value => parseFloat(getComputedStyle(document.documentElement).fontSize) >= 17 * value - 1, scale), 'large text is honored');
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${article.id}: body overflows at ${width}/${colorScheme}/${scale}`);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => window.reader.restore({ fraction: .53, fontScale: 1 }));
    await page.waitForFunction(() => Math.abs(scrollY / (document.documentElement.scrollHeight - innerHeight) - .53) < .025);
    const heading = article.headings.find(value => value.level === 3) || article.headings[1];
    await page.evaluate(id => window.reader.goToHeading(id), heading.id);
    await page.waitForFunction(id => Math.abs(document.getElementById(id).getBoundingClientRect().top) < 80, heading.id);
    await page.evaluate(() => window.reader.restore({ heading: 'missing-heading', fraction: .31, fontScale: 1 }));
    await page.waitForFunction(() => Math.abs(scrollY / (document.documentElement.scrollHeight - innerHeight) - .31) < .025);
    if (codeBlocks > 0) {
      await page.locator('button[data-copy]').first().click();
      assert.ok(await page.evaluate(() => window.__readerMessages.some(message => message.type === 'copy' && message.text.length > 5)));
    }
    const internal = page.locator('a[data-article-id]').first();
    if (await internal.count()) {
      const before = page.url();
      await internal.click();
      assert.equal(page.url(), before);
      assert.ok(await page.evaluate(() => window.__readerMessages.some(message => message.type === 'article')));
    }
    if (article.id.includes('transformer')) {
      assert.ok(await page.locator('.katex math').count() > 0, 'MathML is present');
      assert.ok(await page.locator('.katex-html').count() > 0, 'visual math is present');
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(evidence, article.id.replaceAll('/', '--') + '.png'), fullPage: false });
    results.push({ article: article.id, themes: 2, widths: [320, 390], font_scales: [1.6, 2.5], result: 'passed' });
  }
  assert.deepEqual(errors, [], 'article JavaScript errors');
  assert.deepEqual(remoteRequests, [], 'offline article rendering must not request the network');
  await context.close();
  const result = { surface: 'desktop-chromium-mobile-viewport', ios_native_test: false, revision: manifest.revision, results, remote_requests: remoteRequests.length, javascript_errors: errors.length };
  await writeFile(path.join(evidence, 'reader-check.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
