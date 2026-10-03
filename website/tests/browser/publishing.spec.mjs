import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = value => `${basePath}${value}`

for (const pathname of ['/tags', '/audio', '/glossary']) test(`dense links prefetch budget at 375px: ${pathname}`, async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Transferred-byte measurement requires Chromium CDP')
  const requests = new Set(), transferred = new Map()
  const network = await context.newCDPSession(page)
  await network.send('Network.enable')
  network.on('Network.requestWillBeSent', event => { if (/\.txt(?:\?|$)/.test(event.request.url)) requests.add(event.requestId) })
  network.on('Network.loadingFinished', event => { if (requests.has(event.requestId)) transferred.set(event.requestId, event.encodedDataLength) })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(route(pathname))
  for (let step = 0; step < 60; step++) { await page.mouse.wheel(0, 1600); await page.waitForTimeout(35) }
  await page.waitForTimeout(300)
  const bytes = [...transferred.values()].reduce((sum, value) => sum + value, 0)
  await test.info().attach('prefetch-budget', { body: JSON.stringify({ pathname, count: requests.size, completed: transferred.size, bytes }), contentType: 'application/json' })
  expect(requests.size).toBeLessThanOrEqual(10); expect(bytes).toBeLessThanOrEqual(500 * 1024)
})

for (const slug of ['transformer-architecture', 'mixture-of-experts-internals', 'alignment-theory', 'inference-internals', 'roi-and-business-case']) {
  for (const [width, rate, maximum] of [[1366, 1, 200], [375, 4, 1000]]) test(`static diagrams scroll without long rendering tasks: ${slug} ${width}px CPU${rate}`, async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'CPU throttling requires Chromium CDP')
    const session = await context.newCDPSession(page)
    await session.send('Emulation.setCPUThrottlingRate', { rate })
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.goto(route(`/docs/${slug === 'roi-and-business-case' ? 'business' : 'llm-internals'}/${slug}`))
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => { window.scrollTasks = []; new PerformanceObserver(list => window.scrollTasks.push(...list.getEntries().map(item => item.duration))).observe({ type: 'longtask' }) })
    for (let step = 0; step < 40; step++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(150) }
    await page.waitForTimeout(300)
    const tasks = await page.evaluate(() => window.scrollTasks)
    const measured = Math.max(0, ...tasks)
    await test.info().attach('scroll-longtasks', { body: JSON.stringify({ slug, width, rate, maximum_ms: measured, tasks }), contentType: 'application/json' })
    expect(measured).toBeLessThanOrEqual(maximum)
  })
}

test('report link uses the original article path and current date; about and freshness are navigable', async ({ page }) => {
  await page.goto(route('/docs/concepts/tool-use'))
  const url = new URL(await page.getByRole('link', { name: 'この記事の誤りを報告', exact: true }).getAttribute('href'))
  expect(url.searchParams.get('template')).toBe('article-correction.yml')
  expect(url.searchParams.get('article')).toBe('docs/01-concepts/tool-use.md')
  const pages = JSON.parse(readFileSync(new URL('../../generated/pages.json', import.meta.url), 'utf8'))
  expect(url.searchParams.get('updated')).toBe(pages['/docs/concepts/tool-use'].last_updated)
  await page.getByRole('contentinfo').getByRole('link', { name: 'このライブラリについて', exact: true }).click()
  await expect(page.getByRole('heading', { name: '制作とレビューの担い手' })).toBeVisible()
  await page.getByRole('contentinfo').getByRole('link', { name: '確認状況', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(16)
})

test('strict static diagrams have theme-specific assets and render when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`http://127.0.0.1:4183${route('/docs/concepts/agent-loop')}`)
  const image = page.locator('.static-mermaid img:visible').first()
  await image.scrollIntoViewIfNeeded()
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true)
  await expect(image).toHaveAccessibleName(/の図$/)
  await context.close()
})

test('CSP permits search, math, diagrams and theme changes without violations', async ({ page }) => {
  await page.addInitScript(() => { window.cspViolations = []; document.addEventListener('securitypolicyviolation', event => window.cspViolations.push({ directive: event.violatedDirective, blocked: event.blockedURI })) })
  for (const pathname of ['/docs/llm-internals/transformer-architecture', '/docs', '/audio']) {
    await page.goto(route(pathname))
    await page.waitForLoadState('networkidle')
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
    if (pathname === '/docs') {
      // Exercise actual keyboard input: WinCairo WebKit's insertText/fill does
      // not populate this controlled search field, while key events do.
      await page.locator('input[role="combobox"]:visible').pressSequentially('MCP')
      // Pagefind imports and loads its index on the first query. Allow that
      // real asynchronous work to finish under the complete route audit.
      await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 15_000 })
    }
    await page.getByRole('combobox', { name: '表示テーマ', exact: true }).selectOption('dark')
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
    if (pathname.includes('transformer')) {
      const image = page.locator('.static-mermaid img:visible').first(); await image.scrollIntoViewIfNeeded()
      await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true)
      await expect(page.locator('article .katex').first()).toBeVisible()
    }
    expect(await page.evaluate(() => window.cspViolations)).toEqual([])
  }
})
