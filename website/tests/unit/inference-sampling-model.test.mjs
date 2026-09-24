import test from 'node:test'
import assert from 'node:assert/strict'
import { INFERENCE_SAMPLING_STAGES, INFERENCE_SAMPLING_TOKENS, INFERENCE_SAMPLING_LOGITS,
  topKFilter, samplingDistribution, samplingComparison, inferenceSamplingFrame } from '../../lib/inference-sampling-model.mjs'

const close = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`)
const vector = (actual, expected) => { assert.equal(actual.length, expected.length); actual.forEach((value, index) => close(value, expected[index])) }
const column = (value, key) => value.rows.map(row => row[key])

test('base fixture independently fixes probabilities, retained mass, normalized support and selection', () => {
  const result = samplingDistribution()
  vector(column(result, 'probability'), [.4, .3, .2, .1])
  assert.deepEqual(column(result, 'kept'), [true, true, true, false])
  vector(column(result, 'selectionProbability'), [4 / 9, 1 / 3, 2 / 9, 0])
  close(result.retainedMass, .9)
  assert.equal(result.selectedLabel, 'B'); assert.equal(result.selectedTokenId, 1)
  assert.equal(result.effectiveMethod, 'top-p'); assert.equal(result.effectiveDraw, .62)
})

test('temperature plus top-k/top-p has fixed numeric oracles and normalized nonnegative outputs', () => {
  for (const method of ['top-k', 'top-p']) {
    const result = samplingDistribution(INFERENCE_SAMPLING_LOGITS, { temperature: .5, method, topK: 2, topP: .8 })
    vector(column(result, 'probability'), [8 / 15, 3 / 10, 2 / 15, 1 / 30])
    vector(column(result, 'selectionProbability'), [16 / 25, 9 / 25, 0, 0]); close(result.retainedMass, 5 / 6)
    assert.equal(result.selectedLabel, 'A')
  }
  for (const temperature of [.5, 1, 2]) for (const method of ['top-k', 'top-p']) for (const topK of [1, 2, 4]) for (const topP of [.6, .8, 1]) {
    const result = samplingDistribution(INFERENCE_SAMPLING_LOGITS, { temperature, method, topK, topP })
    close(column(result, 'selectionProbability').reduce((a, b) => a + b, 0), 1)
    assert.ok(result.rows.every(row => Number.isFinite(row.selectionProbability) && row.selectionProbability >= 0))
    assert.ok(result.rows.filter(row => !row.kept).every(row => row.selectionProbability === 0))
    assert.ok(result.rows[result.selectedTokenId].selectionProbability > 0)
    assert.equal(result.effectiveMethod, method)
  }
})

test('top-k counts candidates by rank but preserves input IDs and tie order', () => {
  const result = topKFilter([.125, .5, .25, .125], 2)
  assert.deepEqual(result.order, [1, 2, 0, 3]); assert.deepEqual(result.kept, [false, true, true, false])
  vector(result.probabilities, [0, 2 / 3, 1 / 3, 0]); close(result.retainedMass, .75)
  assert.deepEqual(topKFilter([.25, .25, .25, .25], 2).kept, [true, true, false, false])
  assert.deepEqual(topKFilter([0, 1, 0, 0], 1).probabilities, [0, 1, 0, 0])
  assert.deepEqual(topKFilter([0, 1, 0, 0], 4).probabilities, [0, 1, 0, 0])
})

test('top-p inclusion >= and inverse-CDF boundaries remain different through the pipeline', () => {
  const logits = [0, 0, 0, 0], delta = 2 ** -20
  assert.deepEqual(column(samplingDistribution(logits, { topP: .75 }), 'kept'), [true, true, true, false])
  assert.deepEqual(column(samplingDistribution(logits, { topP: .75 - delta }), 'kept'), [true, true, true, false])
  assert.deepEqual(column(samplingDistribution(logits, { topP: .75 + delta }), 'kept'), [true, true, true, true])
  assert.equal(samplingDistribution(logits, { topP: 1, draw: .25 - delta }).selectedTokenId, 0)
  assert.equal(samplingDistribution(logits, { topP: 1, draw: .25 }).selectedTokenId, 1)
  assert.equal(samplingDistribution(logits, { topP: 1, draw: 1 - Number.EPSILON }).selectedTokenId, 3)
  assert.equal(samplingDistribution(logits, { topP: Number.MIN_VALUE, draw: 0 }).selectedTokenId, 0)
})

test('greedy is argmax with stable tie order, reference probability and inactive filter/draw', () => {
  for (const method of ['none', 'top-k', 'top-p']) for (const draw of [0, .22, .62, 1 - Number.EPSILON]) {
    const result = samplingDistribution([2, 2, 1, 0], { temperature: 0, method, topK: 4, topP: .01, draw })
    assert.equal(result.selectedTokenId, 0); assert.equal(result.selectionKind, 'greedy')
    vector(column(result, 'selectionProbability'), [1, 0, 0, 0])
    assert.equal(result.retainedMass, null); assert.equal(result.effectiveMethod, null); assert.equal(result.effectiveDraw, null)
    assert.equal(result.probabilityKind, 'reference-t1'); assert.ok(result.rows[0].probability < 1)
  }
  assert.match(inferenceSamplingFrame(1, { temperature: 0 }).formula, /argmax/)
})

test('draw changes selection without changing probabilities or candidate identities', () => {
  const cases = [[.22, 'A'], [.62, 'B'], [.92, 'D']]
  for (const [draw, selected] of cases) {
    const result = samplingDistribution(INFERENCE_SAMPLING_LOGITS, { method: 'none', draw })
    assert.equal(result.selectedLabel, selected)
    vector(column(result, 'selectionProbability'), [.4, .3, .2, .1])
    assert.deepEqual(result.rows.map(({ tokenId, label, color }) => ({ tokenId, label, color })), INFERENCE_SAMPLING_TOKENS)
    assert.deepEqual(column(result, 'occurrenceId'), ['candidate:0', 'candidate:1', 'candidate:2', 'candidate:3'])
  }
})

test('reproducibility examples change only draw or A logit and preserve ID/color at rank changes', () => {
  const draw = samplingComparison('draw'), logit = samplingComparison('logit')
  assert.equal(draw.changedField, 'draw'); assert.deepEqual(column(draw.left, 'logit'), column(draw.right, 'logit'))
  assert.deepEqual(column(draw.left, 'probability'), column(draw.right, 'probability'))
  assert.deepEqual([draw.left.selectedLabel, draw.right.selectedLabel], ['A', 'B'])
  assert.equal(logit.changedField, 'logit-A'); assert.deepEqual(column(logit.left, 'logit').slice(1), column(logit.right, 'logit').slice(1))
  assert.deepEqual([logit.left.selectedLabel, logit.right.selectedLabel], ['A', 'B'])
  assert.deepEqual(column(logit.left, 'rank'), [1, 2, 3, 4]); assert.deepEqual(column(logit.right, 'rank'), [2, 1, 3, 4])
  for (const key of ['tokenId', 'color', 'occurrenceId']) assert.deepEqual(column(logit.left, key), column(logit.right, key))
  assert.deepEqual(inferenceSamplingFrame(6, { temperature: .5, topK: 1, draw: .92 }).comparison, inferenceSamplingFrame(6).comparison)
})

test('seven stages use the shared midpoint and reverse seeking repeats identical frames', () => {
  assert.equal(INFERENCE_SAMPLING_STAGES.length, 7)
  const settings = { temperature: 2, method: 'top-p', topK: 1, topP: .6, draw: .92 }
  for (let i = 0; i < 6; i++) for (const offset of [.49, .5, .51]) {
    const phase = i + offset, first = inferenceSamplingFrame(phase, settings)
    assert.equal(first.stage, Math.round(phase))
    inferenceSamplingFrame(0); inferenceSamplingFrame(6)
    assert.deepEqual(inferenceSamplingFrame(phase, settings), first)
  }
  assert.equal(inferenceSamplingFrame(0, settings).distribution.temperature, 1)
  assert.equal(inferenceSamplingFrame(1, settings).distribution.effectiveMethod, 'none')
  assert.equal(inferenceSamplingFrame(2, settings).distribution.effectiveMethod, 'top-k')
  assert.equal(inferenceSamplingFrame(3, settings).distribution.effectiveMethod, 'top-p')
  assert.equal(inferenceSamplingFrame(-1).stage, 0); assert.equal(inferenceSamplingFrame(99).stage, 6)
})

test('nonfinite, invalid support, malformed options and phase are rejected', () => {
  for (const probabilities of [[], [0, 0], [.3, .4], [-.1, 1.1], [NaN, 1]]) assert.throws(() => topKFilter(probabilities, 1))
  for (const k of [0, 5, 1.5, NaN, '2']) assert.throws(() => topKFilter([.4, .3, .2, .1], k))
  for (const logits of [[], [1, 2], [0, 1, 2, Infinity], [0, 1, NaN, 2], [0, 1, 2, '3']]) assert.throws(() => samplingDistribution(logits))
  for (const options of [null, [], { temperature: -1 }, { temperature: Infinity }, { topP: 0 }, { topP: 1.1 }, { topP: '1' }, { topK: 0 }, { topK: 5 }, { method: 'both' }, { draw: 1 }, { draw: NaN }]) assert.throws(() => samplingDistribution(INFERENCE_SAMPLING_LOGITS, options))
  for (const phase of [NaN, Infinity, '1']) assert.throws(() => inferenceSamplingFrame(phase))
  assert.throws(() => inferenceSamplingFrame(0, { variation: 'unknown' }))
})

test('returned rows cannot mutate later frames or immutable fixture data', () => {
  const logits = [...INFERENCE_SAMPLING_LOGITS], options = { temperature: .5, topK: 2, method: 'top-k' }, before = JSON.stringify({ logits, options })
  const first = samplingDistribution(logits, options); first.rows[0].logit = 99; first.rows[0].color = 'changed'
  assert.equal(JSON.stringify({ logits, options }), before)
  assert.equal(samplingDistribution(logits, options).rows[0].logit, Math.log(.4))
  assert.equal(INFERENCE_SAMPLING_TOKENS[0].color, '#74e3cf')
})

test('sparse arrays cannot bypass finite-number validation in greedy or filter exports', () => {
  for (const sparse of [Array(4), [1, , , ,], [, 1, 2, 3], [0, 1, , 3]]) {
    for (const temperature of [0, 1]) assert.throws(() => samplingDistribution(sparse, { temperature }), TypeError)
    assert.throws(() => topKFilter(sparse, 2), TypeError)
  }
})
