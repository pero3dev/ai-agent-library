import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const items = [
  { id: 'generation-token-loop', route: 'how-llms-generate-text', title: '1トークンずつ、続きを生成する', count: 8, steps: [0, 3, 4, 5, 6, 7], attr: 'data-generation-stage', mermaids: 1 },
  { id: 'tokenization-counting', route: 'tokenization', title: '分割・数え方・予算', count: 7, steps: [0, 1, 2, 3, 4, 5], attr: 'data-tokenization-stage', mermaids: 0 }
].map(item => {
  const source = readFileSync(new URL(`../../../docs/10-llm-foundations/${item.route}.md`, import.meta.url), 'utf8')
  return {
    ...item,
    headings: [...source.matchAll(/^### (.+)$/gm)].map(match => match[1].trim()),
    tableCells: source.split(/\r?\n/).filter(line => line.startsWith('|') && !/^\|\s*:?-/.test(line))
      .flatMap(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
  }
})
const figure = (page, item) => page.locator(`.reading-figure[data-diagram-id="${item.id}"]`)
const panel = (page, item) => figure(page, item).locator('.aw-sticky > .aw-diagram')
async function open(page, item, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(`${basePath}/docs/llm-foundations/${item.route}`)
  expect(response.status()).toBe(200)
  await expect(figure(page, item)).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
  await expect(panel(page, item).getByRole('slider')).toBeEnabled()
  // Finish lazy Mermaid layout before measuring text or scrolling to a step.
  for (const mermaid of await page.locator('article [data-mermaid-renderer="strict"]').all()) {
    await mermaid.scrollIntoViewIfNeeded()
    await expect(mermaid.locator('svg .nodes').last()).toBeVisible()
  }
  await page.evaluate(() => document.fonts.ready)
  await panel(page, item).scrollIntoViewIfNeeded()
}
async function sourceContent(page, item) {
  expect(item.headings).toHaveLength(8)
  await expect(page.locator('article h3')).toHaveText(item.headings)
  await expect(page.locator('article [data-mermaid-renderer="strict"]')).toHaveCount(item.mermaids)
  await expect(page.locator('article table')).toHaveCount(item.tableCells.length ? 1 : 0)
  if (item.tableCells.length) await expect(page.locator('article table th, article table td')).toHaveText(item.tableCells, { useInnerText: true })
}
async function seek(target, stage) {
  const button = target.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button').nth(stage)
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(target).toHaveAttribute('data-stage', String(stage))
  await expect(target).toHaveAttribute('data-mode', 'manual')
  await expect(target.getByRole('slider')).toHaveValue(String(stage))
}
async function phase(target, value) {
  await target.getByRole('slider').evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(next))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
  await expect(target).toHaveAttribute('data-stage', String(Math.round(value)))
}
async function scrollToStep(page, item, stage, edge = 'top') {
  await figure(page, item).locator(`[data-reading-step="${stage}"]`).evaluate((element, edge) => {
    const line = Math.min(innerHeight * 0.4, 340)
    window.scrollTo({ top: scrollY + element.getBoundingClientRect()[edge] - line + 8, behavior: 'instant' })
  }, edge)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}
async function layout(target) {
  const result = await target.locator('svg.aw-scene').evaluate(svg => {
    const inverse = svg.getScreenCTM().inverse(), view = svg.viewBox.baseVal
    const outside = [...svg.querySelectorAll('text')].filter(element => {
      for (let parent = element; parent && parent !== svg; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      const bounds = element.getBBox(), matrix = inverse.multiply(element.getScreenCTM())
      return [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y], [bounds.x, bounds.y + bounds.height], [bounds.x + bounds.width, bounds.y + bounds.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
        .some(point => point.x < view.x - 1 || point.y < view.y - 1 || point.x > view.x + view.width + 1 || point.y > view.y + view.height + 1)
    }).map(element => element.textContent)
    return { outside, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  })
  expect(result.outside).toEqual([])
  expect(result.overflow).toBeLessThanOrEqual(1)
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  for (const colorScheme of viewport.width === 1280 ? ['light'] : ['light', 'dark']) {
    test.describe(`${viewport.width} ${colorScheme}`, () => {
      test.use({ viewport, colorScheme, reducedMotion: 'reduce' })
      for (const item of items) test(`${item.id} all stages preserve content and fit`, async ({ page }) => {
        await open(page, item, colorScheme)
        await sourceContent(page, item)
        await expect(page.locator('.rf-article-toc')).toHaveCount(1)
        expect(await figure(page, item).locator('[data-reading-step]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.readingStep)))).toEqual(item.steps)
        const ids = await page.locator('article [id]').evaluateAll(nodes => nodes.map(node => node.id))
        expect(new Set(ids).size).toBe(ids.length)
        const target = panel(page, item)
        for (let stage = 0; stage < item.count; stage++) {
          await seek(target, stage)
          await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, String(stage))
          await layout(target)
        }
      })
    })
  }
}

test.describe('foundations meaning and controls', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  test('selected occurrence commits with the new prefix and reverse seeking restores it', async ({ page }) => {
    const item = items[0]
    await open(page, item)
    const target = panel(page, item)
    for (const value of [1.49, 1.5, 2, 2.49, 2.5, 3, 2.49, 2, 1.5, 1.49]) {
      await phase(target, value)
      const committed = value >= 2.5 ? 'A B B' : 'A B'
      await expect(target.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', committed)
      await expect(target.locator('[data-distribution-prefix]')).toHaveAttribute('data-distribution-prefix', committed)
      await expect(target.locator('[data-model-weights]')).toHaveAttribute('data-model-weights', 'fixed')
      expect(Number(await target.locator('[data-append-progress]').getAttribute('data-append-progress'))).toBeCloseTo(Math.max(0, Math.min(1, value - 1.5)), 10)
      const moving = value >= 1.5 && value < 2.5
      await expect(target.locator('[data-moving-token="true"]')).toHaveCount(moving ? 1 : 0)
      await expect(target.locator('[data-occurrence-id="generated:0"]')).toHaveCount(value >= 1.5 ? 1 : 0)
      if (moving) await expect(target.locator('[data-moving-token="true"]')).toHaveAttribute('data-occurrence-id', 'generated:0')
      await layout(target)
    }
    await seek(target, 4)
    for (const temperature of ['0.5', '1', '2']) for (const topP of ['0.6', '0.8', '1']) {
      await target.getByLabel('温度・選択', { exact: true }).selectOption(temperature)
      await target.getByLabel('候補の範囲', { exact: true }).selectOption(topP)
      const rows = await target.locator('[data-candidate]').evaluateAll(nodes => nodes.map(node => ({ kept: node.dataset.kept === 'true', p: Number(node.dataset.selectionProbability) })))
      expect(rows.reduce((sum, row) => sum + row.p, 0)).toBeCloseTo(1, 10)
      expect(rows.filter(row => !row.kept).every(row => row.p === 0)).toBe(true)
      await expect(target.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', 'A B')
      await expect(target.locator('[data-distribution-prefix]')).toHaveAttribute('data-distribution-prefix', 'A B')
    }
    await target.getByLabel('温度・選択', { exact: true }).selectOption('0')
    await expect(target.getByLabel('候補の範囲', { exact: true })).toBeDisabled()
    await expect(target.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind', 'greedy')
    await expect(target).toContainText('確信100%の意味ではない')
    expect(Number(await target.locator('[data-candidate="A"]').getAttribute('data-probability'))).toBeCloseTo(0.4, 10)
    await seek(target, 3)
    // Stage-4 choices must not rewrite the fixed earlier generation example.
    await expect(target.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind', 'sampling')
    expect(Number(await target.locator('[data-candidate="C"]').getAttribute('data-probability'))).toBeCloseTo(0.6, 10)
    await seek(target, 5)
    for (const cause of ['sampling', 'logit']) {
      await target.getByLabel('分岐の原因', { exact: true }).selectOption(cause)
      await expect(target.locator('[data-comparison-kind]')).toHaveAttribute('data-comparison-kind', cause)
      await expect(target.locator('[data-changed-field]')).toHaveAttribute('data-changed-field', cause === 'sampling' ? 'draw' : 'logit-A')
      expect(await target.locator('[data-comparison-selected]').evaluateAll(nodes => nodes.map(node => node.dataset.comparisonSelected))).toEqual(['A', 'B'])
      const sides = target.locator('[data-comparison-side]')
      const probabilities = await sides.evaluateAll(nodes => nodes.map(node => [...node.querySelectorAll('[data-compare-probability]')].map(row => Number(row.dataset.compareProbability))))
      if (cause === 'sampling') {
        expect(probabilities[0]).toEqual(probabilities[1])
        expect(await sides.nth(0).getAttribute('data-draw')).not.toBe(await sides.nth(1).getAttribute('data-draw'))
      } else {
        const difference = Math.abs(probabilities[0][0] - probabilities[1][0])
        expect(difference).toBeGreaterThan(0)
        expect(difference).toBeLessThan(0.00001)
      }
      await layout(target)
    }
  })

  test('stopping keeps EOS, delimiter and incomplete-limit outcomes distinct; stream never retracts', async ({ page }) => {
    await open(page, items[0])
    const target = panel(page, items[0])
    for (const [reason, generated, visible, count] of [['natural', 'ABC', 'ABC', 4], ['sequence', 'ABC', 'A', 3], ['limit', 'AB', 'AB', 2]]) {
      await seek(target, 6)
      await target.getByLabel('停止条件', { exact: true }).selectOption(reason)
      await expect(target.locator('[data-stop-reason]')).toHaveAttribute('data-stop-reason', reason)
      await expect(target.locator('[data-visible-text]')).toHaveAttribute('data-visible-text', visible)
      await expect(target.locator('[data-generated-text]')).toHaveAttribute('data-generated-text', generated)
      await expect(target.locator('[data-selected-count]')).toHaveAttribute('data-selected-count', String(count))
      await layout(target)
      let previous = ''
      for (const value of [6.5, 6.63, 6.75, 6.88, 7]) {
        await phase(target, value)
        const next = await target.locator('[data-stream-visible]').getAttribute('data-stream-visible')
        expect(next.startsWith(previous)).toBe(true)
        previous = next
        if (reason === 'natural' && value === 6.75) {
          await expect(target.locator('[data-stream-generated]')).toHaveAttribute('data-stream-generated', 'AB')
          await expect(target.locator('[data-stream-visible]')).toHaveAttribute('data-stream-visible', 'A')
          await expect(target.locator('[data-stream-pending]')).toHaveAttribute('data-stream-pending', 'B')
          await expect(target.locator('[data-stream-finished]')).toHaveAttribute('data-stream-finished', 'false')
        }
        await layout(target)
      }
      expect(previous).toBe(visible)
      await expect(target.locator('[data-stream-finished]')).toHaveAttribute('data-stream-finished', 'true')
      // A manual rewind restores the empty snapshot, not a residual chunk.
      await phase(target, 6.5)
      for (const field of ['generated', 'visible', 'pending']) await expect(target.locator(`[data-stream-${field}]`)).toHaveAttribute(`data-stream-${field}`, '')
      await expect(target.locator('[data-stream-finished]')).toHaveAttribute('data-stream-finished', 'false')
    }
  })

  test('same text has distinct boundaries and vocabulary IDs without invented measurements', async ({ page }) => {
    await open(page, items[1])
    const target = panel(page, items[1]), svg = target.locator('svg.aw-scene')
    await seek(target, 2)
    for (const [boundary, count] of [['character', 9], ['word', 1], ['subword', 2]]) {
      await target.getByLabel('比較する境界', { exact: true }).selectOption(boundary)
      await expect(svg).toHaveAttribute('data-segment-count', String(count))
      await expect(target.locator('[data-vocabulary-id]')).toHaveCount(boundary === 'subword' ? 2 : 0)
      await expect(svg).toHaveAttribute('data-token-count', '2')
      await layout(target)
    }
    await seek(target, 4)
    const positions = await target.locator('[data-source-position]').evaluateAll(nodes => nodes.map(node => node.getAttribute('x')))
    for (const [vocabulary, count] of [['b', 4], ['a', 2]]) {
      await target.getByLabel('説明用の語彙', { exact: true }).selectOption(vocabulary)
      await expect(svg).toHaveAttribute('data-token-count', String(count))
      await expect(target.locator('[data-reconstructed-text]')).toHaveAttribute('data-reconstructed-text', 'tokenizer')
      expect(await target.locator('[data-vocabulary-id]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.vocabularyId)))).toEqual(vocabulary === 'b' ? [31, 8, 5, 42] : [12, 27])
      expect(await target.locator('[data-source-position]').evaluateAll(nodes => nodes.map(node => node.getAttribute('x')))).toEqual(positions)
      await layout(target)
    }
    await seek(target, 3)
    for (const condition of ['language', 'content']) {
      await target.getByLabel('確認する条件', { exact: true }).selectOption(condition)
      await expect(svg).toHaveAttribute('data-dependency-focus', condition)
      await layout(target)
    }
    await seek(target, 5)
    for (const subject of ['estimate', 'usage', 'history']) {
      await target.getByLabel('確認する対象', { exact: true }).selectOption(subject)
      for (const part of ['past-input', 'past-output', 'current-input']) await expect(target.locator('[data-history-inclusion]')).toHaveAttribute(`data-includes-${part}`, 'true')
      await expect(svg).toHaveAttribute('data-usage-measured', 'false')
      await expect(svg).toHaveAttribute('data-quality-judgment', 'none')
      await layout(target)
    }
    for (const value of [5.49, 5.5, 6, 5.49]) {
      await phase(target, value)
      const stage = Math.round(value)
      await expect(svg).toHaveAttribute('data-tokenization-stage', String(stage))
      await expect(target.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(stage)).toHaveAttribute('aria-pressed', 'true')
      await expect(target.getByRole('slider')).toHaveAttribute('aria-valuetext', new RegExp(`^${stage + 1} / 7、`))
      await expect(target.locator('[data-history-inclusion]')).toBeVisible()
    }
  })

  for (const item of items) {
    test(`${item.id}: keyboard seeking and expansion share state and restore focus`, async ({ page }) => {
      await open(page, item)
      const target = panel(page, item), slider = target.getByRole('slider', { name: '図解の再生位置' })
      await slider.focus()
      await page.keyboard.press('Home')
      await expect(slider).toHaveValue('0')
      await expect(target.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
      await page.keyboard.press('End')
      await expect(slider).toHaveValue(String(item.count - 1))
      await expect(target.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
      await page.keyboard.press('ArrowLeft')
      expect(Number(await slider.inputValue())).toBeCloseTo(item.count - 1.01, 5)
      await expect(target).toHaveAttribute('data-stage', String(item.count - 1))
      await expect(slider).toHaveAttribute('aria-valuetext', new RegExp(`^${item.count} / ${item.count}、`))
      const stageButton = target.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(4)
      await stageButton.focus()
      await page.keyboard.press('Enter')
      await expect(stageButton).toHaveAttribute('aria-pressed', 'true')
      await expect(target).toHaveAttribute('data-stage', '4')
      const expand = target.getByRole('button', { name: '図を拡大', exact: true })
      await expand.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: `${item.title}の拡大図`, exact: true })
      await expect(dialog).toBeVisible()
      expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true)
      await expect(dialog.getByRole('button', { name: '拡大図を閉じる', exact: true })).toBeFocused()
      const expanded = dialog.locator('.aw-diagram')
      const label = item.id === 'generation-token-loop' ? '温度・選択' : '説明用の語彙'
      const choice = item.id === 'generation-token-loop' ? '2' : 'b'
      await expanded.getByRole('combobox', { name: label, exact: true }).selectOption(choice)
      await layout(expanded)
      const ids = await figure(page, item).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id))
      expect(new Set(ids).size).toBe(ids.length)
      await seek(expanded, item.count - 1)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(expand).toBeFocused()
      await expect(target).toHaveAttribute('data-stage', String(item.count - 1))
      await seek(target, 4)
      await expect(target.getByRole('combobox', { name: label, exact: true })).toHaveValue(choice)
      if (item.id === 'tokenization-counting') await expect(target.locator('svg.aw-scene')).toHaveAttribute('data-token-count', '4')
    })

    test(`${item.id}: article tracking yields to manual seeking and resumes at the reading step`, async ({ page }) => {
      await open(page, item)
      const target = panel(page, item)
      for (const stage of item.steps) {
        await scrollToStep(page, item, stage)
        await expect(target).toHaveAttribute('data-mode', 'reading')
        await expect(target).toHaveAttribute('data-stage', String(stage))
        await expect(figure(page, item).locator(`[data-reading-step="${stage}"]`)).toHaveAttribute('data-reading-active', 'true')
      }
      // Tokenization's last history stage is reached after its final body block.
      await scrollToStep(page, item, item.steps.at(-1), 'bottom')
      await expect(target).toHaveAttribute('data-stage', String(item.count - 1))
      await seek(target, 1)
      await scrollToStep(page, item, 4)
      await expect(target).toHaveAttribute('data-stage', '1')
      await expect(target).toHaveAttribute('data-mode', 'manual')
      await target.getByRole('button', { name: '本文に連動する', exact: true }).click()
      await scrollToStep(page, item, 4)
      await expect(target).toHaveAttribute('data-mode', 'reading')
      await expect(target).toHaveAttribute('data-stage', '4')
      await expect(target.getByRole('button', { name: '本文に連動中', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await scrollToStep(page, item, 0)
      await expect(target).toHaveAttribute('data-stage', '0')
    })

    test(`${item.id}: playback pauses at an intermediate state and restarts to completion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.clock.install({ time: new Date('2026-09-24T00:00:00Z') })
      await open(page, item)
      const target = panel(page, item), slider = target.getByRole('slider')
      await phase(target, 0)
      // Explicitly stop the installed clock before measuring elapsed playback.
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
      await target.getByRole('button', { name: '図解を再生', exact: true }).click()
      await expect(target).toHaveAttribute('data-mode', 'playing')
      await page.clock.runFor(9000)
      await expect(target).toHaveAttribute('data-stage', '2')
      expect(Math.abs(Number(await slider.inputValue()) - 2)).toBeLessThanOrEqual(0.01)
      await expect(target.locator('svg.aw-scene')).toHaveAttribute(item.attr, '2')
      if (item.id === 'generation-token-loop') {
        await expect(target.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', 'A B')
        await expect(target.locator('[data-moving-token="true"]')).toHaveCount(1)
        const progress = Number(await target.locator('[data-append-progress]').getAttribute('data-append-progress'))
        expect(progress).toBeGreaterThan(0.48)
        expect(progress).toBeLessThan(0.52)
      }
      await target.getByRole('button', { name: '図解を一時停止', exact: true }).click()
      await expect(target).toHaveAttribute('data-mode', 'manual')
      const paused = await slider.inputValue()
      await page.clock.runFor(5000)
      await expect(slider).toHaveValue(paused)
      await phase(target, item.count - 1)
      await target.getByRole('button', { name: '図解を最初から再生', exact: true }).click()
      await page.clock.runFor(100)
      await expect(target).toHaveAttribute('data-stage', '0')
      await expect(target).toHaveAttribute('data-mode', 'playing')
      await page.clock.runFor((item.count - 1) * 4500)
      await expect(slider).toHaveValue(String(item.count - 1))
      await expect(target).toHaveAttribute('data-mode', 'manual')
    })

    test(`${item.id}: printing freezes a coherent scene and retains the article`, async ({ page }) => {
      await open(page, item)
      const target = panel(page, item)
      if (item.id === 'generation-token-loop') {
        await seek(target, 6)
        await target.getByRole('combobox', { name: '停止条件', exact: true }).selectOption('sequence')
        await phase(target, 6.75)
      } else {
        await seek(target, 4)
        await target.getByRole('combobox', { name: '説明用の語彙', exact: true }).selectOption('b')
        await phase(target, 4.25)
      }
      // emulateMedia changes CSS; dispatch the browser print lifecycle separately.
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
      await page.emulateMedia({ media: 'print' })
      await expect(target).toHaveAttribute('data-mode', 'manual')
      await expect(target).toHaveAttribute('data-stage', item.id === 'generation-token-loop' ? '7' : '4')
      await expect(target.getByRole('slider', { includeHidden: true })).toHaveValue(item.id === 'generation-token-loop' ? '7' : '4')
      await expect(target.locator('svg.aw-scene')).toBeVisible()
      await expect(figure(page, item).locator('.aw-prose')).toBeVisible()
      await expect(target.locator('.aw-timeline')).toBeHidden()
      await expect(target.locator('.rf-scene-controls')).toBeHidden()
      await expect(figure(page, item).locator('.rf-static-stages')).toBeHidden()
      expect(await figure(page, item).locator('.aw-sticky').evaluate(element => getComputedStyle(element).position)).toBe('static')
      await sourceContent(page, item)
      if (item.id === 'generation-token-loop') {
        await expect(target.locator('[data-stream-visible]')).toHaveAttribute('data-stream-visible', 'A')
        await expect(target.locator('[data-stream-finished]')).toHaveAttribute('data-stream-finished', 'true')
        await expect(page.locator('article [data-mermaid-renderer="strict"] svg .nodes')).toBeVisible()
      } else {
        await expect(target.locator('svg.aw-scene')).toHaveAttribute('data-token-count', '4')
        await expect(target.locator('[data-reconstructed-text]')).toHaveAttribute('data-reconstructed-text', 'tokenizer')
      }
    })

    test.describe(`${item.id} without JavaScript`, () => {
      test.use({ javaScriptEnabled: false })
      test('source text and all static stage explanations remain readable', async ({ page }) => {
        const response = await page.goto(`${basePath}/docs/llm-foundations/${item.route}`)
        expect(response.status()).toBe(200)
        const root = figure(page, item), target = panel(page, item)
        await expect(root).toHaveAttribute('data-ready', 'false')
        await sourceContent(page, item)
        await expect(root.locator('.aw-prose')).toBeVisible()
        await expect(root.getByText('動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。', { exact: true })).toBeVisible()
        await expect(target.locator('svg.aw-scene')).toBeVisible()
        await expect(target.getByRole('slider')).toBeDisabled()
        await expect(target.getByRole('button', { name: '図解を再生', exact: true })).toBeDisabled()
        await expect(target.getByRole('button', { name: '図を拡大', exact: true })).toBeDisabled()
        const fallback = root.locator('.rf-static-stages')
        await fallback.locator('summary').click()
        await expect(fallback).toHaveAttribute('open', '')
        await expect(fallback.locator('li')).toHaveCount(item.count)
        for (const explanation of await fallback.locator('li').all()) await expect(explanation).toBeVisible()
      })
    })
  }
})
