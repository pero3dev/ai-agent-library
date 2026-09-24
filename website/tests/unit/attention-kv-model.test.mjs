import test from 'node:test'
import assert from 'node:assert/strict'
import { KV_STAGES, KV_SHARING, kvBytes, attentionPairs, kvHeadMap, kvFrame } from '../../lib/attention-kv-model.mjs'

test('KV byte count includes both K and V and each factor exactly once', () => {
  const factors = { tokens: 7, layers: 3, kvHeads: 4, headDimension: 5, bytesPerElement: 2 }
  assert.equal(kvBytes(factors), 1680)
  for (const key of Object.keys(factors)) assert.equal(kvBytes({ ...factors, [key]: factors[key] * 2 }), 3360)
  assert.equal(kvBytes({ ...factors, kvHeads: 2 }), 840)
  assert.equal(kvBytes({ ...factors, kvHeads: 1 }), 420)
})

test('doubling full-pair dimensions quadruples pairs, while causal triangular counts differ', () => {
  assert.equal(attentionPairs(4), 16)
  assert.equal(attentionPairs(8), 64)
  assert.equal(attentionPairs(4, { causal: true }), 10)
  assert.equal(attentionPairs(8, { causal: true }), 36)
  for (const n of [1, 2, 3, 9, 32]) {
    assert.equal(attentionPairs(2 * n), 4 * attentionPairs(n))
    assert.notEqual(attentionPairs(2 * n, { causal: true }), 4 * attentionPairs(n, { causal: true }))
  }
  assert.deepEqual(kvFrame(0).lengthComparison, { multiplier: 2, fullPairRatio: 4, kvRatio: 2, causal: false })
})

test('sharing preserves Q identities and associates exactly one K/V pair with each Q', () => {
  for (const queries of [4, 8, 12]) for (const heads of [1, 2, 4]) {
    const mapping = kvHeadMap(queries, heads)
    assert.deepEqual(mapping.map(item => item.query), Array.from({ length: queries }, (_, i) => i))
    assert.equal(new Set(mapping.map(item => item.group)).size, heads)
    assert.equal(new Set(mapping.map(item => item.slot)).size, heads)
    for (let group = 0; group < heads; group++) assert.equal(mapping.filter(item => item.group === group).length, queries / heads)
  }
  assert.deepEqual(kvHeadMap(4, 2).map(item => item.slot), [0, 0, 2, 2])
  assert.deepEqual(kvHeadMap(4, 1).map(item => item.slot), [0, 0, 0, 0])
})

test('comparison changes only KV sharing and a ratio that follows the byte formula', () => {
  const fixed = { tokens: 13, layers: 7, headDimension: 16, bytesPerElement: 2 }
  const baseline = kvBytes({ ...fixed, kvHeads: 4 })
  for (const { id } of KV_SHARING) {
    const frame = kvFrame(4, { sharing: id })
    assert.equal(frame.queryHeads, 4)
    assert.deepEqual(frame.fixedFactors, ['n', 'L', 'd_h', 'b'])
    assert.deepEqual(frame.attentionShape, ['n', 'n'])
    assert.equal(frame.cacheRatio, kvBytes({ ...fixed, kvHeads: frame.kvHeads }) / baseline)
    assert.equal(frame.activeSlots.length, frame.kvHeads)
  }
  assert.equal(kvFrame(4).mode, 'mqa')
})

test('earlier stages keep their specified sharing regardless of the final selector', () => {
  assert.equal(KV_STAGES.length, 5)
  for (const { id } of KV_SHARING) {
    for (let stage = 0; stage < 4; stage++) assert.equal(kvFrame(stage, { sharing: id }).mode, stage === 3 ? 'gqa' : 'mha')
  }
  const frame = kvFrame(4)
  frame.connections[0].query = 99; frame.activeSlots.push(99); frame.fixedFactors[0] = 'changed'
  assert.equal(kvFrame(4).connections[0].query, 0)
  assert.deepEqual(kvFrame(4).activeSlots, [0])
  assert.equal(kvFrame(4).fixedFactors[0], 'n')
})

test('invalid counts, sharing states and overflow are rejected', () => {
  const fixed = { tokens: 13, layers: 7, kvHeads: 4, headDimension: 16, bytesPerElement: 2 }
  for (const value of [0, -1, 1.5, NaN, Infinity, '4', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => attentionPairs(value), RangeError)
    assert.throws(() => kvBytes({ ...fixed, tokens: value }), RangeError)
  }
  assert.throws(() => attentionPairs(Number.MAX_SAFE_INTEGER), RangeError)
  assert.throws(() => attentionPairs(4, { causal: 'true' }), TypeError)
  assert.throws(() => kvBytes({ ...fixed, tokens: Number.MAX_SAFE_INTEGER }), RangeError)
  for (const [q, kv] of [[4, 3], [4, 8], [0, 1], [2048, 1]]) assert.throws(() => kvHeadMap(q, kv), RangeError)
  for (const stage of [-1, 5, 0.5, NaN, '1']) assert.throws(() => kvFrame(stage), RangeError)
  for (const options of [null, [], 'mqa']) assert.throws(() => kvFrame(0, options), TypeError)
  assert.throws(() => kvFrame(4, { sharing: 'unknown' }), RangeError)
})
