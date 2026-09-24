import test from 'node:test'
import assert from 'node:assert/strict'
import { stageForPhase } from '../../lib/reading-clock.mjs'
import { EXPERT_COUNT, DEFAULT_K, PRIMARY_EXPERTS, TOKEN_IDS, routingBatch } from '../../lib/moe-routing-model.mjs'
import { PARAMETER_STAGES, PARAMETER_CHECKS, PARAMETER_LAYOUTS, PARAMETER_GEOMETRY, parametersFrame } from '../../lib/moe-parameters-model.mjs'

const positions = frame => frame.experts.map(({ index, x, y, width, height }) => ({ index, x, y, width, height }))

test('all resident weights and their positions survive every stage and layout; only two experts are active', () => {
  const baseline = parametersFrame(0)
  assert.equal(EXPERT_COUNT, 8)
  assert.equal(DEFAULT_K, 2)
  assert.deepEqual(PRIMARY_EXPERTS, [1, 5])
  assert.equal(PARAMETER_STAGES.length, 6)
  for (const { id: layout } of PARAMETER_LAYOUTS) for (let stage = 0; stage < 6; stage++) {
    const frame = parametersFrame(stage, { layout })
    assert.deepEqual(positions(frame), positions(baseline))
    assert.deepEqual(positions(frame), PARAMETER_GEOMETRY.experts)
    assert.equal(frame.experts.filter(expert => expert.resident).length, 8)
    assert.deepEqual(frame.experts.filter(expert => expert.selected).map(expert => expert.index), [1, 5])
    assert.equal(frame.activeExpertCount, 2)
    assert.equal(frame.shared.kind, 'shared-part')
    assert.equal(frame.shared.resident, true)
    assert.equal(frame.shared.active, true)
    assert.deepEqual(frame.shared, baseline.shared)
    assert.deepEqual(frame.source, baseline.source)
    assert.deepEqual(frame.sum, baseline.sum)
    assert.equal(frame.transferredWeightCount, 0)
  }
})

test('distributed expert placement partitions the eight weights once and the selected pair is local plus remote', () => {
  const frame = parametersFrame(2)
  assert.deepEqual(frame.experts.map(expert => expert.device), [0, 0, 0, 0, 1, 1, 1, 1])
  assert.equal(new Set(frame.experts.map(expert => expert.index)).size, 8)
  assert.deepEqual(frame.routes.map(route => route.expertIndex), [1, 5])
  assert.deepEqual(frame.routes.map(route => route.remote), [false, true])
  assert.ok(parametersFrame(2, { layout: 'single' }).experts.every(expert => expert.device === 0))
  assert.equal(parametersFrame(0, { layout: 'single' }).layout, 'distributed')
  assert.equal(parametersFrame(1, { layout: 'single' }).showDevices, false)
})

test('only selected representations and results travel; return preserves token identity and original gate values', () => {
  for (const { id: layout } of PARAMETER_LAYOUTS) {
    const sent = parametersFrame(3, { layout }), returned = parametersFrame(4, { layout })
    assert.equal(sent.transfers.length, 2)
    assert.equal(returned.transfers.length, 2)
    assert.ok(sent.transfers.every(transfer => transfer.payload === 'representation' && transfer.direction === 'dispatch'))
    assert.ok(returned.transfers.every(transfer => transfer.payload === 'expert-output' && transfer.direction === 'return'))
    for (let index = 0; index < 2; index++) {
      const before = sent.transfers[index], after = returned.transfers[index]
      assert.equal(after.tokenId, before.tokenId)
      assert.equal(after.tokenId, returned.sum.tokenId)
      assert.equal(after.tokenId, TOKEN_IDS[0])
      assert.equal(after.expertIndex, before.expertIndex)
      assert.equal(after.sourceDevice, before.targetDevice)
      assert.equal(after.targetDevice, before.sourceDevice)
      assert.equal(sent.routes[index].weight, routingBatch().weights[0][before.expertIndex])
      assert.equal(returned.routes[index].weight, sent.routes[index].weight)
    }
    assert.equal(returned.sum.gateApplications, 1)
    assert.equal(sent.crossDeviceTransfers, layout === 'single' ? 0 : 1)
    assert.equal(returned.crossDeviceTransfers, layout === 'single' ? 0 : 1)
  }
})

