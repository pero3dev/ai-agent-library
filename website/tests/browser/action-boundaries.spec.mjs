import { test, expect } from '@playwright/test'
import { ACTION_BOUNDARY_STAGES } from '../../lib/action-boundaries-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'
checkReadingArticles({ name:'action boundaries and recovery', chapter:'architecture', stages:ACTION_BOUNDARY_STAGES, sceneSelector:'svg[data-action-diagram]', articles:[
  ['orchestration-patterns',['orchestration-basics','orchestration-composition']],
  ['human-in-the-loop',['human-intervention-positions','human-approval-lifecycle']],
  ['error-handling-and-retries',['error-layer-routing','retry-and-recovery-boundaries']]
] })
test('approval is explicit and retry contracts cannot bypass a stop condition', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/human-in-the-loop`)
  const approval = page.locator('[data-diagram-id="human-approval-lifecycle"]')
  await approval.getByRole('button',{name:'応答と期限',exact:true}).click()
  for (const status of ['approved','denied','timeout','waiting']) {
    await approval.getByLabel('人の応答状態').selectOption(status)
    await expect(approval.locator('[data-approval-execute]')).toHaveAttribute('data-approval-execute',String(status === 'approved'))
  }
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/error-handling-and-retries`)
  const retry = page.locator('[data-diagram-id="retry-and-recovery-boundaries"]')
  await retry.getByRole('button',{name:'上限と反復',exact:true}).click()
  await retry.getByLabel('副作用の再試行契約').selectOption('idempotent')
  for (const limit of ['remaining','exhausted','repeated']) {
    await retry.getByLabel('再試行の停止条件').selectOption(limit)
    await expect(retry.locator('[data-automatic-retry]')).toHaveAttribute('data-automatic-retry',String(limit === 'remaining'))
  }
  await retry.getByLabel('再試行の停止条件').selectOption('remaining')
  await retry.getByLabel('副作用の再試行契約').selectOption('unknown')
  await expect(retry.locator('[data-automatic-retry]')).toHaveAttribute('data-automatic-retry','false')
})
test('three architecture articles keep their source without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({javaScriptEnabled:false,baseURL:'http://127.0.0.1:4183'})
  try {
    const page = await context.newPage()
    for (const [route,phrase] of [['orchestration-patterns','詳細: 外部エージェント連携の概観'],['human-in-the-loop','詳細: 実装上の要点'],['error-handling-and-retries','詳細: リトライ設計の 3 つの注意点']]) {
      await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/${route}`)
      await expect(page.locator('article h3').filter({hasText:phrase})).toBeVisible()
    }
  } finally { await context.close() }
})
test('control remains readable on a low PC screen and in print', async ({ page }) => {
  await page.setViewportSize({width:1280,height:720})
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/architecture/human-in-the-loop`)
  const figure = page.locator('[data-diagram-id="human-intervention-positions"]')
  await figure.getByRole('button',{name:'実行の手前',exact:true}).click()
  await figure.getByRole('button',{name:'図解を再生',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','playing')
  await figure.getByRole('button',{name:'図解を一時停止',exact:true}).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode','manual')
  await page.emulateMedia({media:'print'})
  await expect(figure.locator('svg[data-action-diagram]')).toBeVisible()
  await expect(figure.locator('.aw-prose')).toContainText('事前承認')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true)
})
