import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const path = `${basePath}/docs/llm-internals/attention-variants-and-long-context`
const diagrams = [
  { id: 'attention-kv-sharing', count: 5, steps: [0, 1, 4] },
  { id: 'attention-compute-memory', count: 6, steps: [0, 1, 2, 3, 4, 5] },
  { id: 'attention-context-range', count: 4, steps: [0, 2] }
]
const figure = (page, id) => page.locator(`.reading-figure[data-diagram-id="${id}"]`)
const inline = (page, id) => figure(page, id).locator('.aw-sticky > .aw-diagram')
async function open(page, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  expect((await page.goto(path)).status()).toBe(200)
  for (const item of diagrams) await expect(figure(page, item.id)).toHaveAttribute('data-ready', 'true')
  await page.evaluate(() => document.fonts.ready)
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

test.describe('attention variants source and interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('eleven headings, three equations and one TOC survive; SSM remains outside the figures', async ({ page }) => {
    await open(page)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId))).toEqual(diagrams.map(item => item.id))
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await expect(page.locator('article h3')).toHaveCount(11)
    await expect(page.locator('article .katex-display')).toHaveCount(3)
    for (const item of diagrams) expect(await figure(page, item.id).locator('[data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))).toEqual(item.steps)
    const ssm = page.locator('article h3').filter({ hasText: 'Transformer を離れる: 状態空間モデル' })
    expect(await ssm.evaluate(element => element.closest('.reading-figure') === null)).toBe(true)
    const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
  test('each figure restores its own paragraph and leaves other manual states untouched', async ({ page }) => {
    await open(page)
    for (const item of diagrams) {
      const panel = inline(page, item.id)
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
      await seek(panel, 0)
    }
    for (const item of diagrams) {
      const panel = inline(page, item.id), others = diagrams.filter(other => other.id !== item.id)
      const before = await Promise.all(others.map(other => inline(page, other.id).getByRole('slider').inputValue()))
      await seek(panel, item.count - 1)
      expect(await Promise.all(others.map(other => inline(page, other.id).getByRole('slider').inputValue()))).toEqual(before)
      await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
      for (const stage of item.steps) {
        await figure(page, item.id).locator(`[data-reading-step="${stage}"]`).evaluate(element => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }))
        await expect(panel).toHaveAttribute('data-stage', String(stage))
      }
      await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
    }
  })
  test('sparse reachability, numerator regrouping and Flash row carry stay distinct', async ({ page }) => {
    await open(page)
    const panel = inline(page, 'attention-compute-memory')
    await seek(panel, 0)
    await panel.getByLabel('層数', { exact: true }).selectOption('2')
    await expect(panel.locator('[data-reachable="true"]')).toHaveCount(5)
    await panel.getByLabel('接続パターン', { exact: true }).selectOption('sink')
    await expect(panel.locator('[data-query="7"][data-key="0"]')).toHaveAttribute('data-connected', 'true')
    await expect(panel.locator('svg desc')).toContainText('先頭保持、2層')
    await seek(panel, 1)
    await expect(panel.locator('[data-pair-mode]')).toHaveCount(0)
    await expect(panel.locator('[data-product-scope]')).toHaveAttribute('data-product-scope', 'unnormalized-noncausal')
    await expect(panel.locator('svg.aw-scene')).toContainText('正規化・因果制約は省略')
    await seek(panel, 2)
    await expect(panel.locator('[data-intermediate]')).toHaveAttribute('data-intermediate', 'feature-by-value')
    await seek(panel, 4)
    await expect(panel.locator('[data-pair-mode]')).toHaveAttribute('data-pair-mode', 'dense-causal')
    await expect(panel.locator('[data-row-carry]')).toHaveAttribute('data-row-carry', 'true')
    await panel.getByRole('button', { name: '図を拡大', exact: true }).click()
    const dialog = figure(page, 'attention-compute-memory').getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('[data-row-carry]')).toHaveAttribute('data-row-carry', 'true')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(panel.getByRole('button', { name: '図を拡大', exact: true })).toBeFocused()
  })
  test('KV comparisons keep four Q heads and context interpolation preserves token identity', async ({ page }) => {
    await open(page)
    const kv = inline(page, 'attention-kv-sharing')
    await seek(kv, 4)
    for (const [mode, heads, ratio] of [['mha', 4, 1], ['gqa', 2, .5], ['mqa', 1, .25]]) {
      await kv.getByLabel('KVの共有', { exact: true }).selectOption(mode)
      await expect(kv.locator('svg.aw-scene')).toHaveAttribute('data-kv-heads', String(heads))
      await expect(kv.locator('svg.aw-scene')).toHaveAttribute('data-cache-ratio', String(ratio))
      await expect(kv.locator('[data-query-head]')).toHaveCount(4)
    }
    const context = inline(page, 'attention-context-range')
    await seek(context, 1)
    const before = await context.locator('[data-token-id]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.tokenId, input: node.dataset.inputPosition, assigned: Number(node.dataset.assignedPosition) })))
    await seek(context, 2)
    const after = await context.locator('[data-token-id]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.tokenId, input: node.dataset.inputPosition, assigned: Number(node.dataset.assignedPosition) })))
    expect(after.map(({ id, input }) => ({ id, input }))).toEqual(before.map(({ id, input }) => ({ id, input })))
    expect(after.map(item => item.assigned)).toEqual(before.map(item => item.assigned * .5))
    await seek(context, 3)
    for (const value of ['training', 'quality', 'cost']) {
      await context.getByLabel('確認する対象', { exact: true }).selectOption(value)
      await expect(context.locator('svg.aw-scene')).toHaveAttribute('data-context-check', value)
      await expect(context.locator('svg.aw-scene')).toHaveAttribute('data-quality-judgment', 'none')
    }
  })
  test('fractional seeks preserve semantic labels and reverse position mapping', async ({ page }) => {
    await open(page)
    const compute = inline(page, 'attention-compute-memory'), context = inline(page, 'attention-context-range')
    for (const panel of [compute, context]) await seek(panel, 0)
    const setPhase = async (panel, phase) => {
      await panel.getByRole('slider').evaluate((input, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(value))
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, phase)
      await expect(panel).toHaveAttribute('data-stage', String(Math.round(phase)))
    }
    for (const phase of [1.6, 2.6, 3.6, 4.49, 2.6, 1.6]) {
      await setPhase(compute, phase)
      if (Math.round(phase) === 2) await expect(compute.locator('[data-product-order]')).toHaveAttribute('data-product-order', 'kv-first')
      else await expect(compute.locator('[data-pair-mode]')).toHaveAttribute('data-pair-mode', 'dense-causal')
    }
    for (const phase of [1.2, 1.6, 2, 1.6, 1.2]) {
      await setPhase(context, phase)
      await expect(context.locator('svg.aw-scene')).toHaveAttribute('data-interpolation', String(Math.max(0, Math.min(1, (phase - 1.5) * 2))))
    }
  })
})

for (const [width, height, theme] of [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
  test(`all attention variant states fit ${width}x${height} ${theme}`, async ({ page }) => {
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

test('no JavaScript retains stage lists; print keeps three static scenes and original formulas', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })
  try {
    const page = await context.newPage()
    await page.goto(path)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    await expect(page.locator('article h3')).toHaveCount(11)
    await expect(page.locator('article .katex-display')).toHaveCount(3)
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
