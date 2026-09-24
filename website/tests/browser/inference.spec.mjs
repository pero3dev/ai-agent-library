import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const route = `${basePath}/docs/llm-internals/inference-internals`
const headings = [...readFileSync(new URL('../../../docs/11-llm-internals/inference-internals.md', import.meta.url), 'utf8').matchAll(/^### (.+)$/gm)].map(match => match[1].trim())
const items = [
  { id: 'inference-sampling', count: 7, attr: 'data-inference-sampling-stage', steps: [0, 1, 3, 6], controlStage: 3, control: '温度・選択', choice: '2' },
  { id: 'inference-cache-batching', count: 6, attr: 'data-inference-cache-stage', steps: [1, 2, 3, 4, 5], controlStage: 4, control: '処理枠の使い方', choice: 'ordinary' },
  { id: 'inference-speculative', count: 6, attr: 'data-speculative-stage', steps: [0, 2, 4, 5], controlStage: 5, control: '確認する方式', choice: 'greedy' },
  { id: 'inference-quantization', count: 4, attr: 'data-inference-quantization-stage', steps: [0, 2, 3], controlStage: 2, control: '通常部分のbit数', choice: '4' }
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
test.describe('inference article interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('sampling filters preserve normalized probabilities and distinguish greedy from confidence', async ({ page }) => {
    test.setTimeout(90_000)
    await open(page)
    const target = panel(page, items[0])
    await seek(target, 5)
    for (const [temperature, expectedA] of [['0.5', 8 / 15], ['1', .4]]) {
      await target.getByLabel('温度・選択', { exact: true }).selectOption(temperature)
      expect(Number(await target.locator('[data-candidate-label="A"]').getAttribute('data-probability'))).toBeCloseTo(expectedA, 10)
    }
    await target.getByLabel('候補制限の方式', { exact: true }).selectOption('top-k')
    await target.getByLabel('残す候補数', { exact: true }).selectOption('1')
    await target.getByLabel('候補制限の方式', { exact: true }).selectOption('top-p')
    await target.getByLabel('累積確率の閾値', { exact: true }).selectOption('0.8')
    expect(await target.locator('[data-candidate-id][data-kept="true"]').evaluateAll(nodes => nodes.map(node => node.dataset.candidateLabel))).toEqual(['A', 'B', 'C'])
    await target.getByLabel('候補制限の方式', { exact: true }).selectOption('top-k')
    await expect(target.locator('[data-candidate-id][data-kept="true"]')).toHaveCount(1)
    for (const temperature of ['0.5', '1', '2']) {
      await target.getByLabel('温度・選択', { exact: true }).selectOption(temperature)
      for (const method of ['top-k', 'top-p']) {
        await target.getByLabel('候補制限の方式', { exact: true }).selectOption(method)
        for (const threshold of method === 'top-k' ? ['1', '2', '4'] : ['0.6', '0.8', '1']) {
          await target.getByLabel(method === 'top-k' ? '残す候補数' : '累積確率の閾値', { exact: true }).selectOption(threshold)
          const rows = await target.locator('[data-candidate-id]').evaluateAll(nodes => nodes.map(node => ({ p: Number(node.dataset.probability), selected: Number(node.dataset.selectionProbability), kept: node.dataset.kept === 'true' })))
          expect(rows.reduce((sum, row) => sum + row.p, 0)).toBeCloseTo(1, 10)
          expect(rows.reduce((sum, row) => sum + row.selected, 0)).toBeCloseTo(1, 10)
          expect(rows.filter(row => !row.kept).every(row => row.selected === 0)).toBe(true)
          const kept = rows.filter(row => row.kept)
          if (method === 'top-k') expect(kept).toHaveLength(Number(threshold))
          else {
            const mass = kept.reduce((sum, row) => sum + row.p, 0)
            expect(mass + 1e-12).toBeGreaterThanOrEqual(Number(threshold))
            expect(mass - Math.min(...kept.map(row => row.p))).toBeLessThan(Number(threshold))
          }
          for (const draw of ['0.22', '0.62', '0.92']) {
            await target.getByLabel('固定したu', { exact: true }).selectOption(draw)
            const selected = await target.locator('[data-selected-token]').getAttribute('data-selected-token')
            const bin = target.locator(`[data-cdf-token="${selected}"]`)
            expect(Number(await bin.getAttribute('data-cdf-low'))).toBeLessThanOrEqual(Number(draw))
            expect(Number(await bin.getAttribute('data-cdf-high'))).toBeGreaterThan(Number(draw))
          }
        }
      }
    }
    await target.getByLabel('温度・選択', { exact: true }).selectOption('0')
    await expect(target.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind', 'greedy')
    await expect(target.getByLabel('固定したu', { exact: true })).toBeDisabled()
    await expect(target.getByLabel('候補制限の方式', { exact: true })).toBeDisabled()
    await expect(target.locator('[data-cdf-token]')).toHaveCount(0)
    const probabilities = await target.locator('[data-probability]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.probability)))
    expect(probabilities.every(p => p > 0 && p < 1)).toBe(true)
    await seek(target, 6)
    for (const kind of ['draw', 'logit']) {
      await target.getByLabel('比較する揺らぎ', { exact: true }).selectOption(kind)
      const sides = await target.locator('[data-comparison-side]').evaluateAll(nodes => nodes.map(node => ({ selected: node.dataset.comparisonSelected, probabilities: [...node.querySelectorAll('[data-compare-probability]')].map(row => Number(row.dataset.compareProbability)) })))
      expect(sides[0].selected).not.toBe(sides[1].selected)
      if (kind === 'draw') expect(sides[0].probabilities).toEqual(sides[1].probabilities)
      else expect(sides[0].probabilities).not.toEqual(sides[1].probabilities)
    }
    await seek(target, 0)
    await expect(target.locator('svg.aw-scene')).toHaveAttribute('data-sampling-kind', 'sampling')
  })
  test('KV belongs to processed tokens and continuous batches refill only the freed slot', async ({ page }) => {
    await open(page)
    const target = panel(page, items[1])
    await seek(target, 1)
    for (const [length, bytes] of [['4', '256'], ['8', '512']]) {
      await target.getByLabel('入力の長さ', { exact: true }).selectOption(length)
      await expect(target.locator('[data-kv-bytes]')).toHaveAttribute('data-kv-bytes', bytes)
    }
    await seek(target, 2)
    for (const [operation, length] of [['prefill', '4'], ['decode', '5']]) {
      await target.getByLabel('処理する相', { exact: true }).selectOption(operation)
      await expect(target.locator('[data-operation]')).toHaveAttribute('data-kv-length', length)
      await expect(target.locator('[data-operation]')).toHaveAttribute('data-sampled-in-cache', 'false')
      await expect(target.locator('[data-cache-row]').first().locator('[data-cache-position]')).toHaveCount(Number(length))
    }
    await seek(target, 4)
    await target.getByLabel('論理反復', { exact: true }).selectOption('2')
    const batch = target.locator('[data-batch-mode]')
    await target.getByLabel('処理枠の使い方', { exact: true }).selectOption('ordinary')
    await expect(batch).toHaveAttribute('data-active-requests', 'B')
    await expect(batch).toHaveAttribute('data-waiting-requests', 'C')
    await expect(target.locator('[data-slot="0"]')).toHaveAttribute('data-reserved', 'true')
    await target.getByLabel('処理枠の使い方', { exact: true }).selectOption('continuous')
    await expect(target.locator('[data-slot="0"]')).toHaveAttribute('data-request', 'C')
    await expect(target.locator('[data-slot="1"]')).toHaveAttribute('data-request', 'B')
    await expect(batch).toHaveAttribute('data-waiting-requests', '')
    await expect(batch).toHaveAttribute('data-weights-changed', 'false')
    await seek(target, 5)
    await expect(batch).toHaveAttribute('data-total-kv-bytes', '1152')
    await target.getByLabel('入力の長さ', { exact: true }).selectOption('4')
    await expect(batch).toHaveAttribute('data-total-kv-bytes', '640')
    await seek(target, 4)
    await target.getByLabel('論理反復', { exact: true }).selectOption('7')
    await expect(batch).toHaveAttribute('data-total-kv-bytes', '0')
    await seek(target, 3)
    await expect(batch).toHaveAttribute('data-batch-iteration', '0')
    await expect(batch).toHaveAttribute('data-batch-mode', 'ordinary')
  })
  test('speculation commits correction or bonus and preserves separate greedy and sampling fixtures', async ({ page }) => {
    await open(page)
    const target = panel(page, items[2]), svg = target.locator('svg.aw-scene')
    await seek(target, 5)
    for (const [mode, suffixes] of [['sampling', ['C', 'AD', 'ABCD']], ['greedy', ['C', 'CD', 'CDCD']]]) {
      await target.getByLabel('確認する方式', { exact: true }).selectOption(mode)
      for (const [index, caseId] of ['first-reject', 'middle-reject', 'all-accept'].entries()) {
        await target.getByLabel('固定の経路例', { exact: true }).selectOption(caseId)
        await expect(svg).toHaveAttribute('data-committed-suffix', suffixes[index])
        await expect(svg).toHaveAttribute('data-first-rejected', index === 2 ? 'none' : String(index))
        await expect(svg).toHaveAttribute('data-candidate-prefix', 'AB')
        await expect(svg).toHaveAttribute('data-quality-judgment', 'none')
      }
    }
    await seek(target, 3)
    await expect(svg).toHaveAttribute('data-speculative-mode', 'sampling')
    await seek(target, 2)
    await expect(svg).toHaveAttribute('data-speculative-mode', 'greedy')
    await seek(target, 5)
    await expect(svg).toHaveAttribute('data-speculative-mode', 'greedy')
    await expect(svg).toHaveAttribute('data-committed-suffix', 'CDCD')
  })
  test('quantization changes only the chosen region and keeps outliers at high precision', async ({ page }) => {
    await open(page)
    const target = panel(page, items[3]), svg = target.locator('svg.aw-scene')
    await seek(target, 2)
    for (const region of ['weights', 'activations', 'kv']) {
      await target.getByLabel('量子化する対象', { exact: true }).selectOption(region)
      for (const bits of ['16', '8', '4']) {
        await target.getByLabel('通常部分のbit数', { exact: true }).selectOption(bits)
        const selected = target.locator(`[data-quantization-region="${region}"]`)
        await expect(selected).toHaveAttribute('data-region-selected', 'true')
        const all = await target.locator('[data-quantization-region]').evaluateAll(nodes => nodes.map(node => ({ selected: node.dataset.regionSelected === 'true', values: [...node.querySelectorAll('[data-value-bits]')].map(value => ({ bits: Number(value.dataset.valueBits), outlier: value.dataset.outlier === 'true' })) })))
        for (const r of all) for (const value of r.values) expect(value.bits).toBe(r.selected && !value.outlier ? Number(bits) : 16)
        await expect(svg).toHaveAttribute('data-quality-judgment', 'none')
      }
    }
    await seek(target, 3)
    await expect(target.locator('[data-task-validation-required]')).toHaveAttribute('data-task-validation-executed', 'false')
    await seek(target, 0)
    await expect(svg).toHaveAttribute('data-effective-bits', '16')
  })
  test('source headings, two equations, overview graph and one article navigation survive', async ({ page }) => {
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
    await expect(page.locator('article .katex-display')).toHaveCount(2)
    await expect(page.locator('.rf-article-toc')).toHaveCount(1)
    expect(await page.locator('article .reading-figure').evaluateAll(nodes => nodes.map(node => node.dataset.diagramId))).toEqual(items.map(item => item.id))
    expect(await page.locator('article [data-mermaid-renderer="strict"]').evaluate(node => node.closest('.reading-figure'))).toBeNull()
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
  test('four figures have isolated manual state and retain coherent scenes in print', async ({ page }) => {
    await open(page)
    for (const item of items) await phase(panel(page, item), 1.25)
    await seek(panel(page, items[0]), 6)
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
    await expect(page.locator('article .katex-display')).toHaveCount(2)
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
  test(`all inference states fit ${width}x${height} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, theme)
    for (const item of items) for (let stage = 0; stage < item.count; stage++) {
      const target = panel(page, item)
      await seekForFit(target, stage); await geometry(page, target)
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(stage))
    }
  })
}
test.describe('inference without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('all four figures retain original prose, equations and static stage lists', async ({ page }) => {
    expect((await page.goto(route)).status()).toBe(200)
    await expect(page.locator('article h3')).toHaveText(headings)
    await expect(page.locator('article .katex-display')).toHaveCount(2)
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
