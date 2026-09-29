import assert from 'node:assert/strict'

// Independent approved storyboard fixtures; no product model or public response supplies expectations.
export const pretrainingPath = '/docs/llm-internals/pretraining-and-scaling-laws'
export const pretraining = [
  {
    "id": "pretraining-loss-perplexity",
    "marker": "PRETRAINING / LOSS & PERPLEXITY",
    "attr": "data-pretraining-loss-stage",
    "labels": [
      "予測",
      "正解確率",
      "損失",
      "PPL",
      "比較条件"
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
        "id": "probability-example",
        "label": "説明用の確率",
        "stages": [
          1,
          2,
          3
        ],
        "options": [
          "A",
          "B"
        ],
        "default": "A",
        "behavior": "固定表を切替。列/位置/prefixを保持。S4は常にA/B両方を表示し、この操作を引き継がない。"
      },
      {
        "id": "comparison-condition",
        "label": "比較する条件",
        "stages": [
          4
        ],
        "options": [
          "same",
          "different-tokenizer",
          "different-data"
        ],
        "default": "same",
        "behavior": "同一条件のみ比較を許す。異条件はcomparisonAllowed=false; PPLは元の説明例の値と明記したまま勝敗/順位を出さない。"
      }
    ]
  },
  {
    "id": "pretraining-scaling",
    "marker": "PRETRAINING / SCALING LAWS",
    "attr": "data-pretraining-scaling-stage",
    "labels": [
      "軸",
      "残差",
      "固定予算",
      "系譜",
      "推論時",
      "条件依存"
    ],
    "steps": [
      0,
      1,
      3,
      4,
      5
    ],
    "controls": [
      {
        "id": "fixed-allocation",
        "label": "同じ予算の配分",
        "stages": [
          2
        ],
        "options": [
          "data-heavy",
          "reference",
          "parameter-heavy"
        ],
        "default": "reference",
        "behavior": "固定Cの3組のみ。S3は3組の要点を独立に表示し選択を持ち越さない。"
      },
      {
        "id": "growth-scale",
        "label": "予算を増やす説明例",
        "stages": [
          3
        ],
        "options": [
          1,
          2,
          4
        ],
        "default": 2,
        "behavior": "NとDの基準比を同率r、C比をr²へ。固定C枠は変えない。"
      },
      {
        "id": "coefficient-condition",
        "label": "係数に関わる条件",
        "stages": [
          5
        ],
        "options": [
          "data",
          "architecture",
          "tokenizer"
        ],
        "default": "data",
        "behavior": "強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない"
      }
    ]
  },
  {
    "id": "pretraining-data",
    "marker": "PRETRAINING / DATA",
    "attr": "data-pretraining-data-stage",
    "labels": [
      "量と中身",
      "再利用",
      "設計観点",
      "データ制約"
    ],
    "steps": [
      0,
      2,
      3
    ],
    "controls": [
      {
        "id": "data-focus",
        "label": "確認するデータ観点",
        "stages": [
          2
        ],
        "options": [
          "quality",
          "mixture",
          "reuse",
          "contamination"
        ],
        "default": "quality",
        "behavior": "強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない"
      }
    ]
  },
  {
    "id": "pretraining-metrics",
    "marker": "PRETRAINING / METRICS",
    "attr": "data-pretraining-metrics-stage",
    "labels": [
      "論争",
      "同じ出力",
      "測り方",
      "併用"
    ],
    "steps": [
      0,
      2,
      3
    ],
    "controls": [
      {
        "id": "score-threshold",
        "label": "二値化の閾値",
        "stages": [
          2
        ],
        "options": [
          50,
          60,
          70
        ],
        "displayScale": 100,
        "default": 60,
        "behavior": "6入力を固定したまま>=閾値で二値化。S0/S1/S3は選択に依存しない。"
      }
    ]
  },
  {
    "id": "pretraining-compute",
    "marker": "PRETRAINING / COMPUTE BUDGET",
    "attr": "data-pretraining-compute-stage",
    "labels": [
      "概算",
      "積",
      "配分",
      "実コスト"
    ],
    "steps": [
      0,
      1,
      3
    ],
    "controls": [
      {
        "id": "parameter-factor",
        "label": "Nの基準比",
        "stages": [
          1
        ],
        "options": [
          1,
          2
        ],
        "default": 1,
        "behavior": "この段階だけN比を変更。D比との積を表示。"
      },
      {
        "id": "data-factor",
        "label": "Dの基準比",
        "stages": [
          1
        ],
        "options": [
          1,
          2
        ],
        "default": 1,
        "behavior": "この段階だけD比を変更。N比との積を表示。"
      },
      {
        "id": "compute-allocation",
        "label": "同じ予算の配分",
        "stages": [
          2
        ],
        "options": [
          "data-heavy",
          "reference",
          "parameter-heavy"
        ],
        "default": "reference",
        "behavior": "固定Cのみ。S3の要点は固定表示でこの選択と無関係。"
      },
      {
        "id": "real-cost-factor",
        "label": "実測が必要な項目",
        "stages": [
          3
        ],
        "options": [
          "duration",
          "price",
          "energy"
        ],
        "default": "duration",
        "behavior": "強調のみ。比較対象・前提・結論は消さず、段階の意味は変えない"
      }
    ]
  }
]
export const pretrainingProfiles = [[1440,1000,"light",1],[1440,1000,"dark",1],[1280,720,"light",1],[390,844,"light",1],[390,844,"dark",1],[960,540,"light",2]]
export const PRETRAINING_ORACLE = {
  "loss-perplexity": {
    "kind": "exact-explanatory",
    "tokenizerId": "toy-tokenizer",
    "evaluationId": "toy-eval-abc",
    "vocabulary": [
      "A",
      "B",
      "C",
      "D"
    ],
    "occurrences": [
      {
        "id": "eval-0",
        "token": "A",
        "prefix": []
      },
      {
        "id": "eval-1",
        "token": "B",
        "prefix": [
          "A"
        ]
      },
      {
        "id": "eval-2",
        "token": "C",
        "prefix": [
          "A",
          "B"
        ]
      }
    ],
    "examples": {
      "A": {
        "rows": [
          [
            0.5,
            0.25,
            0.125,
            0.125
          ],
          [
            0.25,
            0.25,
            0.25,
            0.25
          ],
          [
            0.375,
            0.25,
            0.125,
            0.25
          ]
        ],
        "correct": [
          0.5,
          0.25,
          0.125
        ],
        "negativeLogs": [
          "ln(2)",
          "ln(4)",
          "ln(8)"
        ],
        "loss": "ln(4)",
        "lossDecimal": 1.3862943611198906,
        "ppl": 4
      },
      "B": {
        "rows": [
          [
            0.5,
            0.25,
            0.125,
            0.125
          ],
          [
            0.25,
            0.5,
            0.125,
            0.125
          ],
          [
            0.125,
            0.125,
            0.5,
            0.25
          ]
        ],
        "correct": [
          0.5,
          0.5,
          0.5
        ],
        "negativeLogs": [
          "ln(2)",
          "ln(2)",
          "ln(2)"
        ],
        "loss": "ln(2)",
        "lossDecimal": 0.6931471805599453,
        "ppl": 2
      }
    },
    "notPPL": {
      "reciprocalArithmeticMeanA": "24/7"
    },
    "edgeCases": {
      "probabilityOne": {
        "loss": 0,
        "ppl": 1
      },
      "probabilityZero": {
        "loss": "Infinity",
        "ppl": "Infinity"
      }
    },
    "empiricalMeasurement": false
  },
  "scaling": {
    "kind": "symbolic-and-algebraic",
    "fittedCoefficients": null,
    "lossPrediction": null,
    "residualIdentity": "R(rN)/R(N) = r^(-alpha)",
    "totalLossRatio": "(Linf + R*r^(-alpha))/(Linf + R)",
    "fixedCompute": [
      {
        "n": 0.5,
        "d": 2,
        "c": 1
      },
      {
        "n": 1,
        "d": 1,
        "c": 1
      },
      {
        "n": 2,
        "d": 0.5,
        "c": 1
      }
    ],
    "growingBudget": [
      {
        "n": 1,
        "d": 1,
        "c": 1
      },
      {
        "n": 2,
        "d": 2,
        "c": 4
      },
      {
        "n": 4,
        "d": 4,
        "c": 16
      }
    ],
    "optimum": null
  },
  "data": {
    "kind": "exact-count-plus-structural",
    "documents": [
      {
        "id": "A",
        "positions": [
          "A0",
          "A1"
        ]
      },
      {
        "id": "B",
        "positions": [
          "B0",
          "B1"
        ]
      },
      {
        "id": "C",
        "positions": [
          "C0",
          "C1"
        ]
      },
      {
        "id": "D",
        "positions": [
          "D0",
          "D1"
        ]
      }
    ],
    "exposures": [
      "A",
      "B",
      "C",
      "D",
      "A",
      "B"
    ],
    "readCount": 6,
    "sourceDocumentCount": 4,
    "processedTokenOccurrences": 12,
    "sourceTokenPositions": 8,
    "uniqueVocabularyCount": null,
    "qualityScores": null,
    "learningEffect": null
  },
  "metrics": {
    "kind": "exact-explanatory",
    "ids": [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F"
    ],
    "scoresNumerator": [
      30,
      40,
      50,
      60,
      70,
      80
    ],
    "denominator": 100,
    "thresholds": {
      "50": [
        0,
        0,
        1,
        1,
        1,
        1
      ],
      "60": [
        0,
        0,
        0,
        1,
        1,
        1
      ],
      "70": [
        0,
        0,
        0,
        0,
        1,
        1
      ]
    },
    "empiricalMeasurement": false,
    "emergenceJudgment": null
  },
  "compute": {
    "kind": "exact-algebraic",
    "baseline": "C0 = 6*N0*D0",
    "factorCases": [
      {
        "n": 1,
        "d": 1,
        "c": 1
      },
      {
        "n": 2,
        "d": 1,
        "c": 2
      },
      {
        "n": 1,
        "d": 2,
        "c": 2
      },
      {
        "n": 2,
        "d": 2,
        "c": 4
      }
    ],
    "fixedCompute": [
      {
        "n": 0.5,
        "d": 2,
        "c": 1
      },
      {
        "n": 1,
        "d": 1,
        "c": 1
      },
      {
        "n": 2,
        "d": 0.5,
        "c": 1
      }
    ],
    "actualCost": {
      "duration": null,
      "price": null,
      "energy": null
    },
    "optimum": null
  }
}
const headings = ["概要: 事前学習は「次トークン予測」の一点","次トークン予測の目的関数","スケーリング則の系譜","データ側: 量・品質・混合・繰り返し","創発的能力の論争","学習の計算量の目安","この理解が効く場面","アンチパターン","チェックリスト"]

