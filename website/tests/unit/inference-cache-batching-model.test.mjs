import test from 'node:test'
import assert from 'node:assert/strict'
import { kvBytes, batchingSnapshot, inferenceCacheFrame, INFERENCE_CACHE_STAGES } from '../../lib/inference-cache-batching-model.mjs'

test('the KV formula has both K/V and every independent size factor', () => {
  assert.equal(kvBytes(4), 256)
  assert.equal(kvBytes(8), 512)
  assert.equal(kvBytes(5) - kvBytes(4), 64)
  for (const length of [1, 4, 7]) for (const layers of [1, 3]) for (const kvHeads of [1, 2]) for (const headDimension of [4, 8]) for (const bytesPerElement of [1, 2, 4]) {
    assert.equal(kvBytes(length, { layers, kvHeads, headDimension, bytesPerElement }), 2 * length * layers * kvHeads * headDimension * bytesPerElement)
  }
})

test('KV factors cannot silently accept invalid or unsafe memory counts', () => {
  for (const length of [0, -1, .5, NaN, Infinity, '4']) assert.throws(() => kvBytes(length))
  for (const key of ['layers', 'kvHeads', 'headDimension', 'bytesPerElement']) {
    assert.throws(() => kvBytes(4, { layers: 2, kvHeads: 2, headDimension: 4, bytesPerElement: 2, [key]: 0 }))
  }
  assert.throws(() => kvBytes(Number.MAX_SAFE_INTEGER))
})

test('prefill produces the first choice without caching its as-yet unprocessed position', () => {
  const prefill = inferenceCacheFrame(2)
  assert.deepEqual(prefill.processedPositions, [0, 1, 2, 3])
  assert.equal(prefill.cacheLength, 4)
  assert.equal(prefill.sampledToken, 'x₁')
  assert.equal(prefill.sampledPosition, 4)
  assert.equal(prefill.sampledTokenInCache, false)
  const decode = inferenceCacheFrame(2, { operation: 'decode' })
  assert.deepEqual(decode.processedPositions, [4])
  assert.equal(decode.cacheLength, 5)
  assert.equal(decode.sampledToken, 'x₂')
  assert.equal(decode.sampledPosition, 5)
  assert.equal(decode.sampledTokenInCache, false)
  assert.equal(decode.weightsChanged, false)
})

test('ordinary batching holds completed slots until the group ends', () => {
  const expected = [
    ['A,B', 'C', ''], ['A,B', 'C', ''], ['B', 'C', 'A'], ['B', 'C', 'A'],
    ['C', '', 'A,B'], ['C', '', 'A,B'], ['C', '', 'A,B'], ['', '', 'A,B,C']
  ]
  for (const [iteration, [active, waiting, finished]] of expected.entries()) {
    const snapshot = batchingSnapshot('ordinary', iteration)
    assert.equal(snapshot.active.join(','), active)
    assert.equal(snapshot.waiting.join(','), waiting)
    assert.equal(snapshot.finished.join(','), finished)
  }
  assert.deepEqual(batchingSnapshot('ordinary', 2).slots, [{ index: 0, id: 'A', reserved: true }, { index: 1, id: 'B', reserved: false }])
  const requestA = batchingSnapshot('ordinary', 2).requests[0]
  assert.equal(requestA.cacheBytes, 0, 'a reserved completed slot is not retained KV')
  assert.equal(batchingSnapshot('ordinary', 4).requests[2].enteredAt, 4)
  assert.equal(batchingSnapshot('ordinary', 7).requests[2].finishedAt, 7)
})

