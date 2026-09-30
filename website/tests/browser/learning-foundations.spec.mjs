import { test, expect } from '@playwright/test'
import { LEARNING_STAGES } from '../../lib/learning-foundations-model.mjs'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const articles = [
  ['llm-foundations/attention-and-context', ['context-causal-cost', 'context-cache-quality']],
  ['llm-internals/in-context-learning-and-memorization', ['icl-hypotheses', 'icl-demonstrations', 'icl-memory-evaluation']],
  ['llm-internals/interpretability-basics', ['interpretability-evidence', 'interpretability-sae']],
  ['llm-foundations/capabilities-and-limits', ['capabilities-assessment']],
  ['llm-foundations/multimodal-models', ['multimodal-representation', 'multimodal-input-tradeoffs']]
]
for (const [route, figures] of articles) for (const [width, theme] of [[1440, 'light'], [390, 'dark']]) test(`reading foundations: ${route} ${width} ${theme}`, async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
  await page.addInitScript(theme => localStorage.setItem('theme', theme), theme)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/docs/${route}`, { waitUntil: 'networkidle' })
  await expect(page.locator('h1')).toBeVisible()
  for (const id of figures) {
    const figure = page.locator(`[data-diagram-id="${id}"]`)
    await figure.scrollIntoViewIfNeeded()
    await expect(figure).toHaveAttribute('data-ready', 'true')
    for (const [index, stage] of LEARNING_STAGES[id].entries()) {
      await figure.getByRole('button', { name: stage.label, exact: true }).click()
      const svg = figure.locator('svg[data-learning-diagram]')
      await expect(svg).toHaveAttribute('data-stage', String(index))
      await expect(svg).toBeVisible()
      // Text must remain within the SVG, regardless of stage or narrow viewport.
      expect(await svg.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        return [...element.querySelectorAll('text')].filter(text => {
          const r = text.getBoundingClientRect()
          return r.width > 0 && (r.left < bounds.left - 2 || r.right > bounds.right + 2 || r.top < bounds.top - 2 || r.bottom > bounds.bottom + 2)
        }).map(text => text.textContent)
      })).toEqual([])
      for (const select of await figure.locator('select').all()) {
        for (const option of await select.locator('option').evaluateAll(options => options.map(option => option.value))) await select.selectOption(option)
      }
      if (width === 1440 && index === 2) await svg.screenshot({ path: testInfo.outputPath(`${id}-stage2.png`) })
    }
    await figure.getByRole('button', { name: '図を拡大', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await figure.getByRole('button', { name: LEARNING_STAGES[id][0].label, exact: true }).click()
    await figure.locator('svg[data-learning-diagram]').screenshot({ path: testInfo.outputPath(`${id}-${width}.png`) })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
