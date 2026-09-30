import assert from 'node:assert/strict'

// Literal fractions and approved conceptual fixtures. Never import the product model.
export const alignmentPath = '/docs/llm-internals/alignment-theory'
export const alignment = [
  {
    "id": "alignment-preference",
    "marker": "ALIGNMENT / PREFERENCE",
    "attr": "data-alignment-preference-stage",
    "labels": [
      "全体",
      "選好ペア",
      "報酬差",
      "報酬とKL",
      "正則化",
      "暗黙の報酬",
      "DPO損失"
    ],
    "steps": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "controls": [
      {
        "id": "beta",
        "label": "式中の β（説明用）",
        "stages": [
          4,
          5,
          6
        ],
        "options": [
          "0.5",
          "1",
          "2"
        ],
        "default": "1"
      }
    ]
  },
  {
    "id": "alignment-reward-risk",
    "marker": "ALIGNMENT / REWARD RISK",
    "attr": "data-alignment-reward-risk-stage",
    "labels": [
      "代理と目的",
      "過剰最適化",
      "正則化と再評価"
    ],
    "steps": [
      0,
      1,
      2
    ],
    "controls": []
  },
  {
    "id": "alignment-feedback",
    "marker": "ALIGNMENT / FEEDBACK",
    "attr": "data-alignment-feedback-stage",
    "labels": [
      "検証器",
      "結果と過程",
      "適用範囲",
      "調整の副作用",
      "フィードバックの作り方"
    ],
    "steps": [
      0,
      1,
      2,
      3,
      4
    ],
    "controls": [
      {
        "id": "labelSource",
        "label": "選好ラベルの作り手",
        "stages": [
          4
        ],
        "options": [
          "human",
          "ai"
        ],
        "default": "human"
      }
    ]
  }
]
export const alignmentProfiles = [[1440,1000,'light',1],[1440,1000,'dark',1],[1280,720,'light',1],[390,844,'light',1],[390,844,'dark',1],[960,540,'light',2]]
const headings = ["概要: 「良さ」をどう最適化するか","RLHF の定式化","DPO の導出: 報酬モデルを消す","報酬の過剰最適化(Goodhart)","検証可能報酬(RLVR)とプロセス報酬","迎合とアラインメント税","この理解が効く場面","アンチパターン","チェックリスト"]

