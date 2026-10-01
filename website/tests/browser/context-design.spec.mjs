import { test, expect } from '@playwright/test'
import { CONTEXT_DESIGN_STAGES } from '../../lib/context-design-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'

checkReadingArticles({ name: 'context design and boundaries', chapter: 'architecture', stages: CONTEXT_DESIGN_STAGES, sceneSelector: 'svg[data-context-diagram]', articles: [
  ['context-engineering', ['context-input-design', 'context-cycle-retrieval']],
  ['context-engineering-patterns', ['context-layout-budget', 'context-information-design']],
  ['context-compaction-and-isolation', ['context-compaction-design', 'context-trust-restart']]
] })
test('data validation does not grant parent approval and missing retained fields are reported', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/context-compaction-and-isolation`)
  const trust = page.locator('[data-diagram-id="context-trust-restart"]')
  await trust.getByRole('button', { name: '戻り値と権限', exact: true }).click()
  for (const mode of ['permitted', 'waiting', 'invalid']) {
    await trust.getByLabel('戻り値検証と親の承認').selectOption(mode)
    await expect(trust.locator('[data-context-execute]')).toHaveAttribute('data-context-execute', String(mode === 'permitted'))
  }
  const retain = page.locator('[data-diagram-id="context-compaction-design"]')
  await retain.getByRole('button', { name: '保持情報', exact: true }).click()
  await retain.getByLabel('圧縮で抜けた情報').selectOption('constraints')
  await expect(retain.locator('[data-context-retention-matched]')).toHaveAttribute('data-context-retention-matched', 'false')
  await expect(retain.locator('svg[data-context-diagram]')).toContainText('不足を原資料で確認')
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/context-engineering-patterns`)
  const budget = page.locator('[data-diagram-id="context-layout-budget"]')
  await budget.getByRole('button', { name: '出力枠を確保', exact: true }).click()
  await expect(budget.locator('[data-context-output-reserve="true"]')).toBeVisible()
  await budget.getByRole('button', { name: '超過時の縮退', exact: true }).click()
  await budget.getByLabel('縮退後の予算状態').selectOption('overflow')
  await expect(budget.locator('[data-context-budget-stop]')).toHaveAttribute('data-context-budget-stop', 'true')
})
test('three architecture sources remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: 'http://127.0.0.1:4183' })
  try {
    const page = await context.newPage()
    for (const [route, phrase] of [['context-engineering','詳細: 4 つの設計原則'], ['context-engineering-patterns','計測と改善: 効いているセクションを見つける'], ['context-compaction-and-isolation','思考ブロックと会話履歴の結び付き']]) {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/${route}`)
      await expect(page.locator('article h3').filter({ hasText: phrase })).toBeVisible()
    }
  } finally { await context.close() }
})
test('context controls remain usable on a low PC screen and retain a print scene', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/context-engineering`)
  const figure = page.locator('[data-diagram-id="context-input-design"]')
  await figure.scrollIntoViewIfNeeded()
  await figure.getByRole('button', { name: '構成を設計', exact: true }).click()
  await figure.getByRole('button', { name: '図解を再生', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'playing')
  await figure.getByRole('button', { name: '図解を一時停止', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'manual')
  await page.emulateMedia({ media: 'print' })
  await expect(figure.locator('svg[data-context-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('システムプロンプト')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
