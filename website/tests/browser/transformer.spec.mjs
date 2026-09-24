import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const path = `${basePath}/docs/llm-internals/transformer-architecture`
const diagrams = [
  { id: 'transformer-io', labels: ['全体', '埋込', '出力', '共有'], steps: [0, 1, 2, 3] },
  { id: 'transformer-position', labels: ['絶対', '相対', 'RoPE', '位置差'], steps: [0, 2, 3] },
  { id: 'self-attention', steps: [0, 1, 2, 3, 4] },
  { id: 'transformer-block', labels: ['射影', '連結', 'FFN', 'ゲート', '残差', 'RMS', '配置', '1層', '全体'], steps: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
]
const figure = (page, id) => page.locator(`.reading-figure[data-diagram-id="${id}"]`)
const inline = (page, id) => figure(page, id).locator('.aw-sticky > .aw-diagram')

async function open(page, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(path)
  expect(response.status()).toBe(200)
  for (const item of diagrams) await expect(figure(page, item.id)).toHaveAttribute('data-ready', 'true')
  await page.evaluate(() => document.fonts.ready)
  for (const chart of await page.locator('article [data-mermaid-renderer="strict"]').all()) {
    await chart.scrollIntoViewIfNeeded()
    await expect(chart.locator('svg .nodes').last()).toBeVisible()
  }
}

async function seek(panel, stage) {
  const button = panel.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage)
  await button.click()
  await expect(panel).toHaveAttribute('data-stage', String(stage))
  await expect(panel.getByRole('slider')).toHaveValue(String(stage))
}

