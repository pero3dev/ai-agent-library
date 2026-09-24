import test from 'node:test'
import assert from 'node:assert/strict'
import { IO_STAGES, ioFrame, embeddingCell, outputWeightCell } from '../../lib/transformer-io-model.mjs'

test('input lookup and output projection retain their distinct symbolic shapes', () => {
  const frame = ioFrame(1)
  assert.deepEqual(frame.shapes.embedding, ['V', 'd'])
  assert.deepEqual(frame.shapes.outputWeight, ['d', 'V'])
  assert.deepEqual(frame.shapes.input, ['d'])
  assert.deepEqual(frame.shapes.hidden, ['d'])
  assert.deepEqual(frame.shapes.logits, ['V'])
  assert.deepEqual(frame.shapes.probabilities, ['V'])
  assert.equal(frame.symbols.tokenId, 'id_t')
})

test('tying preserves asymmetric cell identity by transposing, without an inverse', () => {
  assert.equal(outputWeightCell(2, 5, 'tied'), 'E[5,2]')
  assert.equal(outputWeightCell('j', 'id_t', 'tied'), embeddingCell('id_t', 'j'))
  assert.notEqual(outputWeightCell(2, 5, 'untied'), embeddingCell(5, 2))
  assert.equal(outputWeightCell(2, 5, 'untied'), 'W_U[2,5]')
})

test('all stages retain blocks, final normalization and next-token distribution', () => {
  for (let stage = 0; stage < IO_STAGES.length; stage++) {
    const frame = ioFrame(stage)
    assert.ok(frame.path.indexOf('blocks') < frame.path.indexOf('final-norm'))
    assert.ok(frame.path.indexOf('final-norm') < frame.path.indexOf('hidden'))
    assert.ok(frame.path.indexOf('hidden') < frame.path.indexOf('output-weight'))
    assert.ok(frame.path.indexOf('logits') < frame.path.indexOf('softmax'))
    assert.equal(frame.path.at(-1), 'probabilities')
    assert.equal(frame.kind, 'symbolic')
    assert.equal(Object.hasOwn(frame, 'prediction'), false)
    assert.equal(Object.hasOwn(frame, 'probabilityValues'), false)
  }
})

test('switching weight sharing changes identity without changing shapes or input', () => {
  const tied = ioFrame(3), separate = ioFrame(3, { tying: 'untied' })
  assert.equal(tied.weights.sharedWithEmbedding, true)
  assert.equal(separate.weights.sharedWithEmbedding, false)
  assert.equal(tied.weights.headSymbol, 'Eᵀ')
  assert.equal(separate.weights.headSymbol, 'W_U')
  assert.deepEqual(tied.shapes, separate.shapes)
  assert.deepEqual(tied.symbols, separate.symbols)
  assert.match(separate.detail, /独立/)
})

test('symbolic shape constants cannot be altered through a returned frame', () => {
  assert.throws(() => { ioFrame(0).shapes.embedding[0] = 'n' }, TypeError)
  const frame = ioFrame(0)
  frame.activeNodes.length = 0
  assert.ok(ioFrame(0).activeNodes.length > 0)
})

test('invalid stages, options and cell indices are rejected', () => {
  for (const stage of [-1, 4, 0.5, NaN, Infinity, '1', undefined]) assert.throws(() => ioFrame(stage), RangeError)
  for (const options of [null, [], 'tied']) assert.throws(() => ioFrame(0, options), TypeError)
  assert.throws(() => ioFrame(0, { tying: 'inverse' }), RangeError)
  assert.throws(() => outputWeightCell(1, 2, 'inverse'), RangeError)
  for (const invalid of [0, -1, 0.5, NaN, Infinity, '', {}, undefined]) assert.throws(() => embeddingCell(invalid, 1), TypeError)
})
