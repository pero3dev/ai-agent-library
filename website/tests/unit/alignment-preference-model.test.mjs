import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALIGNMENT_PREFERENCE_STAGES, ALIGNMENT_PREFERENCE_FIXTURE, PREFERENCE_BETA_VALUES,
  bradleyTerryTerms, dpoPairTerms, alignmentPreferenceFrame
} from '../../lib/alignment-preference-model.mjs'

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`)
// Literal fractions and closed forms are independent of the exported production fixture.
const pair = (beta = 1) => ({ beta,
  winner: { inputId: 'x-0', policyProbability: 1 / 2, referenceProbability: 1 / 4 },
  loser: { inputId: 'x-0', policyProbability: 1 / 8, referenceProbability: 1 / 4 }
})

test('Bradley–Terry fixed scores produce three quarters, separately from implicit reward', () => {
  const result = bradleyTerryTerms(Math.log(3), 0)
  near(result.margin, Math.log(3))
  near(result.probability, 3 / 4)
  assert.ok(result.probability > 0 && result.probability < 1)
  const frame = alignmentPreferenceFrame(2)
  near(frame.explicitReward.probability, 3 / 4)
  assert.equal(frame.explicitAndImplicitExamplesIdentical, false)
  assert.notEqual(frame.explicitReward.margin, frame.pair.margin)
})

test('Bradley–Terry respects ties, sign reversal and a common score shift', () => {
  near(bradleyTerryTerms(3, 3).probability, 1 / 2)
  near(bradleyTerryTerms(0, Math.log(3)).probability, 1 / 4)
  near(bradleyTerryTerms(100 + Math.log(3), 100).probability, 3 / 4)
})

test('Bradley–Terry avoids exponential overflow and explicitly permits floating-point 0/1 tails', () => {
  assert.equal(bradleyTerryTerms(1000, 0).probability, 1)
  assert.equal(bradleyTerryTerms(-1000, 0).probability, 0)
  for (const value of ['1', null, undefined, {}, 1n]) assert.throws(() => bradleyTerryTerms(value, 0), TypeError)
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => bradleyTerryTerms(value, 0), RangeError)
  assert.throws(() => bradleyTerryTerms(Number.MAX_VALUE, -Number.MAX_VALUE), RangeError)
})

test('DPO beta one half has margin ln 2, preference 2/3 and one-pair loss ln(3/2)', () => {
  const result = dpoPairTerms(pair(.5))
  near(result.margin, Math.log(2))
  near(result.preferenceProbability, 2 / 3)
  near(result.pairLoss, Math.log(3 / 2))
})

test('DPO beta one has margin ln 4, preference 4/5 and one-pair loss ln(5/4)', () => {
  const result = dpoPairTerms(pair(1))
  near(result.margin, Math.log(4))
  near(result.preferenceProbability, 4 / 5)
  near(result.pairLoss, Math.log(5 / 4))
})

test('DPO beta two has margin ln 16, preference 16/17 and one-pair loss ln(17/16)', () => {
  const result = dpoPairTerms(pair(2))
  near(result.margin, Math.log(16))
  near(result.preferenceProbability, 16 / 17)
  near(result.pairLoss, Math.log(17 / 16))
})

test('DPO row ratios use conditional probabilities; common same-x normalizer cancels without its value', () => {
  const result = dpoPairTerms(pair())
  assert.deepEqual(result.rows.map(row => row.responseId), ['y-w', 'y-l'])
  assert.deepEqual(result.rows.map(row => row.ratio), [2, .5])
  near(result.rows[0].logRatio, Math.log(2))
  near(result.rows[1].logRatio, -Math.log(2))
  assert.equal(result.sameInput, true)
  assert.equal(result.normalizerCancels, true)
  assert.equal(result.normalizerValue, null)
  assert.equal(result.inputId, 'x-0')
  for (const x of ['x-other', ' x-0']) {
    const input = pair()
    input.loser.inputId = x
    assert.throws(() => dpoPairTerms(input), RangeError)
  }
})

test('DPO rejects bad probabilities, excess mass, malformed rows and missing conditioning', () => {
  for (const rowName of ['winner', 'loser']) {
    for (const key of ['policyProbability', 'referenceProbability']) {
      for (const value of [0, -0, -.1, 1.1, NaN, Infinity, -Infinity]) {
        const input = pair(); input[rowName][key] = value
        assert.throws(() => dpoPairTerms(input), RangeError)
      }
      for (const value of ['.5', null, undefined, true]) {
        const input = pair(); input[rowName][key] = value
        assert.throws(() => dpoPairTerms(input), TypeError)
      }
    }
    for (const value of ['', '   ']) {
      const input = pair(); input[rowName].inputId = value
      assert.throws(() => dpoPairTerms(input), RangeError)
    }
    for (const value of [0, null, undefined]) {
      const input = pair(); input[rowName].inputId = value
      assert.throws(() => dpoPairTerms(input), TypeError)
    }
    for (const value of [null, [], new Date(), 'row']) {
      const input = pair(); input[rowName] = value
      assert.throws(() => dpoPairTerms(input), TypeError)
    }
  }
  for (const key of ['policyProbability', 'referenceProbability']) {
    const input = pair(); input.winner[key] = .75; input.loser[key] = .5
    assert.throws(() => dpoPairTerms(input), RangeError)
  }
  const extra = pair(); extra.winner.otherInput = 'x-other'
  assert.throws(() => dpoPairTerms(extra), TypeError)
  for (const input of [null, undefined, [], 1, { ...pair(), extra: 1 }]) assert.throws(() => dpoPairTerms(input), TypeError)
})

test('DPO validates positive finite beta and finite derived terms without clamping', () => {
  for (const beta of ['1', null, true]) assert.throws(() => dpoPairTerms(pair(beta)), TypeError)
  assert.throws(() => dpoPairTerms({ ...pair(), beta: undefined }), TypeError)
  // The default in pair() is convenient for fixtures; test an explicit missing beta separately.
  const missing = pair(); delete missing.beta
  assert.throws(() => dpoPairTerms(missing), TypeError)
  for (const beta of [0, -1, NaN, Infinity]) assert.throws(() => dpoPairTerms(pair(beta)), RangeError)
  assert.throws(() => dpoPairTerms(pair(Number.MAX_VALUE)), RangeError)
})

test('a probability quotient may overflow while log-based DPO arithmetic stays finite', () => {
  const input = { beta: 1,
    winner: { inputId: 'extreme', policyProbability: .5, referenceProbability: Number.MIN_VALUE },
    loser: { inputId: 'extreme', policyProbability: .25, referenceProbability: .25 }
  }
  const result = dpoPairTerms(input)
  assert.equal(result.rows[0].ratio, null)
  assert.equal(result.rows[0].ratioRepresentable, false)
  assert.ok(Number.isFinite(result.margin) && Number.isFinite(result.pairLoss))
  const reverse = dpoPairTerms({ ...input, winner: input.loser, loser: input.winner })
  near(reverse.margin, -result.margin)
  assert.ok(Number.isFinite(reverse.pairLoss) && reverse.pairLoss > 700)
})

test('policy equal to reference gives ln 2 pair loss; swapping responses reverses the margin', () => {
  const input = pair()
  input.winner.policyProbability = input.winner.referenceProbability
  input.loser.policyProbability = input.loser.referenceProbability
  const tie = dpoPairTerms(input)
  near(tie.margin, 0); near(tie.preferenceProbability, .5); near(tie.pairLoss, Math.log(2))
  const original = dpoPairTerms(pair()), reversed = dpoPairTerms({ ...pair(), winner: pair().loser, loser: pair().winner })
  near(reversed.margin, -original.margin)
  near(reversed.preferenceProbability, 1 / 5)
  near(reversed.pairLoss, Math.log(5))
})

test('all stages retain separate routes, stable pair IDs, unknown full KL and limits of numerical display', () => {
  assert.deepEqual(ALIGNMENT_PREFERENCE_STAGES.map(s => s.label), ['全体', '選好ペア', '報酬差', '報酬とKL', '正則化', '暗黙の報酬', 'DPO損失'])
  for (let stage = 0; stage < 7; stage++) {
    const f = alignmentPreferenceFrame(stage)
    assert.equal(f.fixtureId, 'alignment-fixed-pair-v1')
    assert.equal(f.inputId, 'x-0')
    assert.deepEqual(f.responseIds, ['y-w', 'y-l'])
    assert.deepEqual(f.routes.map(r => r.nodes), [['preference', 'reward-model', 'policy'], ['preference', 'policy']])
    assert.equal(f.referencePolicyId, 'pi-ref'); assert.equal(f.referenceFixed, true)
    for (const key of ['normalizerValue', 'expectedReward', 'klDivergence', 'rlhfObjective', 'optimizerResult']) assert.equal(f[key], null)
    for (const key of ['empiricalMeasurement', 'trainingTrajectory', 'guaranteedUpdateMonotonicity', 'guaranteedQualityImprovement', 'preferenceIsCorrectnessGuarantee']) assert.equal(f[key], false)
    assert.equal(f.objectiveOperator, 'minus')
    assert.equal(f.lossScope, 'one-pair'); assert.equal(f.dpoAggregation, 'expectation')
    assert.equal(f.otherResponseMass.klComputable, false)
    assert.equal(f.otherResponseMass.individualProbabilities, null)
    near(f.otherResponseMass.policy, 3 / 8); near(f.otherResponseMass.reference, 1 / 2)
    assert.deepEqual(f.normalizerTerms.map(t => [t.termId, t.inputId, t.value, t.cancelled]), [['z-x-0', 'x-0', null, stage === 6], ['z-x-0', 'x-0', null, stage === 6]])
  }
})

test('beta only changes the active stages and never changes policy or reference distributions', () => {
  assert.deepEqual(PREFERENCE_BETA_VALUES, [.5, 1, 2])
  for (const beta of [.5, 1, 2]) {
    for (let stage = 0; stage < 4; stage++) assert.deepEqual(alignmentPreferenceFrame(stage, { beta }), alignmentPreferenceFrame(stage))
    for (const stage of [4, 5, 6]) {
      const frame = alignmentPreferenceFrame(stage, { beta })
      assert.equal(frame.effectiveBeta, beta)
      assert.deepEqual(frame.rows.map(r => [r.policyProbability, r.referenceProbability, r.ratio]), [[.5, .25, 2], [.125, .25, .5]])
      near(frame.rows[0].weightedLogRatio, beta * Math.log(2))
      near(frame.rows[1].weightedLogRatio, -beta * Math.log(2))
    }
  }
})

test('every midpoint uses the shared stage rule, in both traversal directions', () => {
  const phases = [0, ...[0, 1, 2, 3, 4, 5].flatMap(k => [k + .49, k + .5, k + .51]), 6]
  const forward = phases.map(phase => alignmentPreferenceFrame(phase, { beta: 2 }))
  for (let n = phases.length - 1; n >= 0; n--) {
    const result = alignmentPreferenceFrame(phases[n], { beta: 2 })
    assert.deepEqual(result, forward[n])
    assert.equal(result.stage, Math.round(phases[n]))
    const { phase, progress, ...meaning } = result
    const { phase: integerPhase, progress: integerProgress, ...integerMeaning } = alignmentPreferenceFrame(Math.round(phases[n]), { beta: 2 })
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(integerPhase, Math.round(phase))
    assert.equal(integerProgress, integerPhase === 0 ? 0 : integerPhase === 6 ? 1 : .5)
    assert.ok(progress >= 0 && progress <= 1)
  }
  assert.equal(alignmentPreferenceFrame(.5).progress, 0)
  assert.equal(alignmentPreferenceFrame(1).progress, .5)
  assert.equal(alignmentPreferenceFrame(6).progress, 1)
})

test('invalid phase/options fail and finite out-of-range phase clamps without coercion', () => {
  for (const phase of [null, undefined, '2', NaN, Infinity, -Infinity]) assert.throws(() => alignmentPreferenceFrame(phase), TypeError)
  for (const settings of [null, [], new Date(), 1, '1', Object.create({ beta: 1 }), { extra: 1 }, { [Symbol('beta')]: 1 }]) assert.throws(() => alignmentPreferenceFrame(0, settings), TypeError)
  for (const beta of [null, undefined, '1', true]) assert.throws(() => alignmentPreferenceFrame(4, { beta }), TypeError)
  for (const beta of [0, -.5, 1.5, NaN, Infinity]) assert.throws(() => alignmentPreferenceFrame(4, { beta }), RangeError)
  assert.deepEqual(alignmentPreferenceFrame(-3), alignmentPreferenceFrame(0))
  assert.deepEqual(alignmentPreferenceFrame(9), alignmentPreferenceFrame(6))
})

test('frames and helper outputs are fresh; constants and caller-owned inputs remain untouched', () => {
  const options = Object.freeze({ beta: 2 }), expected = alignmentPreferenceFrame(6, options), changed = alignmentPreferenceFrame(6, options)
  changed.rows[0].ratio = 400
  changed.routes[0].nodes.pop()
  changed.normalizerTerms[0].value = 99
  changed.otherResponseMass.policy = .99
  changed.explicitReward.winner = 42
  changed.responseIds.pop()
  assert.deepEqual(alignmentPreferenceFrame(6, options), expected)
  const input = pair(), snapshot = structuredClone(input)
  dpoPairTerms(input).rows[0].policyProbability = .9
  assert.deepEqual(input, snapshot)
  const frozen = value => !value || typeof value !== 'object' || (Object.isFrozen(value) && Object.values(value).every(frozen))
  assert.ok(frozen(ALIGNMENT_PREFERENCE_FIXTURE))
  assert.ok(frozen(ALIGNMENT_PREFERENCE_STAGES))
})