const near = (actual, expected, message) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-10, message)
export function assertLossObservation(value, example) {
  const oracle = PRETRAINING_ORACLE['loss-perplexity'], expected = oracle.examples[example]
  assert.deepEqual(value.rows.map(row => ({ id: row.id, token: row.token, prefix: row.prefix })), oracle.occurrences, 'Evaluation IDs, targets and prefixes must stay fixed')
  if (value.rows.some(row => 'probabilities' in row)) assert.deepEqual(value.rows.map(row => row.probabilities), expected.rows, 'Full fixed vocabulary distributions differ')
  value.rows.forEach((row, index) => {
    near(row.probability, expected.correct[index], 'Correct-token probability differs')
    near(row.loss, -Math.log(expected.correct[index]), 'Token negative log loss differs')
    if ('probabilities' in row) near(row.probabilities.reduce((sum, item) => sum + item, 0), 1, 'Vocabulary probabilities must sum to one')
  })
  if ('loss' in value) near(value.loss, expected.lossDecimal, 'Mean log loss differs')
  if ('ppl' in value) near(value.ppl, expected.ppl, 'PPL must use the geometric probability mean, not arithmetic mean')
}
export function assertRatioObservation(value, expected) {
  assert.deepEqual(value, expected, 'N/D/C must preserve the fixed algebraic ratio fixture')
  near(value.c, value.n * value.d, 'Compute ratio must be the product')
}
export function assertDataObservation(value) {
  const oracle = PRETRAINING_ORACLE.data
  assert.deepEqual(value.documents, oracle.documents, 'Four source documents retain eight position IDs')
  assert.deepEqual(value.reads.map(read => read.document), oracle.exposures, 'Read order must preserve repeated sources')
  assert.equal(new Set(value.reads.map(read => read.id)).size, 6, 'Read occurrence IDs must be distinct')
  assert.equal(value.reads.length, 6)
  const positions = value.reads.flatMap(read => read.positions)
  assert.equal(positions.length, 12, 'Processed positions are occurrences, not unique information')
  assert.equal(new Set(positions.map(position => position.id)).size, 12, 'Token occurrence IDs must be distinct')
  assert.deepEqual(positions.map(position => position.source), oracle.exposures.flatMap(document => [document + '0', document + '1']))
  assert.deepEqual(value.counts, { reads: 6, documents: 4, occurrences: 12, positions: 8 })
  assert.equal(value.vocabulary, null, 'Vocabulary count must remain unknown')
  assert.equal(value.quality, null, 'Quality score must remain unknown')
  assert.equal(value.effect, null, 'Learning effect must remain unknown')
}
export function assertMetricsObservation(value, threshold) {
  const oracle = PRETRAINING_ORACLE.metrics
  assert.deepEqual(value.ids, oracle.ids, 'Metric input IDs must remain fixed')
  assert.deepEqual(value.scores, oracle.scoresNumerator, 'Changing a threshold cannot alter original scores')
  assert.deepEqual(value.passes, oracle.thresholds[threshold], 'The threshold includes equality')
  assert.equal(value.denominator, 100)
  assert.equal(value.empirical, false, 'Explanatory scores are not measured model capability')
  assert.equal(value.judgment, null, 'No emergence verdict may be manufactured')
}
export function assertUnknownCosts(value) {
  assert.deepEqual(value, { duration: null, price: null, energy: null }, 'Actual costs remain unknown, never zero')
}