export async function runAlignmentChecks(api) {
  const { check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect } = api
  async function source(page) {
    await expect(page.locator('article h3')).toHaveText(headings, { useInnerText: true })
    await expect(page.locator('article .katex-display')).toHaveCount(4)
    const mermaid = page.locator('article [data-mermaid-renderer="strict"]')
    await expect(mermaid).toHaveCount(1)
    assert.equal(await mermaid.evaluate(node => node.closest('.reading-figure')?.dataset.diagramId), 'alignment-preference')
    for (const text of ['報酬の出所', '評価する粒度', '期待値', '迎合']) await expect(page.locator('article')).toContainText(text)
    for (const heading of headings.slice(6)) assert.equal(await page.locator('article h3').filter({ hasText: heading }).evaluate(node => node.closest('.reading-figure') === null), true)
  }
  async function openAlignment(page, result, options = {}) {
    await open(page, alignmentPath, alignment, result, options)
    await structure(page, alignment, 4, result, 9)
    await source(page)
  }
  const defaultSettings = figure => Object.fromEntries(figure.controls.map(control => [control.id, String(control.default)]))
  async function semantics(panel, figure, index, settings = defaultSettings(figure)) {
    await assertSceneSemantics(panel, figure, index, settings, expect)
  }
  async function visibleGeometry(panel, result, label) {
    const observation = await panel.locator('svg.aw-scene').evaluate(svg => {
      const screen = svg.getScreenCTM(), inverse = screen.inverse()
      const nodes = [...svg.querySelectorAll('text')].filter(node => {
        for (let current = node; current && current !== svg; current = current.parentElement) {
          const style = getComputedStyle(current)
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
        }
        return true
      })
      const boxes = nodes.map(node => {
        const box = node.getBBox(), matrix = inverse.multiply(node.getScreenCTM())
        const points = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
        return { text: node.textContent, x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)), right: Math.max(...points.map(p => p.x)), bottom: Math.max(...points.map(p => p.y)) }
      })
      const overlapCandidates = []
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j], width = Math.min(a.right, b.right) - Math.max(a.x, b.x), height = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y)
        if (width > 0 && height > 0) overlapCandidates.push({ textBoxesSVG: [a, b], intersectionSVG: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), width, height } })
      }
      const wireText = []
      for (const wire of svg.querySelectorAll('.cd-wire path')) {
        const matrix = inverse.multiply(wire.getScreenCTM()), length = wire.getTotalLength()
        for (let at = 0; at <= length; at++) {
          const point = wire.getPointAtLength(at).matrixTransform(matrix)
          const box = boxes.find(box => point.x > box.x - 2 && point.x < box.right + 2 && point.y > box.y - 2 && point.y < box.bottom + 2)
          if (box) { wireText.push(box.text); break }
        }
      }
      const fonts = nodes.map(node => { const matrix = node.getScreenCTM(); return { text: node.textContent, renderedFontPx: parseFloat(getComputedStyle(node).fontSize) * Math.min(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)) } })
      return { overlapCandidates, wireText, fonts, devicePixelRatio, rendered: { width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height } }
    })
    assert.deepEqual(observation.wireText, [], 'alignment wire crosses text')
    assert.ok(observation.fonts.length > 0 && observation.fonts.every(font => Number.isFinite(font.renderedFontPx) && font.renderedFontPx > 0))
    ;(result.alignmentGeometryObservations ??= []).push({ label, ...observation })
    result.visualReviewRequired ||= observation.overlapCandidates.length > 0
    result.independentVisualReviewStatus = 'pending-independent-public-image-review'
    return observation
  }
  async function capture(page, panel, result, name) {
    await screenshot(page, name)
    await screenshot(page, name + '-scene', panel.locator('svg.aw-scene'))
    const observation = result.alignmentGeometryObservations.at(-1)
    observation.screenshots = { viewport: name + '.png', completeScene: name + '-scene.png' }
  }
  for (const [width, height, theme, deviceScaleFactor] of alignmentProfiles) await check(`alignment: all 15 stages ${width}x${height} ${theme} DSF${deviceScaleFactor}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme, deviceScaleFactor }, async page => {
      await openAlignment(page, result, { theme }); result.geometry = {}
      if (width === 390) await verifyDPOFormula(page, expect, result)
      for (const figure of alignment) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index)
          result.geometry[figure.id].push({ stage: index, ...await geometry(page, panel), ...await visibleGeometry(panel, result, `${figure.id} stage ${index}`) })
          await capture(page, panel, result, `${figure.id}-stage-${index}-${width}x${height}-${theme}-dsf${deviceScaleFactor}`)
        }
        if (height <= 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
      }
    }); sceneDelivery(result, alignment)
  })
  for (const figure of alignment) await check(`${figure.id}: independent semantic fixtures, every selector and midpoint reverse seeks`, async result => {
    await usePage(result, {}, async page => {
      await openAlignment(page, result)
      const panel = panelOf(page, figure.id), settings = defaultSettings(figure)
      const forward = Array.from({ length: figure.labels.length - 1 }, (_, index) => [index + .49, index + .5, index + .51]).flat()
      for (const value of [...forward, ...forward.toReversed()]) {
        await phase(panel, value); const index = Math.round(value)
        await semantics(panel, figure, index, settings)
        await expect(panel.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button').nth(index)).toHaveAttribute('aria-pressed', 'true')
        await expect(panel.getByRole('slider')).toHaveAttribute('aria-valuetext', `${index + 1} / ${figure.labels.length}、${figure.labels[index]}`)
      }
      result.midpointVisits = forward.length * 2; result.selectorVisits = []
      for (const control of figure.controls) for (const index of control.stages) {
        await stage(panel, figure, index)
        const select = panel.getByRole('combobox', { name: control.label, exact: true })
        assert.deepEqual(await select.locator('option').evaluateAll(nodes => nodes.map(node => node.value)), control.options.map(String))
        for (const option of control.options) {
          const value = String(option); await select.selectOption(value); settings[control.id] = value
          await semantics(panel, figure, index, settings); await geometry(page, panel)
          await visibleGeometry(panel, result, `${figure.id} ${control.id}=${value} stage ${index}`)
          await capture(page, panel, result, `${figure.id}-${control.id}-${value}-stage-${index}`)
          result.selectorVisits.push({ control: control.id, value, stage: index })
        }
        await stage(panel, figure, 0); await semantics(panel, figure, 0, settings)
        await stage(panel, figure, index); await expect(select).toHaveValue(String(control.options.at(-1)))
      }
      result.selectedStateGrid = []
      for (const control of figure.controls) for (const option of control.options) {
        await stage(panel, figure, control.stages[0])
        await panel.getByRole('combobox', { name: control.label, exact: true }).selectOption(String(option)); settings[control.id] = String(option)
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index, settings)
          result.selectedStateGrid.push({ control: control.id, selected: String(option), stage: index, active: control.stages.includes(index) })
        }
      }
      for (let index = 0; index < figure.labels.length; index++) { await stage(panel, figure, index); await semantics(panel, figure, index, settings) }
    })
  })
  await check('alignment: keyboard transport, modal selectors, isolated state and focus return', async result => {
    await usePage(result, {}, async page => {
      await openAlignment(page, result)
      for (const figure of alignment) await stage(panelOf(page, figure.id), figure, 0)
      for (const figure of alignment) {
        const panel = panelOf(page, figure.id), control = figure.controls[0], settings = defaultSettings(figure)
        const others = alignment.filter(item => item !== figure), previous = await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue()))
        await stage(panel, figure, 0); const slider = panel.getByRole('slider')
        await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0'); await expect(panel.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        const index = control ? control.stages[0] : 2; await stage(panel, figure, index)
        const opener = panel.getByRole('button', { name: '図を拡大', exact: true }); await opener.focus(); await page.keyboard.press('Enter')
        const dialog = rootOf(page, figure.id).getByRole('dialog'), large = dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible(); assert.equal(await dialog.evaluate(node => node.matches(':modal')), true)
        const value = control ? String(control.options.at(-1)) : null
        if (control) { settings[control.id] = value; await large.getByLabel(control.label, { exact: true }).selectOption(value) }
        await semantics(large, figure, index, settings); await geometry(page, large); await visibleGeometry(large, result, `${figure.id} expanded`); await capture(page, large, result, `${figure.id}-expanded`)
        await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused(); if (control) await expect(panel.getByLabel(control.label, { exact: true })).toHaveValue(value)
        await opener.click(); await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(opener).toBeFocused()
        assert.deepEqual(await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue())), previous, 'Modal changes must not move other figures')
        const ids = await rootOf(page, figure.id).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id)); assert.equal(new Set(ids).size, ids.length)
      }
    })
  })
  await check('alignment: all 15 READ stops, no manual-only stages and independent figure states', async result => {
    await usePage(result, {}, async page => {
      await openAlignment(page, result); result.readingStops = {}
      for (const figure of alignment) await stage(panelOf(page, figure.id), figure, 0)
      const scroll = async (figure, index, edge = 'top') => {
        await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate((node, edge) => window.scrollTo({ top: scrollY + node.getBoundingClientRect()[edge] - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }), edge)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      }
      for (const figure of alignment) {
        for (let index = 0; index < figure.labels.length; index++) if (!figure.steps.includes(index)) await expect(rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`)).toHaveCount(0)
        const panel = panelOf(page, figure.id), others = alignment.filter(item => item !== figure)
        const previous = await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue()))
        await stage(panel, figure, figure.labels.length - 1)
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
        for (const index of [...figure.steps, ...figure.steps.toReversed()]) {
          await scroll(figure, index); await expect(panel).toHaveAttribute('data-mode', 'reading'); await expect(panel).toHaveAttribute('data-stage', String(index)); await semantics(panel, figure, index)
        }
        await scroll(figure, figure.steps.at(-1), 'bottom'); await expect(panel).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        await stage(panel, figure, 0); await scroll(figure, figure.steps.at(-1)); await expect(panel).toHaveAttribute('data-mode', 'manual'); await expect(panel).toHaveAttribute('data-stage', '0')
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click(); await scroll(figure, figure.steps[0]); await expect(panel).toHaveAttribute('data-stage', String(figure.steps[0]))
        await panel.getByRole('button', { name: '本文に連動中', exact: true }).click()
        assert.deepEqual(await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue())), previous, 'Reading/manual changes must not move other figures')
        result.readingStops[figure.id] = { forward: figure.steps, reverse: figure.steps.toReversed() }
      }
    })
  })
  for (const figure of alignment) await check(`${figure.id}: native elapsed play, frozen pause, replay and completion`, async result => {
    await usePage(result, {}, async page => {
      await openAlignment(page, result); const panel = panelOf(page, figure.id), slider = panel.getByRole('slider')
      await stage(panel, figure, 0); await panel.scrollIntoViewIfNeeded()
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(900); const started = Date.now()
      await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing'); await page.waitForTimeout(5200)
      const progress = Number(await slider.inputValue()); assert.ok(progress > .6 && progress < 2)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'manual')
      const paused = await slider.inputValue(), frozen = await panel.locator('svg.aw-scene').evaluate(node => node.innerHTML), controls = await panel.locator('select').evaluateAll(nodes => nodes.map(node => node.value))
      await page.waitForTimeout(1000); assert.equal(await slider.inputValue(), paused); assert.equal(await panel.locator('svg.aw-scene').evaluate(node => node.innerHTML), frozen)
      assert.deepEqual(await panel.locator('select').evaluateAll(nodes => nodes.map(node => node.value)), controls)
      await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, figure.labels.length - 1); await page.emulateMedia({ reducedMotion: 'no-preference' })
      await panel.getByRole('button', { name: '図解を最初から再生', exact: true }).click(); await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(.5)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click()
      await phase(panel, figure.labels.length - 1 - .2); await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await page.waitForTimeout(1500)
      await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel).toHaveAttribute('data-mode', 'manual'); await semantics(panel, figure, figure.labels.length - 1)
      result.playback = { clock: 'native browser time; no fake clock', elapsedMs: Date.now() - started, progress, paused, frozen: true, replay: true, completion: true }
    })
  })
  await check('alignment noJS: original prose, nine headings, four equations, Mermaid and 15 static descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await openAlignment(page, result, { noJS: true })
      for (const figure of alignment) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible()
        await expect(root.locator('.rf-static-stages li strong')).toHaveText(figure.labels)
        for (const item of await root.locator('.rf-static-stages li > span').all()) assert.ok((await item.textContent()).trim().length > 20)
        await screenshot(page, `alignment-no-javascript-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await screenshot(page, 'alignment-no-javascript')
    })
  })
  await check('alignment print: coherent scenes and original article with controls hidden', async result => {
    await usePage(result, {}, async page => {
      await openAlignment(page, result)
      for (const figure of alignment) await phase(panelOf(page, figure.id), Math.min(2.25, figure.labels.length - 1 - .25))
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.emulateMedia({ media: 'print' })
      for (const figure of alignment) {
        const panel = panelOf(page, figure.id)
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        await expect(panel.locator('.aw-timeline')).not.toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
        const current = Number(await panel.getAttribute('data-stage')); assert.ok(Number.isInteger(current)); await semantics(panel, figure, current)
        await screenshot(page, `alignment-print-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await source(page); await screenshot(page, 'alignment-print'); result.print = 'CSS emulation with beforeprint; not physical printing'
    })
  })
}

