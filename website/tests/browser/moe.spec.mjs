import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const path = `${basePath}/docs/llm-internals/mixture-of-experts-internals`
const diagrams = [
  { id: 'moe-routing-load', count: 8, steps: [0, 1, 2, 3, 4, 5, 7] },
  { id: 'moe-parameters-communication', count: 6, steps: [0, 1, 2, 5] }
]
const figure = (page, id) => page.locator(`.reading-figure[data-diagram-id="${id}"]`)
const inline = (page, id) => figure(page, id).locator('.aw-sticky > .aw-diagram')
async function open(page, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  expect((await page.goto(path)).status()).toBe(200)
  for (const item of diagrams) await expect(figure(page, item.id)).toHaveAttribute('data-ready', 'true')
  await page.locator('article [data-mermaid-renderer="strict"]').scrollIntoViewIfNeeded()
  await expect(page.locator('article [data-mermaid-renderer="strict"] svg')).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
}
async function seek(panel, stage) {
  await panel.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage).click()
  await expect(panel).toHaveAttribute('data-stage', String(stage))
  await expect(panel.getByRole('slider')).toHaveValue(String(stage))
}
async function phase(panel, value) {
  await panel.getByRole('slider').evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await expect(panel).toHaveAttribute('data-stage', String(Math.round(value)))
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
  expect(await panel.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return [...element.querySelectorAll('button,input,select')].filter(control => {
      const r = control.getBoundingClientRect()
      return r.width && r.height && (r.left < bounds.left - 1 || r.right > bounds.right + 1)
    }).map(control => control.getAttribute('aria-label') || control.textContent)
  })).toEqual([])
}

