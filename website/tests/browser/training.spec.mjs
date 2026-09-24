import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = `${basePath}/docs/llm-foundations/llm-training-pipeline`
const headings = [...readFileSync(new URL('../../../docs/10-llm-foundations/llm-training-pipeline.md', import.meta.url), 'utf8').matchAll(/^### (.+)$/gm)].map(match => match[1].trim())
const items = [
  { id: 'training-stages', count: 6, attr: 'data-training-stage', steps: [0, 1, 2, 3, 4, 5], controlStage: 2, control: '確認する性質', choice: 'accuracy' },
  { id: 'training-runtime-boundary', count: 4, attr: 'data-training-runtime-stage', steps: [0, 2, 3], controlStage: 3, control: '確認する場所', choice: 'verification' }
]
const figure = (page, item) => page.locator(`.reading-figure[data-diagram-id="${item.id}"]`)
const panel = (page, item) => figure(page, item).locator('.aw-sticky > .aw-diagram')
async function open(page, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  expect((await page.goto(route)).status()).toBe(200)
  for (const item of items) await expect(figure(page, item)).toHaveAttribute('data-ready', 'true')
  const mermaid = page.locator('article [data-mermaid-renderer="strict"]')
  await mermaid.scrollIntoViewIfNeeded()
  await expect(mermaid.locator('svg .nodes').last()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}
async function seek(target, stage) {
  await target.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage).click()
  await expect(target).toHaveAttribute('data-stage', String(stage))
  await expect(target.getByRole('slider')).toHaveValue(String(stage))
}
async function phase(target, value) {
  await target.getByRole('slider').evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next))
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await expect(target).toHaveAttribute('data-stage', String(Math.round(value)))
}
async function scrollStep(page, item, stage, edge = 'top') {
  await figure(page, item).locator(`[data-reading-step="${stage}"]`).evaluate((node, edge) => {
    const rectangle = node.getBoundingClientRect(), line = Math.min(innerHeight * .4, 340)
    window.scrollTo({ top: scrollY + rectangle[edge] - line + 8, behavior: 'instant' })
  }, edge)
}
async function geometry(page, target) {
  const result = await target.locator('svg.aw-scene').evaluate(svg => {
    const inverse = svg.getScreenCTM().inverse(), view = svg.viewBox.baseVal
    const outside = [...svg.querySelectorAll('text')].filter(node => {
      for (let ancestor = node; ancestor && ancestor !== svg; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      const r = node.getBBox(), matrix = inverse.multiply(node.getScreenCTM())
      return [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
        .some(point => point.x < -1 || point.y < -1 || point.x > view.width + 1 || point.y > view.height + 1)
    }).map(node => node.textContent)
    return { outside, overflow: document.documentElement.scrollWidth - innerWidth }
  })
  expect(result.outside).toEqual([]); expect(result.overflow).toBeLessThanOrEqual(1)
  expect(await target.evaluate(element => {
    const panel = element.getBoundingClientRect()
    return [...element.querySelectorAll('button,input,select')].filter(control => {
      const r = control.getBoundingClientRect()
      return r.width && r.height && (r.left < panel.left - 1 || r.right > panel.right + 1)
    }).map(control => control.getAttribute('aria-label') || control.textContent)
  })).toEqual([])
}
test.describe('training article interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('learning changes weights while retrieval supplies context, without invented performance scores', async ({ page }) => {
    await open(page)
    const target = panel(page, items[0]), svg = target.locator('svg.aw-scene')
    for (const stage of [0, 1, 2, 3, 4, 5, 4, 2, 0]) {
      await seek(target, stage)
      await expect(svg).toHaveAttribute('data-model-id', 'training-model')
      await expect(svg).toHaveAttribute('data-training-target', 'weights')
      await expect(svg).toHaveAttribute('data-retrieval-target', 'runtime-context')
      await expect(svg).toHaveAttribute('data-numeric-performance', 'none')
      const weights = target.locator('[data-node-id="weights"] rect').first()
      expect(await weights.evaluate(node => ['x', 'y', 'width', 'height'].map(name => Number(node.getAttribute(name))))).toEqual([240, 186, 160, 98])
    }
    await seek(target, 0)
    expect(await target.locator('[data-data-kind]').evaluateAll(nodes => nodes.map(node => node.dataset.dataKind))).toEqual(['text', 'demonstration', 'preference'])
    for (const stage of [2, 4]) {
      await seek(target, stage)
      expect(await target.locator('[data-route-source]').evaluateAll(nodes => nodes.map(node => [node.dataset.routeSource, node.dataset.routeTarget, node.dataset.routeEffect]))).toEqual([
        ['additional-training', 'weights', 'parameter-update'], ['retrieval', 'runtime-context', 'context-input']
      ])
      await expect(target.locator('[data-node-id="runtime-context"]')).toHaveAttribute('data-weights-updated', 'false')
    }
    for (const [stage, label, choices, attribute, rows] of [
      [2, '確認する性質', ['coverage', 'accuracy', 'instruction'], 'data-knowledge-focus', '[data-knowledge-card]'],
      [4, '評価の観点', ['behavior', 'facts'], 'data-evaluation-focus', '[data-evaluation-row]']
    ]) {
      await seek(target, stage)
      const baseline = await target.locator(rows).allTextContents()
      expect(baseline).toHaveLength(choices.length)
      expect(baseline.every(text => text.trim().length > 0)).toBe(true)
      for (const choice of choices) {
        await target.getByRole('combobox', { name: label, exact: true }).selectOption(choice)
        await expect(svg).toHaveAttribute(attribute, choice)
        expect(await target.locator(rows).allTextContents()).toEqual(baseline)
        for (const row of await target.locator(rows).all()) await expect(row).toBeVisible()
        await expect(target.locator(`${rows}[data-emphasized="true"]`)).toHaveCount(1)
      }
      await seek(target, 0)
      await expect(svg).toHaveAttribute(attribute, 'none')
    }
  })
  test('all trait checks stay visible and the permission boundary remains outside the model', async ({ page }) => {
    await open(page)
    const target = panel(page, items[1]), svg = target.locator('svg.aw-scene')
    for (const stage of [0, 1, 2, 3, 2, 0]) {
      await seek(target, stage)
      await expect(svg).toHaveAttribute('data-permission-node', 'outside-model')
      await expect(svg).toHaveAttribute('data-output-route', 'model-candidate,permission-check,operation,result-verification')
      await expect(svg).toHaveAttribute('data-judgment', 'none')
    }
    await seek(target, 3)
    expect(await target.locator('[data-edge-source]').evaluateAll(nodes => nodes.map(node => [node.dataset.edgeSource, node.dataset.edgeTarget, node.dataset.edgeMeaning]))).toEqual([
      ['model-candidate', 'permission-check', 'candidate-only'],
      ['permission-check', 'operation', 'only-if-authorized'],
      ['operation', 'result-verification', 'check-result']
    ])
    expect(await target.locator('[data-boundary-node]').evaluateAll(nodes => nodes.map(node => [node.dataset.boundaryNode, node.dataset.nodeOwner]))).toEqual([
      ['model-candidate', 'model'], ['permission-check', 'outside-model'], ['operation', 'outside-model'], ['result-verification', 'outside-model']
    ])
    await expect(svg).toHaveAttribute('data-operation-executed', 'false')
    await seek(target, 2)
    await expect(svg).toHaveAttribute('data-trait-focus', 'hallucination')
    await expect(target.locator('[data-caveat="refusal-factors"]')).toBeVisible()
    await expect(target.locator('[data-caveat="refusal-factors"]')).toHaveText('SFT・選好・実行時制御も影響')
    for (const [stage, label, choices, attribute, rows] of [
      [2, '確認する性質', ['hallucination', 'sycophancy', 'refusal'], 'data-trait-focus', '[data-trait-row]'],
      [3, '確認する場所', ['instruction', 'permission', 'verification'], 'data-boundary-focus', '[data-boundary-node]']
    ]) {
      await seek(target, stage)
      const baseline = await target.locator(rows).allTextContents()
      expect(baseline.length).toBeGreaterThanOrEqual(3)
      for (const choice of choices) {
        await target.getByRole('combobox', { name: label, exact: true }).selectOption(choice)
        await expect(svg).toHaveAttribute(attribute, choice)
        expect(await target.locator(rows).allTextContents()).toEqual(baseline)
        for (const row of await target.locator(rows).all()) await expect(row).toBeVisible()
        await expect(target.locator(`${rows}[data-emphasized="true"]`)).toHaveCount(1)
      }
    }
  })
  test('source headings, original overview graph and one article navigation survive', async ({ page }) => {
    await open(page)
    const icon = page.locator('link[rel="icon"]')
    await expect(icon).toHaveAttribute('href', `${basePath}/favicon.svg`)
    await expect(icon).toHaveAttribute('type', 'image/svg+xml')
    const iconResponse = await page.request.get(`${basePath}/favicon.svg`)
    expect(iconResponse.status()).toBe(200)
    expect(iconResponse.headers()['content-type']).toContain('image/svg+xml')
    expect(await iconResponse.text()).toContain('<svg')
    await expect(page.locator('article h3')).toHaveText(headings)
    expect(headings).toHaveLength(8)
    await expect(page.locator('article .katex-display')).toHaveCount(0)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId))).toEqual(items.map(item => item.id))
    expect(await page.locator('article [data-mermaid-renderer="strict"]').evaluate(node => ({ diagram: node.closest('.reading-figure')?.dataset.diagramId, step: node.closest('[data-reading-step]')?.dataset.readingStep }))).toEqual({ diagram: 'training-stages', step: '0' })
    const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of items) expect(await figure(page, item).locator('[data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))).toEqual(item.steps)
  })
  for (const item of items) {
    test(`${item.id}: midpoint labels and reversible seeks agree with the scene`, async ({ page }) => {
      await open(page)
      const target = panel(page, item)
      for (let stage = 0; stage < item.count - 1; stage++) for (const offset of [.49, .5, .51, .49]) {
        const value = stage + offset
        await phase(target, value)
        await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(Math.round(value)))
        await expect(target.getByRole('slider')).toHaveAttribute('aria-valuetext', new RegExp(`^${Math.round(value) + 1} / ${item.count}、`))
      }
    })
    test(`${item.id}: keyboard and expanded controls share state and return focus`, async ({ page }) => {
      await open(page)
      const target = panel(page, item), slider = target.getByRole('slider')
      await slider.focus(); await page.keyboard.press('End')
      await expect(slider).toHaveValue(String(item.count - 1))
      await expect(target.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
      await page.keyboard.press('Home'); await expect(slider).toHaveValue('0')
      await seek(target, item.controlStage)
      const expand = target.getByRole('button', { name: '図を拡大', exact: true })
      await expand.focus(); await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      expect(await dialog.evaluate(node => node.matches(':modal'))).toBe(true)
      const expanded = dialog.locator('.aw-diagram')
      await expanded.getByRole('combobox', { name: item.control, exact: true }).selectOption(item.choice)
      await geometry(page, expanded)
      await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(expand).toBeFocused()
      await expect(target.getByRole('combobox', { name: item.control, exact: true })).toHaveValue(item.choice)
      const ids = await figure(page, item).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id))
      expect(new Set(ids).size).toBe(ids.length)
    })
    test(`${item.id}: reading sync yields to manual state and resumes in both directions`, async ({ page }) => {
      await open(page)
      const target = panel(page, item)
      for (const stage of item.steps) {
        await scrollStep(page, item, stage)
        await expect(target).toHaveAttribute('data-mode', 'reading')
        await expect(target).toHaveAttribute('data-stage', String(stage))
      }
      await seek(target, 0)
      const destination = item.steps.at(-1)
      await scrollStep(page, item, destination)
      await expect(target).toHaveAttribute('data-mode', 'manual'); await expect(target).toHaveAttribute('data-stage', '0')
      await target.getByRole('button', { name: '本文に連動する', exact: true }).click()
      await scrollStep(page, item, destination); await expect(target).toHaveAttribute('data-stage', String(destination))
      await scrollStep(page, item, item.steps[0]); await expect(target).toHaveAttribute('data-stage', String(item.steps[0]))
    })
    test(`${item.id}: playback advances, freezes, and restarts from the end`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.clock.install({ time: new Date('2026-09-24T00:00:00Z') })
      await open(page)
      const target = panel(page, item), slider = target.getByRole('slider')
      await seek(target, 0)
      await expect(target).toHaveAttribute('data-mode', 'manual')
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
      await target.getByRole('button', { name: '図解を再生', exact: true }).click()
      await page.clock.runFor(4500)
      await expect(target).toHaveAttribute('data-stage', '1')
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, '1')
      await target.getByRole('button', { name: '図解を一時停止', exact: true }).click()
      const stopped = await slider.inputValue()
      await page.clock.runFor(3000); await expect(slider).toHaveValue(stopped)
      await phase(target, item.count - 1)
      await target.getByRole('button', { name: '図解を最初から再生', exact: true }).click()
      await page.clock.runFor(100); await expect(target).toHaveAttribute('data-stage', '0')
      await page.clock.runFor((item.count - 1) * 4500)
      await expect(slider).toHaveValue(String(item.count - 1)); await expect(target).toHaveAttribute('data-mode', 'manual')
    })
  }
  test('two figures have isolated manual state and retain coherent scenes in print', async ({ page }) => {
    await open(page)
    for (const item of items) await phase(panel(page, item), 1.25)
    await seek(panel(page, items[0]), 5)
    for (const item of items.slice(1)) await expect(panel(page, item).getByRole('slider')).toHaveValue('1.25')
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    await page.emulateMedia({ media: 'print' })
    for (const item of items) {
      await expect(figure(page, item).locator('.aw-prose')).toBeVisible()
      await expect(panel(page, item).locator('svg.aw-scene')).toBeVisible()
      await expect(panel(page, item).locator('.aw-timeline')).toBeHidden()
      await expect(figure(page, item).locator('.aw-sticky')).toHaveCSS('position', 'static')
    }
    await expect(page.locator('article h3')).toHaveText(headings)
    await expect(page.locator('article .katex-display')).toHaveCount(0)
  })
})

