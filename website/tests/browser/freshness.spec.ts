import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import type { Nodes } from 'mdast'
import type { FreshnessReport, PagesMetadata } from '../../lib/content-types'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pages: PagesMetadata = JSON.parse(readFileSync(new URL('../../generated/pages.json', import.meta.url), 'utf8'))
const todoEntry = Object.entries(pages).find(([, page]) => page.source_path.startsWith('docs/') && (page.todo_count ?? 0) > 0)
if (!todoEntry) throw new Error('TODO callout article fixture is required')
const [route, metadata] = todoEntry

test('every published article metadata preserves system membership and exact rendered TODO count', () => {
  const report: FreshnessReport = JSON.parse(readFileSync(new URL('../../generated/freshness.json', import.meta.url), 'utf8'))
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
  const callouts = (node: Nodes): number => (node.type === 'mdxJsxFlowElement' && node.name === 'TodoCallout' ? 1 : 0) + ('children' in node ? node.children.reduce((count, child) => count + callouts(child), 0) : 0)
  const articles = Object.entries(pages).filter(([, page]) => /^docs\/\d{2}-[^/]+\/(?!README\.md)[^/]+\.md$/.test(page.source_path))
  expect(articles.length).toBeGreaterThan(0)
  for (const [routePath, page] of articles) {
    expect(page.freshness_systems?.map(system => system.id)).toEqual(report.systems.filter(system => system.articles.some(article => article.doc === page.source_path)).map(system => system.id))
    expect(page.freshness_systems?.length).toBeGreaterThan(0)
    const generated = readFileSync(new URL(`../../content/${routePath.slice('/docs/'.length)}.mdx`, import.meta.url), 'utf8')
    expect(page.todo_count).toBe(callouts(parser.parse(generated)))
  }
})

test('article confirmation records and TODO counts remain accessible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`http://127.0.0.1:4183${basePath}${route}`)
  await expect(page.locator('.doc-meta-freshness')).toHaveCount(metadata.freshness_systems?.length ?? 0)
  await expect(page.locator('.todo-callout')).toHaveCount(metadata.todo_count ?? 0)
  const link = page.getByRole('link', { name: `未確認事項: ${metadata.todo_count}件`, exact: true })
  await expect(link).toHaveAttribute('href', '#article-todo-1')
  await link.click()
  await expect(page.locator('#article-todo-1')).toBeInViewport()
  await expect(page.locator('.doc-meta-freshness').first()).toContainText('一次情報の確認記録:')
  const first = metadata.freshness_systems?.[0]
  if (!first) throw new Error('System membership is required')
  await page.locator('.doc-meta-freshness').first().getByRole('link').click()
  await expect(page.locator(`#system-${first.id}`)).toBeInViewport()
  await context.close()
})

for (const routePath of new Set([route, '/freshness', '/docs/architecture/workflow-vs-agent', '/docs/architecture/agent-api-design'])) {
  test(`confirmation metadata passes accessibility and inline-link distinction checks: ${routePath}`, async ({ page }) => {
    await page.goto(`${basePath}${routePath}`)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations).toEqual([])
    // withRules and withTags are mutually exclusive; keep both scans so neither scope is lost.
    const inlineLinks = await new AxeBuilder({ page }).withRules(['link-in-text-block']).analyze()
    expect(inlineLinks.violations).toEqual([])
  })
}
