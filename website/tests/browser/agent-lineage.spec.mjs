import { test, expect } from '@playwright/test'
import { AGENT_LINEAGE_STAGES } from '../../lib/agent-lineage-model.mjs'
import { checkReadingArticles } from './reading-article-checks.mjs'

checkReadingArticles({ name: 'agent lineage', stages: AGENT_LINEAGE_STAGES, articles: [
  ['ai-history-and-lineage', ['ai-design-lineage']],
  ['world-models-overview', ['world-model-usages', 'world-model-evidence']],
  ['physical-ai-overview', ['physical-ai-boundaries', 'physical-ai-evidence']]
] })

test('agent lineage: paused history can play and return to reading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docs/concepts/ai-history-and-lineage`)
  const figure = page.locator('[data-diagram-id="ai-design-lineage"]')
  await figure.scrollIntoViewIfNeeded()
  await expect(figure).toHaveAttribute('data-ready', 'true')
  await figure.getByRole('button', { name: '賢さの源', exact: true }).click()
  await figure.getByRole('button', { name: '図解を再生', exact: true }).click()
  await expect(figure.getByRole('slider')).not.toHaveValue('0')
  await figure.getByRole('button', { name: '図解を一時停止', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'manual')
  await figure.getByRole('button', { name: '本文に連動する', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'reading')
})
