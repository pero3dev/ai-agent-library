import assert from 'node:assert/strict'
import test from 'node:test'
import { computeFrame, sparseConnections, reachableKeys, featureProducts, flashTiles, flashTileState } from '../../lib/attention-compute-model.mjs'
import { stageForPhase } from '../../lib/reading-clock.mjs'

test('sparse causal patterns retain self and separate direct links from two-layer reachability', () => {
  for (const pattern of ['local', 'fixed', 'sink']) {
    const graph = sparseConnections({ pattern })
    graph.forEach((row, query) => { assert.equal(row[query], true); assert.ok(row.every((connected, key) => !connected || key <= query)) })
    assert.deepEqual(reachableKeys(graph, 7, 1), graph[7].flatMap((connected, key) => connected ? [key] : []))
  }
  const local = sparseConnections()
  assert.deepEqual(reachableKeys(local, 7, 1), [5, 6, 7])
  assert.deepEqual(reachableKeys(local, 7, 2), [3, 4, 5, 6, 7])
  assert.equal(sparseConnections({ pattern: 'sink' })[7][0], true)
  assert.equal(sparseConnections({ pattern: 'sink' })[7][1], false)
  assert.equal(sparseConnections({ pattern: 'fixed' })[7][3], true)
})

test('feature product regrouping preserves the numerator with distinct feature and value widths', () => {
  const q = [[1, 2], [3, 1]], k = [[2, 1], [1, 4], [3, 2]], v = [[2, 3, 1], [1, 5, 2], [4, 1, 3]]
  const result = featureProducts(q, k, v)
  assert.deepEqual(result.direct, [[45, 64, 43], [65, 67, 54]])
  assert.deepEqual(result.factored, result.direct)
  assert.deepEqual(result.shape, { queries: 2, keys: 3, featureWidth: 2, valueWidth: 3 })
  assert.equal(result.intermediate.length, 2)
  assert.equal(result.intermediate[0].length, 3)
  assert.equal(result.normalized, false); assert.equal(result.causal, false)
})

test('Flash tiles cover exactly the same causal pairs once, including partial edge tiles', () => {
  for (const length of [5, 8]) for (const width of [2, 3]) {
    const cells = flashTiles(length, width).flatMap(tile => tile.cells)
    assert.equal(cells.length, length * (length + 1) / 2)
    assert.equal(new Set(cells.map(cell => `${cell.query}:${cell.key}`)).size, cells.length)
    assert.ok(cells.every(cell => cell.key <= cell.query && cell.query < length))
    for (let index = 0; index < flashTiles(length, width).length; index++) {
      const state = flashTileState(index, length, width)
      for (const row of state.rows) {
        assert.deepEqual(row.previousKeys, state.processed.filter(cell => cell.query === row.query).map(cell => cell.key))
        assert.ok(row.previousKeys.every(key => !row.currentKeys.includes(key)))
      }
    }
  }
  assert.deepEqual(flashTileState(2).rows.map(row => row.previousKeys), [[0, 1], [0, 1]])
})

test('stage frames identify noncausal numerator scope and row carry independently of selectors', () => {
  assert.equal(computeFrame(1).linear, true); assert.equal(computeFrame(2).linear, true)
  assert.equal(computeFrame(3).linear, false)
  assert.ok(computeFrame(4).flash.rows.every(row => row.previousKeys.length > 0))
  assert.equal(computeFrame(5).flash.index, 9)
  assert.throws(() => computeFrame(NaN)); assert.throws(() => computeFrame(0, { pattern: 'made-up' }))
  assert.throws(() => reachableKeys(sparseConnections(), 7, 0))
  assert.throws(() => featureProducts([[1]], [[1, 2]], [[1]]))
})

test('fractional playback uses the shared midpoint for labels, scenes and semantic scope', () => {
  for (let phase = 0; phase <= 5; phase += .01) {
    const frame = computeFrame(phase)
    assert.equal(frame.stage, stageForPhase(phase, 6))
    assert.equal(frame.linear, frame.stage === 1 || frame.stage === 2)
    assert.ok(frame.progress >= 0 && frame.progress <= 1)
    if (frame.stage === 4) {
      assert.equal(frame.flash.current.queryStart, 6)
      assert.ok(frame.flash.rows.every(row => row.previousKeys.length > 0))
    }
  }
  assert.equal(computeFrame(1.6).stage, 2)
  assert.equal(computeFrame(2.6).linear, false)
})