// These expectations are independent of every product helper and model.
export const ALIGNMENT_ORACLE = {
  explicit: { winner: Math.log(3), loser: 0, margin: Math.log(3), probability: 3 / 4 },
  rows: [
    { id: 'y-w', input: 'x-0', p: 1 / 2, q: 1 / 4, ratio: 2, logRatio: Math.log(2) },
    { id: 'y-l', input: 'x-0', p: 1 / 8, q: 1 / 4, ratio: 1 / 2, logRatio: -Math.log(2) }
  ],
  dpo: {
    '0.5': { margin: Math.log(2), probability: 2 / 3, loss: Math.log(3 / 2) },
    '1': { margin: Math.log(4), probability: 4 / 5, loss: Math.log(5 / 4) },
    '2': { margin: Math.log(16), probability: 16 / 17, loss: Math.log(17 / 16) }
  },
  evaluationMarks: [
    { granularity: 'outcome', target: 'final' },
    { granularity: 'process', target: 'step-1' },
    { granularity: 'process', target: 'step-2' },
    { granularity: 'process', target: 'step-3' }
  ]
}
export const ALIGNMENT_PREFERENCE_ORACLE = { rows: ALIGNMENT_ORACLE.rows, explicit: ALIGNMENT_ORACLE.explicit, dpo: ALIGNMENT_ORACLE.dpo }
export const ALIGNMENT_RISK_ORACLE = { output: 'answer-0', lanes: ['proxy', 'quality'], symptoms: ['verbosity', 'appearance'], guarantee: false }
export const ALIGNMENT_FEEDBACK_ORACLE = { answer: 'answer-0', marks: ALIGNMENT_ORACLE.evaluationMarks, sources: ['verifier', 'learned-reward-model'], axes: ['source', 'granularity'] }
const near = (actual, expected, message) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-12, message)
export function assertPreferenceObservation(value, beta) {
  assert.ok(Object.hasOwn(ALIGNMENT_ORACLE.dpo, String(beta)), 'Only three fixed beta values')
  assert.deepEqual(value.rows.map(row => ({ id: row.id, input: row.input })), ALIGNMENT_ORACLE.rows.map(row => ({ id: row.id, input: row.input })), 'Both rows retain the same input and response IDs')
  value.rows.forEach((row, i) => {
    const fixed = ALIGNMENT_ORACLE.rows[i]
    for (const key of ['p', 'q', 'ratio', 'logRatio']) near(row[key], fixed[key], `Fixed response ${key} differs`)
    near(row.weighted, Number(beta) * fixed.logRatio, 'Beta weights fixed log probabilities, never new distributions')
  })
  assert.equal(value.fullKL, 'unknown', 'Full-response KL cannot be computed from these two responses')
  assert.deepEqual(value.normalizers.map(row => ({ id: row.id, input: row.input })), [{ id: 'z-x-0', input: 'x-0' }, { id: 'z-x-0', input: 'x-0' }], 'Cancel exactly two identical same-input Z terms')
  if (value.stage === 6) {
    assert.ok(value.normalizers.every(row => row.cancelled === 'true'), 'Both Z terms cancel at DPO')
    const oracle = ALIGNMENT_ORACLE.dpo[String(beta)]
    near(value.margin, oracle.margin, 'DPO margin differs'); near(value.probability, oracle.probability, 'DPO sigmoid differs'); near(value.loss, oracle.loss, 'One-pair negative log loss differs')
    assert.equal(value.aggregation, 'expectation', 'One-pair loss is not the full expected objective')
  } else { assert.equal(value.stage, 5); assert.ok(value.normalizers.every(row => row.cancelled === 'false'), 'Z terms have not cancelled yet') }
}
export function assertRiskObservation(value) {
  assert.equal(value.output, 'answer-0', 'Both evaluations share one output')
  assert.deepEqual(value.lanes, [{ id: 'proxy', value: 'unknown' }, { id: 'quality', value: 'unknown' }], 'Proxy and separate quality evaluation remain unknown')
  assert.equal(value.guarantee, 'false', 'No quality guarantee')
  if (value.stage === 1) assert.deepEqual(value.symptoms, ['verbosity', 'appearance'], 'Both symptoms are required')
  if (value.stage === 2) { assert.equal(value.constraint, 'kl'); assert.equal(value.reassessment, 'true'); assert.equal(value.suppressionGuarantee, 'false') }
}
export function assertFeedbackObservation(value) {
  assert.equal(value.harmlessness, 'false'); assert.equal(value.universality, 'false')
  if (value.stage <= 2) assert.equal(value.answer, 'answer-0')
  if (value.stage === 1) assert.deepEqual(value.marks, ALIGNMENT_ORACLE.evaluationMarks, 'Outcome is final only; process evaluates three intermediate steps')
  if (value.stage === 2) {
    assert.deepEqual(value.axes, ['source', 'granularity'], 'Reward source and evaluation granularity are separate axes')
    assert.deepEqual(value.sources, ['verifier', 'learned-reward-model'])
    assert.deepEqual(value.granularities.toSorted(), ['outcome', 'process']); assert.equal(value.relation, 'orthogonal'); assert.equal(value.caveat, 'true')
  }
  if (value.stage === 3) assert.deepEqual(value.sideEffects, [{ id: 'sycophancy', universal: 'false' }, { id: 'alignment-tax', universal: 'false' }])
  if (value.stage === 4) {
    assert.deepEqual(value.labels.map(row => row.id), ['human', 'ai'])
    assert.deepEqual(value.labels.map(row => row.emphasized), ['human', 'ai'].map(id => String(id === value.selected)))
    assert.equal(value.target, 'preference-data'); assert.equal(value.labelGuarantee, 'false')
  }
}

