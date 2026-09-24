import assert from 'node:assert/strict'

// Independent C1 storyboard fixtures. Never import the product's scene/model or
// manufacture expectations from a public response or local build.
export const trainingPath = '/docs/llm-foundations/llm-training-pipeline'
export const training = [
  { id: 'training-stages', labels: ['工程', '予測', '知識', '模範例', '使い分け', '選好'], steps: [0, 1, 2, 3, 4, 5], marker: 'TRAINING / STAGES', attr: 'data-training-stage', controlStage: 2, control: '確認する性質', choice: 'accuracy' },
  { id: 'training-runtime-boundary', labels: ['関係', '根拠', '評価', '実行境界'], steps: [0, 2, 3], marker: 'TRAINING / RUNTIME BOUNDARY', attr: 'data-training-runtime-stage', controlStage: 3, control: '確認する場所', choice: 'verification' }
]
export const trainingProfiles = [[1440, 1000, 'light', 1], [1440, 1000, 'dark', 1], [1280, 720, 'light', 1], [390, 844, 'light', 1], [390, 844, 'dark', 1], [960, 540, 'light', 2]]
export const TRAINING_ORACLE = {
  modelId: 'training-model', weights: { x: 240, y: 186, width: 160, height: 98 },
  knowledge: ['coverage', 'accuracy', 'instruction'], evaluation: ['behavior', 'facts'],
  traits: ['hallucination', 'sycophancy', 'refusal'], boundaryChoices: ['instruction', 'permission', 'verification'],
  stageRoutes: [
    [['text', 'weights'], ['demonstration', 'weights'], ['preference', 'weights']],
    [['text', 'weights']],
    [['additional-training', 'weights'], ['retrieval', 'runtime-context']],
    [['demonstration', 'weights']],
    [['additional-training', 'weights'], ['retrieval', 'runtime-context']],
    [['preference:RLHF', 'weights'], ['preference:DPO', 'weights']]
  ],
  runtimeNodes: ['model-candidate', 'permission-check', 'operation', 'result-verification'],
  runtimeEdges: [
    ['model-candidate', 'permission-check', 'candidate-only'],
    ['permission-check', 'operation', 'only-if-authorized'],
    ['operation', 'result-verification', 'check-result']
  ]
}
export function assertRuntimeBoundary(nodes, edges) {
  assert.deepEqual(nodes.map(node => [node.id, node.owner]), TRAINING_ORACLE.runtimeNodes.map((id, index) => [id, index === 0 ? 'model' : 'outside-model']), 'Permission and verification stay outside the model')
  assert.deepEqual(edges, TRAINING_ORACLE.runtimeEdges, 'Every operation must follow permission checking and precede result verification')
}
const headings = ['概要: 3 つの工程と、それぞれが残す「癖」', '事前学習: 次トークン予測で知識を得る', '指示チューニング(SFT): 指示に従う形式を学ぶ', '選好調整: 「良い応答」の基準を最適化する', 'この工程から生まれる性質: 幻覚・迎合・拒否', 'この理解が効く場面', 'アンチパターン', 'チェックリスト']
const defaults = { knowledge: 'coverage', evaluation: 'behavior', trait: 'hallucination', boundary: 'permission' }

