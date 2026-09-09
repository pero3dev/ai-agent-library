import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = value => `${basePath}${value}`

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
  // fitView can move the node after its initial layout. Re-enter after that movement.
  await expect(async () => {
    await page.mouse.move(0, 0)
    await concepts.hover()
    await expect(graph.locator('.dep-panel-title')).toHaveText('01. 基礎概念', { timeout: 500 })
  }).toPass({ timeout: 10_000 })
  await concepts.click()
  await expect(page).toHaveURL(/\/docs\/concepts(?:\.html)?$/)
})

for (const [pathname, headings] of [
  ['/docs/concepts/agent-loop', ['概要: ループが Agent を作る']],
  ['/docs/concepts/rag-vs-agent', ['詳細: 検索を使う 3 つの構成と検索なしの選択肢']],
  ['/docs/implementation/computer-use-implementation', ['概要: 実装は「脆さと実害」への対処が中心']],
  ['/docs/implementation/prompt-engineering-patterns', ['構造化の詳解: 配置には 3 つの力学がある']],
  ['/docs/implementation/rag-implementation-patterns', ['概要: RAG は 4 段のパイプライン']],
  ['/docs/business/own-model-strategy', ['概要: 「持つ」は 0/1 ではなく段階', '見落としやすい継続費用: 追従コスト']],
  ['/docs/llm-foundations/llm-training-pipeline', ['概要: 3 つの工程と、それぞれが残す「癖」']],
  ['/docs/human-ai/verifying-ai-outputs', ['概要: もっともらしさは正しさではない']]
]) {
  test(`changed Mermaid diagrams render without an error: ${pathname}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('mermaid')) errors.push(message.text())
    })
    await page.goto(route(pathname))
    // Nextra renders Mermaid lazily when the diagram enters the viewport.
    const diagrams = page.locator('article svg[aria-roledescription^="flowchart"]')
    for (const [index, heading] of headings.entries()) {
      await page.getByRole('heading', { name: heading }).scrollIntoViewIfNeeded()
      await expect(diagrams.nth(index)).toBeVisible()
    }
    await expect(diagrams).toHaveCount(headings.length)
    await expect(page.locator('article')).not.toContainText('Syntax error in text')
    expect(errors).toEqual([])
  })
}

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
