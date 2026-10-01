import { test, expect } from '@playwright/test'
import { OVERVIEW_STAGES } from '../../lib/overview-reading-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'

checkReadingArticles({ name: 'overview learning and evidence', chapter: 'overview', stages: OVERVIEW_STAGES, sceneSelector: 'svg[data-overview-diagram]', articles: [
  ['learning-roadmap', ['learning-section-map', 'learning-practice-loop']],
  ['skill-map', ['skill-development']],
  ['research-literacy', ['information-evidence', 'information-maintenance']]
] })
test('role switch changes learning goals and claim switch retains forecast conditions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/overview/skill-map`)
  const skills = page.locator('[data-diagram-id="skill-development"]')
  await skills.getByRole('button', { name: '役割の重点', exact: true }).click()
  await skills.getByLabel('学習の役割像').selectOption('operations')
  await expect(skills.locator('[data-skill-target="専門"]')).toHaveCount(2)
  const roleTable = skills.locator('.aw-prose table').filter({ has: page.locator('th', { hasText: 'Agent エンジニア' }) })
  expect((await roleTable.locator('tbody tr').first().locator('td').first().boundingBox()).width).toBeGreaterThan(100)
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/overview/research-literacy`)
  const evidence = page.locator('[data-diagram-id="information-evidence"]')
  await evidence.getByRole('button', { name: '主張の条件', exact: true }).click()
  await evidence.getByLabel('確かめる主張の種類').selectOption('forecast')
  await expect(evidence.locator('svg[data-overview-diagram]')).toContainText('前提・確率')
  await expect(evidence.locator('svg[data-overview-diagram]')).toContainText('検証方法')
})

test('low PC screen supports playback, pause and readable print without changing the prose', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/overview/research-literacy`)
  const figure = page.locator('[data-diagram-id="information-evidence"]')
  await figure.scrollIntoViewIfNeeded()
  await figure.getByRole('button', { name: '追う対象を絞る', exact: true }).click()
  await figure.getByRole('button', { name: '図解を再生', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'playing')
  await figure.getByRole('button', { name: '図解を一時停止', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'manual')
  await page.emulateMedia({ media: 'print' })
  await expect(figure.locator('svg[data-overview-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('第三者の再現実験も、その測定結果については一次情報です')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
test('all overview articles retain readable source sections with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: 'http://127.0.0.1:4183' })
  try {
    const page = await context.newPage()
    for (const [route, heading] of [['learning-roadmap', '学習の進め方の指針'], ['skill-map', '実践で伸ばす方法(社内題材の選び方)'], ['research-literacy', 'この理解が効く場面']]) {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/overview/${route}`)
      await expect(page.locator('article h3').filter({ hasText: heading })).toBeVisible()
      await expect(page.locator('article')).toContainText('実務での注意点')
    }
  } finally { await context.close() }
})