async function layout(page, panel) {
  const result = await panel.locator('svg.aw-scene').evaluate(svg => {
    const inverse = svg.getScreenCTM().inverse(), view = svg.viewBox.baseVal
    const outside = [...svg.querySelectorAll('text')].filter(element => {
      for (let node = element; node && node !== svg; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      const r = element.getBBox(), matrix = inverse.multiply(element.getScreenCTM())
      return [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
        .some(point => point.x < -1 || point.y < -1 || point.x > view.width + 1 || point.y > view.height + 1)
    }).map(element => element.textContent)
    return { outside, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  })
  expect(result.outside).toEqual([])
  expect(result.overflow).toBeLessThanOrEqual(1)
  const controlsOutside = await panel.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return [...element.querySelectorAll('button,input,select')].filter(control => {
      const r = control.getBoundingClientRect()
      return r.width && r.height && (r.left < bounds.left - 1 || r.right > bounds.right + 1)
    }).map(control => control.getAttribute('aria-label') || control.textContent)
  })
  expect(controlsOutside).toEqual([])
}

test.describe('Transformer article with four independent figures', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })

  test('source order, eleven headings, 21 reading blocks and one article TOC remain intact', async ({ page }) => {
    await open(page)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId)))
      .toEqual(diagrams.map(item => item.id))
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await expect(page.locator('article h3')).toHaveCount(11)
    const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of diagrams) {
      const steps = await figure(page, item.id).locator('.aw-prose [data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))
      expect(steps).toEqual(item.steps)
    }
    await expect(page.locator('article .katex-display')).toHaveCount(12)
  })

  test('seeking a figure does not alter other manual figures; each restores its own reading position', async ({ page }) => {
    await open(page)
    for (const item of diagrams) {
      const panel = inline(page, item.id)
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
      await seek(panel, 0)
    }
    for (const item of diagrams.filter(item => item.id !== 'self-attention')) {
      const panel = inline(page, item.id)
      const before = await Promise.all(diagrams.filter(other => other.id !== item.id).map(other => inline(page, other.id).getByRole('slider').inputValue()))
      await seek(panel, item.labels.length - 1)
      const after = await Promise.all(diagrams.filter(other => other.id !== item.id).map(other => inline(page, other.id).getByRole('slider').inputValue()))
      expect(after).toEqual(before)
      await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
      for (const stage of item.steps) {
        await figure(page, item.id).locator(`[data-reading-step="${stage}"]`).evaluate(element => {
          const line = Math.min(innerHeight * .4, 340)
          window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - line + 8, behavior: 'instant' })
        })
        await expect(panel).toHaveAttribute('data-stage', String(stage))
      }
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
    }
  })

  test('head selection follows its concatenated output, and norm/weight selectors keep their meaning', async ({ page }) => {
    await open(page)
    const panel = inline(page, 'transformer-block')
    await seek(panel, 1)
    for (const head of ['1', 'h', 'i']) {
      await panel.getByLabel('注目するヘッド').selectOption(head)
      await expect(panel.locator('[data-concat-head][data-selected="true"]')).toHaveAttribute('data-concat-head', head)
      await expect(panel.locator('svg desc')).toContainText(`head ${head}`)
    }
    await seek(panel, 3)
    await expect(panel.locator('[data-weight-inventory]')).toHaveAttribute('data-weight-inventory', 'swiglu')
    await seek(panel, 6)
    await panel.getByLabel('Normの配置').selectOption('post')
    await expect(panel.locator('[data-norm-placement]')).toHaveAttribute('data-norm-placement', 'post')
    await seek(panel, 7)
    await expect(panel.locator('[data-weight-inventory]')).toHaveAttribute('data-weight-inventory', 'basic')
    await expect(panel.locator('[data-norm-placement]')).toHaveAttribute('data-norm-placement', 'pre')
    await seek(panel, 8)
    await panel.getByLabel('重みの共有', { exact: true }).selectOption('untied')
    await expect(panel.locator('.aw-formula')).toContainText('2Vd')
    await expect(panel.locator('svg desc')).toContainText('共有なし')
    await panel.getByRole('button', { name: '図を拡大', exact: true }).click()
    const dialog = figure(page, 'transformer-block').getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('重みの共有', { exact: true })).toHaveValue('untied')
    await dialog.getByRole('button', { name: '拡大図を閉じる' }).click()
    await expect(dialog).not.toBeVisible()
    await expect(panel.getByRole('button', { name: '図を拡大', exact: true })).toBeFocused()
  })

  test('weight sharing and position comparisons update symbols without changing their source meaning', async ({ page }) => {
    await open(page)
    const io = inline(page, 'transformer-io')
    await seek(io, 3)
    await io.getByLabel('重みの共有', { exact: true }).selectOption('untied')
    await expect(io.locator('svg.aw-scene')).toHaveAttribute('data-io-tying', 'untied')
    await expect(io.locator('.aw-formula')).toHaveText('E ∈ ℝⱽˣᵈ / W_U ∈ ℝᵈˣⱽ')
    await expect(io.locator('.aw-detail')).toContainText('同じ値・同じパラメータではありません')
    await expect(io.locator('[data-weight="output"] [data-cell-identity]').first()).toHaveAttribute('data-cell-identity', /^W_U\[/)
    await io.getByLabel('重みの共有', { exact: true }).selectOption('tied')
    await expect(io.locator('[data-weight="output"] [data-cell-identity]').first()).toHaveAttribute('data-cell-identity', /^E\[/)
    const position = inline(page, 'transformer-position')
    await seek(position, 3)
    await position.getByLabel('位置の比較').selectOption('shift-together')
    await expect(position.locator('[data-pair="q"]')).toHaveAttribute('data-position', 'm + Δ')
    await expect(position.locator('[data-pair="k"]')).toHaveAttribute('data-position', 'n + Δ')
    await expect(position.locator('svg.aw-scene')).toHaveAttribute('data-value-rotated', 'false')
    await position.getByLabel('位置の比較').selectOption('change-gap')
    await expect(position.locator('[data-pair="q"]')).toHaveAttribute('data-position', 'm + Δ')
    await expect(position.locator('[data-pair="k"]')).toHaveAttribute('data-position', 'n')
    await seek(position, 2)
    await expect(position.locator('svg.aw-scene')).toHaveAttribute('data-position-comparison', 'base')
    await expect(position.locator('[data-pair="q"]')).toHaveAttribute('data-position', 'm')
  })
})

for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
  test(`all new Transformer states fit ${width}x${height} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await open(page, theme)
    for (const item of diagrams.filter(item => item.id !== 'self-attention')) {
      const panel = inline(page, item.id)
      for (let stage = 0; stage < item.labels.length; stage++) {
        await seek(panel, stage)
        await layout(page, panel)
      }
      const sync = panel.getByRole('button', { name: '本文に連動する', exact: true })
      await sync.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
      await expect(sync).toBeInViewport({ ratio: 1 })
      if (height === 720) await expect(figure(page, item.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
    }
    expect(errors).toEqual([])
  })
}

test('all four static figures and source math remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })
  try {
    const page = await context.newPage()
    await page.goto(path)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await page.locator('.rf-article-toc summary').click()
    await expect(page.locator('.rf-article-toc ol')).toBeVisible()
    for (const item of diagrams) {
      await expect(figure(page, item.id).locator('svg.aw-scene')).toBeVisible()
      await expect(inline(page, item.id).getByRole('slider')).toBeDisabled()
      await figure(page, item.id).locator('.rf-static-stages summary').click()
      await expect(figure(page, item.id).locator('.rf-static-stages ol')).toBeVisible()
    }
    await expect(page.locator('article h3')).toHaveCount(11)
    await expect(page.locator('article .katex-display')).toHaveCount(12)
  } finally { await context.close() }
})
