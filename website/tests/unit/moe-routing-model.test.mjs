import test from 'node:test'
import assert from 'node:assert/strict'
import { BATCH_LOGITS, PRIMARY_EXPERTS, ROUTING_STAGES, capacityBatch, gateWeights, routeExpression, routingBatch, routingFrame, topIndices } from '../../lib/moe-routing-model.mjs'
import { stageForPhase } from '../../lib/reading-clock.mjs'

test('gate probabilities are stable; top-k keeps original unnormalized selected coefficients', () => {
  assert.deepEqual(gateWeights([1000, 1000]), [.5, .5])
  const batch = routingBatch()
  batch.weights.forEach((row, token) => {
    assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-12)
    assert.ok(row.every(value => value > 0 && value < 1))
    assert.deepEqual(row, gateWeights(BATCH_LOGITS[token]))
    assert.equal(batch.counts[token], 2)
  })
  assert.deepEqual(topIndices(batch.weights[0], 2), PRIMARY_EXPERTS)
  const frame = routingFrame(2)
  assert.ok(frame.selectedWeightSum < 1)
  assert.deepEqual(frame.terms.map(term => term.weight), PRIMARY_EXPERTS.map(index => batch.weights[0][index]))
  assert.deepEqual(topIndices([4, 4, 3], 2), [0, 1])
})

test('expert choice changes selection axis, not scores, and gives variable per-token counts', () => {
  const token = routingBatch(), expert = routingBatch('expert')
  assert.deepEqual(expert.weights, token.weights)
  assert.deepEqual(token.loads, [0, 4, 1, 0, 0, 3, 0, 0])
  assert.deepEqual(expert.loads, Array(8).fill(1))
  assert.ok(new Set(expert.counts).size > 1)
  assert.equal(expert.counts.reduce((sum, count) => sum + count, 0), 8)
  expert.mask.forEach((row, tokenIndex) => row.forEach((selected, expertIndex) => {
    if (selected) assert.equal(expert.weights[tokenIndex][expertIndex], Math.max(...expert.weights.map(weights => weights[expertIndex])))
  }))
})

test('the same capacity-limited batch includes accepted, partly dropped and residual-only tokens', () => {
  const batch = capacityBatch()
  assert.deepEqual(batch.accepted.map(row => row.flatMap((value, index) => value ? [index] : [])), [[1, 5], [2], [], []])
  assert.deepEqual(batch.acceptedLoads, [0, 1, 1, 0, 0, 1, 0, 0])
  assert.deepEqual(batch.dropped.map(row => row.filter(Boolean).length), [0, 1, 2, 2])
  for (const token of [0, 1, 2]) {
    const frame = routingFrame(6, { token })
    assert.equal(frame.terms.filter(term => term.kind === 'residual').length, 1)
    assert.equal(frame.terms.filter(term => term.kind === 'expert').length, 2 - token)
    frame.terms.filter(term => term.kind === 'expert').forEach(term => assert.equal(term.weight, batch.weights[token][term.expert]))
  }
  assert.deepEqual(routingFrame(6, { token: 2 }).terms, [{ kind: 'residual', tokenId: 'C' }])
  assert.deepEqual(capacityBatch(4).accepted, routingBatch().mask)
  assert.ok(capacityBatch(0).accepted.flat().every(value => !value))
})

test('auxiliary objective does not redistribute the batch; fractional labels and choices use one clock', () => {
  assert.deepEqual(routingFrame(7, { choice: 'expert' }).batch, routingFrame(5).batch)
  for (let phase = 0; phase <= 7; phase += .07) {
    const frame = routingFrame(phase, { choice: 'expert', token: 2 })
    assert.equal(frame.stage, stageForPhase(phase, ROUTING_STAGES.length))
    assert.equal(frame.choice, frame.stage === 4 ? 'expert' : 'token')
    assert.equal(frame.selectedToken, frame.stage === 6 ? 2 : 0)
  }
  assert.equal(routingFrame(-1).stage, 0)
  assert.equal(routingFrame(10).stage, 7)
  assert.throws(() => routingFrame(NaN))
  assert.throws(() => routingFrame(6, { token: 4 }))
  assert.throws(() => routingBatch('invalid'))
  assert.throws(() => gateWeights([Infinity]))
  assert.throws(() => topIndices([1], 2))
  assert.throws(() => capacityBatch(-1))
  assert.deepEqual(routeExpression([.2, .8], [false, true], 'A'), [{ kind: 'expert', expert: 1, weight: .8, tokenId: 'A' }])
})
