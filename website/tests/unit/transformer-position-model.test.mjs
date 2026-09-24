import test from 'node:test'
import assert from 'node:assert/strict'
import { positionFrame, rotatePair, ropePair } from '../../lib/transformer-position-model.mjs'

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]

test('a quarter turn has the expected direction and preserves signed content magnitude', () => {
  const result = rotatePair([2, -3], Math.PI / 2)
  near(result[0], 3); near(result[1], 2)
  near(dot(result, result), 13)
  assert.deepEqual(rotatePair([2, -3], 0), [2, -3])
})

test('the relative rotation uses key angle minus query angle', () => {
  const q = [2, -1], k = [3, 4], a = 0.7, b = -0.2
  near(dot(rotatePair(q, a), rotatePair(k, b)), dot(q, rotatePair(k, b - a)))
})

test('a common position shift preserves the dot product with content and frequency fixed', () => {
  const input = { query: [2, -1], key: [-3, 4], queryPosition: 7, keyPosition: 2, anglePerPosition: 0.13 }
  const base = ropePair(input)
  const shifted = ropePair({ ...input, queryPosition: 18, keyPosition: 13 })
  near(dot(base.queryRotated, base.keyRotated), dot(shifted.queryRotated, shifted.keyRotated))
  near(dot(base.queryBase, base.queryBase), dot(shifted.queryRotated, shifted.queryRotated))
  near(dot(base.keyBase, base.keyBase), dot(shifted.keyRotated, shifted.keyRotated))
  assert.deepEqual(base.queryBase, shifted.queryBase)
  assert.deepEqual(base.keyBase, shifted.keyBase)
})

test('the dot product still depends on vector content when the position difference is fixed', () => {
  const input = { query: [1, 0], key: [1, 0], queryPosition: 1, keyPosition: 1, anglePerPosition: 0.2 }
  const aligned = ropePair(input), perpendicular = ropePair({ ...input, key: [0, 1] })
  near(dot(aligned.queryRotated, aligned.keyRotated), 1)
  near(dot(perpendicular.queryRotated, perpendicular.keyRotated), 0)
})

test('comparison controls change positions, never the pair content or value vectors', () => {
  const frames = ['base', 'shift-together', 'change-gap'].map(comparison => positionFrame(3, { comparison }))
  for (const frame of frames) {
    assert.deepEqual(frame.pair.queryBase, frames[0].pair.queryBase)
    assert.deepEqual(frame.pair.keyBase, frames[0].pair.keyBase)
    assert.equal(frame.rotatesValue, false)
    near(dot(frame.pair.queryRotated, frame.pair.queryRotated), dot(frame.pair.queryBase, frame.pair.queryBase))
    near(dot(frame.pair.keyRotated, frame.pair.keyRotated), dot(frame.pair.keyBase, frame.pair.keyBase))
  }
  near(dot(frames[0].pair.queryRotated, frames[0].pair.keyRotated), dot(frames[1].pair.queryRotated, frames[1].pair.keyRotated))
  assert.notEqual(dot(frames[0].pair.queryRotated, frames[0].pair.keyRotated), dot(frames[2].pair.queryRotated, frames[2].pair.keyRotated))
  assert.equal(frames[1].labels.relativePosition, 'm − n')
  assert.equal(frames[2].labels.relativePosition, '(m + Δ) − n')
})

test('three mechanisms have separate application points and earlier stages ignore comparison selection', () => {
  assert.equal(positionFrame(0).application, 'embedding')
  assert.equal(positionFrame(1).application, 'score')
  assert.equal(positionFrame(2).application, 'query-key')
  for (let stage = 0; stage < 3; stage++) {
    const frame = positionFrame(stage, { comparison: 'change-gap' })
    assert.equal(frame.comparison, 'base')
    assert.deepEqual(frame.pair, positionFrame(stage).pair)
    assert.equal(frame.rotatesQuery, stage >= 2)
    assert.equal(frame.rotatesKey, stage >= 2)
    assert.equal(frame.rotatesValue, false)
  }
})

test('caller mutation cannot change the fixed explanatory geometry', () => {
  const frame = positionFrame(3)
  frame.pair.queryBase[0] = 99
  assert.notEqual(positionFrame(3).pair.queryBase[0], 99)
  const query = [1, 2], key = [2, 1]
  ropePair({ query, key, queryPosition: 2, keyPosition: 1, anglePerPosition: 0.4 })
  assert.deepEqual(query, [1, 2]); assert.deepEqual(key, [2, 1])
})

test('invalid geometry, states and overflowing products are rejected', () => {
  for (const pair of [[], [1], [1, 2, 3], [NaN, 0], [0, Infinity], ['1', 0], new Array(2)]) assert.throws(() => rotatePair(pair, 0), TypeError)
  assert.throws(() => rotatePair([1, 2], NaN), TypeError)
  assert.throws(() => rotatePair([Number.MAX_VALUE, -Number.MAX_VALUE], Math.PI / 4), RangeError)
  assert.throws(() => ropePair(), TypeError)
  assert.throws(() => ropePair({ query: [1, 0], key: [0, 1], queryPosition: -1, keyPosition: 1, anglePerPosition: 1 }), TypeError)
  assert.throws(() => ropePair({ query: [1, 0], key: [0, 1], queryPosition: Number.MAX_VALUE, keyPosition: 1, anglePerPosition: 2 }), RangeError)
  for (const stage of [-1, 4, 0.5, NaN, '1']) assert.throws(() => positionFrame(stage), RangeError)
  for (const options of [null, [], 'base']) assert.throws(() => positionFrame(0, options), TypeError)
  assert.throws(() => positionFrame(3, { comparison: 'random' }), RangeError)
})
