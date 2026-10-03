import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
for (const [route, file] of [
  ['/docs/llm-internals/transformer-architecture', '11-llm-internals/transformer-architecture.md'],
  ['/docs/concepts/agent-loop', '01-concepts/agent-loop.md'],
  ['/docs/security/tool-permissions-and-sandboxing', '06-security/tool-permissions-and-sandboxing.md']
]) {
  const headings = [...readFileSync(new URL('../../../docs/' + file, import.meta.url), 'utf8').matchAll(/^## (.+)$/gm)].map(match => match[1].trim())
  test(`former diagram article retains its normal reading layout: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(base + route)
    expect(response.status()).toBe(200)
    await expect(page.locator('article h1')).toBeVisible()
    await expect(page.locator('article h2')).toHaveCount(headings.length)
    for (const [index, heading] of headings.entries()) {
      await expect(page.locator('article h2').nth(index)).toContainText(heading)
    }
    await expect(page.locator('.reading-figure, .rf-article-toc, [data-reading-step]')).toHaveCount(0)
    await expect(page.getByRole('slider', { name: '図解の再生位置' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    expect(errors).toEqual([])
  })
}
