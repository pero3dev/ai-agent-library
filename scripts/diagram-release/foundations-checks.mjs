import assert from 'node:assert/strict'

// Fixed public contract. No repository model, website/out or public response is
// used to manufacture expected values. The runner supplies CI-bound navigation.
export const foundations = [
  {
    id: 'generation-token-loop', route: '/docs/llm-foundations/how-llms-generate-text', title: '1トークンずつ、続きを生成する',
    labels: ['全体', '候補', '選ぶ', '戻す', '調整', '分岐', '停止', '配信'], steps: [0, 3, 4, 5, 6, 7],
    marker: 'GENERATION / TOKEN LOOP', stageAttribute: 'data-generation-stage', mermaids: 1,
    headings: ['概要: たった 1 つのループ', '次トークン予測という実体', 'サンプリングと温度', '「同じ入力で違う出力」になる理由', '停止とストリーミング', 'この理解が効く場面', 'アンチパターン', 'チェックリスト'],
    tableCells: [
      '方法・パラメータ', '意味', '実務での使いどころ',
      '貪欲法(最大確率を常に選ぶ)', '揺らぎ最小。反復・単調に陥ることがある', '温度 0 指定が近い挙動',
      '温度(temperature)', '分布の尖り具合。低いほど高確率トークンに集中、高いほど平坦化', '分類・抽出・構造化出力は低め、発想・文章の多様性は中〜高',
      'top-p(累積確率での足切り)', '確率上位から累積が指定値に達する候補集合を作り、そこからサンプリング', '候補の裾を切る調整。安全性や正確性を保証する設定ではない'
    ]
  },
  {
    id: 'tokenization-counting', route: '/docs/llm-foundations/tokenization', title: '分割・数え方・予算',
    labels: ['単位', '変換', '境界', '条件', '語彙', '計測', '履歴'], steps: [0, 1, 2, 3, 4, 5],
    marker: 'TOKENIZATION / COUNTING', stageAttribute: 'data-tokenization-stage', mermaids: 0,
    headings: ['概要: トークンは LLM 世界の通貨', 'トークンとは何か: サブワード分割の直感', '言語と内容による効率差', 'モデル間の非互換: 移行時の再見積り', '見積りと計測の実務', 'この理解が効く場面', 'アンチパターン', 'チェックリスト'], tableCells: []
  }
]

