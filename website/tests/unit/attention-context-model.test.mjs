import test from 'node:test'
import assert from 'node:assert/strict'
import { CONTEXT_STAGES, CONTEXT_CHECKS, CONTEXT_GEOMETRY, mapContextPositions, contextFrame } from '../../lib/attention-context-model.mjs'

const tokens = [0, 1, 2, 3, 4, 5, 6, 7].map(position => ({ id: `id-${position}`, position }))
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`)

test('interpolation preserves every input identity, position and order without rounding', () => {
  const mapped = mapContextPositions(tokens, { inputLength: 8, trainingLength: 4 })
  assert.deepEqual(mapped.map(({ id, position }) => ({ id, position })), tokens)
  assert.deepEqual(mapped.map(item => item.assignedPosition), [0, .5, 1, 1.5, 2, 2.5, 3, 3.5])
  assert.equal(new Set(mapped.map(item => item.assignedPosition)).size, tokens.length)
  assert.ok(mapped.every(item => item.assignedPosition < 4))
  assert.deepEqual(tokens.map(item => item.position), [0, 1, 2, 3, 4, 5, 6, 7])
})

test('fractional positions undergo the same linear map and never clamp to a boundary', () => {
  const input = [{ id: 'a', position: .2 }, { id: 'b', position: 3.1 }, { id: 'c', position: 9.9 }]
  const mapped = mapContextPositions(input, { inputLength: 10, trainingLength: 3 })
  for (let i = 0; i < input.length; i++) near(mapped[i].assignedPosition, input[i].position * .3)
  near(mapped[2].assignedPosition - mapped[1].assignedPosition, (9.9 - 3.1) * .3)
  assert.ok(mapped[2].assignedPosition < 3)
})

test('every intermediate shared-clock frame is monotone, continuous and injective', () => {
  let previous = null
  for (let step = 0; step <= 100; step++) {
    const phase = 1.5 + step / 200
    const frame = contextFrame(Math.round(phase), { phase })
    const positions = frame.tokens.map(item => item.assignedPosition)
    for (let i = 1; i < positions.length; i++) assert.ok(positions[i] > positions[i - 1])
    for (let i = 0; i < positions.length; i++) {
      near(positions[i], i * (1 - step / 200))
      if (previous) assert.ok(previous[i] - positions[i] < .036)
    }
    assert.equal(frame.tokens.length, 8)
    previous = positions
  }
})

test('extrapolation leaves positions outside training visible; interpolation keeps all tokens inside', () => {
  const extrapolated = contextFrame(1)
  assert.deepEqual(extrapolated.tokens.map(item => item.assignedPosition), tokens.map(item => item.position))
  assert.equal(extrapolated.tokens.filter(item => item.assignedPosition >= CONTEXT_GEOMETRY.trainingLength).length, 4)
  assert.deepEqual(contextFrame(1, { phase: 1.49 }).tokens, extrapolated.tokens)
  assert.ok(contextFrame(2).tokens.every(item => item.assignedPosition < CONTEXT_GEOMETRY.trainingLength))
  assert.equal(CONTEXT_STAGES.length, 4)
})

test('midpoint boundaries and backward seeks keep labels and mapping in agreement', () => {
  const phases = [0, .5, 1, 1.49, 1.5 - 1e-9, 1.5, 1.5 + 1e-9, 1.75, 2 - 1e-9, 2, 2.5, 3]
  const forward = phases.map(phase => contextFrame(Math.round(phase), { phase }))
  const backward = [...phases].reverse().map(phase => contextFrame(Math.round(phase), { phase })).reverse()
  assert.deepEqual(backward, forward)
  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index], frame = forward[index]
    if (phase <= 1.5) assert.deepEqual(frame.tokens.map(item => item.assignedPosition), tokens.map(item => item.position))
    else if (phase < 2) {
      assert.equal(frame.stage, 2)
      assert.ok(frame.interpolation > 0 && frame.interpolation < 1)
    } else assert.deepEqual(frame.tokens.map(item => item.assignedPosition), [0, .5, 1, 1.5, 2, 2.5, 3, 3.5])
  }
  assert.ok(Math.abs(forward[4].tokens[7].assignedPosition - forward[6].tokens[7].assignedPosition) < 1e-7)
  assert.ok(Math.abs(forward[8].tokens[7].assignedPosition - forward[9].tokens[7].assignedPosition) < 1e-7)
})

test('check selectors do not invent quality, cost, token content or position changes', () => {
  const baseline = contextFrame(3)
  for (const { id } of CONTEXT_CHECKS) {
    const frame = contextFrame(3, { check: id })
    assert.deepEqual(frame.tokens, baseline.tokens)
    assert.equal(frame.check, id)
    assert.equal(frame.qualityJudgment, null)
    assert.equal(frame.costMeasurement, null)
    assert.equal(contextFrame(2, { check: id }).check, null)
  }
  baseline.tokens[0].position = 99; baseline.tokens[0].id = 'changed'
  assert.equal(contextFrame(3).tokens[0].position, 0)
  assert.equal(contextFrame(3).tokens[0].id, 'token-0')
})

test('invalid, duplicate, unordered, out-of-range and sparse inputs fail closed', () => {
  const options = { inputLength: 8, trainingLength: 4 }
  for (const input of [null, [], new Array(3), [{ position: 0 }], [tokens[0], tokens[0]]]) assert.throws(() => mapContextPositions(input, options), TypeError)
  for (const positions of [[1, 0], [1, 1], [-1, 0], [0, 8], [0, NaN], [0, Infinity]]) {
    assert.throws(() => mapContextPositions(positions.map((position, i) => ({ id: String(i), position })), options), RangeError)
  }
  for (const inputLength of [0, -1, Infinity, NaN, '8', 2]) assert.throws(() => mapContextPositions(tokens, { ...options, inputLength }), RangeError)
  for (const interpolation of [-1, 2, NaN, Infinity, '1']) assert.throws(() => mapContextPositions(tokens, { ...options, interpolation }), RangeError)
  for (const stage of [-1, 4, .5, NaN, '1']) assert.throws(() => contextFrame(stage), RangeError)
  for (const options of [null, [], 'quality']) assert.throws(() => contextFrame(0, options), TypeError)
  for (const phase of [-1, 4, NaN, '1']) assert.throws(() => contextFrame(2, { phase }), RangeError)
  assert.throws(() => contextFrame(3, { check: 'unknown' }), RangeError)
})
