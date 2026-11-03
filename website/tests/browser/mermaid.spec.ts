import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const content = fileURLToPath(new URL('../../content/', import.meta.url))
const parser = unified().use(remarkParse)
const countDiagrams = node => (node.type === 'code' && node.lang === 'mermaid' ? 1 : 0)
  + (node.children ?? []).reduce((count, child) => count + countDiagrams(child), 0)
const articles = readdirSync(content, { recursive: true })
  .filter(file => file.endsWith('.mdx')).sort()
  .map(file => ({
    pathname: `/docs/${file.replaceAll(path.sep, '/').replace(/\.mdx$/, '').replace(/(?:^|\/)index$/, '')}`.replace(/\/$/, ''),
    count: (readFileSync(path.join(content, file), 'utf8').match(/<StaticMermaid\b/g) || []).length
  }))
  .filter(article => article.count > 0)

test('the synchronized article inventory includes Mermaid coverage', () => {
  expect(articles.length).toBeGreaterThan(0)
})

// Only the existing published articles are rendered; no diagram inputs are
// injected into the browser. The same coverage grows with the article library.
for (const { pathname, count } of articles) {
  test(`all ${count} published Mermaid diagrams render with strict settings: ${pathname}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' && /mermaid/i.test(message.text())) errors.push(message.text())
    })
    await page.goto(`${basePath}${pathname}`)
    // This marker proves the component reached by the compiled MDX import.
    const diagrams = page.locator('article [data-mermaid-renderer="strict-static"]')
    await expect(diagrams).toHaveCount(count)
    for (let index = 0; index < count; index++) {
      const diagram = diagrams.nth(index)
      await diagram.scrollIntoViewIfNeeded()
      const svg = diagram.locator('img:visible')
      await expect(svg).toBeVisible()
      await expect(svg).toHaveCount(1)
      // Theme hydration can replace the SVG between visibility and measurement.
      // Retry the layout assertion itself; a permanently absent/zero-size SVG still fails.
      await expect.poll(async () => {
        const bounds = await svg.boundingBox()
        return Boolean(bounds && bounds.width > 0 && bounds.height > 0)
      }).toBe(true)
      await expect.poll(() => svg.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
      await expect(svg).toHaveAccessibleName(/の図$/)
      // Existing articles use HTML-style line breaks. They must remain labels,
      // rather than showing the markup itself when rendered in strict mode.
      const image = await page.request.get(await svg.getAttribute('src'))
      expect(await image.text()).not.toMatch(/<script\b|\son[a-z]+\s*=/i)
    }
    await expect(page.locator('article')).not.toContainText('Syntax error in text')
    expect(errors).toEqual([])
  })
}

for (const pathname of ['/docs/overview/learning-roadmap', '/docs/llm-internals/transformer-architecture', '/docs/concepts/tool-use']) {
  for (const width of [375, 1366]) for (const theme of ['light', 'dark']) {
    test(`original-size diagram is keyboard reachable and scrolls: ${pathname} ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.addInitScript(theme => {
        localStorage.setItem('theme', theme)
        window.diagramCspViolations = []
        document.addEventListener('securitypolicyviolation', event => window.diagramCspViolations.push(event.violatedDirective))
      }, theme)
      await page.goto(`${basePath}${pathname}`)
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /\bdark\b/ : /\blight\b/)
      const figure = page.locator('article .static-mermaid').first()
      await figure.scrollIntoViewIfNeeded()
      const preview = figure.locator(':scope > img:visible')
      await expect.poll(() => preview.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
      const before = await preview.evaluate(image => ({ naturalWidth: image.naturalWidth, width: image.getBoundingClientRect().width }))
      const summary = figure.locator('summary')
      await expect(summary).toHaveAccessibleName(/の図を元の大きさで表示$/)
      await summary.focus(); await summary.press('Enter')
      const region = figure.getByRole('region', { name: /の図のスクロール領域$/ })
      const original = region.locator('img:visible')
      await expect(original).toBeVisible()
      await expect.poll(() => original.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
      await expect(original).toHaveAttribute('src', new RegExp(`-${theme}\\.svg$`))
      const after = await original.evaluate(image => ({ naturalWidth: image.naturalWidth, width: image.getBoundingClientRect().width }))
      expect(Math.abs(after.width - after.naturalWidth)).toBeLessThan(2)
      expect(after.width).toBeGreaterThanOrEqual(before.width)
      // Native Tab and arrow handling, followed by mouse scrolling to both ends.
      await summary.focus(); await summary.press('Tab')
      await expect(region).toBeFocused()
      const horizontal = await region.evaluate(element => element.scrollWidth > element.clientWidth)
      if (horizontal) {
        await region.evaluate(element => {
          element.keyboardScrollEnded = false
          const ended = event => {
            if (event.target !== element) return
            element.keyboardScrollEnded = true
            element.removeEventListener('scrollend', ended)
          }
          element.addEventListener('scrollend', ended)
        })
        await region.press('ArrowRight')
        await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
        // A visible/stable box can still be scrolling after a keyboard action.
        // Finish that native action before testing a separate mouse gesture.
        await expect.poll(() => region.evaluate(element => element.keyboardScrollEnded)).toBe(true)
      }
      // Exercise each axis separately. A diagonal wheel gesture can be locked
      // to its vertical axis by the browser, even when this figure only scrolls horizontally.
      const axes = [
        { position: 'scrollLeft', size: 'scrollWidth', viewport: 'clientWidth', deltaX: 10000, deltaY: 0 },
        { position: 'scrollTop', size: 'scrollHeight', viewport: 'clientHeight', deltaX: 0, deltaY: 10000 }
      ]
      for (const axis of axes) {
        const maximum = await region.evaluate((element, axis) => element[axis.size] - element[axis.viewport], axis)
        if (maximum > 0) { await region.hover(); await page.mouse.wheel(axis.deltaX, axis.deltaY) }
        await expect.poll(() => region.evaluate((element, axis) => Math.abs(element[axis.size] - element[axis.viewport] - element[axis.position]), axis)).toBeLessThan(2)
      }
      const scrollEnd = await region.evaluate(element => ({ x: element.scrollLeft, y: element.scrollTop }))
      for (const axis of axes.toReversed()) {
        const maximum = await region.evaluate((element, axis) => element[axis.size] - element[axis.viewport], axis)
        if (maximum > 0) { await region.hover(); await page.mouse.wheel(-axis.deltaX, -axis.deltaY) }
        await expect.poll(() => region.evaluate((element, axis) => element[axis.position], axis)).toBeLessThan(2)
      }
      await expect.poll(() => region.evaluate(element => element.scrollLeft + element.scrollTop)).toBeLessThan(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      await test.info().attach('diagram-reading-dimensions', { body: JSON.stringify({ pathname, width, theme, before, after, scrollEnd }), contentType: 'application/json' })
      if (width === 375 && theme === 'light') await test.info().attach('original-size-diagram', { body: await figure.screenshot(), contentType: 'image/png' })
      await summary.click()
      await expect(region).toBeHidden()
      await expect(summary).toBeFocused()
      expect(await page.evaluate(() => window.diagramCspViolations)).toEqual([])
    })
  }
}
