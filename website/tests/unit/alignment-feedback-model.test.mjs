import test from 'node:test'
import assert from 'node:assert/strict'
import { ALIGNMENT_FEEDBACK_STAGES, FEEDBACK_LABEL_SOURCE_IDS, alignmentFeedbackFrame as frame } from '../../lib/alignment-feedback-model.mjs'

test('feedback labels and midpoint stage meanings remain stable in reverse seek', () => {
  assert.deepEqual(ALIGNMENT_FEEDBACK_STAGES.map(stage => stage.label), ['検証器', '結果と過程', '適用範囲', '調整の副作用', 'フィードバックの作り方'])
  const cases = [[-2, 0], ...Array.from({ length: 5 }, (_, stage) => [stage, stage]), [9, 4]]
  for (let stage = 0; stage < 4; stage++) cases.push([stage + .49, stage], [stage + .5, stage + 1], [stage + .51, stage + 1])
  for (const [phase, expected] of [...cases, ...cases.toReversed()]) {
    const result = frame(phase)
    assert.equal(result.stage, expected)
    assert.equal(result.stageLabel, ALIGNMENT_FEEDBACK_STAGES[expected].label)
    assert.ok(result.progress >= 0 && result.progress <= 1)
  }
  assert.equal(frame(3.5).progress, 0)
  assert.equal(frame(4).progress, 1)
})

test('one answer retains its steps, with evaluation positions distinct from correctness', () => {
  for (let phase = 0; phase <= 4; phase += .25) {
    const result = frame(phase)
    assert.equal(result.answerId, 'answer-0')
    assert.deepEqual(result.steps, ['step-1', 'step-2', 'step-3'])
    assert.equal(result.finalId, 'final')
    assert.equal(result.stepText, null)
    assert.deepEqual(result.marks, [
      { granularity: 'outcome', target: 'final' },
      { granularity: 'process', target: 'step-1' },
      { granularity: 'process', target: 'step-2' },
      { granularity: 'process', target: 'step-3' }
    ])
    assert.equal(result.markMeaning, 'evaluation location only, not correctness')
    assert.deepEqual(result.rewardSources, ['verifier', 'learned-reward-model'])
    assert.deepEqual(result.granularities, ['outcome', 'process'])
    assert.equal(result.axisRelation, 'orthogonal-classification-not-subtype')
    assert.equal(result.scope, 'RLVR requires available verifiable reward')
    for (const key of ['processRequiresMechanicalVerification', 'outcomeExcludesLearnedModel', 'harmlessnessGuarantee', 'sideEffectUniversality', 'empiricalMeasurement']) assert.equal(result[key], false)
    for (const key of ['scores', 'observedAccuracy', 'capabilityDelta']) assert.equal(result[key], null)
    assert.deepEqual(result.sideEffects, ['sycophancy', 'alignment-tax'])
  }
})

test('label source changes emphasis only at S4 and cannot leak backward into any earlier state', () => {
  assert.deepEqual(FEEDBACK_LABEL_SOURCE_IDS, ['human', 'ai'])
  for (const phase of [0, .5, 1, 1.5, 2, 2.5, 3, 3.49, 0]) assert.deepEqual(frame(phase, { labelSource: 'ai' }), frame(phase, { labelSource: 'human' }))
  for (const phase of [3.5, 3.51, 4, 10]) {
    const human = frame(phase), ai = frame(phase, { labelSource: 'ai' })
    assert.equal(ai.effectiveLabelSource, 'ai')
    assert.equal(human.effectiveLabelSource, 'human')
    assert.deepEqual({ ...ai, effectiveLabelSource: 'human' }, human)
  }
})

test('feedback frames are fresh and deterministic for all nested values', () => {
  const expected = frame(4), changed = frame(4)
  changed.steps[0] = 'fabricated'
  changed.marks[0].target = 'step-1'
  changed.rewardSources.push('oracle')
  changed.granularities.reverse()
  changed.sideEffects.pop()
  assert.deepEqual(frame(4), expected)
  assert.deepEqual(frame(0, Object.create(null)), frame(0))
})

test('feedback rejects malformed phases, option objects, types and enum domains', () => {
  for (const phase of [null, undefined, '1', NaN, Infinity, -Infinity, [], {}]) assert.throws(() => frame(phase), TypeError)
  for (const options of [null, 1, false, '', [], new Date(), Object.create({ labelSource: 'ai' })]) assert.throws(() => frame(0, options), TypeError)
  for (const labelSource of [null, 1, {}, [], true]) assert.throws(() => frame(0, { labelSource }), TypeError)
  for (const labelSource of ['', 'AI', 'verifier']) assert.throws(() => frame(0, { labelSource }), RangeError)
  for (const options of [{ stage: 4 }, { [Symbol('labelSource')]: 'ai' }, Object.defineProperty({}, 'hidden', { value: true })]) assert.throws(() => frame(0, options), RangeError)
})
