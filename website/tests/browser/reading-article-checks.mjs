import { test, expect } from '@playwright/test'

export async function assertReadingLabelsFit(svg) {
  expect(await svg.evaluate(element => {
    const canvas = element.getBoundingClientRect()
    const fits = (r, b) => r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1
    return [...element.querySelectorAll('text')].flatMap(text => {
      const r = text.getBoundingClientRect()
      if (!r.width) return []
      if (!fits(r, canvas)) return [`canvas: ${text.textContent}`]
      const box = text.closest('.lf-box')?.querySelector('rect')
      return box && !fits(r, box.getBoundingClientRect()) ? [`box: ${text.textContent}`] : []
    })
  })).toEqual([])
}

export function checkReadingArticles({ name, chapter = 'concepts', articles, stages }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  for (const [route, ids] of articles) for (const [width, theme] of [[1440, 'light'], [390, 'dark']]) test(`${name}: ${route} ${width} ${theme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
    await page.addInitScript(theme => localStorage.setItem('theme', theme), theme)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/docs/${chapter}/${route}`, { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toBeVisible()
    for (const id of ids) {
      const figure = page.locator(`[data-diagram-id="${id}"]`)
      await figure.scrollIntoViewIfNeeded()
      await expect(figure).toHaveAttribute('data-ready', 'true')
      const svg = figure.locator('svg[data-agent-diagram]')
      for (const [index, stage] of stages[id].entries()) {
        await figure.getByRole('button', { name: stage.label, exact: true }).click()
        await expect(svg).toHaveAttribute('data-stage', String(index))
        await assertReadingLabelsFit(svg)
        for (const select of await figure.locator('select').all()) for (const value of await select.locator('option').evaluateAll(options => options.map(option => option.value))) {
          await select.selectOption(value)
          await assertReadingLabelsFit(svg)
        }
      }
      await figure.getByRole('button', { name: stages[id][0].label, exact: true }).click()
      await figure.getByRole('button', { name: '次の段階', exact: true }).click()
      await expect(svg).toHaveAttribute('data-stage', '1')
      await figure.getByRole('button', { name: '前の段階', exact: true }).click()
      await expect(svg).toHaveAttribute('data-stage', '0')
      await figure.getByRole('slider', { name: '図解の再生位置' }).focus()
      await page.keyboard.press('End')
      await expect(svg).toHaveAttribute('data-stage', String(stages[id].length - 1))
      await figure.getByRole('button', { name: '図を拡大', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await assertReadingLabelsFit(page.getByRole('dialog').locator('svg[data-agent-diagram]'))
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
}
