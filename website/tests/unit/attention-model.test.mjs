import test from 'node:test'
import assert from 'node:assert/strict'
import { ATTENTION_SAMPLE, createAttentionSample, matrixMultiply, rowSoftmax } from '../../lib/attention-model.mjs'

function approximately(actual, expected, message = '') {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${message}: expected ${expected}, received ${actual}`)
}

test('a hand-computable two-token head gives the expected causal output', () => {
  const result = createAttentionSample({
    input: [[1, 0], [0, 1]],
    WQ: [[1], [2]],
    WK: [[0], [Math.log(3) / 2]],
    WV: [[2, -1], [6, 3]]
  })
  assert.deepEqual(result.Q, [[1], [2]])
  assert.deepEqual(result.V, [[2, -1], [6, 3]])
  assert.deepEqual(result.weights[0], [1, 0])
  assert.deepEqual(result.output[0], [2, -1])
  approximately(result.weights[1][0], 0.25)
  approximately(result.weights[1][1], 0.75)
  approximately(result.output[1][0], 5)
  approximately(result.output[1][1], 2)
})

test('dot products are scaled by the square root of the key dimension', () => {
  const sample = createAttentionSample({ input: [[2, 3]], WQ: [[1, 0], [0, 1]], WK: [[1, 0], [0, 1]], WV: [[1], [1]] })
  assert.equal(sample.scores[0][0], 13)
  approximately(sample.scaledScores[0][0], 13 / Math.sqrt(2))
  assert.deepEqual(sample.output, [[5]])
})

test('each teaching-model row is finite, normalized and strictly causal', () => {
  const sample = ATTENTION_SAMPLE
  assert.equal(sample.tokenCount, 4)
  assert.equal(sample.keyDimension, 3)
  assert.equal(sample.valueDimension, 3)
  for (let query = 0; query < sample.tokenCount; query++) {
    approximately(sample.weights[query].reduce((sum, value) => sum + value, 0), 1, `row ${query}`)
    for (let key = 0; key < sample.tokenCount; key++) {
      assert.ok(Number.isFinite(sample.weights[query][key]))
      assert.ok(sample.weights[query][key] >= 0)
      if (key > query) {
        assert.equal(sample.maskedScores[query][key], -Infinity)
        assert.equal(sample.weights[query][key], 0)
      } else {
        assert.ok(Number.isFinite(sample.maskedScores[query][key]))
      }
    }
    assert.ok(sample.output[query].every(Number.isFinite))
  }
})

test('each output component equals the weighted sum of value vectors', () => {
  const { weights, V, output } = ATTENTION_SAMPLE
  for (let row = 0; row < output.length; row++) {
    for (let component = 0; component < output[row].length; component++) {
      const expected = V.reduce((sum, value, key) => sum + weights[row][key] * value[component], 0)
      approximately(output[row][component], expected)
    }
  }
})

test('changing a future input cannot affect earlier outputs', () => {
  const { input, WQ, WK, WV } = ATTENTION_SAMPLE
  const changed = input.map(row => [...row])
  changed[3] = [20, -10, 15, 8]
  const result = createAttentionSample({ input: changed, WQ, WK, WV })
  assert.deepEqual(result.output.slice(0, 3), ATTENTION_SAMPLE.output.slice(0, 3))
  assert.notDeepEqual(result.output[3], ATTENTION_SAMPLE.output[3])
})

test('softmax is stable for large scores and masked entries remain exact zero', () => {
  assert.deepEqual(rowSoftmax([1000, -Infinity, 1000]), [0.5, 0, 0.5])
  assert.deepEqual(rowSoftmax([-1000, -1000]), [0.5, 0.5])
  assert.deepEqual(rowSoftmax([-Infinity, 1000]), [0, 1])
  assert.deepEqual(rowSoftmax([-Number.MAX_VALUE, Number.MAX_VALUE]), [0, 1])
})

test('matrix multiplication handles signed, rectangular inputs', () => {
  assert.deepEqual(matrixMultiply([[1, 2, -1], [0, 3, 2]], [[2, 1], [1, 0], [3, -2]]), [[1, 3], [9, -4]])
})

test('invalid matrices, incompatible projections and undefined softmax are rejected', () => {
  for (const invalid of [undefined, [], [[]], [[1], [1, 2]], [[NaN]], [[Infinity]], [['1']], new Array(2)]) {
    assert.throws(() => matrixMultiply(invalid, [[1]]), TypeError)
  }
  assert.throws(() => matrixMultiply([[1, 2]], [[1]]), RangeError)
  assert.throws(() => matrixMultiply([[Number.MAX_VALUE]], [[2]]), RangeError)
  for (const invalid of [[], [NaN], [Infinity], ['1'], [undefined], new Array(2)]) {
    assert.throws(() => rowSoftmax(invalid), TypeError)
  }
  assert.throws(() => rowSoftmax([-Infinity, -Infinity]), RangeError)
  assert.throws(() => createAttentionSample(), TypeError)
  assert.throws(() => createAttentionSample({ input: [[1, 2]], WQ: [[1]], WK: [[1]], WV: [[1]] }), RangeError)
  assert.throws(() => createAttentionSample({ input: [[1]], WQ: [[1, 2]], WK: [[1]], WV: [[1]] }), RangeError)
})

test('caller mutations do not change the recorded trace and the shared sample is immutable', () => {
  const input = [[2]]
  const WQ = [[3]]
  const result = createAttentionSample({ input, WQ, WK: [[4]], WV: [[5]] })
  input[0][0] = 100
  WQ[0][0] = 100
  assert.deepEqual(result.input, [[2]])
  assert.deepEqual(result.WQ, [[3]])
  assert.deepEqual(result.Q, [[6]])
  assert.ok(Object.isFrozen(ATTENTION_SAMPLE))
  assert.ok(Object.isFrozen(ATTENTION_SAMPLE.weights[0]))
})