export async function runPretrainingChecks(api) {
  const { check, usePage, open, structure, sceneDelivery, stage, phase, geometry, screenshot, rootOf, panelOf, expect } = api
  async function source(page) {
    await expect(page.locator('article h3')).toHaveText(headings, { useInnerText: true })
    await expect(page.locator('article .katex-display')).toHaveCount(4)
    const mermaid = page.locator('article [data-mermaid-renderer="strict"]')
    await expect(mermaid).toHaveCount(1)
    assert.equal(await mermaid.evaluate(node => node.closest('.reading-figure')?.dataset.diagramId), 'pretraining-scaling')
    for (const text of ['下限からの差', '計算予算を増やすときには', '異なるトークナイザ・異なる評価データ間で PPL を直接比較してはいけません', '学習コストは並列化効率・ハードウェアで大きく変わる']) await expect(page.locator('article')).toContainText(text)
    for (const heading of headings.slice(6)) assert.equal(await page.locator('article h3').filter({ hasText: heading }).evaluate(node => node.closest('.reading-figure') === null), true)
    for (const suffix of ['/tokenization', '/reasoning-models', '/evaluation-datasets', '/own-model-strategy']) assert.ok(await page.locator(`article a[href$="${suffix}"]`).count() > 0, `Preserve original link ${suffix}`)
  }
  async function openPretraining(page, result, options = {}) {
    await open(page, pretrainingPath, pretraining, result, options)
    await structure(page, pretraining, 4, result, 9)
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
    assert.deepEqual(observation.wireText, [], 'pretraining wire crosses text')
    assert.ok(observation.fonts.length > 0 && observation.fonts.every(font => Number.isFinite(font.renderedFontPx) && font.renderedFontPx > 0))
    ;(result.pretrainingGeometryObservations ??= []).push({ label, ...observation })
    result.visualReviewRequired ||= observation.overlapCandidates.length > 0
    result.independentVisualReviewStatus = 'pending-independent-public-image-review'
    return observation
  }
  async function capture(page, panel, result, name) {
    await screenshot(page, name)
    await screenshot(page, name + '-scene', panel.locator('svg.aw-scene'))
    const observation = result.pretrainingGeometryObservations.at(-1)
    observation.screenshots = { viewport: name + '.png', completeScene: name + '-scene.png' }
  }
  for (const [width, height, theme, deviceScaleFactor] of pretrainingProfiles) await check(`pretraining: all 23 stages ${width}x${height} ${theme} DSF${deviceScaleFactor}`, async result => {
    await usePage(result, { viewport: { width, height }, colorScheme: theme, deviceScaleFactor }, async page => {
      await openPretraining(page, result, { theme }); result.geometry = {}
      for (const figure of pretraining) {
        const panel = panelOf(page, figure.id); result.geometry[figure.id] = []
        for (let index = 0; index < figure.labels.length; index++) {
          await stage(panel, figure, index); await semantics(panel, figure, index)
          result.geometry[figure.id].push({ stage: index, ...await geometry(page, panel), ...await visibleGeometry(panel, result, `${figure.id} stage ${index}`) })
          await capture(page, panel, result, `${figure.id}-stage-${index}-${width}x${height}-${theme}-dsf${deviceScaleFactor}`)
        }
        if (height <= 720) await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'relative')
      }
    }); sceneDelivery(result, pretraining)
  })
  for (const figure of pretraining) await check(`${figure.id}: independent semantic fixtures, every selector and midpoint reverse seeks`, async result => {
    await usePage(result, {}, async page => {
      await openPretraining(page, result)
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
        const select = panel.locator(`[data-control="${control.id}"]`).getByLabel(control.label, { exact: true })
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
      if (figure.id === 'pretraining-compute') {
        await stage(panel, figure, 1)
        for (const n of [1, 2]) for (const d of [1, 2]) {
          await panel.getByLabel('Nの基準比', { exact: true }).selectOption(String(n)); settings['parameter-factor'] = String(n)
          await panel.getByLabel('Dの基準比', { exact: true }).selectOption(String(d)); settings['data-factor'] = String(d)
          await semantics(panel, figure, 1, settings)
          await visibleGeometry(panel, result, `compute cross product ${n} x ${d}`)
          await capture(page, panel, result, `pretraining-compute-product-${n}-${d}`)
        }
        result.cartesianProducts = 4
      }
      for (let index = 0; index < figure.labels.length; index++) { await stage(panel, figure, index); await semantics(panel, figure, index, settings) }
    })
  })
  await check('pretraining: keyboard transport, modal selectors, isolated state and focus return', async result => {
    await usePage(result, {}, async page => {
      await openPretraining(page, result)
      for (const figure of pretraining) await stage(panelOf(page, figure.id), figure, 0)
      for (const figure of pretraining) {
        const panel = panelOf(page, figure.id), control = figure.controls[0], settings = defaultSettings(figure)
        const others = pretraining.filter(item => item !== figure), previous = await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue()))
        await stage(panel, figure, 0); const slider = panel.getByRole('slider')
        await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue(String(figure.labels.length - 1)); await expect(panel.getByRole('button', { name: '次の段階', exact: true })).toBeDisabled()
        await page.keyboard.press('Home'); await expect(slider).toHaveValue('0'); await expect(panel.getByRole('button', { name: '前の段階', exact: true })).toBeDisabled()
        await panel.getByRole('button', { name: '次の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '1')
        await panel.getByRole('button', { name: '前の段階', exact: true }).click(); await expect(panel).toHaveAttribute('data-stage', '0')
        const index = control.stages[0]; await stage(panel, figure, index)
        const opener = panel.getByRole('button', { name: '図を拡大', exact: true }); await opener.focus(); await page.keyboard.press('Enter')
        const dialog = rootOf(page, figure.id).getByRole('dialog'), large = dialog.locator('.aw-diagram')
        await expect(dialog).toBeVisible(); assert.equal(await dialog.evaluate(node => node.matches(':modal')), true)
        const value = String(control.options.at(-1)); settings[control.id] = value
        await large.getByLabel(control.label, { exact: true }).selectOption(value)
        await semantics(large, figure, index, settings); await geometry(page, large); await visibleGeometry(large, result, `${figure.id} expanded`); await capture(page, large, result, `${figure.id}-expanded`)
        await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused(); await expect(panel.getByLabel(control.label, { exact: true })).toHaveValue(value)
        await opener.click(); await dialog.getByRole('button', { name: '拡大図を閉じる', exact: true }).click(); await expect(opener).toBeFocused()
        assert.deepEqual(await Promise.all(others.map(item => panelOf(page, item.id).getByRole('slider').inputValue())), previous, 'Modal changes must not move other figures')
        const ids = await rootOf(page, figure.id).locator('[id]').evaluateAll(nodes => nodes.map(node => node.id)); assert.equal(new Set(ids).size, ids.length)
      }
    })
  })
  await check('pretraining: all 19 READ stops, four manual-only stages and independent figure states', async result => {
    await usePage(result, {}, async page => {
      await openPretraining(page, result); result.readingStops = {}
      for (const figure of pretraining) await stage(panelOf(page, figure.id), figure, 0)
      const scroll = async (figure, index, edge = 'top') => {
        await rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`).evaluate((node, edge) => window.scrollTo({ top: scrollY + node.getBoundingClientRect()[edge] - Math.min(innerHeight * .4, 340) + 8, behavior: 'instant' }), edge)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      }
      for (const figure of pretraining) {
        for (let index = 0; index < figure.labels.length; index++) if (!figure.steps.includes(index)) await expect(rootOf(page, figure.id).locator(`[data-reading-step="${index}"]`)).toHaveCount(0)
        const panel = panelOf(page, figure.id), others = pretraining.filter(item => item !== figure)
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
  for (const figure of pretraining) await check(`${figure.id}: native elapsed play, frozen pause, replay and completion`, async result => {
    await usePage(result, {}, async page => {
      await openPretraining(page, result); const panel = panelOf(page, figure.id), slider = panel.getByRole('slider')
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
  await check('pretraining noJS: original prose, nine headings, four equations, Mermaid and 23 static descriptions', async result => {
    await usePage(result, { javaScriptEnabled: false }, async page => {
      await openPretraining(page, result, { noJS: true })
      for (const figure of pretraining) {
        const root = rootOf(page, figure.id), panel = panelOf(page, figure.id)
        await expect(root.locator('.aw-prose')).toBeVisible(); assert.ok((await root.locator('.aw-prose').textContent()).trim().length > 50)
        await expect(panel.locator('svg.aw-scene')).toBeVisible(); await expect(panel.getByRole('slider')).toBeDisabled(); await expect(root.locator('noscript > p')).toBeVisible()
        await root.locator('.rf-static-stages summary').click(); await expect(root.locator('.rf-static-stages ol')).toBeVisible()
        await expect(root.locator('.rf-static-stages li strong')).toHaveText(figure.labels)
        for (const item of await root.locator('.rf-static-stages li > span').all()) assert.ok((await item.textContent()).trim().length > 20)
        await screenshot(page, `pretraining-no-javascript-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await screenshot(page, 'pretraining-no-javascript')
    })
  })
  await check('pretraining print: coherent scenes and original article with controls hidden', async result => {
    await usePage(result, {}, async page => {
      await openPretraining(page, result)
      for (const figure of pretraining) await phase(panelOf(page, figure.id), 2.25)
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.emulateMedia({ media: 'print' })
      for (const figure of pretraining) {
        const panel = panelOf(page, figure.id)
        await expect(rootOf(page, figure.id).locator('.aw-prose')).toBeVisible(); await expect(panel.locator('svg.aw-scene')).toBeVisible()
        await expect(panel.locator('.aw-timeline')).not.toBeVisible(); await expect(rootOf(page, figure.id).locator('.aw-sticky')).toHaveCSS('position', 'static')
        const current = Number(await panel.getAttribute('data-stage')); assert.ok(Number.isInteger(current)); await semantics(panel, figure, current)
        await screenshot(page, `pretraining-print-${figure.id}-scene`, panel.locator('svg.aw-scene'))
      }
      await source(page); await screenshot(page, 'pretraining-print'); result.print = 'CSS emulation with beforeprint; not physical printing'
    })
  })
}

