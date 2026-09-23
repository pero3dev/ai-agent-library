import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { loopFrame } from '../../lib/concept-diagram-model.mjs'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const figures = [
  { id: 'agent-loop', path: '/docs/concepts/agent-loop', title: 'Agent ループ', labels: ['入力', 'モデル', '解釈', '結果', '停止'] },
  { id: 'workflow-comparison', path: '/docs/architecture/workflow-vs-agent', title: 'Workflow と Agent', labels: ['手順', '比較', '選択', '混在', '境界'] }
]
const loopSource = readFileSync(new URL('../../../docs/01-concepts/agent-loop.md', import.meta.url), 'utf8')
const loopItems = loopSource.split('### 詳細: 1 イテレーションの分解')[1].split('\n### ')[0]
  .split(/\r?\n/).filter(line => /^\d+\. /.test(line)).map(line => line.replace(/^\d+\. /, '').replaceAll('**', ''))
const workflowHeadings = [
  '概要: 原則は「同じ品質なら、自律性の低い方」', '詳細: トレードオフの全体像',
  '詳細: 判断フロー', '詳細: ハイブリッドという現実解', '設計判断: 段階的な移行を前提にする'
]
const browserErrors = new WeakMap()
const root = (page, figure) => page.locator(`.reading-figure[data-diagram-id="${figure.id}"]`)
const inline = (page, figure) => root(page, figure).locator('.aw-sticky > .aw-diagram')
const normalize = text => text.replace(/\s+/g, ' ').trim()

test.beforeEach(async ({ page }) => {
  const errors = []
  browserErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() !== 'error') return
    const url = message.location().url
    // The static test server has no origin-root favicon. This browser-generated
    // request is unrelated to article assets; retain every other console error.
    if (url === 'http://127.0.0.1:4183/favicon.ico' && message.text().includes('404 (Not Found)')) return
    errors.push(`${url}: ${message.text()}`)
  })
})
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]) })

