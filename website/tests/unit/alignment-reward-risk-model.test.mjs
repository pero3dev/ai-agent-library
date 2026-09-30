import test from 'node:test'
import assert from 'node:assert/strict'
import { ALIGNMENT_REWARD_RISK_STAGES, alignmentRewardRiskFrame as frame } from '../../lib/alignment-reward-risk-model.mjs'

test('risk stages use the reading midpoint in either seek direction', () => {
  assert.deepEqual(ALIGNMENT_REWARD_RISK_STAGES.map(stage => stage.label), ['代理と目的', '過剰最適化', '正則化と再評価'])
  const cases = [[-3, 0], [0, 0], [.49, 0], [.5, 1], [.51, 1], [1, 1], [1.49, 1], [1.5, 2], [1.51, 2], [2, 2], [8, 2]]
  for (const [phase, expected] of [...cases, ...cases.toReversed()]) {
    const result = frame(phase)
    assert.equal(result.stage, expected)
    assert.equal(result.stageLabel, ALIGNMENT_REWARD_RISK_STAGES[expected].label)
    assert.ok(result.progress >= 0 && result.progress <= 1)
    assert.equal(result.proxyEmphasis, expected === 1)
    assert.equal(result.constraint, expected === 2 ? 'KL' : null)
    assert.equal(result.reassessment, expected === 2)
  }
  assert.equal(frame(.5).progress, 0)
  assert.equal(frame(1).progress, .5)
  assert.equal(frame(2).progress, 1)
})

test('same output is assessed through two distinct unknown-valued lanes', () => {
  for (const phase of [0, .5, 1, 1.5, 2]) {
    const result = frame(phase)
    assert.equal(result.outputId, 'answer-0')
    assert.equal(result.policyId, 'pi-theta')
    assert.equal(result.referencePolicyId, 'pi-ref')
    assert.deepEqual(result.lanes.map(({ id, kind, value }) => ({ id, kind, value })), [
      { id: 'proxy', kind: 'learned-reward-model', value: null },
      { id: 'quality', kind: 'separate-assessment', value: null }
    ])
    assert.equal(result.lanes[1].groundTruthAccess, false)
    assert.deepEqual(result.symptoms, ['verbosity', 'appearance'])
    for (const key of ['curve', 'turningPoint', 'optimum']) assert.equal(result[key], null)
    for (const key of ['empiricalMeasurement', 'safetyGuarantee']) assert.equal(result[key], false)
  }
})

test('risk frames are deterministic and caller mutations cannot change subsequent results', () => {
  const expected = frame(2), changed = frame(2)
  changed.lanes[0].value = 100
  changed.lanes[1].groundTruthAccess = true
  changed.symptoms.push('fabricated')
  assert.deepEqual(frame(2), expected)
  assert.deepEqual(frame(0, Object.create(null)), frame(0))
})

test('risk rejects invalid phases, non-plain options and all option keys', () => {
  for (const phase of [null, undefined, '1', NaN, Infinity, -Infinity, {}, []]) assert.throws(() => frame(phase), TypeError)
  for (const options of [null, 1, false, '', [], new Date(), Object.create({})]) assert.throws(() => frame(0, options), TypeError)
  for (const options of [{ beta: 1 }, { stage: 2 }, { [Symbol('x')]: 1 }, Object.defineProperty({}, 'hidden', { value: 1 })]) assert.throws(() => frame(0, options), RangeError)
})
