import test from 'node:test'
import assert from 'node:assert/strict'
import { BLOCK_STAGES, blockFrame, blockWeights, parameterTerms, residualPaths } from '../../lib/transformer-block-model.mjs'

test('head projections use all of X and preserve total width for different head counts', () => {
  const frame = blockFrame(0)
  assert.equal(frame.projection.source, 'full-X')
  for (const [d, h] of [[768, 12], [1024, 16], [64, 1]]) {
    const dimensions = { d, h, 'd/h': d / h }
    const heads = dimensions[frame.projection.headCount]
    const perHeadProjection = dimensions[frame.projection.inputWidth] * dimensions[frame.projection.headWidth]
    assert.equal(heads * perHeadProjection, d * d)
    assert.equal(heads * dimensions[frame.projection.headWidth], dimensions[frame.projection.concatenatedWidth])
    assert.equal(3 * heads * perHeadProjection + d * d, parameterTerms().attention * d * d)
  }
})

test('counting returns to the basic two-layer FFN after the gated view', () => {
  assert.deepEqual(blockFrame(3).weights.filter(item => item.family === 'ffn').map(item => item.id), ['1', '2', '3'])
  assert.equal(blockFrame(3).ffn.product, 'elementwise-real')
  const count = blockFrame(7)
  assert.equal(count.gated, false)
  assert.deepEqual(count.weights.filter(item => item.family === 'ffn').map(item => item.id), ['1', '2'])
  for (const d of [64, 768, 4096]) {
    const actualAttention = 4 * d * d
    const actualFfn = d * (4 * d) + (4 * d) * d
    assert.equal(count.parameters.layer * d ** 2, actualAttention + actualFfn)
    assert.equal(actualFfn / (actualAttention + actualFfn), 2 / 3)
  }
  assert.ok(blockWeights(true).filter(item => item.family === 'ffn').every(item => item.coefficient === null))
})

test('vocabulary sharing counts one matrix without altering L-layer terms', () => {
  const tied = parameterTerms('tied'), untied = parameterTerms('untied')
  const [L, d, V] = [12, 768, 50000]
  const shared = L * tied.layer * d ** 2 + tied.vocabulary * V * d
  const separate = L * untied.layer * d ** 2 + untied.vocabulary * V * d
  assert.equal(separate - shared, V * d)
  assert.equal(tied.layer, untied.layer)
  assert.equal(tied.approximate, true)
  assert.match(tied.omitted, /バイアス・Norm/)
})

test('both sublayers preserve the residual addition and separate norm placement', () => {
  for (const mode of ['pre', 'post']) {
    const paths = residualPaths(mode)
    assert.deepEqual(paths.map(item => item.sublayer), ['Attention', 'FFN'])
    for (const path of paths) {
      assert.deepEqual(path.residual, ['input', 'add'])
      assert.equal(path.branch.includes('Norm'), mode === 'pre')
      assert.equal(path.output.includes('Norm'), mode === 'post')
    }
  }
  assert.equal(blockFrame(4, { placement: 'post' }).placement, 'pre')
  assert.equal(blockFrame(6, { placement: 'post' }).placement, 'post')
  for (let index = 0; index < BLOCK_STAGES.length; index++) {
    assert.equal(blockFrame(index).ffn.mixesPositions, false)
    assert.equal(blockFrame(index).ffn.sharesWeightsAcrossPositions, true)
  }
})

test('invalid stages and selectors are rejected', () => {
  for (const value of [-1, 9, 1.5, NaN, Infinity, '2']) assert.throws(() => blockFrame(value), RangeError)
  for (const options of [{ head: '4' }, { placement: 'middle' }, { tying: 'maybe' }]) assert.throws(() => blockFrame(0, options), RangeError)
})