export async function runTrainingChecks(api) {
  const { check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect } = api
  async function source(page) {
    await expect(page.locator('article h3')).toHaveText(headings, { useInnerText: true })
    await expect(page.locator('article .katex-display')).toHaveCount(0)
    const mermaid = page.locator('article [data-mermaid-renderer="strict"]')
    await expect(mermaid).toHaveCount(1)
    assert.equal(await mermaid.evaluate(node => node.closest('.reading-figure')?.dataset.diagramId), 'training-stages')
    for (const text of ['SFT で新しい事実を学べないわけではありません', 'これは全 FT の不可能性を示す結果ではありません', 'モデルの拒否を権限境界の代わりにはしません']) await expect(page.locator('article')).toContainText(text)
    for (const heading of headings.slice(5)) assert.equal(await page.locator('article h3').filter({ hasText: heading }).evaluate(node => node.closest('.reading-figure') === null), true)
  }
  async function openTraining(page, result, options = {}) {
    await open(page, trainingPath, training, result, options)
    await structure(page, training, 0, result, 8)
    await source(page)
  }
  async function rows(panel, attr, ids, selected) {
    const locator = panel.locator(`[${attr}]`)
    assert.deepEqual(await locator.evaluateAll((nodes, attr) => nodes.map(node => node.getAttribute(attr)), attr), ids)
    for (const id of ids) {
      const row = panel.locator(`[${attr}="${id}"]`)
      await expect(row).toBeVisible()
      await expect(row).toHaveAttribute('data-emphasized', String(id === selected))
    }
  }
  async function semantics(panel, figure, index, settings = defaults) {
    const svg = panel.locator('svg.aw-scene')
    await expect(svg).toHaveAttribute(figure.attr, String(index))
    if (figure.id === 'training-stages') {
      await expect(svg).toHaveAttribute('data-model-id', TRAINING_ORACLE.modelId)
      await expect(svg).toHaveAttribute('data-training-target', 'weights')
      await expect(svg).toHaveAttribute('data-retrieval-target', 'runtime-context')
      await expect(svg).toHaveAttribute('data-numeric-performance', 'none')
      await expect(svg).toHaveAttribute('data-knowledge-focus', index === 2 ? settings.knowledge : 'none')
      await expect(svg).toHaveAttribute('data-evaluation-focus', index === 4 ? settings.evaluation : 'none')
      const weights = panel.locator('[data-node-id="weights"]')
      await expect(weights).toHaveCount(1)
      await expect(weights).toHaveAttribute('data-model-id', TRAINING_ORACLE.modelId)
      await expect(weights).toHaveAttribute('data-parameter-values', 'none')
      assert.deepEqual(await weights.locator('rect').evaluate(node => Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Number(node.getAttribute(key))]))), TRAINING_ORACLE.weights)
      const routes = await panel.locator('[data-route-source]').evaluateAll(nodes => nodes.map(node => [node.dataset.routeSource, node.dataset.routeTarget, node.dataset.routeEffect]))
      assert.deepEqual(routes, TRAINING_ORACLE.stageRoutes[index].map(([from, to]) => [from, to, to === 'weights' ? 'parameter-update' : 'context-input']))
      if (index === 0) {
        assert.deepEqual(await panel.locator('[data-data-kind]').evaluateAll(nodes => nodes.map(node => node.dataset.dataKind)), ['text', 'demonstration', 'preference'])
        await expect(panel.locator('[data-caveat="representative-order"]')).toContainText('順序や反復は一律ではない')
      }
      if (index === 1) for (const text of ['prefix', '次の正解', '学習の誤差', '重みを更新']) await expect(svg).toContainText(text)
      if (index === 2) {
        await rows(panel, 'data-knowledge-card', TRAINING_ORACLE.knowledge, settings.knowledge)
        await expect(panel.locator('[data-caveat="knowledge-coverage"]')).toContainText('自動保証しない')
      }
      if (index === 3) {
        await expect(panel.locator('[data-caveat="new-facts"]')).toHaveText('新しい事実も学びうる')
        await expect(svg).toContainText('データと手法に依存')
      }
      if (index === 4) {
        await rows(panel, 'data-evaluation-row', TRAINING_ORACLE.evaluation, settings.evaluation)
        await expect(svg).toContainText('最新性・出典・削除・権限')
        await expect(panel.locator('[data-caveat="closed-book-qa"]')).toContainText('全FTで新知識を学べない')
      }
      if (index === 2 || index === 4) await expect(panel.locator('[data-node-id="runtime-context"]')).toHaveAttribute('data-weights-updated', 'false')
      if (index === 5) {
        assert.deepEqual(await panel.locator('[data-preference-method]').evaluateAll(nodes => nodes.map(node => node.dataset.preferenceMethod)), ['RLHF', 'DPO'])
        for (const text of ['人間 / AI', '選好データ', '有用さ・無害さ・トーン・拒否', '保証を示す点数ではない']) await expect(svg).toContainText(text)
      }
    } else {
      await expect(svg).toHaveAttribute('data-permission-node', 'outside-model')
      await expect(svg).toHaveAttribute('data-output-route', TRAINING_ORACLE.runtimeNodes.join(','))
      await expect(svg).toHaveAttribute('data-judgment', 'none')
      await expect(svg).toHaveAttribute('data-operation-executed', 'false')
      await expect(svg).toHaveAttribute('data-trait-focus', index === 2 ? settings.trait : 'none')
      await expect(svg).toHaveAttribute('data-boundary-focus', index === 3 ? settings.boundary : 'none')
      if (index === 0) {
        const edges = panel.locator('[data-association-source]')
        await expect(edges).toHaveCount(3)
        for (const edge of await edges.all()) {
          await expect(edge).toHaveAttribute('data-sole-cause', 'false')
          assert.notEqual(await edge.evaluate(node => getComputedStyle(node).strokeDasharray), 'none')
        }
        await expect(panel.locator('[data-caveat="association"]')).toContainText('単独の原因ではない')
      }
      if (index === 1) {
        await expect(panel.locator('[data-runtime-weights]')).toHaveAttribute('data-runtime-weights', 'fixed')
        assert.deepEqual(await panel.locator('[data-evidence-step]').evaluateAll(nodes => nodes.map(node => node.dataset.evidenceStep)), ['supply', 'source-check', 'result-check'])
      }
      if (index === 2) {
        await rows(panel, 'data-trait-row', TRAINING_ORACLE.traits, settings.trait)
        for (const text of ['根拠', '出典', '結果', '中立', '基準', '過剰', '過小', '権限']) await expect(svg).toContainText(text)
        await expect(panel.locator('[data-caveat="research-scope"]')).toContainText('一律に断定しない')
      }
      if (index === 3) {
        const nodes = await panel.locator('[data-boundary-node]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.boundaryNode, owner: node.dataset.nodeOwner })))
        const edges = await panel.locator('[data-edge-source]').evaluateAll(nodes => nodes.map(node => [node.dataset.edgeSource, node.dataset.edgeTarget, node.dataset.edgeMeaning]))
        assertRuntimeBoundary(nodes, edges)
        const selected = { instruction: 'model-candidate', permission: 'permission-check', verification: 'result-verification' }[settings.boundary]
        await rows(panel, 'data-boundary-node', TRAINING_ORACLE.runtimeNodes, selected)
        await expect(panel.locator('[data-caveat="prompt-limit"]')).toContainText('実行を強制する仕組みではない')
        await expect(panel.locator('[data-caveat="permission-boundary"]')).toHaveText('モデルの拒否 ≠ 権限境界')
      }
    }
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
    assert.deepEqual(observation.wireText, [], 'training wire crosses text')
    assert.ok(observation.fonts.length > 0 && observation.fonts.every(font => Number.isFinite(font.renderedFontPx) && font.renderedFontPx > 0))
    ;(result.trainingGeometryObservations ??= []).push({ label, ...observation })
    result.visualReviewRequired ||= observation.overlapCandidates.length > 0
    result.independentVisualReviewStatus = 'pending-independent-public-image-review'
    return observation
  }
  async function capture(page, panel, result, name) {
    await screenshot(page, name)
    await screenshot(page, name + '-scene', panel.locator('svg.aw-scene'))
    const observation = result.trainingGeometryObservations.at(-1)
    observation.screenshots = { viewport: name + '.png', completeScene: name + '-scene.png' }
  }
  // 6 views + semantics + keyboard/modal + reading + 2 playback + noJS + print.
  for (const [width, height, theme, deviceScaleFactor] of trainingProfiles) await check(`training: all 10 stages ${width}x${height} ${theme} DSF${deviceScaleFactor}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme, deviceScaleFactor }, async page => {
      await openTraining(page, result, { theme }); result.geometry = {}
      for (const figure of training) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index)
          result.geometry[figure.id].push({ stage: index, ...await geometry(page, panel), ...await visibleGeometry(panel, result, `${figure.id} stage ${index}`) })
          await capture(page, panel, result, `${figure.id}-stage-${index}-${width}x${height}-${theme}-dsf${deviceScaleFactor}`)
        }
        if (height <= 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
      }
    }); sceneDelivery(result, training)
  })
  await check('training: all selectors, fixed semantic fixtures, midpoint boundaries and reverse seeks', async result => {
    await usePage(result, {}, async page => {
      await openTraining(page, result); result.midpoints = {}; result.selectorValues = 0
      for (const figure of training) {
        const panel = panelOf(page, figure.id), forward = Array.from({ length: figure.labels.length - 1 }, (_, index) => [index + .49, index + .5, index + .51]).flat()
        for (const value of [...forward, ...forward.toReversed()]) {
          await phase(panel, value); const index = Math.round(value)
          await semantics(panel, figure, index)
          await expect(panel.getByRole('group', { name: '図解の段階', exact: true }).getByRole('button').nth(index)).toHaveAttribute('aria-pressed', 'true')
          await expect(panel.getByRole('slider')).toHaveAttribute('aria-valuetext', `${index + 1} / ${figure.labels.length}、${figure.labels[index]}`)
        }
        result.midpoints[figure.id] = forward.length * 2
      }
      const settings = { ...defaults }
      for (const [figure, index, id, label, key, values] of [
        [training[0], 2, 'knowledge-focus', '確認する性質', 'knowledge', TRAINING_ORACLE.knowledge],
        [training[0], 4, 'evaluation-focus', '評価の観点', 'evaluation', TRAINING_ORACLE.evaluation],
        [training[1], 2, 'trait-focus', '確認する性質', 'trait', TRAINING_ORACLE.traits],
        [training[1], 3, 'boundary-focus', '確認する場所', 'boundary', TRAINING_ORACLE.boundaryChoices]
      ]) {
        const panel = panelOf(page, figure.id); await stage(panel, figure, index)
        const select = panel.locator(`[data-control="${id}"]`).getByLabel(label, { exact: true })
        assert.deepEqual(await select.locator('option').evaluateAll(nodes => nodes.map(node => node.value)), values)
        for (const value of values) {
          await select.selectOption(value); settings[key] = value; await semantics(panel, figure, index, settings); result.selectorValues++
        }
        await geometry(page, panel); await visibleGeometry(panel, result, `${id} all values`); await capture(page, panel, result, `training-${id}-selected`)
        await stage(panel, figure, 0); await semantics(panel, figure, 0, settings)
        await stage(panel, figure, index); await expect(select).toHaveValue(values.at(-1)); await semantics(panel, figure, index, settings)
      }
      assert.equal(result.selectorValues, 11)
    })
  })
  await check('training: keyboard transport, modal selector state and focus return', async result => {
    await usePage(result, {}, async page => {
      await openTraining(page, result)
      for (const figure of training) {
        const panel = panelOf(page, figure.id); await stage(panel, figure, 0); const slider = panel.getByRole('slider')
        await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0'); await expect(panel.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        await stage(panel, figure, figure.controlStage); const opener = panel.getByRole('button', { name: '図を拡大', exact: true })
        await opener.focus(); await page.keyboard.press('Enter'); const dialog = rootOf(page, figure.id).getByRole('dialog'), large = dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible(); assert.equal(await dialog.evaluate(node => node.matches(':modal')), true)
        await large.getByLabel(figure.control, { exact: true }).selectOption(figure.choice)
        const settings = { ...defaults, ...(figure.id === 'training-stages' ? { knowledge: figure.choice } : { boundary: figure.choice }) }
        await semantics(large, figure, figure.controlStage, settings); await geometry(page, large); await visibleGeometry(large, result, `${figure.id} expanded`); await capture(page, large, result, `${figure.id}-expanded`)
        await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused(); await expect(panel.getByLabel(figure.control, { exact: true })).toHaveValue(figure.choice)
        await opener.click(); await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(opener).toBeFocused()
        const ids = await rootOf(page, figure.id).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id)); assert.equal(new Set(ids).size, ids.length)
      }
    })
  })
  await check('training: all nine READ stops, manual-only auxiliary stage and independent figure states', async result => {
    await usePage(result, {}, async page => {
      await openTraining(page, result); result.readingStops = {}
      for (const figure of training) await stage(panelOf(page, figure.id), figure, 0)
      const scroll = async (figure, index, edge = 'top') => {
        await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate((node, edge) => window.scrollTo({ top: scrollY + node.getBoundingClientRect()[edge] - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }), edge)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      }
      await expect(rootOf(page, training[1].id).locator('[data-reading-step="1"]')).toHaveCount(0)
      for (const figure of training) {
        const panel = panelOf(page, figure.id), other = training.find(item => item !== figure), otherPanel = panelOf(page, other.id), unchanged = await otherPanel.getByRole('slider').inputValue()
        await stage(panel, figure, figure.labels.length - 1); await expect(otherPanel.getByRole('slider')).toHaveValue(unchanged)
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
        for (const index of [...figure.steps, ...figure.steps.toReversed()]) {
          await scroll(figure, index); await expect(panel).toHaveAttribute('data-mode', 'reading'); await expect(panel).toHaveAttribute('data-stage', String(index)); await semantics(panel, figure, index)
        }
        await scroll(figure, figure.steps.at(-1), 'bottom'); await expect(panel).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        await stage(panel, figure, 0); await scroll(figure, figure.steps.at(-1)); await expect(panel).toHaveAttribute('data-mode', 'manual'); await expect(panel).toHaveAttribute('data-stage', '0')
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click(); await scroll(figure, figure.steps[0]); await expect(panel).toHaveAttribute('data-stage', String(figure.steps[0]))
        await panel.getByRole('button', { name: '本文に連動中', exact: true }).click(); await expect(otherPanel.getByRole('slider')).toHaveValue(unchanged)
        result.readingStops[figure.id] = { forward: figure.steps, reverse: figure.steps.toReversed() }
      }
    })
  })
  for (const figure of training) await check(`${figure.id}: native elapsed play, frozen pause, replay and completion`, async result => {
    await usePage(result, {}, async page => {
      await openTraining(page, result); const panel = panelOf(page, figure.id), slider = panel.getByRole('slider'); await stage(panel, figure, 0); await panel.scrollIntoViewIfNeeded()
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(900); const started = Date.now()
      await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing'); await page.waitForTimeout(5200)
      const progress = Number(await slider.inputValue()); assert.ok(progress > .6 && progress < 2)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'manual')
      const paused = await slider.inputValue(), frozen = await panel.locator('svg.aw-scene').evaluate(node => node.innerHTML)
      await page.waitForTimeout(1000); assert.equal(await slider.inputValue(), paused); assert.equal(await panel.locator('svg.aw-scene').evaluate(node => node.innerHTML), frozen)
      await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, figure.labels.length - 1); await page.emulateMedia({ reducedMotion: 'no-preference' })
      await panel.getByRole('button', { name: '図解を最初から再生', exact: true }).click(); await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(.5)
      await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click()
      await phase(panel, figure.labels.length - 1 - .2); await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await page.waitForTimeout(1500)
      await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel).toHaveAttribute('data-mode', 'manual'); await semantics(panel, figure, figure.labels.length - 1)
      result.playback = { clock: 'native browser time; no fake clock', elapsedMs: Date.now() - started, progress, paused, frozen: true, replay: true, completion: true }
    })
  })
  await check('training noJS: original prose, eight headings, Mermaid and all ten static descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await openTraining(page, result, { noJS: true })
      for (const figure of training) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible()
        await expect(root.locator('.rf-static-stages li strong')).toHaveText(figure.labels)
        for (const item of await root.locator('.rf-static-stages li > span').all()) assert.ok((await item.textContent()).trim().length > 20)
        await screenshot(page, `training-no-javascript-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await screenshot(page, 'training-no-javascript')
    })
  })
  await check('training print: coherent scenes and original article with controls hidden', async result => {
    await usePage(result, {}, async page => {
      await openTraining(page, result)
      for (const figure of training) await phase(panelOf(page, figure.id), 2.25)
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.emulateMedia({ media: 'print' })
      for (const figure of training) {
        const panel = panelOf(page, figure.id)
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        await expect(panel.locator('.aw-timeline')).not.toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
        const current = Number(await panel.getAttribute('data-stage')); assert.ok(Number.isInteger(current)); await semantics(panel, figure, current)
        await screenshot(page, `training-print-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await source(page); await screenshot(page, 'training-print'); result.print = 'CSS emulation with beforeprint; not physical printing'
    })
  })
}