const metricPositions = new WeakMap()
async function assertSceneSemantics(panel, figure, index, settings, expect) {
  const svg = panel.locator('svg.aw-scene')
  await expect(svg).toHaveAttribute(figure.attr, String(index))
  if (figure.id === 'pretraining-data') {
    if (index === 1) {
      const value = await svg.evaluate(node => ({
        documents: [...node.querySelectorAll('[data-data-document]')].map(document => ({ id: document.dataset.dataDocument, positions: [...document.querySelectorAll('[data-source-position]')].map(position => position.dataset.sourcePosition) })),
        reads: [...node.querySelectorAll('[data-data-read]')].map(read => ({ id: read.dataset.dataRead, document: read.dataset.documentId, positions: [...node.querySelectorAll('[data-processing-occurrence]')].filter(position => position.dataset.readIndex === read.dataset.readIndex).map(position => ({ id: position.dataset.processingOccurrence, source: position.dataset.sourcePositionRef })) })),
        counts: { reads: Number(node.dataset.readCount), documents: Number(node.dataset.sourceDocumentCount), occurrences: Number(node.dataset.processedTokenOccurrences), positions: Number(node.dataset.sourceTokenPositions) },
        vocabulary: node.dataset.uniqueVocabularyCount === 'unknown' ? null : node.dataset.uniqueVocabularyCount,
        quality: node.dataset.qualityScore === 'unknown' ? null : node.dataset.qualityScore,
        effect: node.dataset.learningEffect === 'unknown' ? null : node.dataset.learningEffect
      }))
      assertDataObservation(value)
      for (const count of ['6', '4', '12', '8']) await expect(svg).toContainText(count)
    }
    if (index === 2) {
      const cards = panel.locator('[data-data-aspect]')
      assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.dataAspect)), ['quality', 'mixture', 'reuse', 'contamination'])
      for (const card of await cards.all()) { await expect(card).toBeVisible(); await expect(card).toHaveAttribute('data-emphasized', String(await card.getAttribute('data-data-aspect') === settings['data-focus'])) }
      for (const label of ['品質', '配合', '再利用', '評価データ混入']) await expect(svg).toContainText(label)
    }
    if (index === 3) await expect(svg).toContainText('データ')
  } else if (figure.id === 'pretraining-metrics') {
    await expect(svg).toHaveAttribute('data-empirical-measurement', 'false'); await expect(svg).toHaveAttribute('data-emergence-judgment', 'none')
    if (index > 0) {
      const threshold = index === 2 ? Number(settings['score-threshold']) : 60
      await expect(svg).toHaveAttribute('data-score-threshold', String(threshold))
      await expect(svg).toHaveAttribute('data-score-denominator', '100')
      const values = []
      for (const view of ['continuous', 'binary']) {
        const graph = svg.locator(`[data-metric-view="${view}"]`); await expect(graph).toBeVisible()
        const rows = await graph.locator('[data-metric-point]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.metricPoint, score: Number(node.dataset.scoreNumerator), index: Number(node.dataset.pointIndex), x: Number(node.dataset.pointX), pass: Number(node.dataset.binaryValue), text: node.textContent })))
        assert.deepEqual(rows.map(row => row.index), [0, 1, 2, 3, 4, 5])
        assert.ok(rows.every(row => Number.isFinite(row.x)))
        assertMetricsObservation({ ids: rows.map(row => row.id), scores: rows.map(row => row.score), passes: rows.map(row => row.pass), denominator: 100, empirical: false, judgment: null }, threshold)
        for (const row of rows) assert.ok(row.text.includes(view === 'continuous' ? (row.score / 100).toFixed(2) : String(row.pass)), 'Show the actual fixed value in text')
        values.push(rows)
      }
      assert.deepEqual(values[0].map(row => row.x), values[1].map(row => row.x), 'Both metrics keep the same input x positions')
      const positions = values[0].map(row => row.x), page = panel.page()
      assert.ok(positions.every((position, at) => at === 0 || position > positions[at - 1]), 'Input positions remain ordered and distinct')
      if (metricPositions.has(page)) assert.deepEqual(positions, metricPositions.get(page), 'Every threshold, seek and modal preserves input positions')
      else metricPositions.set(page, positions)
    }
  } else {
    await assertNumericSemantics(panel, figure, index, settings, expect)
  }
}