test('every shared-clock midpoint aligns stage, payload and transfer direction, including reverse seeks', () => {
  const phases = [0, .4999, .5, 1, 1.4999, 1.5, 2, 2.4999, 2.5, 2.75, 3, 3.4999, 3.5, 3.75, 4, 4.4999, 4.5, 5]
  const forward = phases.map(phase => parametersFrame(0, { phase }))
  const backward = [...phases].reverse().map(phase => parametersFrame(0, { phase })).reverse()
  assert.deepEqual(forward, backward)
  for (const frame of forward) {
    assert.equal(frame.stage, stageForPhase(frame.phase, 6))
    assert.equal(frame.title, PARAMETER_STAGES[frame.stage].title)
    const direction = frame.stage === 3 ? 'dispatch' : frame.stage === 4 ? 'return' : null
    assert.equal(frame.direction, direction)
    assert.equal(frame.transfers.length, direction ? 2 : 0)
    for (const transfer of frame.transfers) {
      assert.equal(transfer.direction, direction)
      assert.ok(Number.isFinite(transfer.point.x) && Number.isFinite(transfer.point.y))
    }
  }
  const from = parametersFrame(3, { phase: 2.5 }).transfers[1].point
  const mid = parametersFrame(3).transfers[1].point
  const to = parametersFrame(3, { phase: 3.499999 }).transfers[1].point
  assert.deepEqual(from, { x: 160, y: 290 })
  assert.ok(mid.x > from.x && mid.x < to.x)
  const expert = PARAMETER_GEOMETRY.experts[PRIMARY_EXPERTS[1]]
  assert.ok(Math.abs(to.x - (expert.x + expert.width / 2)) < .001 && Math.abs(to.y - 220) < .001)
})

test('checks only change emphasis, keep the M1 batch, and never invent measurements or judgments', () => {
  const baseline = parametersFrame(5)
  for (const { id: check } of PARAMETER_CHECKS) {
    const frame = parametersFrame(5, { check })
    assert.equal(frame.check, check)
    assert.deepEqual(frame.experts, baseline.experts)
    assert.deepEqual(frame.routes, baseline.routes)
    assert.deepEqual(frame.loads, routingBatch().loads)
    assert.deepEqual(frame.experts.map(expert => expert.load), routingBatch().loads)
    assert.equal(frame.performanceMeasurement, null)
    assert.equal(frame.qualityJudgment, null)
    assert.equal(parametersFrame(3, { check }).check, null)
  }
  baseline.experts[0].x = 999
  baseline.loads[0] = 999
  baseline.routes[0].dispatchPoints[0][0] = 999
  const fresh = parametersFrame(5)
  assert.equal(fresh.experts[0].x, 28)
  assert.deepEqual(fresh.loads, routingBatch().loads)
  assert.equal(fresh.routes[0].dispatchPoints[0][0], 102)
})

test('invalid stages, selectors and phases fail closed', () => {
  for (const stage of [-1, 6, .5, NaN, '1']) assert.throws(() => parametersFrame(stage), RangeError)
  for (const options of [null, [], 'single']) assert.throws(() => parametersFrame(0, options), TypeError)
  for (const phase of [-1, 6, NaN, Infinity, '1']) assert.throws(() => parametersFrame(0, { phase }), RangeError)
  assert.throws(() => parametersFrame(2, { layout: 'unknown' }), RangeError)
  assert.throws(() => parametersFrame(5, { check: 'unknown' }), RangeError)
})
