import test from 'node:test'
import assert from 'node:assert/strict'
import { PRETRAINING_LOSS_STAGES, lossAndPerplexity, pretrainingLossFrame } from '../../lib/pretraining-loss-perplexity-model.mjs'

const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-12, `${value} != ${expected}`)
const positions = frame => frame.occurrences.map(({ id, token, prefix, correctColumn, x }) => ({ id, token, prefix, correctColumn, x }))

test('fixed conditional probability rows sum to one and correct columns follow A, B, C', () => {
  const expected = {
    A: [[.5, .25, .125, .125], [.25, .25, .25, .25], [.375, .25, .125, .25]],
    B: [[.5, .25, .125, .125], [.25, .5, .125, .125], [.125, .125, .5, .25]]
  }
  for (const probabilityExample of ['A', 'B']) {
    const frame = pretrainingLossFrame(1, { probabilityExample })
    assert.deepEqual(frame.vocabulary, ['A', 'B', 'C', 'D'])
    assert.deepEqual(frame.activeExample.rows, expected[probabilityExample])
    assert.deepEqual(frame.activeExample.correct, probabilityExample === 'A' ? [.5, .25, .125] : [.5, .5, .5])
    for (const row of frame.activeExample.rows) assert.equal(row.reduce((a, b) => a + b), 1)
    assert.deepEqual(positions(frame), [
      { id: 'eval-0', token: 'A', prefix: [], correctColumn: 0, x: 120 },
      { id: 'eval-1', token: 'B', prefix: ['A'], correctColumn: 1, x: 320 },
      { id: 'eval-2', token: 'C', prefix: ['A', 'B'], correctColumn: 2, x: 520 }
    ])
  }
})

test('loss is the position-average negative natural log and PPL is its exponential', () => {
  const a = lossAndPerplexity([.5, .25, .125]), b = lossAndPerplexity([.5, .5, .5])
  a.negativeLogs.forEach((value, index) => near(value, [0.6931471805599453, 1.3862943611198906, 2.0794415416798357][index]))
  near(a.loss, 1.3862943611198906)
  near(a.ppl, 4)
  near(b.loss, .6931471805599453)
  near(b.ppl, 2)
  assert.ok(Math.abs(a.ppl - 24 / 7) > .5, 'the reciprocal arithmetic mean is not PPL')
  near(lossAndPerplexity([.25, .25, .25]).loss, a.loss)
})

test('certain and impossible correct tokens have the documented zero and infinity boundaries', () => {
  assert.deepEqual(lossAndPerplexity([1, 1]), { negativeLogs: [0, 0], loss: 0, ppl: 1 })
  for (const input of [[0], [.5, 0, 1]]) {
    assert.equal(lossAndPerplexity(input).loss, Infinity)
    assert.equal(lossAndPerplexity(input).ppl, Infinity)
  }
})

test('empty, sparse, nonfinite and out-of-range probability input is rejected without coercion', () => {
  for (const input of [[], new Array(3), [.5, , .25], null, '0.5', new Float64Array([.5])]) assert.throws(() => lossAndPerplexity(input), TypeError)
  for (const value of [NaN, Infinity, -Infinity, -1, 1.001, '.5', null, undefined, false]) assert.throws(() => lossAndPerplexity([value]), RangeError)
})

test('A/B values and identities remain visible under all comparison conditions, with no invented ranking', () => {
  const baseline = pretrainingLossFrame(4)
  for (const comparisonCondition of ['same', 'different-tokenizer', 'different-data']) {
    const frame = pretrainingLossFrame(4, { probabilityExample: 'B', comparisonCondition })
    assert.deepEqual(frame.examples, baseline.examples)
    assert.equal(frame.comparisonAllowed, comparisonCondition === 'same')
    assert.deepEqual(frame.examples.map(item => item.ppl), [4, 2])
    assert.equal(frame.displayedValuesCondition, 'original-toy-example')
    assert.equal(frame.downstreamAbilityJudgment, null)
    assert.equal(frame.ranking, null)
    assert.equal(frame.empiricalMeasurement, false)
  }
})

test('selectors cannot change the meaning of another stage or turn example switching into measured training', () => {
  for (const stage of [0, 4]) assert.deepEqual(pretrainingLossFrame(stage), pretrainingLossFrame(stage, { probabilityExample: 'B' }))
  for (const stage of [0, 1, 2, 3]) assert.deepEqual(pretrainingLossFrame(stage), pretrainingLossFrame(stage, { comparisonCondition: 'different-data' }))
  for (let stage = 0; stage < 5; stage++) {
    const frame = pretrainingLossFrame(stage)
    assert.equal(frame.trainingWeights, 'updated')
    assert.equal(frame.inferenceWeights, 'fixed')
    assert.equal(frame.empiricalMeasurement, false)
    assert.equal(frame.tokenizerId, 'toy-tokenizer')
    assert.equal(frame.evaluationId, 'toy-eval-abc')
  }
})

test('all midpoint and reverse seeks keep exact semantic values and stable positions', () => {
  assert.equal(PRETRAINING_LOSS_STAGES.length, 5)
  const phases = [0, ...[0, 1, 2, 3].flatMap(k => [k + .49, k + .5, k + .51]), 4]
  for (const probabilityExample of ['A', 'B']) {
    const forward = phases.map(phase => pretrainingLossFrame(phase, { probabilityExample }))
    for (let index = phases.length - 1; index >= 0; index--) {
      const frame = pretrainingLossFrame(phases[index], { probabilityExample })
      assert.deepEqual(frame, forward[index])
      const { phase, ...meaning } = frame, { phase: integerPhase, ...integerMeaning } = pretrainingLossFrame(Math.round(phases[index]), { probabilityExample })
      assert.deepEqual(meaning, integerMeaning)
      assert.equal(integerPhase, Math.round(phase))
      assert.deepEqual(positions(frame), positions(pretrainingLossFrame(0)))
    }
  }
})

test('invalid phase/settings fail, while finite out-of-range phases clamp to endpoints', () => {
  for (const phase of [NaN, Infinity, -Infinity, '', '1', null, undefined]) assert.throws(() => pretrainingLossFrame(phase), TypeError)
  for (const options of [null, [], 'A', 1]) assert.throws(() => pretrainingLossFrame(1, options), TypeError)
  for (const options of [{ probabilityExample: '' }, { probabilityExample: null }, { probabilityExample: 'C' }, { comparisonCondition: false }, { comparisonCondition: 'different' }]) assert.throws(() => pretrainingLossFrame(1, options), RangeError)
  assert.deepEqual(pretrainingLossFrame(-3), pretrainingLossFrame(0))
  assert.deepEqual(pretrainingLossFrame(9), pretrainingLossFrame(4))
})

test('input arrays/settings and future frames cannot be mutated by a returned frame', () => {
  const input = Object.freeze([.5, .25, .125]), settings = Object.freeze({ probabilityExample: 'B' })
  lossAndPerplexity(input)
  const original = pretrainingLossFrame(2, settings), changed = pretrainingLossFrame(2, settings)
  changed.occurrences[1].prefix.push('changed')
  changed.activeExample.rows[0][0] = 0
  changed.examples[0].negativeLogs[0] = 42
  changed.vocabulary.pop()
  assert.deepEqual(pretrainingLossFrame(2, settings), original)
  assert.deepEqual(input, [.5, .25, .125])
  assert.ok(Object.isFrozen(PRETRAINING_LOSS_STAGES) && PRETRAINING_LOSS_STAGES.every(Object.isFrozen))
})
