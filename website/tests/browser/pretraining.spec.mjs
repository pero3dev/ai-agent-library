import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = `${basePath}/docs/llm-internals/pretraining-and-scaling-laws`
const headings = [...readFileSync(new URL('../../../docs/11-llm-internals/pretraining-and-scaling-laws.md', import.meta.url), 'utf8').matchAll(/^### (.+)$/gm)].map(match => match[1].trim())
const items = [
  {
    "id": "pretraining-loss-perplexity",
    "count": 5,
    "attr": "data-pretraining-loss-stage",
    "steps": [
      0,
      1,
      2,
      3,
      4
    ],
    "controlStage": 2,
    "control": "説明用の確率",
    "choice": "B"
  },
  {
    "id": "pretraining-scaling",
    "count": 6,
    "attr": "data-pretraining-scaling-stage",
    "steps": [
      0,
      1,
      3,
      4,
      5
    ],
    "controlStage": 3,
    "control": "予算を増やす説明例",
    "choice": "4"
  },
  {
    "id": "pretraining-data",
    "count": 4,
    "attr": "data-pretraining-data-stage",
    "steps": [
      0,
      2,
      3
    ],
    "controlStage": 2,
    "control": "確認するデータ観点",
    "choice": "reuse"
  },
  {
    "id": "pretraining-metrics",
    "count": 4,
    "attr": "data-pretraining-metrics-stage",
    "steps": [
      0,
      2,
      3
    ],
    "controlStage": 2,
    "control": "二値化の閾値",
    "choice": "70"
  },
  {
    "id": "pretraining-compute",
    "count": 4,
    "attr": "data-pretraining-compute-stage",
    "steps": [
      0,
      1,
      3
    ],
    "controlStage": 1,
    "control": "Nの基準比",
    "choice": "2"
  }
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
async function seek(target, stage) { await seekForFit(target, stage) }
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
test.describe('pretraining article interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('loss uses each conditional probability, then averages logarithms before exponentiating', async ({ page }) => {
    await open(page)
    const target = panel(page, items[0]), svg = target.locator('svg.aw-scene')
    for (const [example, probabilities, loss, ppl] of [
      ['A', [.5, .25, .125], Math.log(4), 4], ['B', [.5, .5, .5], Math.log(2), 2]
    ]) {
      await seek(target, 1)
      await target.getByRole('combobox', { name: '説明用の確率', exact: true }).selectOption(example)
      const rows = await svg.locator('[data-eval-id]').evaluateAll(nodes => nodes.map(node => ({
        id: node.dataset.evalId, prefix: node.dataset.prefix, target: node.dataset.target,
        p: Number(node.dataset.probability), loss: Number(node.dataset.loss),
        row: [...node.querySelectorAll('[data-row-probability]')].map(cell => Number(cell.dataset.rowProbability))
      })))
      expect(rows.map(row => [row.id, row.prefix, row.target])).toEqual([
        ['eval-0', '', 'A'], ['eval-1', 'A', 'B'], ['eval-2', 'A,B', 'C']
      ])
      rows.forEach((row, i) => {
        expect(row.p).toBe(probabilities[i]); expect(row.loss).toBeCloseTo(-Math.log(probabilities[i]), 12)
        expect(row.row.reduce((sum, value) => sum + value, 0)).toBe(1)
      })
      await seek(target, 3)
      expect(Number(await svg.locator('[data-aggregate-loss]').getAttribute('data-aggregate-loss'))).toBeCloseTo(loss, 12)
      expect(Number(await svg.locator('[data-aggregate-ppl]').getAttribute('data-aggregate-ppl'))).toBeCloseTo(ppl, 12)
      await expect(svg.locator('[data-aggregate-ppl]')).toHaveText(String(ppl))
      await expect(svg.locator('[data-caveat="not-arithmetic"]')).toContainText('算術平均の逆数とは異なる')
    }
    await seek(target, 4)
    for (const condition of ['same', 'different-tokenizer', 'different-data']) {
      await target.getByRole('combobox', { name: '比較する条件', exact: true }).selectOption(condition)
      await expect(svg).toHaveAttribute('data-comparison-allowed', String(condition === 'same'))
      expect(await svg.locator('[data-comparison-example]').evaluateAll(nodes => nodes.map(node => [node.dataset.comparisonExample, Number(node.dataset.ppl)]))).toEqual([['A', 4], ['B', 2]])
      await expect(svg.locator('[data-comparison-example="A"]')).toContainText('元の説明例の値')
      await expect(svg.locator('[data-caveat="ability"]')).toContainText('下流能力の判定ではない')
    }
  })
  test('scaling keeps fixed allocation distinct from growing compute and leaves coefficients symbolic', async ({ page }) => {
    await open(page)
    const target = panel(page, items[1]), svg = target.locator('svg.aw-scene')
    await seek(target, 1)
    await expect(svg.locator('[data-residual-identity]')).toHaveAttribute('data-residual-identity', 'R(rN)/R(N) = r^(-alpha)')
    await expect(svg.locator('[data-total-loss-ratio]')).toHaveAttribute('data-total-loss-ratio', '(Linf + R*r^(-alpha))/(Linf + R)')
    await seek(target, 2)
    const allocations = [[.5, 2, 1], [1, 1, 1], [2, .5, 1]]
    for (const choice of ['data-heavy', 'reference', 'parameter-heavy']) {
      await target.getByRole('combobox', { name: '同じ予算の配分', exact: true }).selectOption(choice)
      expect(await svg.locator('[data-allocation-id]').evaluateAll(nodes => nodes.map(n => [n.dataset.nRatio, n.dataset.dRatio, n.dataset.cRatio].map(Number)))).toEqual(allocations)
      await expect(svg.locator(`[data-allocation-id="${choice}"]`)).toHaveAttribute('data-emphasized', 'true')
    }
    await seek(target, 3)
    await expect(svg.locator('[data-lineage-node="Kaplan"]')).toContainText('初期の N 重視')
    for (const r of [1, 2, 4]) {
      await target.getByRole('combobox', { name: '予算を増やす説明例', exact: true }).selectOption(String(r))
      expect(await svg.locator('[data-budget-kind]').evaluateAll(nodes => nodes.map(n => [n.dataset.budgetKind, Number(n.dataset.nRatio), Number(n.dataset.dRatio), Number(n.dataset.cRatio)]))).toEqual([
        ['fixed', 2, .5, 1], ['growing', r, r, r * r]
      ])
    }
    await seek(target, 5)
    for (const choice of ['data', 'architecture', 'tokenizer']) {
      await target.getByRole('combobox', { name: '係数に関わる条件', exact: true }).selectOption(choice)
      await expect(svg.locator('[data-coefficient-condition]')).toHaveCount(3)
      await expect(svg.locator(`[data-coefficient-condition="${choice}"]`)).toHaveAttribute('data-emphasized', 'true')
    }
  })
  test('data reuse increases processed occurrences while preserving source identities', async ({ page }) => {
    await open(page)
    const target = panel(page, items[2]), svg = target.locator('svg.aw-scene')
    await seek(target, 1)
    await expect(svg).toHaveAttribute('data-read-count', '6')
    await expect(svg).toHaveAttribute('data-source-document-count', '4')
    await expect(svg).toHaveAttribute('data-processed-token-occurrences', '12')
    await expect(svg).toHaveAttribute('data-source-token-positions', '8')
    await expect(svg).toHaveAttribute('data-unique-vocabulary-count', 'unknown')
    expect(await svg.locator('[data-data-read]').evaluateAll(nodes => nodes.map(n => n.dataset.documentId))).toEqual(['A', 'B', 'C', 'D', 'A', 'B'])
    expect(await svg.locator('[data-source-position]').evaluateAll(nodes => nodes.map(n => n.dataset.sourcePosition))).toEqual(['A0', 'A1', 'B0', 'B1', 'C0', 'C1', 'D0', 'D1'])
    await expect(svg.locator('[data-processing-occurrence]')).toHaveCount(12)
    await seek(target, 2)
    for (const choice of ['quality', 'mixture', 'reuse', 'contamination']) {
      await target.getByRole('combobox', { name: '確認するデータ観点', exact: true }).selectOption(choice)
      await expect(svg.locator('[data-data-aspect]')).toHaveCount(4)
      for (const row of await svg.locator('[data-data-aspect]').all()) await expect(row).toBeVisible()
      await expect(svg.locator(`[data-data-aspect="${choice}"]`)).toHaveAttribute('data-emphasized', 'true')
      await expect(svg).toHaveAttribute('data-learning-effect', 'unknown')
    }
  })
  test('metric threshold changes only the binary view of the same six inputs', async ({ page }) => {
    await open(page)
    const target = panel(page, items[3]), svg = target.locator('svg.aw-scene')
    await seek(target, 2)
    let positions
    for (const threshold of [50, 60, 70]) {
      await target.getByRole('combobox', { name: '二値化の閾値', exact: true }).selectOption(String(threshold))
      for (const view of ['continuous', 'binary']) {
        const points = await svg.locator(`[data-metric-view="${view}"] [data-metric-point]`).evaluateAll(nodes => nodes.map(n => ({
          id: n.dataset.metricPoint, score: Number(n.dataset.scoreNumerator), index: Number(n.dataset.pointIndex),
          x: Number(n.dataset.pointX), binary: Number(n.dataset.binaryValue)
        })))
        expect(points.map(p => p.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
        expect(points.map(p => p.score)).toEqual([30, 40, 50, 60, 70, 80])
        expect(points.map(p => p.binary)).toEqual([30, 40, 50, 60, 70, 80].map(score => Number(score >= threshold)))
        const nextPositions = points.map(p => [p.index, p.x])
        if (positions) expect(nextPositions).toEqual(positions)
        positions = nextPositions
      }
      await expect(svg).toHaveAttribute('data-empirical-measurement', 'false')
      await expect(svg).toHaveAttribute('data-emergence-judgment', 'none')
    }
    for (const stage of [0, 1, 3]) {
      await seek(target, stage)
      await expect(svg).toHaveAttribute('data-score-threshold', '60')
    }
  })
  test('compute uses a product of ratios and never estimates unknown real costs', async ({ page }) => {
    await open(page)
    const target = panel(page, items[4]), svg = target.locator('svg.aw-scene')
    await seek(target, 1)
    for (const n of [1, 2]) for (const d of [1, 2]) {
      await target.getByRole('combobox', { name: 'Nの基準比', exact: true }).selectOption(String(n))
      await target.getByRole('combobox', { name: 'Dの基準比', exact: true }).selectOption(String(d))
      await expect(svg.locator('[data-ratio-product]')).toHaveAttribute('data-c-ratio', String(n * d))
      await expect(svg.locator('[data-compute-cell]')).toHaveCount(n * d)
      await expect(svg.locator('[data-compute-ratio-label]')).toHaveText(`C/C₀ = ${n * d}`)
    }
    await seek(target, 2)
    for (const choice of ['data-heavy', 'reference', 'parameter-heavy']) {
      await target.getByRole('combobox', { name: '同じ予算の配分', exact: true }).selectOption(choice)
      expect(await svg.locator('[data-allocation-id]').evaluateAll(nodes => nodes.map(n => [n.dataset.nRatio, n.dataset.dRatio, n.dataset.cRatio].map(Number)))).toEqual([[.5, 2, 1], [1, 1, 1], [2, .5, 1]])
    }
    await seek(target, 3)
    for (const choice of ['duration', 'price', 'energy']) {
      await target.getByRole('combobox', { name: '実測が必要な項目', exact: true }).selectOption(choice)
      expect(await svg.locator('[data-budget-kind]').evaluateAll(nodes => nodes.map(n => [n.dataset.nRatio, n.dataset.dRatio, n.dataset.cRatio].map(Number)))).toEqual([[2, .5, 1], [2, 2, 4]])
      expect(await svg.locator('[data-real-cost]').evaluateAll(nodes => nodes.map(n => n.dataset.value))).toEqual(['unknown', 'unknown', 'unknown'])
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
    expect(headings).toHaveLength(9)
    await expect(page.locator('article .katex-display')).toHaveCount(4)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId))).toEqual(items.map(item => item.id))
    expect(await page.locator('article [data-mermaid-renderer="strict"]').evaluate(node => ({ diagram: node.closest('.reading-figure')?.dataset.diagramId, step: node.closest('[data-reading-step]')?.dataset.readingStep }))).toEqual({ diagram: 'pretraining-scaling', step: '4' })
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
  test('five figures have isolated manual state and retain coherent scenes in print', async ({ page }) => {
    await open(page)
    for (const item of items) await phase(panel(page, item), 1.25)
    await seek(panel(page, items[0]), 4)
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
    await expect(page.locator('article .katex-display')).toHaveCount(4)
  })
})

async function seekForFit(target, stage) {
  const button = target.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage)
  // Scrolling to another figure can update its reading stage and move its controls.
  await button.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
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
  await button.click()
  await expect(target).toHaveAttribute('data-mode', 'manual')
  await expect(target).toHaveAttribute('data-stage', String(stage))
  await expect(target.getByRole('slider')).toHaveValue(String(stage))
}

for (const [width, height, theme] of [[1920, 1080, 'light'], [1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [768, 1024, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
  test(`all pretraining states fit ${width}x${height} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, theme)
    for (const item of items) for (let stage = 0; stage < item.count; stage++) {
      const target = panel(page, item)
      await seekForFit(target, stage); await geometry(page, target)
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(stage))
    }
  })
}
test.describe('pretraining on a scaled low-height PC viewport', () => {
  test.use({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  test('every stage and control stays within the scene and page width', async ({ page }) => {
    await open(page)
    for (const item of items) for (let stage = 0; stage < item.count; stage++) {
      const target = panel(page, item)
      await seekForFit(target, stage); await geometry(page, target)
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(stage))
    }
  })
})

test.describe('pretraining without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('all five figures retain original prose and static stage lists', async ({ page }) => {
    expect((await page.goto(route)).status()).toBe(200)
    await expect(page.locator('article h3')).toHaveText(headings)
    await expect(page.locator('article .katex-display')).toHaveCount(4)
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