async function seekForFit(target, stage) {
  const button = target.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage)
  if (stage === 0) {
    // Scrolling to another figure can update its reading stage and move its controls.
    await button.scrollIntoViewIfNeeded()
    await expect.poll(() => button.evaluate(async node => {
      const sample = () => {
        const rect = node.getBoundingClientRect()
        return {
          stage: node.closest('.aw-diagram').dataset.stage,
          scrollY,
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          inView: node.isConnected && rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth
        }
      }
      const initial = sample()
      if (!initial.inView) return false
      const key = JSON.stringify(initial)
      for (let frame = 0; frame < 3; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve))
        if (JSON.stringify(sample()) !== key) return false
      }
      return true
    }), { intervals: [50, 100, 100] }).toBe(true)
  }
  await button.click()
  await expect(target).toHaveAttribute('data-mode', 'manual')
  await expect(target).toHaveAttribute('data-stage', String(stage))
  await expect(target.getByRole('slider')).toHaveValue(String(stage))
}

for (const [width, height, theme] of [[1920, 1080, 'light'], [1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [768, 1024, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
  test(`all training states fit ${width}x${height} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, theme)
    for (const item of items) for (let stage = 0; stage < item.count; stage++) {
      const target = panel(page, item)
      await seekForFit(target, stage); await geometry(page, target)
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(stage))
    }
  })
}
test.describe('training without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('both figures retain original prose and static stage lists', async ({ page }) => {
    expect((await page.goto(route)).status()).toBe(200)
    await expect(page.locator('article h3')).toHaveText(headings)
    await expect(page.locator('article .katex-display')).toHaveCount(0)
    for (const item of items) {
      const root = figure(page, item), target = panel(page, item)
      await expect(root).toHaveAttribute('data-ready', 'false')
      await expect(root.locator('.aw-prose')).toBeVisible(); await expect(target.locator('svg.aw-scene')).toBeVisible()
      await expect(target.getByRole('slider')).toBeDisabled()
      await expect(root.getByText('動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。', { exact: true })).toBeVisible()
      await root.locator('.rf-static-stages summary').click()
      await expect(root.locator('.rf-static-stages li')).toHaveCount(item.count)
    }
  })
})
