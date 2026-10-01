import { test, expect } from '@playwright/test'
import { AGENT_DESIGN_STAGES } from '../../lib/agent-design-model.mjs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const articles = [
  ['planning-and-reasoning', ['planning-patterns', 'planning-maintenance']],
  ['rag-vs-agent', ['retrieval-paths', 'retrieval-choice']],
  ['single-vs-multi-agent', ['delegation-boundaries', 'delegation-patterns']]
]
async function labelsFit(svg) {
  expect(await svg.evaluate(element => {
    const canvas = element.getBoundingClientRect()
    const fits = (r, bounds) => r.left >= bounds.left - 1 && r.right <= bounds.right + 1 && r.top >= bounds.top - 1 && r.bottom <= bounds.bottom + 1
    return [...element.querySelectorAll('text')].flatMap(text => {
      const r = text.getBoundingClientRect()
      if (!r.width) return []
      if (!fits(r, canvas)) return [`canvas: ${text.textContent}`]
      const box = text.closest('.lf-box')?.querySelector('rect')
      if (box && !fits(r, box.getBoundingClientRect())) return [`box: ${text.textContent}`]
      return []
    })
  })).toEqual([])
}

for (const [route, ids] of articles) for (const [width, theme] of [[1440, 'light'], [390, 'dark']]) test(`agent design: ${route} ${width} ${theme}`, async ({ page }) => {
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
    for (const [index, stage] of AGENT_DESIGN_STAGES[id].entries()) {
      await figure.getByRole('button', { name: stage.label, exact: true }).click()
      await expect(svg).toHaveAttribute('data-stage', String(index))
      await labelsFit(svg)
      for (const select of await figure.locator('select').all()) for (const value of await select.locator('option').evaluateAll(options => options.map(option => option.value))) {
        await select.selectOption(value)
        await labelsFit(svg)
        if (id === 'delegation-boundaries' && index === 4) await expect(svg.locator('[data-delegated-execution]')).toHaveAttribute('data-delegated-execution', String(value === 'approved'))
      }
    }
    await figure.getByRole('button', { name: AGENT_DESIGN_STAGES[id][0].label, exact: true }).click()
    await figure.getByRole('button', { name: '次の段階', exact: true }).click()
    await expect(svg).toHaveAttribute('data-stage', '1')
    await figure.getByRole('button', { name: '前の段階', exact: true }).click()
    await expect(svg).toHaveAttribute('data-stage', '0')
    await figure.getByRole('slider', { name: '図解の再生位置' }).focus()
    await page.keyboard.press('End')
    await expect(svg).toHaveAttribute('data-stage', String(AGENT_DESIGN_STAGES[id].length - 1))
    await figure.getByRole('button', { name: '図を拡大', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await labelsFit(page.getByRole('dialog').locator('svg[data-agent-diagram]'))
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await figure.getByRole('button', { name: '本文に連動する', exact: true }).click()
    const step = figure.locator('[data-reading-step]').last()
    const expected = await step.getAttribute('data-reading-step')
    await step.evaluate(element => window.scrollBy({ top: element.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
    await expect(figure).toHaveAttribute('data-current-stage', expected)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})

test('agent design: playback advances, pauses, and can return to reading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${base}/docs/concepts/planning-and-reasoning`)
  const figure = page.locator('[data-diagram-id="planning-patterns"]')
  await figure.scrollIntoViewIfNeeded()
  await expect(figure).toHaveAttribute('data-ready', 'true')
  await figure.getByRole('button', { name: '構造と判断', exact: true }).click()
  await figure.getByRole('button', { name: '図解を再生', exact: true }).click()
  await expect(figure.getByRole('slider')).not.toHaveValue('0')
  await figure.getByRole('button', { name: '図解を一時停止', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'manual')
  await figure.getByRole('button', { name: '本文に連動する', exact: true }).click()
  await expect(figure.locator('.aw-diagram')).toHaveAttribute('data-mode', 'reading')
})

test('short labels stay inside the corrected autonomy, contract and memory cells', async ({ page }) => {
  for (const [route, id, label] of [['what-is-an-ai-agent', 'agent-autonomy', '固定手順'], ['tool-use', 'tool-contract', '三つの要素'], ['memory-and-state', 'memory-lifecycle', '刈り込み']]) {
    await page.goto(`${base}/docs/concepts/${route}`, { waitUntil: 'networkidle' })
    const figure = page.locator(`[data-diagram-id="${id}"]`)
    await figure.scrollIntoViewIfNeeded()
    await expect(figure).toHaveAttribute('data-ready', 'true')
    await figure.getByRole('button', { name: label, exact: true }).click()
    await labelsFit(figure.locator('svg[data-agent-diagram]'))
    expect(await figure.locator('[data-token-row] text').evaluateAll(texts => texts.filter(text => {
      const textBounds = text.getBoundingClientRect(), rectBounds = text.parentElement.parentElement.querySelector('rect').getBoundingClientRect()
      return textBounds.left < rectBounds.left || textBounds.right > rectBounds.right
    }).map(text => text.textContent))).toEqual([])
  }
})
