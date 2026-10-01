import { test, expect } from '@playwright/test'
import { SCREEN_LOOP_STAGES } from '../../lib/screen-loop-model.mjs'
import { WORKFLOW_STAGES } from '../../lib/workflow-comparison-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'

checkReadingArticles({ name: 'screen and loop', stages: SCREEN_LOOP_STAGES, articles: [
  ['computer-use-and-multimodal-agents', ['screen-observation', 'screen-boundaries']],
  ['agent-loop', ['loop-stop-reasons', 'loop-runtime']]
] })
checkReadingArticles({ name: 'workflow completion', chapter: 'architecture', stages: { 'workflow-comparison': WORKFLOW_STAGES },
  articles: [['workflow-vs-agent', ['workflow-comparison']]], sceneSelector: 'svg.aw-scene' })

test('screen approvals do not execute while waiting or denied; truncated output remains incomplete', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/concepts/computer-use-and-multimodal-agents`)
  const boundary = page.locator('[data-diagram-id="screen-boundaries"]')
  await boundary.scrollIntoViewIfNeeded()
  await boundary.getByRole('button', { name: '承認の境界', exact: true }).click()
  for (const status of ['approved', 'waiting', 'denied']) {
    await boundary.getByLabel('不可逆操作の承認').selectOption(status)
    await expect(boundary.locator('[data-screen-execute]')).toHaveAttribute('data-screen-execute', String(status === 'approved'))
  }
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/concepts/agent-loop`)
  const stop = page.locator('[data-diagram-id="loop-stop-reasons"]')
  await stop.scrollIntoViewIfNeeded()
  await stop.getByRole('button', { name: '応答の判定', exact: true }).click()
  for (const reason of ['complete', 'truncated', 'refused', 'continue']) {
    await stop.getByLabel('モデル応答の停止理由').selectOption(reason)
    await expect(stop.locator('[data-loop-complete]')).toHaveAttribute('data-loop-complete', String(reason === 'complete'))
    await expect(stop.locator('[data-loop-execute]')).toHaveAttribute('data-loop-execute', 'false')
  }
})
