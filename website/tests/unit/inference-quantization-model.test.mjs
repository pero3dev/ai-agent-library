import test from 'node:test'
import assert from 'node:assert/strict'
import { INFERENCE_QUANTIZATION_STAGES, INFERENCE_QUANTIZATION_TARGETS, inferenceQuantizationFrame } from '../../lib/inference-quantization-model.mjs'

const shape = frame => frame.regions.map(region => ({ id: region.id, x: region.x, samples: region.samples.map(({ occurrenceId, x, y, width, height, outlier }) => ({ occurrenceId, x, y, width, height, outlier })) }))

test('overview keeps all three targets at 16 bit and distinct fixed locations', () => {
  const frame = inferenceQuantizationFrame(0, { target: 'kv', bits: 4 })
  assert.equal(frame.effectiveBits, 16); assert.equal(frame.requestedBits, 4); assert.equal(frame.mixed, false)
  assert.deepEqual(frame.regions.map(region => region.id), ['weights', 'activations', 'kv'])
  assert.equal(new Set(frame.regions.map(region => region.x)).size, 3)
  assert.ok(frame.regions.flatMap(region => region.samples).every(sample => sample.bits === 16))
  assert.equal(frame.regions.filter(region => region.selected).length, 1)
})

test('bit choice changes only selected target and never moves values or outlier markers', () => {
  const baseline = shape(inferenceQuantizationFrame(0))
  for (const { id: target } of INFERENCE_QUANTIZATION_TARGETS) for (const bits of [16, 8, 4]) {
    const frame = inferenceQuantizationFrame(1, { target, bits })
    assert.deepEqual(shape(frame), baseline)
    for (const region of frame.regions) for (const sample of region.samples) assert.equal(sample.bits, region.id === target ? bits : 16)
    assert.equal(frame.representation.regularBits, bits); assert.equal(frame.representation.outlierBits, bits)
    assert.equal(frame.representation.unit, 'one-element'); assert.equal(frame.representation.metadataIncluded, false)
  }
})

test('mixed precision keeps only the selected outlier at 16 bit without claiming a quantizer', () => {
  const baseline = shape(inferenceQuantizationFrame(0))
  for (const { id: target } of INFERENCE_QUANTIZATION_TARGETS) for (const bits of [8, 4]) {
    const frame = inferenceQuantizationFrame(2, { target, bits }), selected = frame.regions.find(region => region.selected)
    assert.deepEqual(shape(frame), baseline); assert.equal(frame.mixed, true)
    assert.deepEqual(selected.samples.map(sample => sample.bits), [bits, bits, 16, bits])
    assert.deepEqual(selected.samples.filter(sample => sample.highPrecisionRetained).map(sample => sample.occurrenceId), [`${target}:value:2`])
    assert.equal(frame.representation.outlierBits, 16); assert.equal(frame.representation.quantizerSpecified, false)
    for (const region of frame.regions.filter(region => !region.selected)) assert.ok(region.samples.every(sample => sample.bits === 16 && !sample.highPrecisionRetained))
  }
  const unchanged = inferenceQuantizationFrame(2, { bits: 16 })
  assert.equal(unchanged.mixed, false); assert.ok(unchanged.regions.flatMap(region => region.samples).every(sample => !sample.highPrecisionRetained))
})

test('quality stage preserves the chosen representation but never manufactures measurements or a pass', () => {
  for (const target of ['weights', 'activations', 'kv']) for (const bits of [16, 8, 4]) {
    const frame = inferenceQuantizationFrame(3, { target, bits })
    assert.deepEqual(frame.regions, inferenceQuantizationFrame(2, { target, bits }).regions)
    assert.deepEqual(frame.validation, { required: true, executed: false, outcome: null })
    assert.equal(frame.actualCompressionRatio, null); assert.equal(frame.measuredSpeed, null); assert.equal(frame.measuredQuality, null)
    assert.equal(frame.dataKind, 'conceptual')
  }
})

test('midpoints and reverse seeks preserve stable appearances and bit-width stage contracts', () => {
  assert.equal(INFERENCE_QUANTIZATION_STAGES.length, 4)
  const options = { target: 'activations', bits: 4 }
  for (const phase of [0, .49, .5, 1, 1.49, 1.5, 2, 2.49, 2.5, 3, 2.49, 1.49, .49, 0]) {
    const first = inferenceQuantizationFrame(phase, options)
    assert.equal(first.stage, Math.round(phase))
    assert.deepEqual(shape(first), shape(inferenceQuantizationFrame(0)))
    assert.equal(first.effectiveBits, Math.round(phase) === 0 ? 16 : 4)
    assert.equal(first.mixed, Math.round(phase) >= 2)
    assert.deepEqual(first, inferenceQuantizationFrame(phase, options))
  }
})

test('invalid choices are rejected and returned data cannot mutate another frame', () => {
  for (const options of [null, [], { target: 'all' }, { target: '' }, { bits: 0 }, { bits: 32 }, { bits: '8' }, { bits: NaN }]) assert.throws(() => inferenceQuantizationFrame(1, options))
  for (const phase of [NaN, Infinity, '1']) assert.throws(() => inferenceQuantizationFrame(phase))
  const first = inferenceQuantizationFrame(2); first.regions[0].samples[0].bits = 99
  assert.equal(inferenceQuantizationFrame(2).regions[0].samples[0].bits, 8)
  assert.equal(inferenceQuantizationFrame(-1).stage, 0); assert.equal(inferenceQuantizationFrame(10).stage, 3)
})
