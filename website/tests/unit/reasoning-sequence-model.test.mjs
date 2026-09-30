import test from 'node:test'
import assert from 'node:assert/strict'
import { REASONING_SEQUENCE_STAGES, reasoningSequenceFrame as frame } from '../../lib/reasoning-sequence-model.mjs'

const ids = ['input', 'reasoning-region', 'prior-symbols', 'next-prediction', 'final-answer', 'training-adjustment', 'runtime-model']
const node = (result, id) => result.nodes.find(item => item.id === id)
const edge = (result, meaning) => result.edges.find(item => item.meaning === meaning)

test('sequence labels, clamp and every midpoint agree in both seek directions', () => {
  assert.deepEqual(REASONING_SEQUENCE_STAGES.map(stage => stage.label), ['同じ生成の土台', '中間トークン', '学習と実行', '回答と費用'])
  const cases = [[-9, 0], [0, 0], [1, 1], [2, 2], [3, 3], [9, 3]]
  for (let stage = 0; stage < 3; stage++) cases.push([stage + .49, stage], [stage + .5, stage + 1], [stage + .51, stage + 1])
  for (const [phase, expected] of [...cases, ...cases.toReversed()]) {
    const result = frame(phase)
    assert.equal(result.stage, expected)
    assert.equal(result.label, REASONING_SEQUENCE_STAGES[expected].label)
    assert.ok(result.progress >= 0 && result.progress <= 1)
    assert.deepEqual(result.nodes.map(item => item.id), ids)
  }
  assert.equal(frame(-9).phase, 0)
  assert.equal(frame(9).phase, 3)
})

test('direct READ 0 to 2 to 3 needs no intermediate manual-stage state', () => {
  const expected = [0, 2, 3].map(phase => frame(phase))
  for (const phase of [3, 1, .5, 0, 2, 1.5]) frame(phase)
  assert.deepEqual([0, 2, 3].map(phase => frame(phase)), expected)
  for (const result of expected) {
    for (const id of ['input', 'reasoning-region', 'prior-symbols', 'next-prediction', 'runtime-model']) assert.equal(node(result, id).visible, true)
    assert.equal(result.runtimeWeights, 'fixed')
    assert.match(result.reasoning.displayLabel, /実際の思考内容ではない/)
  }
  const learning = expected[1]
  assert.equal(node(learning, 'training-adjustment').visible, true)
  assert.equal(node(learning, 'runtime-model').visible, true)
  assert.equal(edge(learning, 'conditions-following-prediction').visible, true)
  assert.match(learning.detail, /通常モデルも中間の考察/)
  assert.match(learning.detail, /単にCoT指示を加えただけとは限りません/)
  assert.match(learning.detail, /正しさは保証されません/)
})

test('conditioning and answer edges retain their meaning independently of emphasis', () => {
  for (let phase = 0; phase <= 3; phase += .125) {
    const result = frame(phase)
    assert.deepEqual(edge(result, 'conditions-following-prediction'), {
      source: 'prior-symbols', target: 'next-prediction', meaning: 'conditions-following-prediction', kind: 'flow', visible: true
    })
    assert.deepEqual(edge(result, 'answer-after-reasoning'), {
      source: 'next-prediction', target: 'final-answer', meaning: 'answer-after-reasoning', kind: 'flow', visible: true
    })
  }
})

test('training association is separate from live weight updates and only appears at S2', () => {
  for (let phase = 0; phase <= 3; phase += .125) {
    const result = frame(phase), association = edge(result, 'training-and-inference-configuration')
    assert.equal(association.source, 'training-adjustment')
    assert.equal(association.target, 'runtime-model')
    assert.equal(association.kind, 'association')
    assert.equal(association.runtimeUpdate, false)
    assert.equal(association.visible, result.stage === 2)
    assert.equal(result.trainingAdjustmentVisible, association.visible)
    assert.equal(node(result, 'training-adjustment').visible, association.visible)
    assert.equal(result.claims.runtimeWeightsUpdated, false)
  }
})

test('presentation marks never become private reasoning, real token counts or performance claims', () => {
  for (let phase = 0; phase <= 3; phase += .125) {
    const result = frame(phase)
    assert.equal(result.reasoning.content, null)
    assert.equal(result.reasoning.rawThought, null)
    assert.equal(result.reasoning.tokenCount, null)
    assert.equal(result.reasoning.representsActualTokenCount, false)
    assert.deepEqual(result.reasoning.decorativeSymbols, ['prior-mark', 'continuation-mark'])
    assert.ok(result.reasoning.markReveal >= 0 && result.reasoning.markReveal <= 1)
    for (const key of ['reproducesPrivateThought', 'allProvidersExposeReasoning', 'correctReasoningGuaranteed', 'cotPromptAloneExplainsReasoningModel']) assert.equal(result.claims[key], false)
    assert.equal(result.claims.costEstimate, null)
    assert.equal(result.claims.billingFormula, null)
  }
  assert.equal(frame(.5).reasoning.markReveal, 0)
  assert.ok(frame(1).reasoning.markReveal > frame(.5).reasoning.markReveal)
  assert.equal(frame(2).reasoning.markReveal, 1)
})

test('answer expansion preserves both unmeasured resource bands without invented ratios', () => {
  assert.equal(node(frame(0), 'final-answer').expanded, false)
  assert.equal(node(frame(3), 'final-answer').expanded, true)
  for (const phase of [0, 1, 2, 2.49]) assert.deepEqual(frame(phase).resourceBands, [])
  for (const phase of [2.5, 3, 99]) assert.deepEqual(frame(phase).resourceBands, [
    { id: 'reasoning', label: '推論', tokenCount: null, duration: null, price: null },
    { id: 'answer', label: '最終回答', tokenCount: null, duration: null, price: null }
  ])
})

test('sequence rejects malformed phases, objects and every unsupported own option key', () => {
  for (const phase of [null, undefined, '1', NaN, Infinity, -Infinity, [], {}, 1n]) assert.throws(() => frame(phase), TypeError)
  for (const options of [null, 0, false, '', [], new Date(), () => {}, Object.create({})]) assert.throws(() => frame(0, options), TypeError)
  for (const options of [{ ignored: true }, { [Symbol('phase')]: 1 }, Object.defineProperty({}, 'hidden', { value: 1 })]) assert.throws(() => frame(0, options), TypeError)
  assert.deepEqual(frame(0, Object.create(null)), frame(0))
  assert.deepEqual(frame(0, Object.freeze({})), frame(0))
})

test('nested sequence results cannot mutate subsequent frames or frozen stage definitions', () => {
  const pristine = frame(3), changed = frame(3)
  changed.nodes[0].visible = false
  changed.edges[0].source = 'invented'
  changed.reasoning.decorativeSymbols.push('invented')
  changed.resourceBands[0].price = 3
  changed.claims.correctReasoningGuaranteed = true
  assert.deepEqual(frame(3), pristine)
  assert.ok(Object.isFrozen(REASONING_SEQUENCE_STAGES))
  assert.ok(REASONING_SEQUENCE_STAGES.every(Object.isFrozen))
})
