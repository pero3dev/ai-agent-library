import test from 'node:test'
import assert from 'node:assert/strict'
import { PRETRAINING_COMPUTE_STAGES, computeRatios, fixedComputeAllocations, pretrainingComputeFrame } from '../../lib/pretraining-compute-model.mjs'

test('the four factor combinations give one, two, two, and four times the baseline compute', () => {
  for (const [n, d, c] of [[1, 1, 1], [2, 1, 2], [1, 2, 2], [2, 2, 4]]) {
    assert.deepEqual(computeRatios(n, d), { n, d, c })
    assert.deepEqual(pretrainingComputeFrame(1, { parameterFactor: n, dataFactor: d }).ratios, { n, d, c })
  }
})

test('fixed-budget allocations keep compute equal without choosing a loss optimum', () => {
  assert.deepEqual(fixedComputeAllocations(), [
    { id: 'data-heavy', n: .5, d: 2, c: 1 }, { id: 'reference', n: 1, d: 1, c: 1 }, { id: 'parameter-heavy', n: 2, d: .5, c: 1 }
  ])
  for (const allocation of ['data-heavy', 'reference', 'parameter-heavy']) {
    const frame = pretrainingComputeFrame(2, { allocation })
    assert.equal(frame.allocations.length, 3)
    assert.ok(frame.allocations.every(item => item.c === 1))
    assert.deepEqual(frame.allocations.filter(item => item.emphasized).map(item => item.id), [allocation])
    assert.equal(frame.optimum, null)
  }
})

test('the ratio helper rejects zero, negatives, coercible values, overflow, and underflow', () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity, '2', '', null, undefined, false]) {
    assert.throws(() => computeRatios(value, 1), RangeError)
    assert.throws(() => computeRatios(1, value), RangeError)
  }
  assert.throws(() => computeRatios(Number.MAX_VALUE, 2), RangeError)
  assert.throws(() => computeRatios(Number.MIN_VALUE, .25), RangeError)
  assert.deepEqual(computeRatios(.125, 8), { n: .125, d: 8, c: 1 })
})

test('the cost boundary preserves fixed and growing budgets and keeps all actual costs unknown', () => {
  for (const realCostFactor of ['duration', 'price', 'energy']) {
    const frame = pretrainingComputeFrame(3, { realCostFactor })
    assert.deepEqual(frame.fixedBudget, { kind: 'fixed', n: 2, d: .5, c: 1 })
    assert.deepEqual(frame.growingBudget, { kind: 'growing', n: 2, d: 2, c: 4 })
    assert.deepEqual(frame.actualCost, { duration: null, price: null, energy: null })
    assert.deepEqual(frame.realCosts.map(item => [item.id, item.value]), [['duration', null], ['price', null], ['energy', null]])
    assert.deepEqual(frame.realCosts.filter(item => item.emphasized).map(item => item.id), [realCostFactor])
    assert.equal(frame.actualCostDeterminedByFlops, false)
    assert.equal(frame.computeUnit, 'FLOPs')
    assert.equal(frame.measuredPerformance, null)
  }
})

test('choices stay in their own stages; the final summary does not inherit product or allocation state', () => {
  for (const stage of [0, 2, 3]) assert.deepEqual(pretrainingComputeFrame(stage), pretrainingComputeFrame(stage, { parameterFactor: 2, dataFactor: 2 }))
  for (const stage of [0, 1, 3]) assert.deepEqual(pretrainingComputeFrame(stage), pretrainingComputeFrame(stage, { allocation: 'parameter-heavy' }))
  for (const stage of [0, 1, 2]) assert.deepEqual(pretrainingComputeFrame(stage), pretrainingComputeFrame(stage, { realCostFactor: 'energy' }))
})

test('forward midpoints and reverse seeks preserve the exact integer-stage meaning', () => {
  assert.equal(PRETRAINING_COMPUTE_STAGES.length, 4)
  const phases = [0, ...[0, 1, 2].flatMap(k => [k + .49, k + .5, k + .51]), 3]
  const options = { parameterFactor: 2, dataFactor: 2, allocation: 'data-heavy', realCostFactor: 'energy' }
  const forward = phases.map(phase => pretrainingComputeFrame(phase, options))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = pretrainingComputeFrame(phases[index], options)
    assert.deepEqual(frame, forward[index])
    const { phase, ...meaning } = frame, { phase: integerPhase, ...integerMeaning } = pretrainingComputeFrame(Math.round(phases[index]), options)
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(integerPhase, Math.round(phase))
  }
})

test('invalid phases and choices fail explicitly, and finite seeks clamp', () => {
  for (const phase of [NaN, Infinity, -Infinity, '1', null, undefined]) assert.throws(() => pretrainingComputeFrame(phase), TypeError)
  for (const options of [null, [], '1', 2]) assert.throws(() => pretrainingComputeFrame(1, options), TypeError)
  for (const options of [{ parameterFactor: '2' }, { parameterFactor: 0 }, { dataFactor: '' }, { dataFactor: 4 }, { allocation: null }, { allocation: 'best' }, { realCostFactor: 'power' }]) assert.throws(() => pretrainingComputeFrame(1, options), RangeError)
  assert.deepEqual(pretrainingComputeFrame(-3), pretrainingComputeFrame(0))
  assert.deepEqual(pretrainingComputeFrame(9), pretrainingComputeFrame(3))
})

test('returned ratio and cost objects are independent and caller options stay unchanged', () => {
  const options = Object.freeze({ parameterFactor: 2 }), original = pretrainingComputeFrame(1, options), changed = pretrainingComputeFrame(1, options)
  changed.ratios.n = 9
  changed.allocations[0].c = 9
  changed.actualCost.price = 0
  changed.realCosts[1].value = 0
  changed.fixedBudget.c = 9
  assert.deepEqual(pretrainingComputeFrame(1, options), original)
  const allocations = fixedComputeAllocations()
  allocations[0].n = 9
  assert.equal(fixedComputeAllocations()[0].n, .5)
  assert.ok(Object.isFrozen(PRETRAINING_COMPUTE_STAGES) && PRETRAINING_COMPUTE_STAGES.every(Object.isFrozen))
})
