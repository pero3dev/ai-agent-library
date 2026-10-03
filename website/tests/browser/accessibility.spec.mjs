import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pages = ['/', '/docs/concepts/tool-use', '/glossary', '/roadmap', '/tags', '/audio',
  '/docs/concepts/agent-loop', '/docs/architecture/workflow-vs-agent']

for (const theme of ['light', 'dark']) {
  for (const width of [375, 1440]) {
    for (const pathname of pages) {
      test(`named controls and readable text: ${theme} ${width}px ${pathname}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 960 })
        await page.addInitScript(value => localStorage.setItem('theme', value), theme)
        await page.goto(`${basePath}${pathname}`)
        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
        await expect(page.getByRole('combobox', { name: '表示テーマ', exact: true })).toHaveValue(theme)
        if (pathname === '/roadmap') await expect(page.locator('.react-flow__node')).toHaveCount(16)
        const auditRules = ['label', 'button-name', 'color-contrast', 'link-in-text-block']
        const audit = await new AxeBuilder({ page }).withRules(auditRules).analyze()
        await test.info().attach('axe-target-rules', { body: JSON.stringify({
          pathname, theme, width, auditRules, violations: audit.violations, incomplete: audit.incomplete
        }, null, 2), contentType: 'application/json' })
        expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
        const colors = await page.locator('.concept-english, .section-count, .doc-meta-updated, .glossary-card-english, .dep-node-count, .dep-panel-hint, .tag-chip-count, .tag-title-count, .btn-primary, .react-flow__attribution a').evaluateAll(elements => {
          const luminance = color => {
            const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
              const channel = value / 255
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
            })
            return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
          }
          return elements.filter(element => element.getClientRects().length).map(element => {
            const foreground = getComputedStyle(element).color
            let ancestor = element, background = 'rgb(255, 255, 255)'
            while (ancestor) {
              const candidate = getComputedStyle(ancestor).backgroundColor
              if (/^rgb\(/.test(candidate)) { background = candidate; break }
              ancestor = ancestor.parentElement
            }
            const a = luminance(foreground), b = luminance(background)
            return { selector: element.className, foreground, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
          })
        })
        await test.info().attach('text-color-samples', { body: JSON.stringify({ pathname, theme, width, colors }, null, 2), contentType: 'application/json' })
        for (const color of colors) expect(color.ratio, JSON.stringify(color)).toBeGreaterThanOrEqual(4.5)

        for (const checkbox of await page.locator('article input[type="checkbox"]').all()) {
          const label = await checkbox.getAttribute('aria-labelledby')
          expect(label).toBeTruthy()
          const text = await page.locator(`[id="${label}"]`).innerText()
          expect(text.length).toBeGreaterThan(3)
          const namePattern = Array.from(text.replace(/\s+/g, '')).map(character =>
            character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*')
          await expect(checkbox).toHaveAccessibleName(new RegExp(`^\\s*${namePattern}\\s*$`))
        }
        if (pathname === '/') await expect(page.locator('.route-more a').first()).toHaveCSS('text-decoration-line', 'underline')
      })
    }
  }
}

test('checklist Space and theme Enter keep keyboard focus and current value', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto(`${basePath}/docs/concepts/tool-use`)
  const checkbox = page.locator('article input[type="checkbox"]').first()
  await checkbox.focus()
  await page.keyboard.press('Space')
  await expect(checkbox).toBeChecked()
  await expect(checkbox).toBeFocused()
  await expect(checkbox).toHaveCSS('outline-style', 'solid')
  const theme = page.getByRole('combobox', { name: '表示テーマ', exact: true })
  await theme.scrollIntoViewIfNeeded()
  await theme.focus()
  await expect(theme).toHaveValue('light')
  await expect(theme.getByRole('option')).toHaveText(['ライト', 'ダーク', 'システム設定'])
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(theme).toHaveValue('dark')
  await expect(theme).toBeFocused()
  await theme.selectOption('system')
  await expect(theme).toHaveValue('system')
})

test('article copy and named usage menu retain the Markdown and existing destinations', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`${basePath}/docs/concepts/tool-use`)
  await page.getByRole('button', { name: '記事をコピー', exact: true }).click()
  await expect(page.getByRole('button', { name: 'コピーしました', exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('# ツール使用')
  await page.evaluate(() => { window.open = (...args) => { window.articleOpenArguments = args; return null } })
  const menu = page.getByRole('combobox', { name: '記事の利用方法', exact: true })
  await menu.focus()
  await expect(menu.getByRole('option')).toHaveText(['記事の利用方法', '記事を Markdown でコピー', 'ChatGPT で開く', 'Claude で開く'])
  await menu.selectOption('chatgpt')
  const opened = await page.evaluate(() => window.articleOpenArguments)
  expect(opened[0]).toContain('https://chatgpt.com/?hints=search&prompt=')
  expect(decodeURIComponent(opened[0])).toContain(`${basePath}/docs/concepts/tool-use`)
  expect(opened.slice(1)).toEqual(['_blank', 'noopener,noreferrer'])
  await menu.selectOption('claude')
  expect((await page.evaluate(() => window.articleOpenArguments))[0]).toContain('https://claude.ai/new?q=')
})