async function assertSceneSemantics(panel, figure, index, settings, expect) {
  const svg = panel.locator('svg.aw-scene')
  await expect(svg).toHaveAttribute(figure.attr, String(index))
  await expect(svg).toHaveAttribute('data-empirical-measurement', 'false')
  for (const control of figure.controls) {
    const field = panel.getByRole('combobox', { name: control.label, exact: true })
    if (control.stages.includes(index)) await expect(field).toBeVisible()
    else await expect(field).toHaveCount(0)
  }
  const visible = async (selector, text) => { const node = svg.locator(selector); await expect(node).toBeVisible(); if (text) await expect(node).toContainText(text); return node }
  const approximate = async (selector, expected) => {
    const node = await visible(selector); near(Number(await node.getAttribute('data-value')), expected, `Raw ${selector} differs`)
    await expect(node).toContainText('≈'); await expect(node).toContainText(expected.toFixed(3))
  }
  if (figure.id === 'alignment-preference') {
    await expect(svg).toHaveAttribute('data-training-trajectory', 'false'); await expect(svg).toHaveAttribute('data-update-guarantee', 'false')
    const beta = index >= 4 ? Number(settings.beta) : 1
    if (index === 0) {
      await visible('[data-preference-route="rlhf"]', 'RLHF'); await visible('[data-preference-route="dpo"]', 'DPO')
      await visible('[data-rlvr-entry="separate"]', 'RLVR')
      for (const text of ['選好', '報酬', '方策']) await expect(svg).toContainText(text)
    } else {
      const rows = svg.locator('[data-response-id]'); await expect(rows).toHaveCount(2)
      assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.responseId, input: node.dataset.inputId }))), [{ id: 'y-w', input: 'x-0' }, { id: 'y-l', input: 'x-0' }])
      for (const row of await rows.all()) await expect(row).toBeVisible()
      for (const text of ['勝ち', '負け']) await expect(svg).toContainText(text)
    }
    if (index === 1) await visible('[data-pair-correctness-guarantee="false"]', '正誤判定')
    if (index === 2) {
      for (const [id, value] of [['y-w', Math.log(3)], ['y-l', 0]]) {
        const node = await visible(`[data-explicit-reward-id="${id}"]`)
        near(Number(await node.getAttribute('data-reward-score')), value, 'Explicit reward score differs')
      }
      await approximate('[data-bradley-terry-margin]', Math.log(3)); await approximate('[data-bradley-terry-probability]', 3 / 4)
    }
    if (index >= 3) {
      await visible('[data-reference-policy="pi-ref"][data-fixed="true"]', '参照')
      await visible('[data-full-response-kl="unknown"]', '未計算')
    }
    if ([3, 4].includes(index)) {
      await visible('[data-objective-term="reward"]', '報酬'); await visible('[data-objective-term="kl"]', 'KL'); await visible('[data-objective-operator="minus"]', '−')
    }
    if (index >= 4) { const node = await visible('[data-preference-beta]', 'β'); near(Number(await node.getAttribute('data-value')), beta, 'Effective beta differs'); for (const text of ['固定', '更新量', '品質']) await expect(panel).toContainText(text) }
    if (index >= 5) {
      const observation = await svg.evaluate(node => ({
        stage: Number(node.dataset.alignmentPreferenceStage), fullKL: node.querySelector('[data-full-response-kl]')?.dataset.fullResponseKl,
        rows: [...node.querySelectorAll('[data-probability-row]')].map(row => ({ id: row.dataset.probabilityRow, input: row.dataset.inputId, p: Number(row.dataset.policyProbability), q: Number(row.dataset.referenceProbability), ratio: Number(row.dataset.ratio), logRatio: Number(row.dataset.logRatio), weighted: Number(row.dataset.weightedLogRatio) })),
        normalizers: [...node.querySelectorAll('[data-normalizer-term-id]')].map(row => ({ id: row.dataset.normalizerTermId, input: row.dataset.inputId, cancelled: row.dataset.cancelled })),
        margin: Number(node.querySelector('[data-dpo-pair-margin]')?.dataset.value), probability: Number(node.querySelector('[data-dpo-pair-probability]')?.dataset.value), loss: Number(node.querySelector('[data-dpo-pair-loss]')?.dataset.value), aggregation: node.querySelector('[data-dpo-aggregation]')?.dataset.dpoAggregation
      }))
      assertPreferenceObservation(observation, beta)
      for (const [at, row] of (await svg.locator('[data-probability-row]').all()).entries()) {
        await expect(row).toBeVisible(); await expect(row).toContainText('πθ / πref')
        await expect(row).toContainText(at ? '1/8 ÷ 1/4 = 1/2' : '1/2 ÷ 1/4 = 2')
        await expect(row).toContainText('≈ ' + (beta * ALIGNMENT_ORACLE.rows[at].logRatio).toFixed(3))
      }
      for (const term of await svg.locator('[data-normalizer-term-id]').all()) { await expect(term).toBeVisible(); await expect(term).toContainText('Z'); if (index === 6) assert.ok(await term.locator('line,path').count() > 0, 'Cancellation has a visible strike') }
      if (index === 6) {
        const oracle = ALIGNMENT_ORACLE.dpo[String(beta)]
        await approximate('[data-dpo-pair-margin]', oracle.margin); await approximate('[data-dpo-pair-probability]', oracle.probability); await approximate('[data-dpo-pair-loss]', oracle.loss)
        await visible('[data-dpo-aggregation="expectation"]', '期待値')
        for (const text of ['直接', '別設計']) await expect(svg).toContainText(text)
      }
    }
  } else if (figure.id === 'alignment-reward-risk') {
    const observation = await svg.evaluate(node => ({ stage: Number(node.dataset.alignmentRewardRiskStage), output: node.querySelector('[data-risk-output-id]')?.dataset.riskOutputId, lanes: [...node.querySelectorAll('[data-evaluation-lane]')].map(row => ({ id: row.dataset.evaluationLane, value: row.dataset.value })), guarantee: node.dataset.qualityGuarantee, symptoms: [...node.querySelectorAll('[data-risk-symptom]')].map(row => row.dataset.riskSymptom), constraint: node.querySelector('[data-risk-constraint]')?.dataset.riskConstraint, reassessment: node.querySelector('[data-risk-reassessment]')?.dataset.riskReassessment, suppressionGuarantee: node.querySelector('[data-risk-guarantee]')?.dataset.riskGuarantee }))
    assertRiskObservation(observation)
    await visible('[data-risk-output-id="answer-0"]', '同じ出力'); await visible('[data-evaluation-lane="proxy"]', '代理報酬'); await visible('[data-evaluation-lane="quality"]', '別の品質評価')
    await expect(svg).toContainText('真の良さそのもの')
    if (index === 1) { await visible('[data-risk-emphasis="proxy"]', '代理への最適化'); await visible('[data-risk-symptom="verbosity"]', '冗長'); await visible('[data-risk-symptom="appearance"]', '体裁'); await visible('[data-quality-divergence="true"]', 'ずれうる') }
    if (index === 2) { await visible('[data-risk-constraint="kl"]', 'KL'); await visible('[data-risk-reassessment="true"]', '再評価'); await visible('[data-risk-guarantee="false"]', '保証ではない') }
    assert.ok(await svg.locator('.cd-wire path').count() >= 3, 'Both evaluation connections must be drawn')
  } else {
    const observation = await svg.evaluate((node, selected) => ({
      stage: Number(node.dataset.alignmentFeedbackStage), harmlessness: node.dataset.harmlessnessGuarantee, universality: node.dataset.sideEffectGuarantee,
      answer: node.querySelector('[data-answer-id]')?.dataset.answerId, marks: [...node.querySelectorAll('[data-evaluation-mark]')].map(row => ({ granularity: row.dataset.granularity, target: row.dataset.targetStep })), axes: [...node.querySelectorAll('[data-feedback-axis]')].map(row => row.dataset.feedbackAxis), sources: [...node.querySelectorAll('[data-reward-source]')].map(row => row.dataset.rewardSource), granularities: [...node.querySelectorAll('[data-feedback-granularity]')].map(row => row.dataset.feedbackGranularity), relation: node.querySelector('[data-axis-relation]')?.dataset.axisRelation, caveat: node.querySelector('[data-process-source-caveat]')?.dataset.processSourceCaveat,
      sideEffects: [...node.querySelectorAll('[data-alignment-side-effect]')].map(row => ({ id: row.dataset.alignmentSideEffect, universal: row.dataset.sideEffectUniversality })), labels: [...node.querySelectorAll('[data-label-source]')].map(row => ({ id: row.dataset.labelSource, emphasized: row.dataset.emphasized })), selected, target: node.querySelector('[data-label-source-target]')?.dataset.labelSourceTarget, labelGuarantee: node.querySelector('[data-label-source-guarantee]')?.dataset.labelSourceGuarantee
    }), settings.labelSource)
    assertFeedbackObservation(observation)
    if (index <= 2) { await visible('[data-answer-id="answer-0"]', '同じ解答'); assert.deepEqual(await svg.locator('[data-step-id]').evaluateAll(nodes => nodes.map(node => node.dataset.stepId)), ['step-1', 'step-2', 'step-3', 'final']) }
    if ([0, 2].includes(index)) { await visible('[data-reward-source="verifier"]', '検証器'); await visible('[data-rlvr-scope="verifiable-reward"]', '報酬を検証できる範囲') }
    if (index === 1) { for (const mark of await svg.locator('[data-evaluation-mark]').all()) await expect(mark).toBeVisible(); for (const text of ['結果：最終', '過程：各段階', '正誤の判定ではない']) await expect(svg).toContainText(text) }
    if (index === 2) { await visible('[data-feedback-axis="source"]', '報酬の出所'); await visible('[data-feedback-axis="granularity"]', '評価する粒度'); await visible('[data-process-source-caveat="true"]', '人手'); await expect(svg).toContainText('人手等の段階ラベル'); await expect(svg).toContainText('学習した報酬モデル') }
    if (index === 3) { for (const text of ['迎合', 'アラインメント税', '能力：別に評価', '安全：別に評価', '全モデルの必然ではない']) await expect(svg).toContainText(text) }
    if (index === 4) { await visible('[data-label-source="human"]', '人手'); await visible('[data-label-source="ai"]', 'AI'); await visible('[data-label-source-target="preference-data"]', '選好データ'); await visible('[data-label-source-guarantee="false"]', '無害性の保証ではない') }
  }
}