test('continuous batching admits C after A without waiting for B', () => {
  const expected = [
    ['A,B', 'C', ''], ['A,B', 'C', ''], ['B,C', '', 'A'], ['B,C', '', 'A'],
    ['C', '', 'A,B'], ['', '', 'A,B,C'], ['', '', 'A,B,C'], ['', '', 'A,B,C']
  ]
  for (const [iteration, [active, waiting, finished]] of expected.entries()) {
    const snapshot = batchingSnapshot('continuous', iteration)
    assert.equal(snapshot.active.join(','), active)
    assert.equal(snapshot.waiting.join(','), waiting)
    assert.equal(snapshot.finished.join(','), finished)
  }
  assert.deepEqual(batchingSnapshot('continuous', 2).slots.map(slot => slot.id), ['C', 'B'])
  assert.equal(batchingSnapshot('continuous', 2).requests[2].enteredAt, 2)
  assert.equal(batchingSnapshot('continuous', 2).requests[2].completed, 0, 'newly admitted C does not run in the just-completed iteration')
  assert.equal(batchingSnapshot('continuous', 5).requests[2].finishedAt, 5)
})

test('KV totals follow only active requests and processed positions', () => {
  assert.equal(batchingSnapshot('ordinary', 2, 4).cacheBytes, 6 * 64)
  assert.equal(batchingSnapshot('continuous', 2, 4).cacheBytes, (6 + 4) * 64)
  assert.equal(batchingSnapshot('continuous', 2, 8).cacheBytes, (10 + 8) * 64)
  for (const mode of ['ordinary', 'continuous']) for (const length of [4, 8]) for (let iteration = 0; iteration <= 7; iteration++) {
    const snapshot = batchingSnapshot(mode, iteration, length)
    const reference = snapshot.requests.filter(request => request.status === 'active').reduce((total, request) => total + (length + request.completed) * 64, 0)
    assert.equal(snapshot.cacheBytes, reference)
    for (const request of snapshot.requests) {
      assert.ok(request.completed <= request.required)
      assert.equal(request.remaining, request.required - request.completed)
      if (request.status !== 'active') assert.equal(request.cacheBytes, 0)
    }
    assert.equal(snapshot.elapsedMs, null)
    assert.equal(snapshot.throughput, null)
    assert.equal(snapshot.latency, null)
    assert.equal(snapshot.weightsChanged, false)
  }
})

test('selectors remain scoped to the explanatory stage', () => {
  const selected = { length: 8, operation: 'decode', mode: 'ordinary', iteration: 7 }
  for (const phase of [0, 1, 2, 3, 4, 5]) {
    const frame = inferenceCacheFrame(phase, selected)
    assert.equal(frame.length, phase === 1 || phase === 5 ? 8 : 4)
    assert.equal(frame.operation, phase === 2 ? 'decode' : 'prefill')
    if (phase === 3) {
      assert.equal(frame.snapshot.mode, 'ordinary')
      assert.equal(frame.snapshot.iteration, 0)
      assert.deepEqual(frame.snapshot.active, ['A', 'B'])
    }
  }
})

test('every midpoint and reverse seek use the common presentation boundary', () => {
  assert.equal(INFERENCE_CACHE_STAGES.length, 6)
  for (let index = 0; index < 5; index++) {
    for (const phase of [index + .499, index + .5, index + .501, index + .499]) {
      const frame = inferenceCacheFrame(phase)
      assert.equal(frame.stage, Math.round(phase))
      assert.equal(frame.title, INFERENCE_CACHE_STAGES[frame.stage].title)
      assert.deepEqual(frame, inferenceCacheFrame(phase))
    }
  }
  assert.equal(inferenceCacheFrame(-5).stage, 0)
  assert.equal(inferenceCacheFrame(50).stage, 5)
})

test('returned state is fresh and invalid settings are rejected', () => {
  const first = batchingSnapshot()
  first.requests[0].completed = 99
  first.slots[0].id = 'X'
  assert.equal(batchingSnapshot().requests[0].completed, 2)
  assert.equal(batchingSnapshot().slots[0].id, 'C')
  for (const options of [{ length: 3 }, { operation: 'unknown' }, { mode: 'unknown' }, { iteration: -.1 }, { iteration: 8 }, { iteration: NaN }]) assert.throws(() => inferenceCacheFrame(4, options))
  for (const value of [NaN, Infinity, '2']) assert.throws(() => inferenceCacheFrame(value))
  assert.throws(() => batchingSnapshot('invalid'))
  assert.throws(() => batchingSnapshot('ordinary', .5))
  assert.throws(() => batchingSnapshot('continuous', 2, 3))
})