test.describe('MoE source and interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('nine headings, four equations, Mermaid and one TOC survive; specialization stays outside', async ({ page }) => {
    await open(page)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId))).toEqual(diagrams.map(item => item.id))
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await expect(page.locator('article h3')).toHaveCount(9)
    await expect(page.locator('article .katex-display')).toHaveCount(4)
    for (const item of diagrams) expect(await figure(page, item.id).locator('[data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))).toEqual(item.steps)
    expect(await page.locator('article h3').filter({ hasText: '専門化の実態' }).evaluate(element => element.closest('.reading-figure') === null)).toBe(true)
    const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
  test('selection changes keep original gates; capacity preserves accepted routes and one residual', async ({ page }) => {
    await open(page)
    const panel = inline(page, diagrams[0].id)
    await seek(panel, 1)
    const gates = await panel.locator('[data-gate-expert]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.gateWeight)))
    expect(gates.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10)
    await seek(panel, 2)
    expect(await panel.locator('[data-gate-expert]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.gateWeight)))).toEqual(gates)
    await seek(panel, 4)
    const tokenMask = await panel.locator('[data-batch-mask]').getAttribute('data-batch-mask')
    await panel.getByLabel('選ぶ方式', { exact: true }).selectOption('expert')
    await expect(panel.locator('[data-selection-choice]')).toHaveAttribute('data-selection-choice', 'expert')
    expect(await panel.locator('[data-batch-mask]').getAttribute('data-batch-mask')).not.toBe(tokenMask)
    const counts = await panel.locator('[data-batch-token]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.selectedCount)))
    expect(new Set(counts).size).toBeGreaterThan(1)
    await seek(panel, 5)
    await expect(panel.locator('[data-selection-choice]')).toHaveAttribute('data-selection-choice', 'token')
    const loads = await panel.locator('[data-load-counts]').getAttribute('data-load-counts')
    await seek(panel, 6)
    for (const [token, accepted, dropped] of [['0', '1,5', 0], ['1', '2', 1], ['2', '', 2]]) {
      await panel.getByLabel('同じバッチのトークン', { exact: true }).selectOption(token)
      await expect(panel.locator('[data-output-experts]')).toHaveAttribute('data-output-experts', accepted)
      await expect(panel.locator('[data-output-experts]')).toHaveAttribute('data-residual-count', '1')
      await expect(panel.locator('[data-stopped-route]')).toHaveCount(dropped)
      await expect(panel.locator('[data-residual-token]')).toHaveCount(1)
    }
    await seek(panel, 7)
    await expect(panel.locator('[data-load-counts]')).toHaveAttribute('data-load-counts', loads)
  })
  test('resident weights stay fixed while representations and results return to the same token', async ({ page }) => {
    await open(page)
    const panel = inline(page, diagrams[1].id)
    const positions = () => panel.locator('[data-expert-weight] > rect').evaluateAll(nodes => nodes.map(node => ['x', 'y', 'width', 'height'].map(name => node.getAttribute(name))))
    await seek(panel, 0)
    const initial = await positions()
    for (const placement of ['distributed', 'single']) {
      await seek(panel, 2)
      await panel.getByLabel('重みの配置', { exact: true }).selectOption(placement)
      for (const [stage, payload] of [[3, 'representation'], [4, 'expert-output']]) {
        await seek(panel, stage)
        expect(await positions()).toEqual(initial)
        await expect(panel.locator('[data-expert-weight][data-resident="true"]')).toHaveCount(8)
        await expect(panel.locator('[data-expert-weight][data-selected="true"]')).toHaveCount(2)
        await expect(panel.locator(`[data-payload="${payload}"][data-token-id="A"]`)).toHaveCount(2)
        await expect(panel.locator('[data-token-sum="A"]')).toHaveAttribute('data-gate-applications', '1')
        await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-cross-device-transfers', placement === 'single' ? '0' : '1')
        await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-transferred-weights', '0')
      }
    }
    await seek(panel, 5)
    for (const target of ['resident', 'active', 'communication', 'load']) {
      await panel.getByLabel('確認する対象', { exact: true }).selectOption(target)
      await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-parameters-check', target)
      await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-quality-judgment', 'none')
    }
    expect(await panel.locator('[data-load-count]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.loadCount)))).toEqual([0, 4, 1, 0, 0, 3, 0, 0])
  })
  test('fractional forward and reverse seeks keep scene and heading on the same stage', async ({ page }) => {
    await open(page)
    const routing = inline(page, diagrams[0].id), parameters = inline(page, diagrams[1].id)
    await seek(routing, 0)
    for (const value of [3.49, 3.6, 4.49, 4.6, 5.6, 6.6, 5.6, 4.6, 3.6]) {
      await phase(routing, value)
      await expect(routing.locator('svg.aw-scene')).toHaveAttribute('data-routing-stage', String(Math.round(value)))
    }
    await seek(parameters, 0)
    for (const value of [2.49, 2.6, 3.49, 3.6, 4.49, 4.6, 3.6, 2.6]) {
      await phase(parameters, value)
      await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-parameters-stage', String(Math.round(value)))
      await expect(parameters.locator('svg.aw-scene')).toHaveAttribute('data-transfer-direction', Math.round(value) === 3 ? 'dispatch' : Math.round(value) === 4 ? 'return' : 'none')
    }
    await parameters.getByRole('button', { name: '図を拡大', exact: true }).click()
    const dialog = figure(page, diagrams[1].id).getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('svg.aw-scene')).toHaveAttribute('data-parameters-stage', '3')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(parameters.getByRole('button', { name: '図を拡大', exact: true })).toBeFocused()
    await parameters.getByRole('slider').focus()
    await page.keyboard.press('End')
    await expect(parameters).toHaveAttribute('data-stage', '5')
    await page.keyboard.press('Home')
    await expect(parameters).toHaveAttribute('data-stage', '0')
  })
  test('each figure restores paragraph sync without changing the other manual state', async ({ page }) => {
    await open(page)
    for (const item of diagrams) {
      const panel = inline(page, item.id)
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
      await seek(panel, 0)
    }
    for (const item of diagrams) {
      const panel = inline(page, item.id), other = inline(page, diagrams.find(next => next.id !== item.id).id)
      const before = await other.getByRole('slider').inputValue()
      await seek(panel, item.count - 1)
      expect(await other.getByRole('slider').inputValue()).toBe(before)
      await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
      for (const stage of item.steps) {
        await figure(page, item.id).locator(`[data-reading-step="${stage}"]`).evaluate(element => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
        await expect(panel).toHaveAttribute('data-stage', String(stage))
      }
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
    }
  })
})

for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
  test(`all MoE states fit ${width}x${height} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await open(page, theme)
    for (const item of diagrams) {
      const panel = inline(page, item.id)
      for (let stage = 0; stage < item.count; stage++) { await seek(panel, stage); await layout(page, panel) }
      const sync = panel.getByRole('button', { name: '本文に連動する', exact: true })
      await sync.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(sync).toBeInViewport({ ratio: 1 })
      if (height === 720) await expect(figure(page, item.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
    }
    expect(errors).toEqual([])
  })
}

test('no JavaScript retains stage lists; print keeps static scenes and the original article', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })
  try {
    const page = await context.newPage()
    await page.goto(path)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await expect(page.locator('article h3')).toHaveCount(9)
    await expect(page.locator('article .katex-display')).toHaveCount(4)
    for (const item of diagrams) {
      await expect(figure(page, item.id).locator('svg.aw-scene')).toBeVisible()
      await expect(inline(page, item.id).getByRole('slider')).toBeDisabled()
      await figure(page, item.id).locator('.rf-static-stages summary').click()
      await expect(figure(page, item.id).locator('.rf-static-stages ol > li')).toHaveCount(item.count)
    }
    await page.emulateMedia({ media: 'print' })
    for (const item of diagrams) {
      await expect(figure(page, item.id).locator('.aw-prose')).toBeVisible()
      await expect(inline(page, item.id).locator('.aw-timeline')).not.toBeVisible()
      await expect(inline(page, item.id).locator('svg.aw-scene')).toBeVisible()
      await expect(figure(page, item.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
    }
  } finally { await context.close() }
})