async function verifyDPOFormula(page, expect, result) {
  const formula = page.locator('article .katex-display').filter({ hasText: '\\mathcal{L}_{\\mathrm{DPO}}' })
  await expect(formula).toHaveCount(1); await expect(formula).toHaveAttribute('role', 'region'); await expect(formula).toHaveAccessibleName('数式'); await expect(formula).toHaveAttribute('tabindex', '0')
  await formula.scrollIntoViewIfNeeded()
  const maximum = await formula.evaluate(element => element.scrollWidth - element.clientWidth)
  assert.ok(maximum > 50)
  await page.keyboard.press('Tab'); await formula.focus(); await expect(formula).toBeFocused()
  assert.equal(await formula.evaluate(element => element.matches(':focus-visible')), true)
  const outline = await formula.evaluate(element => ({ style: getComputedStyle(element).outlineStyle, width: parseFloat(getComputedStyle(element).outlineWidth) }))
  assert.notEqual(outline.style, 'none'); assert.ok(outline.width > 0)
  await page.keyboard.press('ArrowRight'); await expect.poll(() => formula.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  for (let press = 0; press < Math.ceil(maximum / 20) + 5; press++) await page.keyboard.press('ArrowRight')
  await expect.poll(() => formula.evaluate(element => element.scrollWidth - element.clientWidth - element.scrollLeft)).toBeLessThanOrEqual(1)
  await expectFormulaNotClipped(formula, 'right', expect)
  for (let press = 0; press < Math.ceil(maximum / 20) + 5; press++) await page.keyboard.press('ArrowLeft')
  await expect.poll(() => formula.evaluate(element => element.scrollLeft)).toBeLessThanOrEqual(1)
  await expectFormulaNotClipped(formula, 'left', expect)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1)
  result.originalDPOFormula = { role: 'region', keyboard: true, focusVisible: true, bothEnds: true, fractionsAndSubscriptsUnclipped: true }
}

