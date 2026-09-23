import { test, expect } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const articlePath = '/docs/concepts/agent-loop'
const figureSelector = '.reading-figure[data-diagram-id="agent-loop"]'

// These tests control delivery of IntersectionObserver batches to the real
// component callbacks. They do not replace the components, their DOM, or their
// rendering. Native observer/scroll regressions remain in the article suites.
async function controlIntersectionBatches(page) {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver
    const registrations = new Set()
    const kindOf = target => target.matches('[data-mermaid-renderer="strict"] > div')
      ? 'mermaid'
      : target.matches('.reading-figure[data-diagram-id="agent-loop"] .aw-sticky') ? 'reading' : null

    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options)
        this.batchCallback = callback
        this.batchTargets = new Set()
      }
      observe(target) {
        if (!kindOf(target)) return super.observe(target)
        this.batchTargets.add(target)
        registrations.add(this)
      }
      unobserve(target) {
        this.batchTargets.delete(target)
        return super.unobserve(target)
      }
      disconnect() {
        this.batchTargets.clear()
        registrations.delete(this)
        return super.disconnect()
      }
    }

    window.__intersectionBatches = {
      count(kind) {
        return [...registrations].reduce((count, observer) => count
          + [...observer.batchTargets].filter(target => kindOf(target) === kind).length, 0)
      },
      emit(kind, states) {
        const delivered = []
        for (const observer of [...registrations]) {
          for (const target of [...observer.batchTargets]) {
            if (kindOf(target) !== kind) continue
            const bounds = target.getBoundingClientRect()
            const entries = states.map((isIntersecting, index) => ({
              target, time: performance.now() + index, isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: bounds,
              rootBounds: new DOMRect(0, 0, innerWidth, innerHeight),
              intersectionRect: isIntersecting ? bounds : new DOMRect()
            }))
            observer.batchCallback.call(observer, entries, observer)
            delivered.push(entries.length)
          }
        }
        return delivered
      }
    }
  })
}

async function emit(page, kind, states) {
  expect(await page.evaluate(({ kind, states }) => window.__intersectionBatches.emit(kind, states), { kind, states }))
    .toEqual([states.length])
}

async function openArticle(page) {
  await controlIntersectionBatches(page)
  const response = await page.goto(`${basePath}${articlePath}`)
  expect(response.status()).toBe(200)
  await expect(page.locator(figureSelector)).toHaveAttribute('data-ready', 'true')
  for (const kind of ['mermaid', 'reading']) {
    await expect.poll(() => page.evaluate(kind => window.__intersectionBatches.count(kind), kind)).toBe(1)
  }
  return page.locator('article [data-mermaid-renderer="strict"]')
}

async function preparePlayback(page) {
  await page.clock.install({ time: new Date('2026-09-24T00:00:00Z') })
  const mermaid = await openArticle(page)
  await emit(page, 'mermaid', [true])
  await expect(mermaid.locator('svg .nodes')).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  const diagram = page.locator(`${figureSelector} .aw-sticky > .aw-diagram`)
  await diagram.getByRole('group', { name: '図解の段階' }).getByRole('button', { name: '入力', exact: true }).click()
  // Finish the seek and explicitly pause the installed clock before measuring.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  await expect(diagram.getByRole('slider', { name: '図解の再生位置' })).toHaveValue('0')
  await expect(diagram).toHaveAttribute('data-mode', 'manual')
  return diagram
}

test.describe('controlled IntersectionObserver batches', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })

  test('Mermaid starts when a stale non-intersection precedes an intersection in one batch', async ({ page }) => {
    const mermaid = await openArticle(page)
    await expect(mermaid.locator('svg')).toHaveCount(0)
    await mermaid.scrollIntoViewIfNeeded()
    await emit(page, 'mermaid', [false, true])
    // This source uses a flowchart; graph nodes prove final rendering, rather
    // than Mermaid's provisional, empty SVG used while measuring the graph.
    await expect(mermaid.locator('svg .nodes')).toBeVisible()
    await expect(mermaid.locator('svg')).toHaveCount(1)
    await expect(mermaid).toContainText('タスク開始')
    await expect.poll(() => page.evaluate(() => window.__intersectionBatches.count('mermaid'))).toBe(0)
  })

  test('reading playback uses the latest visible entry in a false-to-true batch', async ({ page }) => {
    const diagram = await preparePlayback(page)
    await emit(page, 'reading', [false, true])
    await diagram.getByRole('button', { name: '図解を再生', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    await page.clock.runFor(1000)
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    expect(Number(await diagram.getByRole('slider', { name: '図解の再生位置' }).inputValue())).toBeGreaterThan(0.2)
  })

  test('reading playback stops at the latest hidden entry in a true-to-false batch', async ({ page }) => {
    const diagram = await preparePlayback(page)
    await emit(page, 'reading', [true])
    await diagram.getByRole('button', { name: '図解を再生', exact: true }).click()
    await expect(diagram).toHaveAttribute('data-mode', 'playing')
    await page.clock.runFor(1000)
    const slider = diagram.getByRole('slider', { name: '図解の再生位置' })
    expect(Number(await slider.inputValue())).toBeGreaterThan(0.2)
    await emit(page, 'reading', [true, false])
    await expect(diagram).toHaveAttribute('data-mode', 'manual')
    const paused = await slider.inputValue()
    await page.clock.runFor(1000)
    await expect(slider).toHaveValue(paused)
  })
})
