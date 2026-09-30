import assert from 'node:assert/strict'

// Approved source/interface literals. No product model or registry is imported.
export const reasoningPath = '/docs/llm-foundations/reasoning-models'
export const reasoning = [
  {
    "id": "reasoning-sequence",
    "labels": [
      "同じ生成の土台",
      "中間トークン",
      "学習と実行",
      "回答と費用"
    ],
    "steps": [
      0,
      2,
      3
    ],
    "attr": "data-reasoning-sequence-stage",
    "controls": [],
    "marker": "REASONING / SEQUENCE"
  },
  {
    "id": "reasoning-evaluation",
    "labels": [
      "同じタスクで比較",
      "思考量",
      "追加便益",
      "必須条件",
      "複数回の測定"
    ],
    "steps": [
      0,
      1,
      2,
      3,
      4
    ],
    "attr": "data-reasoning-evaluation-stage",
    "controls": [
      {
        "id": "taskFocus",
        "label": "表の観点",
        "stages": [
          0
        ],
        "options": [
          "multi-step",
          "verifiable",
          "constraints"
        ],
        "default": "multi-step"
      },
      {
        "id": "effortFocus",
        "label": "注目する思考量",
        "stages": [
          1,
          2
        ],
        "options": [
          "lower",
          "higher"
        ],
        "default": "lower"
      }
    ],
    "marker": "REASONING / EVALUATION"
  }
]
export const reasoningProfiles = [[1440,1000,'light',1],[1440,1000,'dark',1],[1280,720,'light',1],[390,844,'light',1],[390,844,'dark',1],[960,540,'light',2]]
const headings = ["概要: 分担と「考える時間」の正体","仕組みの直感: 答える前に考えを書く","効くタスクと効かないタスク","思考量の制御とコスト・レイテンシ設計","考えすぎ(overthinking)","プロンプトの変化: 必須手順と探索の余地を分ける","評価の注意: 思考は見えず、揺れる","アンチパターン","チェックリスト"]
const semanticCaseNames = {"reasoning-sequence":"reasoning-sequence: independent meaning fixtures, history-free stages and midpoint reverse seeks","reasoning-evaluation":"reasoning-evaluation: independent meaning fixtures, all six setting pairs and stage-restricted controls"}
export const REASONING_ORACLE = {
  "sequence": {
    "nodeIds": [
      "input",
      "reasoning-region",
      "prior-symbols",
      "next-prediction",
      "final-answer",
      "training-adjustment",
      "runtime-model"
    ],
    "conditioningEdge": {
      "source": "prior-symbols",
      "target": "next-prediction",
      "meaning": "conditions-following-prediction"
    },
    "answerEdge": {
      "source": "next-prediction",
      "target": "final-answer",
      "meaning": "answer-after-reasoning"
    },
    "trainingAssociation": {
      "source": "training-adjustment",
      "target": "runtime-model",
      "meaning": "training-and-inference-configuration",
      "kind": "association",
      "runtimeUpdate": false
    },
    "reasoningRepresentation": {
      "content": null,
      "rawThought": null,
      "tokenCount": null,
      "decorativeSymbols": [
        "prior-mark",
        "continuation-mark"
      ],
      "representsActualTokenCount": false,
      "displayLabel": "記号は模式表示。実際の思考内容ではない"
    },
    "resourceBands": [
      {
        "id": "reasoning",
        "label": "推論",
        "tokenCount": null,
        "duration": null,
        "price": null
      },
      {
        "id": "answer",
        "label": "最終回答",
        "tokenCount": null,
        "duration": null,
        "price": null
      }
    ],
    "nonClaims": {
      "reproducesPrivateThought": false,
      "allProvidersExposeReasoning": false,
      "runtimeWeightsUpdated": false,
      "correctReasoningGuaranteed": false,
      "cotPromptAloneExplainsReasoningModel": false,
      "costEstimate": null,
      "billingFormula": null
    },
    "stageVisibleNodeIds": [
      {
        "stage": 0,
        "visible": [
          "input",
          "reasoning-region",
          "prior-symbols",
          "next-prediction",
          "final-answer",
          "runtime-model"
        ],
        "requiredEdges": [
          "conditions-following-prediction",
          "answer-after-reasoning"
        ]
      },
      {
        "stage": 1,
        "visible": [
          "input",
          "reasoning-region",
          "prior-symbols",
          "next-prediction",
          "runtime-model"
        ],
        "requiredEdges": [
          "conditions-following-prediction"
        ]
      },
      {
        "stage": 2,
        "visible": [
          "input",
          "reasoning-region",
          "prior-symbols",
          "next-prediction",
          "training-adjustment",
          "runtime-model"
        ],
        "requiredEdges": [
          "conditions-following-prediction"
        ]
      },
      {
        "stage": 3,
        "visible": [
          "input",
          "reasoning-region",
          "prior-symbols",
          "next-prediction",
          "final-answer",
          "runtime-model"
        ],
        "requiredEdges": [
          "answer-after-reasoning"
        ]
      }
    ],
    "read0And2": "Fresh READ0->2->3 and reverse without stage1/selector/play: prior symbols + conditioning edge visible; READ2 also separate training frame, fixed runtime weights, no-real-thought label. All checks use visible SVG/text/edge endpoints, not hidden hooks."
  },
  "evaluation": {
    "taskRows": [
      {
        "id": "multi-step",
        "label": "多段推論と定型処理",
        "sourceTopic": "d2-s2-b1.row0",
        "candidates": [
          "多段の推論が要る問題(数学・計画・複雑なデバッグ)",
          "単純な事実検索・定型の抽出・分類"
        ]
      },
      {
        "id": "verifiable",
        "label": "検証可能性と待ち時間",
        "sourceTopic": "d2-s2-b1.row1",
        "candidates": [
          "検証可能な問題(答えの正しさを確かめられる)",
          "低レイテンシが要る対話・大量処理"
        ]
      },
      {
        "id": "constraints",
        "label": "制約と定型手順",
        "sourceTopic": "d2-s2-b1.row2",
        "candidates": [
          "制約が多く、慎重な検討が要る判断",
          "参照先や処理手順が定型化された問い"
        ]
      }
    ],
    "effortVariants": [
      {
        "id": "lower",
        "label": "低めの思考量",
        "providerValue": null,
        "budget": null
      },
      {
        "id": "higher",
        "label": "高めの思考量",
        "providerValue": null,
        "budget": null
      }
    ],
    "comparison": {
      "inputId": "same-input",
      "inputText": null,
      "modelId": "same-model",
      "modelName": null,
      "promptId": "same-instructions",
      "criteriaId": "same-criteria",
      "isExecuted": false,
      "meaning": "各タスク内で、同じ実入力・モデル・指示・評価基準を保ち思考量を比較する模式枠。左右の異なるタスク例を同一入力とは扱わない。モデルを比較する実務評価を禁止する意図ではなく、この図で同時に変える要素を思考量だけへ限定する。"
    },
    "metrics": [
      {
        "id": "quality",
        "label": "品質",
        "value": null,
        "unit": null,
        "status": "unmeasured"
      },
      {
        "id": "cost",
        "label": "費用",
        "value": null,
        "unit": null,
        "status": "unmeasured"
      },
      {
        "id": "latency",
        "label": "待ち時間",
        "value": null,
        "unit": null,
        "status": "unmeasured"
      }
    ],
    "requiredConditions": [
      {
        "id": "goal",
        "label": "目標"
      },
      {
        "id": "constraints",
        "label": "制約"
      },
      {
        "id": "approval",
        "label": "承認"
      },
      {
        "id": "evidence-check",
        "label": "根拠確認"
      },
      {
        "id": "business-rules",
        "label": "業務規程"
      }
    ],
    "executionBoundary": {
      "owner": "outside-model",
      "enforcedBy": "execution-code",
      "approvalDecision": null,
      "operationExecuted": false
    },
    "trials": [
      {
        "id": "lower-a",
        "effort": "lower",
        "inputId": "same-input",
        "conditionId": "lower-settings"
      },
      {
        "id": "lower-b",
        "effort": "lower",
        "inputId": "same-input",
        "conditionId": "lower-settings"
      },
      {
        "id": "higher-a",
        "effort": "higher",
        "inputId": "same-input",
        "conditionId": "higher-settings"
      },
      {
        "id": "higher-b",
        "effort": "higher",
        "inputId": "same-input",
        "conditionId": "higher-settings"
      }
    ],
    "nonClaims": {
      "automaticTaskDecision": null,
      "qualityMonotonic": false,
      "allSimpleTasksWorsen": false,
      "extraEffortFixesUnclearRequirements": false,
      "extraEffortReplacesPermissionChecks": false,
      "visibleThoughtProvesCause": false,
      "allModelsNeedStepByStepPrompt": false,
      "measuredBenefit": null,
      "recommendedEffort": null
    },
    "settingGrid": {
      "taskFocus": [
        "multi-step",
        "verifiable",
        "constraints"
      ],
      "effortFocus": [
        "lower",
        "higher"
      ],
      "stages": [
        0,
        1,
        2,
        3,
        4
      ],
      "observations": 30,
      "visibility": {
        "taskFocus": [
          0
        ],
        "effortFocus": [
          1,
          2
        ]
      },
      "outsideActiveStage": "Control absent and effective data focus none; stored options may remain but cannot alter meaning or values."
    },
    "trialCells": 12
  }
}

