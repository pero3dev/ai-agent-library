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
    count: countDiagrams(parser.parse(readFileSync(path.join(content, file), 'utf8')))
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
    const diagrams = page.locator('article [data-mermaid-renderer="strict"]')
    await expect(diagrams).toHaveCount(count)
    for (let index = 0; index < count; index++) {
      const diagram = diagrams.nth(index)
      await diagram.scrollIntoViewIfNeeded()
      const svg = diagram.locator('svg')
      await expect(svg).toBeVisible()
      await expect(svg).toHaveCount(1)
      const bounds = await svg.boundingBox()
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.height).toBeGreaterThan(0)
      await expect(svg).not.toBeEmpty()
      // Existing articles use HTML-style line breaks. They must remain labels,
      // rather than showing the markup itself when rendered in strict mode.
      expect(await svg.textContent()).not.toMatch(/<br\s*\/?\s*>/i)
    }
    await expect(page.locator('article')).not.toContainText('Syntax error in text')
    expect(errors).toEqual([])
  })
}