async function openFigure(page, figure, theme = 'light') {
  await page.addInitScript(value => localStorage.setItem('theme', value), theme)
  const response = await page.goto(`${basePath}${figure.path}`)
  expect(response.status()).toBe(200)
  await expect(root(page, figure)).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`))
  await page.evaluate(() => document.fonts.ready)
  // Mermaid is lazy and can replace its provisional SVG after theme hydration.
  // Visit the real source diagrams and wait for final graph nodes, not any SVG.
  const mermaids = page.locator('article [data-mermaid-renderer="strict"]')
  await expect(mermaids).toHaveCount(1)
  for (const mermaid of await mermaids.all()) {
    await mermaid.scrollIntoViewIfNeeded()
    await expect(mermaid.locator('svg .nodes').last()).toBeVisible()
  }
  await page.evaluate(() => document.fonts.ready)
  await inline(page, figure).scrollIntoViewIfNeeded()
  return inline(page, figure)
}

async function selectStage(diagram, figure, stage) {
  const button = diagram.getByRole('group', { name: '図解の段階' }).getByRole('button', { name: figure.labels[stage], exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(diagram).toHaveAttribute('data-stage', String(stage))
  await expect(diagram).toHaveAttribute('data-mode', 'manual')
  await expect(diagram.getByRole('slider', { name: '図解の再生位置' })).toHaveValue(String(stage))
}

async function scrollToStep(page, figure, stage) {
  await root(page, figure).locator(`[data-reading-step="${stage}"]`).evaluate(element => {
    const line = Math.min(innerHeight * 0.4, 340)
    window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - line + 8, behavior: 'instant' })
  })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function noHorizontalOverflow(page) {
  const result = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.documentElement.clientWidth
  }))
  expect(result.document).toBeLessThanOrEqual(1)
  expect(result.body).toBeLessThanOrEqual(1)
}

async function sceneTextFits(diagram) {
  const outside = await diagram.locator('svg.aw-scene').evaluate(svg => {
    const box = svg.viewBox.baseVal, inverse = svg.getScreenCTM().inverse()
    return [...svg.querySelectorAll('text')].filter(text => {
      for (let node = text; node && node !== svg; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      const rect = text.getBBox(), transform = inverse.multiply(text.getScreenCTM())
      return [[rect.x, rect.y], [rect.x + rect.width, rect.y], [rect.x, rect.y + rect.height], [rect.x + rect.width, rect.y + rect.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(transform))
        .some(point => point.x < box.x - 1 || point.y < box.y - 1 || point.x > box.x + box.width + 1 || point.y > box.y + box.height + 1)
    }).map(text => text.textContent)
  })
  expect(outside).toEqual([])
}

test.describe('registered reading figures', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })

  test('the loop keeps one five-item ordered list with its original prose and numbering', async ({ page }) => {
    const figure = figures[0]
    await openFigure(page, figure)
    const prose = root(page, figure).locator('.aw-prose')
    const list = prose.locator(':scope > ol')
    await expect(list).toHaveCount(1)
    expect(loopItems).toHaveLength(5)
    await expect(list.locator(':scope > li')).toHaveCount(5)
    expect(await list.evaluate(element => element.start)).toBe(1)
    for (let index = 0; index < 5; index++) {
      const item = list.locator(':scope > li').nth(index)
      await expect(item.locator(`[data-reading-step="${index}"]`)).toHaveCount(1)
      expect(normalize(await item.innerText())).toBe(normalize(loopItems[index]))
    }
    await expect(prose).toContainText('ツール要求がないことだけでは正常完了と判定できません')
    await expect(page.locator('article')).toContainText('不完全なツール要求は実行しない')
    await expect(page.locator('article [data-mermaid-renderer="strict"] svg .nodes').last()).toBeVisible()
  })

  test('the workflow preserves its five source headings, table, Mermaid and article navigation', async ({ page }) => {
    const figure = figures[1]
    await openFigure(page, figure)
    const prose = root(page, figure).locator('.aw-prose')
    await expect(prose.locator('[data-reading-step]')).toHaveCount(5)
    const ids = []
    for (let index = 0; index < workflowHeadings.length; index++) {
      const heading = prose.locator(`[data-reading-step="${index}"] h3`)
      await expect(heading).toHaveText(workflowHeadings[index])
      const id = await heading.getAttribute('id')
      expect(id).toBeTruthy()
      ids.push(id)
    }
    expect(new Set(ids).size).toBe(5)
    await expect(prose.locator('table')).toHaveCount(1)
    await expect(prose.locator('table tbody tr')).toHaveCount(7)
    await expect(prose.locator('table')).toContainText('想定外の入力に対応しうる')
    await expect(prose.locator('table')).toContainText('軌跡(過程)の評価が必要になる')
    await expect(prose.locator('[data-mermaid-renderer="strict"] svg .nodes').last()).toBeVisible()
    const navigation = page.locator('article').getByRole('navigation', { name: 'この記事の目次' })
    await navigation.locator('summary').click()
    for (const id of ids) await expect(navigation.locator(`a[href="#${encodeURIComponent(id)}"]`)).toBeVisible()
    await navigation.locator('summary').click()
    await expect(prose).toContainText('双方向の移行(Agent 化・Workflow への後退)が安価になります')
  })

  for (const figure of figures) {
    test(`${figure.id}: scroll tracking yields to manual controls and resumes from the text`, async ({ page }) => {
      const diagram = await openFigure(page, figure)
      for (const stage of [0, 1, 2, 3, 4]) {
        await scrollToStep(page, figure, stage)
        await expect(diagram).toHaveAttribute('data-mode', 'reading')
        await expect(diagram).toHaveAttribute('data-stage', String(stage))
      }
      await selectStage(diagram, figure, 1)
      await scrollToStep(page, figure, 3)
      await expect(diagram).toHaveAttribute('data-stage', '1')
      await expect(diagram).toHaveAttribute('data-mode', 'manual')
      await diagram.getByRole('button', { name: '本文に連動する', exact: true }).click()
      await scrollToStep(page, figure, 3)
      await expect(diagram).toHaveAttribute('data-mode', 'reading')
      await expect(diagram).toHaveAttribute('data-stage', '3')
      await scrollToStep(page, figure, 0)
      await expect(diagram).toHaveAttribute('data-stage', '0')
    })

    test(`${figure.id}: every stage and keyboard timeline seek are accessible`, async ({ page }) => {
      const diagram = await openFigure(page, figure)
      for (let stage = 0; stage < 5; stage++) {
        await selectStage(diagram, figure, stage)
        await expect(diagram.getByRole('img')).toHaveAccessibleName(new RegExp(`^${figure.labels[stage]}：`))
      }
      const slider = diagram.getByRole('slider', { name: '図解の再生位置' })
      await slider.focus()
      await page.keyboard.press('Home')
      await expect(slider).toHaveValue('0')
      await expect(diagram.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
      await page.keyboard.press('End')
      await expect(slider).toHaveValue('4')
      await expect(diagram.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
      await page.keyboard.press('ArrowLeft')
      await expect(slider).toHaveValue('3.99')
      await expect(diagram).toHaveAttribute('data-stage', '4')
      await expect(slider).toHaveAttribute('aria-valuetext', `5 / 5、${figure.labels[4]}`)
      await diagram.getByRole('button', { name: '前の段階', exact: true }).click()
      await expect(slider).toHaveValue('3')
      await diagram.getByRole('button', { name: '次の段階', exact: true }).click()
      await expect(slider).toHaveValue('4')
    })

    test(`${figure.id}: playback advances, actually pauses and can restart`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      // Install before hydration: an in-flight transition must not retain a
      // native performance.now() start while its later frames use a new clock.
      await page.clock.install({ time: new Date('2026-09-24T00:00:00Z') })
      const diagram = await openFigure(page, figure)
      await selectStage(diagram, figure, 0)
      // install() alone leaves the clock running. Explicitly pause it before
      // advancing frames. Finish the 800 ms seek before measuring playback;
      // a range value can round to "0" before its animation actually ends.
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
      const slider = diagram.getByRole('slider', { name: '図解の再生位置' })
      await expect(slider).toHaveValue('0')
      await expect(diagram).toHaveAttribute('data-mode', 'manual')
      await diagram.getByRole('button', { name: '図解を再生', exact: true }).click()
      await expect(diagram).toHaveAttribute('data-mode', 'playing')
      await page.clock.runFor(5000)
      await expect(diagram).toHaveAttribute('data-stage', '1')
      // A 5 s interval advances approximately 5 / 4.5 stages; rounding and one
      // animation frame account for less than 0.01 of a stage.
      expect(Math.abs(Number(await slider.inputValue()) - 5000 / 4500)).toBeLessThanOrEqual(0.01)
      await diagram.getByRole('button', { name: '図解を一時停止', exact: true }).click()
      await expect(diagram).toHaveAttribute('data-mode', 'manual')
      const paused = await slider.inputValue()
      await page.clock.runFor(5000)
      await expect(slider).toHaveValue(paused)
      await diagram.getByRole('group', { name: '図解の段階' }).getByRole('button', { name: figure.labels[4], exact: true }).click()
      await page.clock.runFor(900)
      await expect(slider).toHaveValue('4')
      await diagram.getByRole('button', { name: '図解を最初から再生', exact: true }).click()
      await page.clock.runFor(100)
      await expect(diagram).toHaveAttribute('data-stage', '0')
      await expect(diagram).toHaveAttribute('data-mode', 'playing')
      await page.clock.runFor(18500)
      await expect(slider).toHaveValue('4')
      await expect(diagram).toHaveAttribute('data-mode', 'manual')
    })

    test(`${figure.id}: expansion shares selections and restores keyboard focus`, async ({ page }) => {
      const diagram = await openFigure(page, figure)
      await selectStage(diagram, figure, figure.id === 'agent-loop' ? 3 : 2)
      const expand = diagram.getByRole('button', { name: '図を拡大', exact: true })
      await expand.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: `${figure.title}の拡大図`, exact: true })
      await expect(dialog).toBeVisible()
      expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true)
      await expect(dialog.getByRole('button', { name: '拡大図を閉じる', exact: true })).toBeFocused()
      const expanded = dialog.locator('.aw-diagram')
      if (figure.id === 'agent-loop') {
        await expanded.getByRole('combobox', { name: '応答の種類', exact: true }).selectOption('refused')
        await expect(expanded.locator('svg.aw-scene')).toHaveAttribute('data-tool-executed', 'false')
      } else {
        await expanded.getByRole('combobox', { name: '本文の判断経路', exact: true }).selectOption('routing')
        await expect(expanded.locator('g[data-choice]')).toHaveAttribute('data-choice', 'routing')
      }
      await selectStage(expanded, figure, 4)
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(expand).toBeFocused()
      await expect(diagram).toHaveAttribute('data-stage', '4')
      if (figure.id === 'agent-loop') {
        await expect(diagram.getByRole('combobox', { name: '応答の種類', exact: true })).toHaveValue('refused')
      } else {
        await selectStage(diagram, figure, 2)
        await expect(diagram.getByRole('combobox', { name: '本文の判断経路', exact: true })).toHaveValue('routing')
      }
    })

    test(`${figure.id}: print retains source prose and a static figure without controls`, async ({ page }) => {
      const diagram = await openFigure(page, figure)
      await selectStage(diagram, figure, 3)
      await page.emulateMedia({ media: 'print' })
      await expect(root(page, figure).locator('.aw-prose')).toBeVisible()
      await expect(diagram.locator('svg.aw-scene')).toBeVisible()
      await expect(diagram.locator('.aw-timeline')).toBeHidden()
      await expect(diagram.locator('.rf-scene-controls')).toBeHidden()
      expect(await root(page, figure).locator('.aw-sticky').evaluate(element => getComputedStyle(element).position)).toBe('static')
      await expect(diagram).toHaveAttribute('data-mode', 'manual')
      await expect(diagram).toHaveAttribute('data-stage', '3')
      await expect(root(page, figure).locator('.aw-prose')).toContainText(figure.id === 'agent-loop' ? 'ツール要求がないことだけでは正常完了と判定できません' : '予測可能な部分をコードに固定し')
    })
  }

  test('loop response routes, tool outcomes and application stops match the model without executing refused or truncated requests', async ({ page }) => {
    const figure = figures[0], diagram = await openFigure(page, figure)
    const responseSelect = diagram.getByRole('combobox', { name: '応答の種類', exact: true })
    const scene = diagram.locator('svg.aw-scene')
    for (const response of ['tool', 'complete', 'truncated', 'refused', 'continue']) {
      await responseSelect.selectOption(response)
      for (let stage = 0; stage < 5; stage++) {
        await selectStage(diagram, figure, stage)
        const frame = loopFrame(stage, response, 'continue', 'success')
        await expect(scene).toHaveAttribute('data-tool-executed', String(frame.toolExecuted))
        await expect(scene).toHaveAttribute('data-terminal', frame.terminal || 'none')
        await expect(scene).toHaveAttribute('data-repeats', String(frame.repeats))
        await expect(diagram.locator('.aw-detail')).toHaveText(frame.detail)
        if (['truncated', 'refused', 'complete', 'continue'].includes(response)) await expect(scene).toHaveAttribute('data-tool-executed', 'false')
        if (stage >= 3 && ['truncated', 'refused'].includes(response)) {
          await expect(scene).toHaveAttribute('data-terminal', 'incomplete')
          await expect(scene).toHaveAttribute('data-repeats', 'false')
          await expect(scene.locator('.cd-card[data-active="true"]')).not.toContainText('ツール実行')
        }
      }
    }
    await responseSelect.selectOption('tool')
    await selectStage(diagram, figure, 3)
    await diagram.getByRole('combobox', { name: 'ツール結果', exact: true }).selectOption('failure')
    await expect(scene).toHaveAttribute('data-tool-executed', 'true')
    await expect(scene.locator('.cd-history-label')).toContainText(['モデルの応答', 'ツール結果（失敗）'])
    await expect(diagram.locator('.aw-detail')).toHaveText(loopFrame(3, 'tool', 'continue', 'failure').detail)
    await diagram.getByRole('combobox', { name: 'ツール結果', exact: true }).selectOption('success')
    await expect(scene.locator('.cd-history-label')).toContainText(['モデルの応答', 'ツール結果（成功）'])
    await selectStage(diagram, figure, 4)
    for (const response of ['tool', 'continue']) {
      await responseSelect.selectOption(response)
      const boundary = diagram.getByRole('combobox', { name: 'アプリの停止条件', exact: true })
      await boundary.selectOption('stop')
      await expect(scene).toHaveAttribute('data-terminal', 'incomplete')
      await expect(scene).toHaveAttribute('data-repeats', 'false')
      await boundary.selectOption('continue')
      await expect(scene).toHaveAttribute('data-terminal', 'none')
      await expect(scene).toHaveAttribute('data-repeats', 'true')
    }
  })

  test('workflow controls retain all seven comparisons, four source decisions and both hybrid directions', async ({ page }) => {
    const figure = figures[1], diagram = await openFigure(page, figure)
    await selectStage(diagram, figure, 1)
    const criteria = ['予測可能性', 'デバッグ性', 'コスト', 'レイテンシ', '柔軟性', '評価', '失敗モード']
    for (let index = 0; index < criteria.length; index++) {
      await diagram.getByRole('combobox', { name: '比較する観点', exact: true }).selectOption(String(index))
      await expect(diagram.locator('svg.aw-scene')).toHaveAttribute('data-criterion', criteria[index])
      await expect(diagram.locator('.cd-comparison-cards')).toContainText(criteria[index])
    }
    await selectStage(diagram, figure, 2)
    for (const choice of ['fixed', 'routing', 'bounded', 'open']) {
      await diagram.getByRole('combobox', { name: '本文の判断経路', exact: true }).selectOption(choice)
      await expect(diagram.locator('g[data-choice]')).toHaveAttribute('data-choice', choice)
    }
    await expect(diagram.locator('g[data-choice]')).toContainText('停止条件・権限を最初に設計')
    await selectStage(diagram, figure, 3)
    for (const hybrid of ['workflow', 'agent']) {
      await diagram.getByRole('combobox', { name: 'ハイブリッドの向き', exact: true }).selectOption(hybrid)
      await expect(diagram.locator('g[data-hybrid]')).toHaveAttribute('data-hybrid', hybrid)
    }
    await expect(diagram.locator('g[data-hybrid]')).toContainText('Agent のツールとして Workflow')
  })
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
  for (const theme of viewport.width === 390 ? ['light', 'dark'] : ['light']) {
    test.describe(`reading figures ${viewport.width}x${viewport.height} ${theme}`, () => {
      test.use({ viewport, colorScheme: theme, reducedMotion: 'reduce' })
      for (const figure of figures) {
        test(`${figure.id}: scenes and controls fit, with safe scrolling when the panel is tall`, async ({ page }) => {
          const diagram = await openFigure(page, figure, theme)
          for (let stage = 0; stage < 5; stage++) {
            await selectStage(diagram, figure, stage)
            await noHorizontalOverflow(page)
            await sceneTextFits(diagram)
            const overflow = await diagram.evaluate(element => [...element.querySelectorAll('button,input,select')].filter(control => control.getClientRects().length).map(control => {
              const box = element.getBoundingClientRect(), bounds = control.getBoundingClientRect()
              return Math.max(box.left - bounds.left, bounds.right - box.right)
            }))
            expect(Math.max(...overflow)).toBeLessThanOrEqual(1)
          }
          const panel = root(page, figure).locator('.aw-sticky')
          const geometry = await panel.evaluate(element => {
            const style = getComputedStyle(element)
            return {
              height: element.getBoundingClientRect().height,
              position: style.position,
              top: Number.parseFloat(style.top),
              rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
              viewport: innerHeight
            }
          })
          const stickyTop = Number.isFinite(geometry.top) ? geometry.top : 5.1 * geometry.rootFontSize
          const bottomGap = 12
          if (geometry.height > geometry.viewport - stickyTop - bottomGap) expect(geometry.position).not.toBe('sticky')
          else if (geometry.position === 'sticky') {
            await diagram.scrollIntoViewIfNeeded()
            const bounds = await panel.boundingBox()
            expect(bounds.y).toBeGreaterThanOrEqual(0)
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - bottomGap + 1)
          }
          if (viewport.width === 1440) {
            const prose = await root(page, figure).locator('.aw-prose').boundingBox(), bounds = await panel.boundingBox()
            expect(prose.x + prose.width).toBeLessThanOrEqual(bounds.x + 1)
          }
          const sync = diagram.getByRole('button', { name: '本文に連動する', exact: true })
          // Nearest-edge scrolling can round a fractional pixel offscreen on
          // Linux Chromium. Test full reachability from a centered position.
          await sync.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
          await expect(sync).toBeInViewport({ ratio: 1 })
          await diagram.getByRole('button', { name: '図を拡大', exact: true }).click()
          const dialog = page.getByRole('dialog', { name: `${figure.title}の拡大図`, exact: true })
          await expect(dialog).toBeVisible()
          const bounds = await dialog.boundingBox()
          expect(bounds.x).toBeGreaterThanOrEqual(0)
          expect(bounds.y).toBeGreaterThanOrEqual(0)
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1)
          expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1)
          const slider = dialog.getByRole('slider', { name: '図解の再生位置' })
          await slider.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
          await expect(slider).toBeInViewport({ ratio: 1 })
          await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click()
          await expect(dialog).not.toBeVisible()
          await noHorizontalOverflow(page)
        })
      }
    })
  }
}

test.describe('reading figures without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
  for (const figure of figures) {
    test(`${figure.id}: source prose and native static explanations work without hydration`, async ({ page }) => {
      const response = await page.goto(`${basePath}${figure.path}`)
      expect(response.status()).toBe(200)
      const section = root(page, figure)
      await expect(section).toHaveAttribute('data-ready', 'false')
      await expect(section.locator('.aw-prose')).toContainText(figure.id === 'agent-loop' ? 'ツール要求がないことだけでは正常完了と判定できません' : '最も自律性の低い構成を選ぶ')
      await expect(inline(page, figure).getByRole('button', { name: '図解を再生', exact: true })).toBeDisabled()
      const staticStages = section.locator('.rf-static-stages')
      await staticStages.locator('summary').click()
      await expect(staticStages.locator('ol > li')).toHaveCount(5)
      for (const item of await staticStages.locator('ol > li').all()) await expect(item).toBeVisible()
      await expect(section.getByText('動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。', { exact: true })).toBeVisible()
      await expect(inline(page, figure).getByRole('img')).toBeVisible()
    })
  }
})
