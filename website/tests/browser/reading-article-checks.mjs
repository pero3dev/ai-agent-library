import { test, expect } from '@playwright/test'

export async function assertReadingLabelsFit(svg) {
  expect(await svg.evaluate(element => {
    const canvas = element.getBoundingClientRect()
    const fits = (r, b) => r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1
    const luminance = color => {
      const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number)
      if (!channels || channels.length !== 3) return null
      return channels.map(channel => channel / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0)
    }
    return [...element.querySelectorAll('text')].flatMap(text => {
      const r = text.getBoundingClientRect()
      if (!r.width) return []
      if (!fits(r, canvas)) return [`canvas: ${text.textContent}`]
      const box = text.closest('.lf-box')?.querySelector('rect')
      const foreground = luminance(getComputedStyle(text).fill)
      // Reading diagrams use a dark canvas; boxes retain their own dark fill.
      const background = box ? luminance(getComputedStyle(box).fill) : luminance('rgb(11, 23, 39)')
      if (foreground !== null && background !== null
        && (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) < 4.5) return [`contrast: ${text.textContent}`]
      return box && !fits(r, box.getBoundingClientRect()) ? [`box: ${text.textContent}`] : []
    })
  })).toEqual([])
}

export function checkReadingArticles({ name, chapter = 'concepts', articles, stages, sceneSelector = 'svg[data-agent-diagram]' }) {
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
      const svg = figure.locator(sceneSelector)
      for (const [index, stage] of stages[id].entries()) {
        await figure.getByRole('button', { name: stage.label, exact: true }).click()
        await expect(figure).toHaveAttribute('data-current-stage', String(index))
        await assertReadingLabelsFit(svg)
        for (const select of await figure.locator('select:visible').all()) for (const value of await select.locator('option').evaluateAll(options => options.map(option => option.value))) {
          await select.selectOption(value)
          await assertReadingLabelsFit(svg)
        }
      }
      await figure.getByRole('button', { name: stages[id][0].label, exact: true }).click()
      await figure.getByRole('button', { name: '次の段階', exact: true }).click()
      await expect(figure).toHaveAttribute('data-current-stage', '1')
      await figure.getByRole('button', { name: '前の段階', exact: true }).click()
      await expect(figure).toHaveAttribute('data-current-stage', '0')
      await figure.getByRole('slider', { name: '図解の再生位置' }).focus()
      await page.keyboard.press('End')
      await expect(figure).toHaveAttribute('data-current-stage', String(stages[id].length - 1))
      await figure.getByRole('button', { name: '図を拡大', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await assertReadingLabelsFit(page.getByRole('dialog').locator(sceneSelector))
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
