import test from 'node:test'
import assert from 'node:assert/strict'
import { PRETRAINING_SCALING_STAGES, pretrainingScalingFrame } from '../../lib/pretraining-scaling-model.mjs'

test('residual and total loss ratios are different symbolic objects with no fitted coefficients', () => {
  const frame = pretrainingScalingFrame(1)
  assert.equal(frame.residualIdentity, 'R(rN)/R(N) = r^(-alpha)')
  assert.equal(frame.totalLossRatio, '(Linf + R*r^(-alpha))/(Linf + R)')
  assert.notEqual(frame.totalLossRatio, frame.residualIdentity)
  assert.deepEqual(frame.coefficients, { alpha: null, Nc: null, Linf: null })
  for (let stage = 0; stage < 6; stage++) {
    const result = pretrainingScalingFrame(stage)
    assert.equal(result.fittedCoefficients, null)
    assert.equal(result.lossPrediction, null)
    assert.equal(result.optimum, null)
    assert.equal(result.empiricalMeasurement, false)
    assert.equal(result.equalNAndDRecommended, false)
  }
})

test('fixed-budget allocation choices preserve three equal-compute alternatives', () => {
  for (const fixedAllocation of ['data-heavy', 'reference', 'parameter-heavy']) {
    const frame = pretrainingScalingFrame(2, { fixedAllocation })
    assert.deepEqual(frame.allocations.map(({ n, d, c }) => [n, d, c]), [[.5, 2, 1], [1, 1, 1], [2, .5, 1]])
    assert.deepEqual(frame.allocations.filter(item => item.emphasized).map(item => item.id), [fixedAllocation])
    assert.equal(frame.optimum, null)
  }
})

test('growing budgets scale compute quadratically and do not alter the fixed-budget frame', () => {
  for (const [growthScale, c] of [[1, 1], [2, 4], [4, 16]]) {
    const frame = pretrainingScalingFrame(3, { growthScale, fixedAllocation: 'data-heavy' })
    assert.deepEqual(frame.growingBudget, { kind: 'growing', n: growthScale, d: growthScale, c })
    assert.deepEqual(frame.fixedBudget, { kind: 'fixed', n: 2, d: .5, c: 1 })
    assert.equal(frame.fixedAllocation, null)
    assert.ok(frame.allocations.every(item => item.emphasized === false))
  }
})

test('all three coefficient conditions stay present after focus changes, while inference has no guarantee', () => {
  for (const coefficientCondition of ['data', 'architecture', 'tokenizer']) {
    const frame = pretrainingScalingFrame(5, { coefficientCondition })
    assert.deepEqual(frame.conditions.map(item => item.id), ['data', 'architecture', 'tokenizer'])
    assert.deepEqual(frame.conditions.filter(item => item.emphasized).map(item => item.id), [coefficientCondition])
    assert.equal(frame.fittedCoefficients, null)
  }
  assert.equal(pretrainingScalingFrame(4).inferenceWeights, 'fixed')
  assert.equal(pretrainingScalingFrame(4).guaranteedImprovement, false)
})

test('settings outside their designated stage do not change another stage', () => {
  for (const stage of [0, 1, 3, 4, 5]) assert.deepEqual(pretrainingScalingFrame(stage), pretrainingScalingFrame(stage, { fixedAllocation: 'parameter-heavy' }))
  for (const stage of [0, 1, 2, 4, 5]) assert.deepEqual(pretrainingScalingFrame(stage), pretrainingScalingFrame(stage, { growthScale: 4 }))
  for (const stage of [0, 1, 2, 3, 4]) assert.deepEqual(pretrainingScalingFrame(stage), pretrainingScalingFrame(stage, { coefficientCondition: 'tokenizer' }))
})

test('all five stage boundaries use the reading-clock midpoint and survive reverse seeks', () => {
  assert.equal(PRETRAINING_SCALING_STAGES.length, 6)
  const phases = [0, ...[0, 1, 2, 3, 4].flatMap(k => [k + .49, k + .5, k + .51]), 5]
  const options = { fixedAllocation: 'parameter-heavy', growthScale: 4, coefficientCondition: 'architecture' }
  const forward = phases.map(phase => pretrainingScalingFrame(phase, options))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = pretrainingScalingFrame(phases[index], options)
    assert.deepEqual(frame, forward[index])
    const { phase, ...meaning } = frame, { phase: integerPhase, ...integerMeaning } = pretrainingScalingFrame(Math.round(phases[index]), options)
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(integerPhase, Math.round(phase))
  }
})

test('invalid phases/options fail without numeric coercion and finite seeks clamp', () => {
  for (const phase of [NaN, Infinity, -Infinity, '2', null, undefined]) assert.throws(() => pretrainingScalingFrame(phase), TypeError)
  for (const options of [null, [], '2', 2]) assert.throws(() => pretrainingScalingFrame(2, options), TypeError)
  for (const options of [{ fixedAllocation: 'optimal' }, { fixedAllocation: null }, { growthScale: '2' }, { growthScale: '' }, { growthScale: 0 }, { growthScale: 3 }, { coefficientCondition: 'all' }]) assert.throws(() => pretrainingScalingFrame(2, options), RangeError)
  assert.deepEqual(pretrainingScalingFrame(-3), pretrainingScalingFrame(0))
  assert.deepEqual(pretrainingScalingFrame(9), pretrainingScalingFrame(5))
})

test('returned allocation, coefficient and budget objects cannot mutate later frames', () => {
  const options = Object.freeze({ growthScale: 4 }), original = pretrainingScalingFrame(3, options), changed = pretrainingScalingFrame(3, options)
  changed.allocations[0].n = 9
  changed.coefficients.alpha = .5
  changed.growingBudget.c = 2
  changed.fixedBudget.c = 2
  changed.conditions.pop()
  assert.deepEqual(pretrainingScalingFrame(3, options), original)
  assert.ok(Object.isFrozen(PRETRAINING_SCALING_STAGES) && PRETRAINING_SCALING_STAGES.every(Object.isFrozen))
})