async function expectFormulaNotClipped(formula, edge, expect) {
  const dimensions = await formula.evaluate((element, selectedEdge) => {
    const bounds = element.getBoundingClientRect()
    const visual = element.querySelector('.katex-html')
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT)
    const boxes = []
    while (walker.nextNode()) {
      // KaTeX uses zero-width characters in its alignment machinery. Only
      // measure text that paints a glyph, including fraction/subscript text.
      if (!walker.currentNode.textContent.replace(/[\s\u200b]/g, '')) continue
      const range = document.createRange()
      range.selectNodeContents(walker.currentNode)
      boxes.push(...Array.from(range.getClientRects()))
    }
    // Square roots intentionally draw a very wide SVG and clip its tail.
    // Measure that visible clip box, not the SVG's offscreen 400em canvas.
    boxes.push(...Array.from(visual.querySelectorAll('.hide-tail, .frac-line'), child => child.getBoundingClientRect()))
    return {
      count: boxes.length,
      verticalOverflow: element.scrollHeight - element.clientHeight,
      clippedVertically: boxes.filter(box => box.top < bounds.top - 1 || box.bottom > bounds.top + element.clientHeight + 1).length,
      edgeClipped: selectedEdge === 'left'
        ? Math.min(...boxes.map(box => box.left)) < bounds.left - 1
        : Math.max(...boxes.map(box => box.right)) > bounds.left + element.clientWidth + 1
    }
  }, edge)
  expect(dimensions.count).toBeGreaterThan(0)
  expect(dimensions.verticalOverflow).toBeLessThanOrEqual(1)
  expect(dimensions.clippedVertically).toBe(0)
  expect(dimensions.edgeClipped).toBe(false)
}
