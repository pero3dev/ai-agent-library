import test from 'node:test'
import assert from 'node:assert/strict'
import { PRETRAINING_METRICS_STAGES, pretrainingMetricsFrame } from '../../lib/pretraining-metrics-model.mjs'

test('thresholds use integer >= and include the exact boundary without changing inputs or x positions', () => {
  const expected = new Map([[50, [0, 0, 1, 1, 1, 1]], [60, [0, 0, 0, 1, 1, 1]], [70, [0, 0, 0, 0, 1, 1]]])
  for (const [scoreThreshold, binary] of expected) {
    const frame = pretrainingMetricsFrame(2, { scoreThreshold })
    assert.deepEqual(frame.points.map(point => point.id), ['A', 'B', 'C', 'D', 'E', 'F'])
    assert.deepEqual(frame.points.map(point => point.numerator), [30, 40, 50, 60, 70, 80])
    assert.deepEqual(frame.points.map(point => point.x), [148, 228, 308, 388, 468, 548])
    assert.deepEqual(frame.points.map(point => point.index), [0, 1, 2, 3, 4, 5])
    assert.deepEqual(frame.points.map(point => point.binary), binary)
    assert.equal(frame.points.find(point => point.numerator === scoreThreshold).binary, 1)
    assert.equal(frame.threshold, scoreThreshold)
    assert.equal(frame.comparisonOperator, '>=')
  }
})

test('continuous values and coordinates stay fixed while only the binary view and threshold guide change', () => {
  const source = frame => frame.points.map(({ id, index, x, numerator, denominator, continuous, display, continuousY }) => ({ id, index, x, numerator, denominator, continuous, display, continuousY }))
  const baseline = pretrainingMetricsFrame(2)
  assert.equal(baseline.threshold, 60)
  assert.deepEqual(baseline.points.map(point => point.display), ['0.30', '0.40', '0.50', '0.60', '0.70', '0.80'])
  for (const scoreThreshold of [50, 60, 70]) {
    const frame = pretrainingMetricsFrame(2, { scoreThreshold })
    assert.deepEqual(source(frame), source(baseline))
    assert.deepEqual(frame.views, ['continuous', 'binary'])
    for (const point of frame.points) assert.equal(point.binaryY, point.binary === 1 ? 256 : 304)
  }
})

test('the selector cannot affect debate, fixed-output example or concluding paired views', () => {
  for (const stage of [0, 1, 3]) for (const scoreThreshold of [50, 60, 70]) assert.deepEqual(pretrainingMetricsFrame(stage, { scoreThreshold }), pretrainingMetricsFrame(stage))
})

test('no stage claims measured ability, exact-match/Brier implementation or settled emergence judgment', () => {
  for (let stage = 0; stage < 4; stage++) {
    const frame = pretrainingMetricsFrame(stage)
    assert.equal(frame.empiricalMeasurement, false)
    assert.equal(frame.exactMatchImplementation, false)
    assert.equal(frame.brierImplementation, false)
    assert.equal(frame.emergenceJudgment, null)
    assert.equal(frame.abilityJudgment, null)
    assert.equal(frame.allEmergenceIsArtifact, false)
  }
})

test('midpoint boundaries and reverse seeks never interpolate a score or threshold result', () => {
  const phases = [0, .49, .5, .51, 1.49, 1.5, 1.51, 2.49, 2.5, 2.51, 3]
  const frames = phases.map(phase => pretrainingMetricsFrame(phase, { scoreThreshold: 70 }))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = pretrainingMetricsFrame(phases[index], { scoreThreshold: 70 })
    assert.deepEqual(frame, frames[index])
    const { phase, ...meaning } = frame, { phase: integer, ...integerMeaning } = pretrainingMetricsFrame(Math.round(phase), { scoreThreshold: 70 })
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(integer, Math.round(phase))
  }
})

test('non-finite phases and unsupported or string threshold values fail, finite endpoint seeks clamp', () => {
  for (const phase of [NaN, Infinity, -Infinity, '2', null, undefined]) assert.throws(() => pretrainingMetricsFrame(phase), TypeError)
  for (const options of [null, [], 50, '60']) assert.throws(() => pretrainingMetricsFrame(2, options), TypeError)
  for (const scoreThreshold of [0, 49, 61, 100, '50', '', null, false, NaN, Infinity]) assert.throws(() => pretrainingMetricsFrame(2, { scoreThreshold }), RangeError)
  assert.deepEqual(pretrainingMetricsFrame(-2), pretrainingMetricsFrame(0))
  assert.deepEqual(pretrainingMetricsFrame(8), pretrainingMetricsFrame(3))
})

test('returned points and view arrays are independent across frames', () => {
  const baseline = pretrainingMetricsFrame(2), frame = pretrainingMetricsFrame(2)
  frame.points[0].numerator = 90
  frame.points[0].x = 999
  frame.views.splice(1, 1)
  assert.deepEqual(pretrainingMetricsFrame(2), baseline)
  assert.equal(PRETRAINING_METRICS_STAGES.length, 4)
  assert.ok(Object.isFrozen(PRETRAINING_METRICS_STAGES) && PRETRAINING_METRICS_STAGES.every(Object.isFrozen))
})