async function assertNumericSemantics(panel, figure, index, settings, expect) {
  const svg = panel.locator('svg.aw-scene')
  const ratio = async locator => {
    await expect(locator).toBeVisible()
    return locator.evaluate(node => ({ n: Number(node.dataset.nRatio), d: Number(node.dataset.dRatio), c: Number(node.dataset.cRatio) }))
  }
  async function allocations(selected) {
    const rows = svg.locator('[data-allocation-id]'), expected = PRETRAINING_ORACLE.scaling.fixedCompute
    assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(node => node.dataset.allocationId)), ['data-heavy', 'reference', 'parameter-heavy'])
    for (const [at, row] of (await rows.all()).entries()) {
      assertRatioObservation(await ratio(row), expected[at]); await expect(row).toHaveAttribute('data-budget-kind', 'fixed')
      await expect(row).toHaveAttribute('data-emphasized', String(await row.getAttribute('data-allocation-id') === selected))
      for (const value of [expected[at].n, expected[at].d, expected[at].c]) await expect(row).toContainText(value === .5 ? '1/2' : String(value))
    }
  }
  if (figure.id === 'pretraining-loss-perplexity') {
    await expect(svg).toHaveAttribute('data-tokenizer-id', 'toy-tokenizer'); await expect(svg).toHaveAttribute('data-evaluation-id', 'toy-eval-abc')
    await expect(svg).toHaveAttribute('data-empirical-measurement', 'false'); await expect(svg).toHaveAttribute('data-ranking', 'none')
    await expect(svg).toHaveAttribute('data-probability-example', index > 0 && index < 4 ? settings['probability-example'] : 'none')
    if (index < 4) {
      const example = index === 0 ? 'A' : settings['probability-example']
      const rows = await svg.locator('[data-eval-id]').evaluateAll((nodes, stage) => nodes.map(node => ({ id: node.dataset.evalId, token: node.dataset.target, prefix: node.dataset.prefix ? node.dataset.prefix.split(',') : [], probability: Number(node.dataset.probability), loss: Number(node.dataset.loss), ...(stage === 1 ? { probabilities: [...node.querySelectorAll('[data-vocabulary-token]')].map(cell => Number(cell.dataset.rowProbability)) } : {}) })), index)
      const value = { rows }
      if (index >= 2) {
        const loss = svg.locator('[data-aggregate-loss]'); await expect(loss).toHaveCount(1)
        value.loss = Number(await loss.getAttribute('data-aggregate-loss')); await expect(loss).toContainText(example === 'A' ? '1.386' : '0.693')
      }
      if (index === 3) {
        const ppl = svg.locator('[data-aggregate-ppl]'); await expect(ppl).toHaveCount(1)
        value.ppl = Number(await ppl.getAttribute('data-aggregate-ppl')); await expect(ppl).toHaveText(example === 'A' ? '4' : '2')
        await expect(svg.locator('[data-caveat="not-arithmetic"]')).toContainText('算術平均の逆数とは異なる')
      }
      assertLossObservation(value, example)
      for (const [at, row] of (await svg.locator('[data-eval-id]').all()).entries()) {
        await expect(row).toContainText('次は ' + ['A', 'B', 'C'][at])
        if (index > 0) await expect(row).toContainText('p = ' + ({ .5: '1/2', .25: '1/4', .125: '1/8' }[PRETRAINING_ORACLE['loss-perplexity'].examples[example].correct[at]]))
      }
      if (index === 1) for (const row of await svg.locator('[data-eval-id]').all()) {
        const cells = row.locator('[data-vocabulary-token]')
        assert.deepEqual(await cells.evaluateAll(nodes => nodes.map(node => node.dataset.vocabularyToken)), ['A', 'B', 'C', 'D'])
        const marked = await cells.evaluateAll(nodes => nodes.filter(node => node.dataset.correct === 'true').map(node => node.dataset.vocabularyToken))
        assert.deepEqual(marked, [await row.getAttribute('data-target')])
      }
    } else {
      const allowed = settings['comparison-condition'] === 'same'
      await expect(svg).toHaveAttribute('data-comparison-allowed', String(allowed))
      await expect(svg.locator('[data-comparison-condition]')).toHaveAttribute('data-comparison-condition', settings['comparison-condition'])
      await expect(svg.locator('text[data-comparison-allowed]')).toHaveAttribute('data-comparison-allowed', String(allowed))
      await expect(svg.locator('text[data-comparison-allowed]')).toContainText(allowed ? '比較できる' : '単純比較しない')
      const examples = svg.locator('[data-comparison-example]'); await expect(examples).toHaveCount(2)
      assert.deepEqual(await examples.evaluateAll(nodes => nodes.map(node => node.dataset.comparisonExample)), ['A', 'B'])
      for (const example of ['A', 'B']) {
        const row = svg.locator(`[data-comparison-example="${example}"]`), expected = PRETRAINING_ORACLE['loss-perplexity'].examples[example]
        near(Number(await row.getAttribute('data-loss')), expected.lossDecimal, 'Both comparison losses remain fixed')
        near(Number(await row.getAttribute('data-ppl')), expected.ppl, 'Both comparison PPL values remain fixed')
        await expect(row).toContainText(String(expected.ppl)); await expect(row).toContainText(example === 'A' ? '1.386' : '0.693')
      }
    }
  } else if (figure.id === 'pretraining-scaling') {
    for (const attr of ['data-fitted-coefficients', 'data-loss-prediction', 'data-optimum']) await expect(svg).toHaveAttribute(attr, 'unknown')
    if (index === 1) {
      await expect(svg.locator('[data-residual-identity]')).toHaveAttribute('data-residual-identity', PRETRAINING_ORACLE.scaling.residualIdentity)
      await expect(svg.locator('[data-total-loss-ratio]')).toHaveAttribute('data-total-loss-ratio', PRETRAINING_ORACLE.scaling.totalLossRatio)
      await expect(svg).toContainText('L = L∞ + R')
      await expect(svg.locator('[data-residual-identity]')).toContainText('R(rN) / R(N) = r−α')
      await expect(svg.locator('[data-total-loss-ratio]')).toContainText('L∞ + R × r−α')
      await expect(svg.locator('[data-total-loss-ratio]')).toContainText('L∞ + R')
      await expect(svg).toContainText('残差と総損失の比は、一般に異なる')
    }
    if (index === 2) await allocations(settings['fixed-allocation'])
    if (index === 3) {
      assert.deepEqual(await svg.locator('[data-lineage-node]').evaluateAll(nodes => nodes.map(node => node.dataset.lineageNode)), ['Kaplan', 'Chinchilla', '推論時計算'])
      assertRatioObservation(await ratio(svg.locator('[data-budget-kind="fixed"]')), { n: 2, d: .5, c: 1 })
      const r = Number(settings['growth-scale']); assertRatioObservation(await ratio(svg.locator('[data-budget-kind="growing"]')), { n: r, d: r, c: r * r })
    }
    if (index === 4) {
      await expect(svg.locator('[data-compute-lane="training"]')).toHaveAttribute('data-weights', 'updated')
      await expect(svg.locator('[data-compute-lane="inference"]')).toHaveAttribute('data-weights', 'fixed')
      await expect(svg.locator('[data-caveat="no-guarantee"]')).toContainText('必ず改善')
    }
    if (index === 5) {
      const rows = svg.locator('[data-coefficient-condition]')
      assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(node => node.dataset.coefficientCondition)), ['data', 'architecture', 'tokenizer'])
      for (const row of await rows.all()) { await expect(row).toBeVisible(); await expect(row).toHaveAttribute('data-emphasized', String(await row.getAttribute('data-coefficient-condition') === settings['coefficient-condition'])) }
    }
  } else if (figure.id === 'pretraining-compute') {
    await expect(svg).toHaveAttribute('data-compute-unit', 'FLOPs'); await expect(svg).toHaveAttribute('data-optimum', 'unknown')
    if (index === 0) await expect(svg.locator('[data-caveat="units"]')).toContainText('課金・時間・電力の正確な式ではない')
    if (index === 1) {
      const n = Number(settings['parameter-factor']), d = Number(settings['data-factor'])
      assertRatioObservation(await ratio(svg.locator('[data-ratio-product]')), { n, d, c: n * d })
      await expect(svg.locator('[data-compute-cell]')).toHaveCount(n * d)
      await expect(svg.locator('[data-compute-ratio-label]')).toContainText(String(n * d))
    }
    if (index === 2) await allocations(settings['compute-allocation'])
    if (index === 3) {
      assertRatioObservation(await ratio(svg.locator('[data-budget-kind="fixed"]')), { n: 2, d: .5, c: 1 })
      assertRatioObservation(await ratio(svg.locator('[data-budget-kind="growing"]')), { n: 2, d: 2, c: 4 })
      const rows = svg.locator('[data-real-cost]')
      assertUnknownCosts(Object.fromEntries(await rows.evaluateAll(nodes => nodes.map(node => [node.dataset.realCost, node.dataset.value === 'unknown' ? null : node.dataset.value]))))
      for (const row of await rows.all()) { await expect(row).toBeVisible(); await expect(row).toContainText('未知・未入力'); await expect(row).toHaveAttribute('data-emphasized', String(await row.getAttribute('data-real-cost') === settings['real-cost-factor'])) }
    }
  }
}
