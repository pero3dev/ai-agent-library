import test from 'node:test'
import assert from 'node:assert/strict'
import { TRAINING_STAGES, TRAINING_WEIGHT_BOX, trainingStagesFrame } from '../../lib/training-stages-model.mjs'

const routeShape = frame => frame.routes.map(({ source, target, effect }) => [source, target, effect])
const comparisonContent = frame => ({
  knowledge: frame.knowledgeCards.map(({ id, title, lines }) => ({ id, title, lines })),
  evaluation: frame.evaluationRows.map(({ id, label }) => ({ id, label }))
})

test('each learning input reaches the same fixed weight box, while retrieval reaches runtime context', () => {
  const weightBox = { id: 'weights', x: 240, y: 186, width: 160, height: 98 }
  const expectedSources = [['text', 'demonstration', 'preference'], ['text'], ['additional-training'], ['demonstration'], ['additional-training'], ['preference:RLHF', 'preference:DPO']]
  for (let stage = 0; stage < 6; stage++) {
    const frame = trainingStagesFrame(stage)
    assert.deepEqual(frame.weights, weightBox)
    assert.equal(frame.modelId, 'training-model')
    const expected = expectedSources[stage].map(source => [source, 'weights', 'parameter-update'])
    if (stage === 2 || stage === 4) expected.push(['retrieval', 'runtime-context', 'context-input'])
    assert.deepEqual(routeShape(frame), expected)
    assert.ok(frame.routes.every(route => route.source !== 'retrieval' || route.target !== 'weights'))
  }
  assert.deepEqual(TRAINING_WEIGHT_BOX, weightBox)
})

test('knowledge focus keeps all caveats and both information destinations available', () => {
  const baseline = trainingStagesFrame(2)
  assert.equal(baseline.knowledgeFocus, 'coverage')
  assert.deepEqual(baseline.knowledgeCards.map(card => card.id), ['coverage', 'accuracy', 'instruction'])
  for (const knowledgeFocus of ['coverage', 'accuracy', 'instruction']) {
    const frame = trainingStagesFrame(2, { knowledgeFocus })
    assert.deepEqual(comparisonContent(frame), comparisonContent(baseline))
    assert.deepEqual(frame.routes, baseline.routes)
    assert.deepEqual(frame.knowledgeCards.filter(card => card.emphasized).map(card => card.id), [knowledgeFocus])
    assert.equal(frame.detail, baseline.detail)
  }
})

test('evaluation focus preserves behavior and factual reproducibility as separate questions', () => {
  const baseline = trainingStagesFrame(4)
  assert.equal(baseline.evaluationFocus, 'behavior')
  assert.deepEqual(baseline.evaluationRows.map(row => row.id), ['behavior', 'facts'])
  for (const evaluationFocus of ['behavior', 'facts']) {
    const frame = trainingStagesFrame(4, { evaluationFocus })
    assert.deepEqual(comparisonContent(frame), comparisonContent(baseline))
    assert.deepEqual(frame.routes, baseline.routes)
    assert.deepEqual(frame.evaluationRows.filter(row => row.emphasized).map(row => row.id), [evaluationFocus])
    assert.equal(frame.detail, baseline.detail)
  }
})

test('choices outside their stages cannot alter the active comparison or learning meaning', () => {
  for (const stage of [0, 1, 3, 5]) {
    assert.deepEqual(trainingStagesFrame(stage), trainingStagesFrame(stage, { knowledgeFocus: 'instruction', evaluationFocus: 'facts' }))
  }
  assert.deepEqual(trainingStagesFrame(2), trainingStagesFrame(2, { evaluationFocus: 'facts' }))
  assert.deepEqual(trainingStagesFrame(4), trainingStagesFrame(4, { knowledgeFocus: 'accuracy' }))
})

test('representative order and distinct preference methods never become a quality measurement', () => {
  for (let stage = 0; stage < 6; stage++) {
    const frame = trainingStagesFrame(stage)
    assert.deepEqual(frame.representativeOrder, ['pretraining', 'sft', 'preference'])
    assert.equal(frame.universalOrder, false)
    assert.deepEqual(frame.preferenceMethods, ['RLHF', 'DPO'])
    assert.equal(frame.samePreferenceMethod, false)
    assert.equal(frame.numericPerformance, null)
    assert.equal(frame.parameterValues, null)
    assert.equal(frame.guaranteedAccuracy, false)
  }
})

test('midpoint transitions and reverse seeks recover exactly the same stage meaning', () => {
  assert.equal(TRAINING_STAGES.length, 6)
  const settings = { knowledgeFocus: 'accuracy', evaluationFocus: 'facts' }
  const phases = [0, .49, .5, .51, 1.49, 1.5, 2.49, 2.5, 3.49, 3.5, 4.49, 4.5, 5]
  const forward = phases.map(phase => trainingStagesFrame(phase, settings))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = trainingStagesFrame(phases[index], settings)
    assert.deepEqual(frame, forward[index])
    const { phase, ...meaning } = frame
    const { phase: integerPhase, ...integerMeaning } = trainingStagesFrame(Math.round(phases[index]), settings)
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(phase, phases[index])
    assert.equal(integerPhase, Math.round(phases[index]))
  }
})

test('invalid inputs fail explicitly and finite out-of-range phases clamp to the endpoints', () => {
  for (const phase of [NaN, Infinity, -Infinity, '2', null, undefined]) assert.throws(() => trainingStagesFrame(phase), TypeError)
  for (const options of [null, [], 'coverage', 2]) assert.throws(() => trainingStagesFrame(2, options), TypeError)
  for (const options of [{ knowledgeFocus: '' }, { knowledgeFocus: null }, { knowledgeFocus: 'all' }, { evaluationFocus: 'accuracy' }, { evaluationFocus: 0 }]) assert.throws(() => trainingStagesFrame(2, options), RangeError)
  assert.deepEqual(trainingStagesFrame(-10), trainingStagesFrame(0))
  assert.deepEqual(trainingStagesFrame(20), trainingStagesFrame(5))
})

test('mutating a returned frame cannot corrupt future scenes or exported constants', () => {
  const baseline = trainingStagesFrame(2), frame = trainingStagesFrame(2)
  frame.weights.x = 0
  frame.routes[0].target = 'runtime-context'
  frame.knowledgeCards[0].lines[0] = 'changed'
  frame.evaluationRows[0].label = 'changed'
  frame.preferenceMethods.push('changed')
  frame.representativeOrder.reverse()
  assert.deepEqual(trainingStagesFrame(2), baseline)
  assert.equal(TRAINING_WEIGHT_BOX.x, 240)
  assert.ok(Object.isFrozen(TRAINING_STAGES) && TRAINING_STAGES.every(Object.isFrozen))
})