export async function runReasoningChecks(api) {
  const { check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect } = api
  async function source(page) {
    await expect(page.locator('article h3')).toHaveText(headings, { useInnerText: true })
    await expect(page.locator('article .katex-display')).toHaveCount(0)
    await expect(page.locator('article [data-mermaid-renderer="strict"]')).toHaveCount(0)
    await expect(page.locator('article table')).toHaveCount(2)
    // The source TODO blockquote becomes the site's existing TodoCallout.
    await expect(page.locator('article blockquote')).toHaveCount(0)
    await expect(page.locator('article aside.todo-callout')).toHaveCount(1)
    await expect(page.locator('article aside.todo-callout')).toContainText('推論モデルの提供形態')
    const sourceLists = await page.locator('article ul, article ol').evaluateAll(nodes => nodes.filter(node => !node.closest('.rf-article-toc, .rf-static-stages')).length)
    assert.equal(sourceLists, 11)
    for (const heading of [headings[0], ...headings.slice(7)]) assert.equal(await page.locator('article h3').filter({ hasText: heading }).evaluate(node => node.closest('.reading-figure') === null), true)
  }
  async function openReasoning(page, result, options = {}) {
    await open(page, reasoningPath, reasoning, result, options)
    await structure(page, reasoning, 0, result, 9)
    await source(page)
  }
  const defaultSettings = figure => Object.fromEntries(figure.controls.map(control => [control.id, String(control.default)]))
  async function semantics(panel, figure, index, settings = defaultSettings(figure), options = {}) {
    await assertSceneSemantics(panel, figure, index, settings, expect, options)
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
    assert.deepEqual(observation.wireText, [], 'reasoning wire crosses text')
    assert.ok(observation.fonts.length > 0 && observation.fonts.every(font => Number.isFinite(font.renderedFontPx) && font.renderedFontPx > 0))
    ;(result.reasoningGeometryObservations ??= []).push({ label, ...observation })
    result.visualReviewRequired ||= observation.overlapCandidates.length > 0
    result.independentVisualReviewStatus = 'pending-independent-public-image-review'
    return observation
  }
  async function capture(page, panel, result, name) {
    await screenshot(page, name)
    await screenshot(page, name + '-scene', panel.locator('svg.aw-scene'))
    const observation = result.reasoningGeometryObservations.at(-1)
    observation.screenshots = { viewport: name + '.png', completeScene: name + '-scene.png' }
  }
  for (const [width, height, theme, deviceScaleFactor] of reasoningProfiles) await check(`reasoning: all 9 stages ${width}x${height} ${theme} DSF${deviceScaleFactor}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme, deviceScaleFactor }, async page => {
      await openReasoning(page, result, { theme }); result.geometry = {}
      for (const figure of reasoning) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index)
          result.geometry[figure.id].push({ stage: index, ...await geometry(page, panel), ...await visibleGeometry(panel, result, `${figure.id} stage ${index}`) })
          await capture(page, panel, result, `${figure.id}-stage-${index}-${width}x${height}-${theme}-dsf${deviceScaleFactor}`)
        }
        if (height <= 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
      }
    }); sceneDelivery(result, reasoning)
  })
  for (const figure of reasoning) await check(semanticCaseNames[figure.id], async result => {
    await usePage(result, {}, async page => {
      await openReasoning(page, result)
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
      if (figure.id === 'reasoning-evaluation') for (const taskFocus of ['multi-step', 'verifiable', 'constraints']) for (const effortFocus of ['lower', 'higher']) {
        await stage(panel, figure, 0); await panel.getByRole('combobox', { name: '表の観点', exact: true }).selectOption(taskFocus)
        await stage(panel, figure, 1); await panel.getByRole('combobox', { name: '注目する思考量', exact: true }).selectOption(effortFocus)
        Object.assign(settings, { taskFocus, effortFocus })
        for (let index = 0; index < 5; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index, settings)
          result.selectedStateGrid.push({ taskFocus, effortFocus, stage: index })
        }
      }
      if (figure.id === 'reasoning-evaluation') assert.equal(result.selectedStateGrid.length, 30)
      for (let index = 0; index < figure.labels.length; index++) { await stage(panel, figure, index); await semantics(panel, figure, index, settings) }
    })
  })
  await check('reasoning: keyboard transport, modal selectors, isolated state and focus return', async result => {
    await usePage(result, {}, async page => {
      await openReasoning(page, result)
      for (const figure of reasoning) await stage(panelOf(page, figure.id), figure, 0)
      for (const figure of reasoning) {
        const panel = panelOf(page, figure.id), settings = defaultSettings(figure)
        const others = reasoning.filter(item => item !== figure), previous = await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue()))
        await stage(panel, figure, 0); const slider = panel.getByRole('slider')
        await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0'); await expect(panel.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        const observations = figure.controls.length ? figure.controls.flatMap(control => control.options.map(value => ({ control, value }))) : [{ control: null, value: null }]
        for (const { control, value } of observations) {
          const index = control ? control.stages[0] : 2; await stage(panel, figure, index)
          const opener = panel.getByRole('button', { name: '図を拡大', exact: true }); await opener.focus(); await page.keyboard.press('Enter')
          const dialog = rootOf(page, figure.id).getByRole('dialog'), large = dialog.locator('.aw-diagram')
          await expect(dialog).toBeVisible(); assert.equal(await dialog.evaluate(node => node.matches(':modal')), true)
          if (control) { settings[control.id] = value; await large.getByLabel(control.label, { exact: true }).selectOption(value) }
          await semantics(large, figure, index, settings); await geometry(page, large); await visibleGeometry(large, result, figure.id + ' expanded ' + (value ?? 'default')); await capture(page, large, result, figure.id + '-expanded-' + (value ?? 'default'))
          await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused()
          if (control) await expect(panel.getByLabel(control.label, { exact: true })).toHaveValue(value)
          await opener.click(); await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(opener).toBeFocused()
        }
        assert.deepEqual(await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue())), previous, 'Modal changes must not move other figures')
        const ids = await rootOf(page, figure.id).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id)); assert.equal(new Set(ids).size, ids.length)
      }
    })
  })
  await check('reasoning: all 8 READ stops, manual-stage meaning carryover and independent figure states', async result => {
    await usePage(result, {}, async page => {
      await openReasoning(page, result); result.readingStops = {}
      for (const figure of reasoning) await stage(panelOf(page, figure.id), figure, 0)
      const scroll = async (figure, index, edge = 'top') => {
        await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate((node, edge) => window.scrollTo({ top: scrollY + node.getBoundingClientRect()[edge] - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }), edge)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      }
      for (const figure of reasoning) {
        for (let index = 0; index < figure.labels.length; index++) if (!figure.steps.includes(index)) await expect(rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`)).toHaveCount(0)
        const panel = panelOf(page, figure.id), others = reasoning.filter(item => item !== figure)
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
  for (const figure of reasoning) await check(`${figure.id}: native elapsed play, frozen pause, replay and completion`, async result => {
    await usePage(result, {}, async page => {
      await openReasoning(page, result); const panel = panelOf(page, figure.id), slider = panel.getByRole('slider')
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
  await check('reasoning noJS: original prose, nine headings, two tables and all nine static stage descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await openReasoning(page, result, { noJS: true })
      for (const figure of reasoning) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible()
        await expect(root.locator('.rf-static-stages li strong')).toHaveText(figure.labels)
        for (const item of await root.locator('.rf-static-stages li > span').all()) assert.ok((await item.textContent()).trim().length > 20)
        await screenshot(page, `reasoning-no-javascript-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await screenshot(page, 'reasoning-no-javascript')
    })
  })
  await check('reasoning print: coherent scenes and original article with controls hidden', async result => {
    await usePage(result, {}, async page => {
      await openReasoning(page, result)
      for (const figure of reasoning) await phase(panelOf(page, figure.id), Math.min(2.25, figure.labels.length - 1 - .25))
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.emulateMedia({ media: 'print' })
      for (const figure of reasoning) {
        const panel = panelOf(page, figure.id)
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        await expect(panel.locator('.aw-timeline')).not.toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
        const current = Number(await panel.getAttribute('data-stage')); assert.ok(Number.isInteger(current)); await semantics(panel, figure, current, defaultSettings(figure), { print: true })
        await screenshot(page, `reasoning-print-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await source(page); await screenshot(page, 'reasoning-print'); result.print = 'CSS emulation with beforeprint; not physical printing'
    })
  })
}

// Validators consume only independently observed visible output and literal oracles.
export function assertSequenceObservation(value) {
  const text = observed => { assert.equal(typeof observed, 'string', 'Visible text must be observed'); return observed.normalize('NFKC').replace(/\s+/g, '') }
  const visible = text(value.visibleText)
  const has = label => assert.ok(visible.includes(text(label)), 'Missing visible sequence meaning: ' + label)
  const named = (items, id) => { const matches = items.filter(item => item.id === id); assert.equal(matches.length, 1, 'One visible text binding: ' + id); return text(matches[0].text) }
  const caveat = (id, label) => { assert.ok(value.caveats.includes(id)); assert.equal(named(value.caveatTexts, id), text(label), 'Visible caveat changed: ' + id) }
  assert.ok(Number.isInteger(value.stage) && value.stage >= 0 && value.stage < 4)
  assert.equal(value.weights, 'fixed'); assert.equal(value.content, 'not-reproduced'); assert.equal(value.costEstimate, 'none')
  const expected = REASONING_ORACLE.sequence.stageVisibleNodeIds[value.stage]
  assert.equal(new Set(value.nodes).size, value.nodes.length)
  for (const id of expected.visible) assert.ok(value.nodes.includes(id), 'Required visible generation node: ' + id)
  assert.ok(value.nodes.every(id => REASONING_ORACLE.sequence.nodeIds.includes(id)))
  assert.deepEqual(value.nodeTexts.map(item => item.id), value.nodes)
  for (const [id, label] of [['input', '入力'], ['reasoning-region', '推論の模式領域'], ['prior-symbols', '既生成'], ['next-prediction', '後続予測'], ['runtime-model', '推論時の重みは固定']]) assert.equal(named(value.nodeTexts, id), text(label), 'Visible node label changed: ' + id)
  assert.equal(value.nodes.includes('training-adjustment'), value.stage === 2)
  // A stable, unexpanded answer placeholder may remain during intermediate stages.
  if (value.nodes.includes('final-answer')) {
    assert.equal(value.answerExpanded, String(value.stage === 3))
    assert.equal(named(value.nodeTexts, 'final-answer'), value.stage === 3 ? '最終回答' : '最終回答未展開')
  }
  for (const meaning of expected.requiredEdges) {
    const fixed = meaning === 'conditions-following-prediction' ? REASONING_ORACLE.sequence.conditioningEdge : REASONING_ORACLE.sequence.answerEdge
    const edge = value.edges.find(item => item.meaning === meaning)
    assert.ok(edge, 'Missing visible semantic edge: ' + meaning)
    assert.deepEqual(edge, fixed, 'Visible edge endpoints differ')
  }
  caveat('not-private-thought', '記号は模式表示。実際の思考内容ではない')
  has('既生成の内容 → 後続予測の条件')
  if (value.stage < 3) has('通常モデルも中間の考察を書ける')
  if (value.stage < 2) has('記号の個数・長さはトークン数ではない')
  if (value.stage === 2) {
    caveat('reasoning-not-guaranteed', '検証の正しさは保証されない')
    const training = named(value.nodeTexts, 'training-adjustment')
    assert.equal(training, text('学習・推論処理の調整 CoT 指示だけとは限らない'), 'Visible training scope must not become a CoT-only or runtime-update claim')
    const { source, target, meaning } = REASONING_ORACLE.sequence.trainingAssociation
    assert.deepEqual(value.edges.find(item => item.meaning === meaning), { source, target, meaning })
  }
  if (value.stage === 3) {
    assert.deepEqual(value.bands, [{ id: 'reasoning', measured: 'false' }, { id: 'answer', measured: 'false' }])
    assert.deepEqual(value.bandTexts.map(item => ({ id: item.id, text: text(item.text) })), [{ id: 'reasoning', text: '推論' }, { id: 'answer', text: '最終回答' }])
    has('推論にも時間・費用がかかる')
    caveat('not-billing-formula', '比率・実費は示さない')
  } else { assert.deepEqual(value.bands, []); assert.deepEqual(value.bandTexts, []) }
}

export function assertEvaluationObservation(value, settings = { taskFocus: 'multi-step', effortFocus: 'lower' }) {
  const text = observed => { assert.equal(typeof observed, 'string', 'Visible text must be observed'); return observed.normalize('NFKC').replace(/\s+/g, '') }
  const visible = text(value.visibleText)
  const has = label => assert.ok(visible.includes(text(label)), 'Missing visible evaluation meaning: ' + label)
  const named = (items, id) => { const matches = items.filter(item => item.id === id); assert.equal(matches.length, 1, 'One visible text binding: ' + id); return text(matches[0].text) }
  const caveat = (id, label) => { assert.ok(value.caveats.includes(id)); assert.equal(named(value.caveatTexts, id), text(label), 'Visible caveat changed: ' + id) }
  const metricIds = ['quality', 'cost', 'latency'], metricLabels = { quality: '品質', cost: '費用', latency: '待ち時間' }
  const metric = item => {
    assert.ok(metricIds.includes(item.id)); assert.equal(item.status, 'unmeasured'); assert.equal(item.value, null); assert.equal(item.unit, null)
    const label = text(item.text).replaceAll(':', '')
    assert.equal(label, value.stage === 4 ? '未計測' : metricLabels[item.id] + '未計測', 'Visible metric must retain its name and unknown value')
  }
  assert.ok(Number.isInteger(value.stage) && value.stage >= 0 && value.stage < 5)
  assert.ok(REASONING_ORACLE.evaluation.settingGrid.taskFocus.includes(settings.taskFocus))
  assert.ok(REASONING_ORACLE.evaluation.settingGrid.effortFocus.includes(settings.effortFocus))
  assert.equal(value.taskFocus, value.stage === 0 ? settings.taskFocus : 'none')
  assert.equal(value.effortFocus, [1, 2].includes(value.stage) ? settings.effortFocus : 'none')
  assert.equal(value.measurement, 'unmeasured'); assert.equal(value.decision, 'none')
  for (const item of value.metrics) metric(item)
  if (value.stage <= 2) {
    assert.deepEqual(value.comparison, { input: 'same-input', model: 'same-model' })
    assert.deepEqual(value.variants.map(item => item.id), ['lower', 'higher'])
    assert.deepEqual(value.variants.map(item => item.emphasized), ['lower', 'higher'].map(id => String([1, 2].includes(value.stage) && id === settings.effortFocus)))
    assert.deepEqual(value.metrics.map(item => item.id), value.stage === 0 ? metricIds : [...metricIds, ...metricIds])
    for (const variant of value.variants) {
      const label = variant.id === 'lower' ? '低めの思考量' : '高めの思考量'
      assert.ok(text(variant.text).startsWith(label), 'Visible effort lane label differs from its ID')
      assert.deepEqual(variant.metrics.map(item => item.id), value.stage === 0 ? [] : metricIds, 'Each effort lane needs all three measurements')
      for (const item of variant.metrics) metric(item)
    }
    assert.ok(text(value.comparisonText).includes(text(value.stage === 0 ? '同じ実入力で設定を比較' : '同じ入力・モデル・指示・評価基準')))
  }
  if (value.stage === 0) {
    assert.deepEqual(value.rows.map(item => item.id), ['multi-step', 'verifiable', 'constraints'])
    const candidateLabels = [
      ['多段の数学・計画 複雑なデバッグ', '事実検索 定型の抽出・分類'],
      ['正しさを 検証できる問題', '低遅延の対話 大量処理'],
      ['制約が多い 慎重な判断', '参照・手順が 定型化された問い']
    ]
    for (const [index, row] of value.rows.entries()) {
      assert.equal(row.emphasized, String(row.id === settings.taskFocus))
      assert.deepEqual(row.candidates, ['improvement', 'lower-comparison'])
      assert.deepEqual(row.candidateTexts.map(item => item.id), row.candidates)
      for (const [column, id] of row.candidates.entries()) assert.equal(named(row.candidateTexts, id), text(candidateLabels[index][column]), 'Visible original-table candidate changed or moved to the wrong column')
    }
    has('改善を評価する候補'); has('低めとの比較が必要な候補')
    caveat('no-auto-choice', '各欄は別タスク。表だけで採否を決めない')
  } else assert.deepEqual(value.rows, [])
  if (value.stage === 1) {
    caveat('provider-specific', '名称・仕様はモデル別')
    has('品質・費用・待ち時間は未計測')
  }
  if (value.stage === 2) {
    caveat('benefit-not-guaranteed', '追加便益が小さい場合もある')
    caveat('effort-not-permission', '曖昧な要件・権限制御は別に見直す')
    has('すべての簡単な問いで悪化するわけではない')
    assert.ok(value.extraWork, 'Additional work is a visible nonnumeric band')
    assert.equal(text(value.extraWorkText), text('追加の作業（模式）'))
  }
  if (value.stage === 3) {
    assert.deepEqual(value.requiredConditions, ['goal', 'constraints', 'approval', 'evidence-check', 'business-rules'])
    assert.deepEqual(value.requiredConditionTexts.map(item => ({ id: item.id, text: text(item.text) })), [
      { id: 'goal', text: '目標' }, { id: 'constraints', text: '制約' }, { id: 'approval', text: '承認' }, { id: 'evidence-check', text: '根拠確認' }, { id: 'business-rules', text: '業務規程' }
    ])
    assert.equal(value.executionBoundary, 'outside-model'); assert.equal(value.exploration, 'within-boundary')
    assert.equal(text(value.executionBoundaryText), text('モデル外の実行コード 安全条件は実行側でも強制'))
    assert.ok(text(value.explorationText).includes('必須手順を保ち、探索は境界内で'))
    caveat('effort-not-permission', '安全条件は実行側でも強制')
    has('思考指示の効果はモデル別に比較')
    const { boundary, token } = value.explorationBounds
    for (const rect of [boundary, token]) { for (const key of ['x', 'y', 'width', 'height']) assert.ok(Number.isFinite(rect[key])); assert.ok(rect.width > 0 && rect.height > 0) }
    assert.ok(token.x >= boundary.x - 1 && token.y >= boundary.y - 1 && token.x + token.width <= boundary.x + boundary.width + 1 && token.y + token.height <= boundary.y + boundary.height + 1, 'Exploration must remain geometrically inside the visible boundary')
    assert.equal(value.metrics.length, 0)
  }
  if (value.stage === 4) {
    assert.deepEqual(value.comparison, { input: 'same-input', model: 'same-model' })
    assert.ok(text(value.comparisonText).includes('同じ入力・モデル・指示・評価基準'))
    assert.deepEqual(value.trials.map(({ metrics, text, ...item }) => item), REASONING_ORACLE.evaluation.trials)
    assert.equal(value.metrics.length, 12)
    assert.deepEqual(value.metrics.map(item => item.id), Array.from({ length: 4 }, () => metricIds).flat())
    for (const [index, trial] of value.trials.entries()) {
      assert.deepEqual(trial.metrics, metricIds)
      assert.equal(text(trial.text), `${index < 2 ? '低め' : '高め'}${index % 2 ? 'B' : 'A'}未計測未計測未計測`)
    }
    for (const label of ['同条件で複数回', '品質・費用・待ち時間を同時に記録', '設定内は同条件／設定間は思考量だけ変更', 'A/B は空の見本。推奨回数ではない', '思考は非公開・要約のみの場合もある']) has(label)
    caveat('thought-not-cause', '見える思考から原因を断定しない')
  } else assert.deepEqual(value.trials, [])
}

async function assertSceneSemantics(panel, figure, index, settings, expect, { print = false } = {}) {
  const svg = panel.locator('svg.aw-scene')
  await expect(svg).toHaveAttribute(figure.attr, String(index))
  for (const control of figure.controls) {
    const field = panel.getByRole('combobox', { name: control.label, exact: true, includeHidden: print })
    if (control.stages.includes(index)) {
      if (print) await expect(field).not.toBeVisible()
      else await expect(field).toBeVisible()
      await expect(field).toHaveValue(settings[control.id])
    }
    else await expect(field).toHaveCount(0)
  }
  const observation = await panel.evaluate((panel, id) => {
    const svg = panel.querySelector('svg.aw-scene')
    const visible = node => {
      for (let at = node; at && at !== panel.parentElement; at = at.parentElement) {
        const style = getComputedStyle(at)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      }
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return true
      // SVG geometric bounds exclude stroke: a painted horizontal arrow has zero height.
      if (node instanceof SVGGeometryElement) {
        const style = getComputedStyle(node)
        return (rect.width > 0 || rect.height > 0) && style.stroke !== 'none' && Number(style.strokeOpacity) > 0 && parseFloat(style.strokeWidth) > 0 && node.getTotalLength() > 0
      }
      return node instanceof SVGGElement && [...node.children].some(visible)
    }
    const all = (selector, parent = svg) => [...parent.querySelectorAll(selector)].filter(visible)
    const one = selector => all(selector)[0]
    const visibleContent = node => [...node.childNodes].map(child => child.nodeType === Node.TEXT_NODE ? child.textContent : child instanceof Element && visible(child) ? visibleContent(child) : '').join('')
    const textOf = node => node ? [ ...(node.matches('text, p') ? [node] : []), ...node.querySelectorAll('text, p') ].filter(visible).map(visibleContent).join(' ').replace(/\s+/g, '') : null
    const bounds = selector => {
      const node = one(selector)
      if (!node) return null
      const { x, y, width, height } = node.getBoundingClientRect()
      return { x, y, width, height }
    }
    const metricOf = node => ({ id: node.dataset.metric, status: node.dataset.metricStatus, value: node.getAttribute('data-value'), unit: node.getAttribute('data-unit'), text: textOf(node) })
    const caveats = all('[data-caveat]').map(node => node.dataset.caveat)
    const caveatTexts = all('[data-caveat]').map(node => ({ id: node.dataset.caveat, text: textOf(node) }))
    const visibleText = [...panel.querySelectorAll('svg text, p')].filter(visible).map(visibleContent).join(' ').replace(/\s+/g, '')
    if (id === 'reasoning-sequence') return {
      stage: Number(svg.dataset.reasoningSequenceStage), weights: svg.dataset.runtimeWeights, content: svg.dataset.reasoningContent, costEstimate: svg.dataset.costEstimate,
      nodes: all('[data-reasoning-node]').map(node => node.dataset.reasoningNode), answerExpanded: one('[data-reasoning-node="final-answer"]')?.dataset.expanded ?? null,
      nodeTexts: all('[data-reasoning-node]').map(node => ({ id: node.dataset.reasoningNode, text: textOf(node) })),
      edges: all('[data-edge-meaning]').map(node => ({ source: node.dataset.edgeSource, target: node.dataset.edgeTarget, meaning: node.dataset.edgeMeaning })),
      bands: all('[data-resource-band]').map(node => ({ id: node.dataset.resourceBand, measured: node.dataset.measured })),
      bandTexts: all('[data-resource-band]').map(node => ({ id: node.dataset.resourceBand, text: textOf(node) })), caveats, caveatTexts, visibleText
    }
    const comparison = one('[data-comparison-input]')
    return {
      stage: Number(svg.dataset.reasoningEvaluationStage), taskFocus: svg.dataset.taskFocus, effortFocus: svg.dataset.effortFocus,
      measurement: svg.dataset.measurementState, decision: svg.dataset.taskDecision,
      comparison: comparison ? { input: comparison.dataset.comparisonInput, model: comparison.dataset.comparisonModel } : null,
      comparisonText: textOf(comparison),
      variants: all('[data-effort-variant]').map(node => ({ id: node.dataset.effortVariant, emphasized: node.dataset.emphasized, text: textOf(node), metrics: all('[data-metric]', node).map(metricOf) })),
      rows: all('[data-task-row]').map(node => ({ id: node.dataset.taskRow, emphasized: node.dataset.emphasized, candidates: all('[data-task-candidate]', node).map(child => child.dataset.taskCandidate), candidateTexts: all('[data-task-candidate]', node).map(child => ({ id: child.dataset.taskCandidate, text: textOf(child) })) })),
      metrics: all('[data-metric]').map(metricOf),
      requiredConditions: all('[data-required-condition]').map(node => node.dataset.requiredCondition),
      requiredConditionTexts: all('[data-required-condition]').map(node => ({ id: node.dataset.requiredCondition, text: textOf(node) })),
      executionBoundary: one('[data-execution-boundary]')?.dataset.executionBoundary ?? null,
      executionBoundaryText: textOf(one('[data-execution-boundary]')),
      exploration: one('[data-exploration]')?.dataset.exploration ?? null,
      explorationText: textOf(one('[data-exploration]')),
      explorationBounds: { boundary: bounds('rect.re-boundary'), token: bounds('rect.re-exploration') },
      extraWork: Boolean(one('[data-extra-work]')),
      extraWorkText: textOf(one('[data-extra-work]')),
      trials: all('[data-trial-id]').map(node => ({ id: node.dataset.trialId, effort: node.dataset.trialEffort, inputId: node.dataset.trialInput, conditionId: node.dataset.trialCondition, metrics: all('[data-metric]', node).map(child => child.dataset.metric), text: textOf(node) })),
      caveats, caveatTexts, visibleText
    }
  }, figure.id)
  if (figure.id === 'reasoning-sequence') assertSequenceObservation(observation)
  else assertEvaluationObservation(observation, settings)
}
