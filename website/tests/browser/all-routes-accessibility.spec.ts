import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

const routes = JSON.parse(readFileSync(new URL('../../generated/routes.json', import.meta.url), 'utf8'))
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
test.describe.configure({ mode: 'parallel' })
for (const theme of ['light', 'dark']) for (const route of routes) {
  test(`all-route WCAG A/AA: ${theme} ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 })
    await page.addInitScript(value => localStorage.setItem('theme', value), theme)
    await page.goto(`${basePath}${route}`)
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const violations = audit.violations.filter(item => ['serious', 'critical'].includes(item.impact))
    await test.info().attach('axe', { body: JSON.stringify({ route, theme, violations, incomplete: audit.incomplete }, null, 2), contentType: 'application/json' })
    expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
  })
}