const profiles = [[1440, 1000, 'light'], [1440, 1000, 'dark'], [1280, 720, 'light'], [390, 844, 'light'], [390, 844, 'dark']]
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`)

export async function runFoundationsChecks(api) {
  const { check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect } = api
  async function source(page, figure) {
    await expect(page.locator('article h3')).toHaveText(figure.headings, { useInnerText: true })
    await expect(page.locator('article [data-mermaid-renderer="strict"]')).toHaveCount(figure.mermaids)
    await expect(page.locator('article table')).toHaveCount(figure.tableCells.length ? 1 : 0)
    // Glossary tooltips are hidden explanatory text, not original table cells.
    if (figure.tableCells.length) await expect(page.locator('article table th, article table td')).toHaveText(figure.tableCells, { useInnerText: true })
  }
  async function scroll(page, figure, index, edge = 'top') {
    await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate((node, edge) => {
      window.scrollTo({ top: scrollY + node.getBoundingClientRect()[edge] - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' })
    }, edge)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  async function midpoints(panel, figure, result) {
    let tested = 0
    const forward = Array.from({ length: figure.labels.length - 1 }, (_, index) => [index + .49, index + .5, index + .51]).flat()
    for (const value of [...forward, ...forward.toReversed()]) {
      const index = Math.round(value)
      await phase(panel, value)
      await expect(panel.locator('svg.aw-scene')).toHaveAttribute(figure.stageAttribute, String(index))
      await expect(panel.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(index)).toHaveAttribute('aria-pressed', 'true')
      await expect(panel.getByRole('slider')).toHaveAttribute('aria-valuetext', `${index + 1} / ${figure.labels.length}、${figure.labels[index]}`)
      tested++
    }
    assert.equal(tested, (figure.labels.length - 1) * 6)
    result.midpoints = { samples: tested, directions: ['forward', 'reverse'], offsets: [.49, .5, .51] }
  }
  async function generationSelections(page, figure, result) {
    const panel = panelOf(page, figure.id)
    for (const value of [1.49, 1.5, 2, 2.49, 2.5, 3, 2.49, 2, 1.5, 1.49]) {
      await phase(panel, value)
      const prefix = value >= 2.5 ? 'A B B' : 'A B'
      await expect(panel.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', prefix)
      await expect(panel.locator('[data-distribution-prefix]')).toHaveAttribute('data-distribution-prefix', prefix)
      await expect(panel.locator('[data-model-weights]')).toHaveAttribute('data-model-weights', 'fixed')
      close(Number(await panel.locator('[data-append-progress]').getAttribute('data-append-progress')), Math.max(0, Math.min(1, value - 1.5)))
      await expect(panel.locator('[data-moving-token="true"]')).toHaveCount(value >= 1.5 && value < 2.5 ? 1 : 0)
      await expect(panel.locator('[data-occurrence-id="generated:0"]')).toHaveCount(value >= 1.5 ? 1 : 0)
      await geometry(page, panel)
    }
    await stage(panel, figure, 4)
    for (const temperature of ['0.5', '1', '2']) for (const topP of ['0.6', '0.8', '1']) {
      await panel.getByLabel('温度・選択', { exact: true }).selectOption(temperature)
      await panel.getByLabel('候補の範囲', { exact: true }).selectOption(topP)
      const rows = await panel.locator('[data-candidate]').evaluateAll(nodes => nodes.map(node => ({ label: node.dataset.candidate, kept: node.dataset.kept === 'true', p: Number(node.dataset.selectionProbability) })))
      close(rows.reduce((sum, row) => sum + row.p, 0), 1)
      assert.ok(rows.filter(row => !row.kept).every(row => row.p === 0))
      if (temperature === '1') assert.deepEqual(rows.filter(row => row.kept).map(row => row.label), topP === '0.6' ? ['A', 'B'] : topP === '0.8' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'])
      await expect(panel.locator('[data-distribution-prefix]')).toHaveAttribute('data-distribution-prefix', 'A B')
      await expect(panel.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', 'A B')
      await geometry(page, panel)
    }
    await panel.getByLabel('温度・選択', { exact: true }).selectOption('0')
    await expect(panel.getByLabel('候補の範囲', { exact: true })).toBeDisabled()
    await expect(panel.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind', 'greedy')
    await expect(panel).toContainText('確信100%の意味ではない')
    close(Number(await panel.locator('[data-candidate="A"]').getAttribute('data-probability')), .4)
    await stage(panel, figure, 3)
    await expect(panel.locator('[data-selection-kind]')).toHaveAttribute('data-selection-kind', 'sampling')
    close(Number(await panel.locator('[data-candidate="C"]').getAttribute('data-probability')), .6)
    await stage(panel, figure, 5)
    for (const cause of ['sampling', 'logit']) {
      await panel.getByLabel('分岐の原因', { exact: true }).selectOption(cause)
      await expect(panel.locator('[data-comparison-kind]')).toHaveAttribute('data-comparison-kind', cause)
      await expect(panel.locator('[data-changed-field]')).toHaveAttribute('data-changed-field', cause === 'sampling' ? 'draw' : 'logit-A')
      const sides = await panel.locator('[data-comparison-side]').evaluateAll(nodes => nodes.map(node => ({ selected: node.dataset.comparisonSelected, draw: node.dataset.draw, probabilities: [...node.querySelectorAll('[data-compare-probability]')].map(row => Number(row.dataset.compareProbability)) })))
      assert.deepEqual(sides.map(side => side.selected), ['A', 'B'])
      if (cause === 'sampling') { assert.deepEqual(sides[0].probabilities, sides[1].probabilities); assert.notEqual(sides[0].draw, sides[1].draw) }
      else { const difference = Math.abs(sides[0].probabilities[0] - sides[1].probabilities[0]); assert.ok(difference > 0 && difference < .00001) }
      await geometry(page, panel); await screenshot(page, `${figure.id}-comparison-${cause}`)
    }
    for (const [reason, generated, visible, count] of [['natural', 'ABC', 'ABC', 4], ['sequence', 'ABC', 'A', 3], ['limit', 'AB', 'AB', 2]]) {
      await stage(panel, figure, 6)
      await panel.getByLabel('停止条件', { exact: true }).selectOption(reason)
      const stop = panel.locator('[data-stop-reason]')
      await expect(stop).toHaveAttribute('data-stop-reason', reason)
      await expect(stop).toHaveAttribute('data-selected-count', String(count))
      await expect(stop).toHaveAttribute('data-generated-text', generated)
      await expect(stop).toHaveAttribute('data-visible-text', visible)
      await geometry(page, panel); await screenshot(page, `${figure.id}-stop-${reason}`)
      let previous = ''
      for (const value of [6.5, 6.63, 6.75, 6.88, 7]) {
        await phase(panel, value)
        const stream = panel.locator('[data-stream-step]'), next = await stream.getAttribute('data-stream-visible')
        assert.ok(next.startsWith(previous), 'Previously transmitted text retracted'); previous = next
        if (reason === 'natural' && value === 6.75) {
          await expect(stream).toHaveAttribute('data-stream-generated', 'AB')
          await expect(stream).toHaveAttribute('data-stream-visible', 'A')
          await expect(stream).toHaveAttribute('data-stream-pending', 'B')
          await expect(stream).toHaveAttribute('data-stream-finished', 'false')
          await screenshot(page, `${figure.id}-stream-pending-B`)
        }
        await geometry(page, panel)
      }
      assert.equal(previous, visible)
      await expect(panel.locator('[data-stream-step]')).toHaveAttribute('data-stream-finished', 'true')
      await phase(panel, 6.5)
      for (const field of ['generated', 'visible', 'pending']) await expect(panel.locator('[data-stream-step]')).toHaveAttribute(`data-stream-${field}`, '')
      await expect(panel.locator('[data-stream-step]')).toHaveAttribute('data-stream-finished', 'false')
    }
    result.meaning = ['prefix AB to ABB', 'single generated occurrence and commit midpoint', 'T>0 x top-p normalized support', 'T=0 separate greedy branch', 'stage-4 controls isolated', 'same distribution/different draw vs changed logit', 'EOS/BC/limit separated', 'generated/pending/received and reverse seek']
  }
  async function tokenizationSelections(page, figure, result) {
    const panel = panelOf(page, figure.id), svg = panel.locator('svg.aw-scene')
    await stage(panel, figure, 2)
    for (const [boundary, count] of [['character', 9], ['word', 1], ['subword', 2]]) {
      await panel.getByLabel('比較する境界', { exact: true }).selectOption(boundary)
      await expect(svg).toHaveAttribute('data-segment-count', String(count))
      await expect(svg).toHaveAttribute('data-token-count', '2')
      await expect(panel.locator('[data-vocabulary-id]')).toHaveCount(boundary === 'subword' ? 2 : 0)
      await geometry(page, panel); await screenshot(page, `${figure.id}-boundary-${boundary}`)
    }
    await stage(panel, figure, 4)
    const positions = await panel.locator('[data-source-position]').evaluateAll(nodes => nodes.map(node => [node.dataset.sourcePosition, node.getAttribute('x'), node.textContent]))
    for (const [vocabulary, ids] of [['b', [31, 8, 5, 42]], ['a', [12, 27]]]) {
      await panel.getByLabel('説明用の語彙', { exact: true }).selectOption(vocabulary)
      await expect(svg).toHaveAttribute('data-token-count', String(ids.length))
      assert.deepEqual(await panel.locator('[data-vocabulary-id]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.vocabularyId))), ids)
      await expect(panel.locator('[data-reconstructed-text]')).toHaveAttribute('data-reconstructed-text', 'tokenizer')
      assert.deepEqual(await panel.locator('[data-source-position]').evaluateAll(nodes => nodes.map(node => [node.dataset.sourcePosition, node.getAttribute('x'), node.textContent])), positions)
      await geometry(page, panel); await screenshot(page, `${figure.id}-vocabulary-${vocabulary}`)
    }
    await stage(panel, figure, 3)
    for (const value of ['language', 'content']) {
      await panel.getByLabel('確認する条件', { exact: true }).selectOption(value)
      await expect(svg).toHaveAttribute('data-dependency-focus', value)
      await geometry(page, panel)
    }
    await stage(panel, figure, 5)
    for (const value of ['estimate', 'usage', 'history']) {
      await panel.getByLabel('確認する対象', { exact: true }).selectOption(value)
      await expect(svg).toHaveAttribute('data-measurement-focus', value)
      for (const part of ['past-input', 'past-output', 'current-input']) await expect(panel.locator('[data-history-inclusion]')).toHaveAttribute(`data-includes-${part}`, 'true')
      await expect(svg).toHaveAttribute('data-usage-measured', 'false')
      await expect(svg).toHaveAttribute('data-quality-judgment', 'none')
      await geometry(page, panel)
    }
    result.meaning = ['9 characters/1 word/2 illustrative tokens', 'vocabulary-scoped IDs A/B', 'stable source positions and exact reconstruction', 'language/content are conditions, not measurements', 'usage unmeasured; no quality claim', 'prior input and output included in current input']
  }

  // 2 routes x (5 profiles + interaction + native playback + noJS + print) = 18.
  // The caller requires 43 completed cases including the unchanged prior 25.
  for (const figure of foundations) {
    for (const [width, height, theme] of profiles) await check(`${figure.id}: all stages ${width}x${height} ${theme}`, async result => {
      await usePage(result, { viewport: { width, height }, colorScheme: theme }, async page => {
        await open(page, figure.route, [figure], result, { theme })
        await structure(page, [figure], 0, result, 8); await source(page, figure)
        const panel = panelOf(page, figure.id); result.geometry = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index)
          await expect(panel.locator('svg.aw-scene')).toHaveAttribute(figure.stageAttribute, String(index))
          const layout = await geometry(page, panel); assert.ok(layout.minSVGFontPx >= 16)
          result.geometry.push({ stage: index, ...layout })
          if (width === 1440 && theme === 'light') await screenshot(page, `${figure.id}-${index}`)
        }
        if (width === 1440 && theme === 'light') {
          await midpoints(panel, figure, result)
          if (figure.id === 'generation-token-loop') await generationSelections(page, figure, result)
          else await tokenizationSelections(page, figure, result)
        } else await screenshot(page, `${figure.id}-${width}x${height}-${theme}`)
      })
      sceneDelivery(result, [figure])
    })

    await check(`${figure.id}: transport, keyboard, reading sync and expansion focus`, async result => {
      await usePage(result, {}, async page => {
        await open(page, figure.route, [figure], result)
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id), slider = panel.getByRole('slider')
        await stage(panel, figure, 0)
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(slider).toHaveValue('1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(slider).toHaveValue('0')
        await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1))
        await expect(panel.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
        await page.keyboard.press('ArrowLeft'); close(Number(await slider.inputValue()), figure.labels.length - 1.01)
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0')
        await expect(panel.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
        const stageButton = panel.getByRole('group', { name: '図解の段階' }).getByRole('button').nth(4)
        await stageButton.focus(); await page.keyboard.press('Enter'); await expect(panel).toHaveAttribute('data-stage', '4')
        const opener = panel.getByRole('button', { name: '図を拡大', exact: true })
        await opener.focus(); await page.keyboard.press('Enter')
        const dialog = page.getByRole('dialog', { name: `${figure.title}の拡大図`, exact: true }), expanded = dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible(); assert.equal(await dialog.evaluate(node => node.matches(':modal')), true)
        await expect(dialog.getByRole('button', { name: '拡大図を閉じる', exact: true })).toBeFocused()
        const label = figure.id === 'generation-token-loop' ? '温度・選択' : '説明用の語彙', value = figure.id === 'generation-token-loop' ? '2' : 'b'
        await expanded.getByLabel(label, { exact: true }).selectOption(value)
        await geometry(page, expanded); await screenshot(page, `${figure.id}-expanded`)
        const ids = await root.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id)); assert.equal(new Set(ids).size, ids.length)
        await stage(expanded, figure, figure.labels.length - 1)
        await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(opener).toBeFocused()
        await expect(panel).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        await stage(panel, figure, 4); await expect(panel.getByLabel(label, { exact: true })).toHaveValue(value)
        await opener.click(); await expect(dialog).toBeVisible()
        await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(dialog).toBeHidden(); await expect(opener).toBeFocused()
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click()
        for (const index of figure.steps) {
          await scroll(page, figure, index); await expect(panel).toHaveAttribute('data-mode', 'reading'); await expect(panel).toHaveAttribute('data-stage', String(index))
          await expect(root.locator(`[data-reading-step="${index}"]`)).toHaveAttribute('data-reading-active', 'true')
        }
        await scroll(page, figure, figure.steps.at(-1), 'bottom'); await expect(panel).toHaveAttribute('data-stage', String(figure.labels.length - 1))
        await stage(panel, figure, 1); await scroll(page, figure, 4); await expect(panel).toHaveAttribute('data-stage', '1'); await expect(panel).toHaveAttribute('data-mode', 'manual')
        await panel.getByRole('button', { name: '本文に連動する', exact: true }).click(); await scroll(page, figure, 4); await expect(panel).toHaveAttribute('data-stage', '4')
        await scroll(page, figure, 0); await expect(panel).toHaveAttribute('data-stage', '0')
        result.readingStages = [...figure.steps]; result.keyboardAndFocus = 'Home/End/ArrowLeft, stage Enter, modal Escape/close, shared selector and restored opener'
      })
      sceneDelivery(result, [figure])
    })

    await check(`${figure.id}: actual elapsed playback, frozen scene and restart`, async result => {
      await usePage(result, {}, async page => {
        await open(page, figure.route, [figure], result)
        const panel = panelOf(page, figure.id), slider = panel.getByRole('slider')
        await stage(panel, figure, 0); await panel.scrollIntoViewIfNeeded(); await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(900)
        const started = Date.now()
        await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing')
        await page.waitForTimeout(5200)
        const progressed = Number(await slider.inputValue()); assert.ok(progressed > .6 && progressed < 2)
        await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'manual')
        const paused = await slider.inputValue(), frozen = await panel.locator('svg.aw-scene').evaluate(svg => svg.innerHTML)
        await page.waitForTimeout(1000); assert.equal(await slider.inputValue(), paused); assert.equal(await panel.locator('svg.aw-scene').evaluate(svg => svg.innerHTML), frozen)
        result.playback = { clock: 'native browser time; no fake clock', elapsedMs: Date.now() - started, progressed, paused, frozenScene: true }
        if (figure.id === 'generation-token-loop') {
          await page.emulateMedia({ reducedMotion: 'reduce' }); await phase(panel, 1.6)
          const coordinates = () => panel.locator('[data-moving-token="true"] rect').evaluate(node => [Number(node.getAttribute('x')), Number(node.getAttribute('y'))])
          const before = await coordinates(); await page.emulateMedia({ reducedMotion: 'no-preference' })
          await panel.getByRole('button', { name: '図解を再生', exact: true }).click(); await page.waitForTimeout(1000)
          await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click()
          const moved = await coordinates(); assert.notDeepEqual(moved, before)
          await expect(panel.locator('[data-committed-prefix]')).toHaveAttribute('data-committed-prefix', 'A B')
          await page.waitForTimeout(700); assert.deepEqual(await coordinates(), moved)
          result.playback.movingOccurrence = { before, paused: moved, committedPrefix: 'A B', frozen: true }
        }
        await page.emulateMedia({ reducedMotion: 'reduce' }); await stage(panel, figure, figure.labels.length - 1); await page.emulateMedia({ reducedMotion: 'no-preference' })
        await panel.getByRole('button', { name: '図解を最初から再生', exact: true }).click(); await expect(panel).toHaveAttribute('data-mode', 'playing')
        await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(.5)
        await panel.getByRole('button', { name: '図解を一時停止', exact: true }).click(); result.playback.replayFromEnd = true
      })
      sceneDelivery(result, [figure])
    })

    await check(`${figure.id}: noJS retains original article and all static stage descriptions`, async result => {
      await usePage(result, { javaScriptEnabled: false }, async page => {
        await open(page, figure.route, [figure], result, { noJS: true }); await structure(page, [figure], 0, result, 8); await source(page, figure)
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        await expect(root.getByText('動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。', { exact: true })).toBeVisible()
        await expect(panel.getByRole('slider')).toBeDisabled(); await expect(panel.getByRole('button', { name: '図解を再生', exact: true })).toBeDisabled()
        await expect(panel.getByRole('button', { name: '図を拡大', exact: true })).toBeDisabled()
        const fallback = root.locator('.rf-static-stages'); await fallback.locator('summary').click()
        await expect(fallback.locator('li')).toHaveCount(figure.labels.length)
        for (const node of await fallback.locator('li').all()) await expect(node).toBeVisible()
        result.staticStageCount = figure.labels.length
        result.mermaidNote = 'Original Mermaid wrapper retained; JavaScript-disabled rendering is not claimed.'
        await screenshot(page, `${figure.id}-no-javascript`)
      })
    })

    await check(`${figure.id}: print freezes the midpoint into a coherent static scene`, async result => {
      await usePage(result, {}, async page => {
        await open(page, figure.route, [figure], result)
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id), generation = figure.id === 'generation-token-loop'
        await stage(panel, figure, generation ? 6 : 4)
        await panel.getByLabel(generation ? '停止条件' : '説明用の語彙', { exact: true }).selectOption(generation ? 'sequence' : 'b')
        await phase(panel, generation ? 6.75 : 4.25)
        await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.emulateMedia({ media: 'print' })
        await expect(panel).toHaveAttribute('data-mode', 'manual'); await expect(panel).toHaveAttribute('data-stage', generation ? '7' : '4')
        await expect(panel.getByRole('slider', { includeHidden: true })).toHaveValue(generation ? '7' : '4')
        await expect(root.locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        for (const selector of ['.aw-timeline', '.rf-scene-controls']) await expect(panel.locator(selector)).toBeHidden()
        await expect(root.locator('.rf-static-stages')).toBeHidden(); await expect(root.locator('.aw-sticky')).toHaveCSS('position', 'static')
        await source(page, figure)
        if (generation) {
          await expect(panel.locator('[data-stream-step]')).toHaveAttribute('data-stream-visible', 'A')
          await expect(panel.locator('[data-stream-step]')).toHaveAttribute('data-stream-finished', 'true')
          await expect(page.locator('article [data-mermaid-renderer="strict"] svg .nodes')).toBeVisible()
        } else {
          await expect(panel.locator('svg.aw-scene')).toHaveAttribute('data-token-count', '4')
          await expect(panel.locator('[data-reconstructed-text]')).toHaveAttribute('data-reconstructed-text', 'tokenizer')
        }
        result.print = { beforeprint: 'explicit browser lifecycle event', media: 'print CSS emulation', stage: generation ? 7 : 4 }
        await screenshot(page, `${figure.id}-print`)
      })
      sceneDelivery(result, [figure])
    })
  }
}
