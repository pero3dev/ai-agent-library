import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = value => `${basePath}${value}`

test('static export serves canonical RSC prefetch segment filenames', async ({ request }) => {
  for (const pathname of [
    '/roadmap/__next.roadmap.__PAGE__.txt',
    '/docs/concepts/tool-use/__next.docs.$oc$mdxPath.__PAGE__.txt'
  ]) {
    const response = await request.get(route(pathname))
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    expect(await response.text()).not.toMatch(/<!doctype html/i)
  }
})

for (const pathname of ['/', '/glossary', '/roadmap', '/tags', '/review-missing-page']) {
  test(`keyboard skip link moves focus to main: ${pathname}`, async ({ page }) => {
    const response = await page.goto(route(pathname))
    expect(response.status()).toBe(pathname === '/review-missing-page' ? 404 : 200)
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#nextra-skip-nav"]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#nextra-skip-nav')).toBeFocused()
  })
}

test('docs body links to every generated section', async ({ page }) => {
  await page.goto(route('/docs'))
  const sections = JSON.parse(readFileSync(new URL('../../generated/sections.json', import.meta.url), 'utf8'))
  for (const section of sections) {
    await expect(page.locator(`article a[href="${route(section.route)}"]`).first()).toBeVisible()
  }
})

test('dependency graph shows every section and navigates from a node', async ({ page }) => {
  await page.goto(route('/roadmap'))
  const graph = page.locator('.dep-graph')
  await graph.scrollIntoViewIfNeeded()
  await expect(graph.locator('.react-flow__node')).toHaveCount(16)
  const concepts = graph.locator('.react-flow__node[data-id="concepts"]')
  await concepts.hover()
  await expect(graph.locator('.dep-panel-title')).toHaveText('01. 基礎概念')
  await expect(concepts).toBeVisible()
  await concepts.click()
  await expect(page).toHaveURL(/\/docs\/concepts(?:\.html)?$/)
})

test('strict Mermaid renderer preserves normal diagrams across theme changes and magnification', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('mermaid')) errors.push(message.text())
  })
  await page.goto(route('/docs/concepts/agent-loop'))
  await page.getByRole('heading', { name: '概要: ループが Agent を作る' }).scrollIntoViewIfNeeded()
  const diagram = page.locator('article [data-mermaid-renderer="strict"] svg')
  await expect(diagram).toBeVisible()
  const originalText = await diagram.textContent()
  for (const dark of [true, false]) {
    const before = await diagram.locator('style').textContent()
    await page.evaluate(value => {
      document.documentElement.classList.toggle('dark', value)
      document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light')
    }, dark)
    await expect.poll(() => diagram.locator('style').textContent()).not.toBe(before)
    await expect(diagram).toBeVisible()
    // Labels survive a fresh render, regardless of generated CSS/theme values.
    await expect(diagram.locator('.nodeLabel').first()).not.toBeEmpty()
  }
  expect(originalText.length).toBeGreaterThan(0)
  await page.setViewportSize({ width: 640, height: 800 })
  await diagram.evaluate(element => { element.parentElement.style.zoom = '2' })
  await diagram.scrollIntoViewIfNeeded()
  await expect(diagram).toBeVisible()
  const bounds = await diagram.boundingBox()
  expect(bounds.width).toBeGreaterThan(0)
  expect(bounds.height).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('Pagefind search returns an article and its navigation works', async ({ page }) => {
  await page.goto(route('/docs'))
  const search = page.getByRole('combobox')
  await search.fill('ツール使用')
  const result = page.locator(`[role="option"][href^="${route('/docs/concepts/tool-use')}"]`)
  await expect(result.first()).toBeVisible()
  await result.first().click()
  await expect(page).toHaveURL(/\/docs\/concepts\/tool-use(?:\.html)?(?:#.*)?$/)
  await expect(page.locator('article h1')).toContainText('ツール使用')
})
