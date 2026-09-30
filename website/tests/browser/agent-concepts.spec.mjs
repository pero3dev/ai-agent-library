import { test, expect } from '@playwright/test'
import { AGENT_CONCEPT_STAGES } from '../../lib/agent-concepts-model.mjs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const articles = [
  ['what-is-an-ai-agent', ['agent-components', 'agent-autonomy']],
  ['tool-use', ['tool-execution', 'tool-contract']],
  ['memory-and-state', ['memory-layers', 'memory-lifecycle']]
]
async function textFits(svg) {
  expect(await svg.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return [...element.querySelectorAll('text')].filter(text => {
      const r = text.getBoundingClientRect()
      return r.width > 0 && (r.left < bounds.left - 1 || r.right > bounds.right + 1 || r.top < bounds.top - 1 || r.bottom > bounds.bottom + 1)
    }).map(text => text.textContent)
  })).toEqual([])
}

for (const [route, ids] of articles) for (const [width, theme] of [[1440, 'light'], [390, 'dark']]) test(`agent concepts: ${route} ${width} ${theme}`, async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
  await page.addInitScript(theme => localStorage.setItem('theme', theme), theme)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/docs/concepts/${route}`, { waitUntil: 'networkidle' })
  await expect(page.locator('h1')).toBeVisible()
  for (const id of ids) {
    const figure = page.locator(`[data-diagram-id="${id}"]`)
    await figure.scrollIntoViewIfNeeded()
    await expect(figure).toHaveAttribute('data-ready', 'true')
    const svg = figure.locator('svg[data-agent-diagram]')
    for (const [index, stage] of AGENT_CONCEPT_STAGES[id].entries()) {
      await figure.getByRole('button', { name: stage.label, exact: true }).click()
      await expect(svg).toHaveAttribute('data-stage', String(index))
      await textFits(svg)
      if (id === 'tool-execution' && index >= 2) await figure.getByLabel('アプリの検証').selectOption('allow')
      for (const select of await figure.locator('select').all()) {
        for (const value of await select.locator('option').evaluateAll(options => options.map(option => option.value))) {
          await select.selectOption(value)
          await textFits(svg)
          if (id === 'tool-execution' && index >= 3 && await figure.getByLabel('アプリの検証').inputValue() === 'deny') {
            await expect(svg.locator('[data-tool-message="3"]')).toHaveAttribute('data-delivered', 'false')
          }
        }
        if (id === 'tool-execution' && await select.getAttribute('aria-label') === 'アプリの検証') await select.selectOption('allow')
      }
    }
    await figure.getByRole('button', { name: AGENT_CONCEPT_STAGES[id][0].label, exact: true }).click()
    await figure.getByRole('button', { name: '次の段階', exact: true }).click()
    await expect(svg).toHaveAttribute('data-stage', '1')
    await figure.getByRole('button', { name: '前の段階', exact: true }).click()
    await expect(svg).toHaveAttribute('data-stage', '0')
    await figure.getByRole('slider', { name: '図解の再生位置' }).focus()
    await page.keyboard.press('End')
    await expect(svg).toHaveAttribute('data-stage', String(AGENT_CONCEPT_STAGES[id].length - 1))
    await figure.getByRole('button', { name: '図を拡大', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await textFits(page.getByRole('dialog').locator('svg[data-agent-diagram]'))
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    if (width === 1440) await svg.screenshot({ path: testInfo.outputPath(`${id}.png`) })
    await figure.getByRole('button', { name: '本文に連動する', exact: true }).click()
    const step = figure.locator('[data-reading-step]').last()
    const expectedStage = await step.getAttribute('data-reading-step')
    await step.evaluate(element => window.scrollBy({ top: element.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
    await expect(figure).toHaveAttribute('data-current-stage', expectedStage)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})

test('agent concepts: playback can start, advance and pause without losing manual control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${base}/docs/concepts/tool-use`)
  const figure = page.locator('[data-diagram-id="tool-execution"]')
  await figure.scrollIntoViewIfNeeded()
  await expect(figure).toHaveAttribute('data-ready', 'true')
  await figure.getByRole('button', { name: '定義を渡す', exact: true }).click()
  await figure.getByRole('button', { name: '図解を再生', exact: true }).click()
  await expect(figure.getByRole('slider')).not.toHaveValue('0')
  await figure.getByRole('button', { name: '図解を一時停止', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'manual')
  await figure.getByRole('button', { name: '実行前の検証', exact: true }).click()
  await expect(figure).toHaveAttribute('data-current-stage', '2')
})
