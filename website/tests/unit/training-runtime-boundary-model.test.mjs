import test from 'node:test'
import assert from 'node:assert/strict'
import { TRAINING_RUNTIME_STAGES, trainingRuntimeFrame } from '../../lib/training-runtime-boundary-model.mjs'

const comparisonContent = frame => frame.traits.map(({ id, label, checks }) => ({ id, label, checks }))
const boundaryContent = frame => frame.boundaryNodes.map(({ id, owner, focus }) => ({ id, owner, focus }))

test('an operation candidate must pass an external permission check before execution and result verification', () => {
  const expectedRoute = ['model-candidate', 'permission-check', 'operation', 'result-verification']
  const expectedEdges = [
    { source: 'model-candidate', target: 'permission-check', meaning: 'candidate-only' },
    { source: 'permission-check', target: 'operation', meaning: 'only-if-authorized' },
    { source: 'operation', target: 'result-verification', meaning: 'check-result' }
  ]
  for (let stage = 0; stage < 4; stage++) {
    const frame = trainingRuntimeFrame(stage)
    assert.deepEqual(frame.outputRoute, expectedRoute)
    assert.deepEqual(frame.outputEdges, expectedEdges)
    assert.deepEqual(frame.boundaryNodes.map(({ id, owner }) => [id, owner]), [
      ['model-candidate', 'model'], ['permission-check', 'outside-model'], ['operation', 'outside-model'], ['result-verification', 'outside-model']
    ])
    assert.equal(frame.permissionNode, 'outside-model')
    assert.equal(frame.refusalIsPermissionBoundary, false)
    assert.equal(frame.promptEnforcesExecution, false)
    assert.equal(frame.operationExecuted, false)
    assert.equal(frame.judgment, null)
  }
})

test('learning associations do not assert sole causes, identical objectives, or measured mitigation effects', () => {
  for (let stage = 0; stage < 4; stage++) {
    const frame = trainingRuntimeFrame(stage)
    assert.deepEqual(frame.associations.map(edge => edge.source), ['pretraining', 'sft', 'preference'])
    assert.ok(frame.associations.every(edge => edge.kind === 'association' && edge.target === 'learned-tendencies' && edge.soleCause === false))
    assert.equal(frame.sameObjectiveAtEveryStage, false)
    assert.equal(frame.nextTokenPredictionIsFactChecker, false)
    assert.equal(frame.measuredEffect, null)
  }
})

test('every trait focus retains all three evaluations and the evidence, source, and result checks', () => {
  const baseline = trainingRuntimeFrame(2)
  assert.equal(baseline.traitFocus, 'hallucination')
  assert.deepEqual(baseline.traits.map(trait => [trait.id, trait.checks]), [
    ['hallucination', ['根拠を渡す', '出典を照合', '結果を検証']],
    ['sycophancy', ['中立な問い', '明文化した基準']],
    ['refusal', ['過剰・過小を評価', '外側の権限確認']]
  ])
  for (const traitFocus of ['hallucination', 'sycophancy', 'refusal']) {
    const frame = trainingRuntimeFrame(2, { traitFocus })
    assert.deepEqual(comparisonContent(frame), comparisonContent(baseline))
    assert.deepEqual(frame.traits.filter(trait => trait.emphasized).map(trait => trait.id), [traitFocus])
    assert.equal(frame.detail, baseline.detail)
  }
})

test('boundary focus changes emphasis without hiding the external checks or authorizing an operation', () => {
  const baseline = trainingRuntimeFrame(3)
  assert.equal(baseline.boundaryFocus, 'permission')
  for (const [boundaryFocus, emphasizedNode] of [['instruction', 'model-candidate'], ['permission', 'permission-check'], ['verification', 'result-verification']]) {
    const frame = trainingRuntimeFrame(3, { boundaryFocus })
    assert.deepEqual(boundaryContent(frame), boundaryContent(baseline))
    assert.deepEqual(frame.outputEdges, baseline.outputEdges)
    assert.deepEqual(frame.outputRoute, baseline.outputRoute)
    assert.deepEqual(frame.boundaryNodes.filter(node => node.emphasized).map(node => node.id), [emphasizedNode])
    assert.equal(frame.operationExecuted, false)
    assert.equal(frame.judgment, null)
  }
})

test('settings outside their active stage cannot change its meaning', () => {
  for (const stage of [0, 1]) assert.deepEqual(trainingRuntimeFrame(stage), trainingRuntimeFrame(stage, { traitFocus: 'refusal', boundaryFocus: 'verification' }))
  assert.deepEqual(trainingRuntimeFrame(2), trainingRuntimeFrame(2, { boundaryFocus: 'verification' }))
  assert.deepEqual(trainingRuntimeFrame(3), trainingRuntimeFrame(3, { traitFocus: 'sycophancy' }))
})

test('forward midpoint transitions and reverse seeks recover the same complete graph', () => {
  assert.equal(TRAINING_RUNTIME_STAGES.length, 4)
  const settings = { traitFocus: 'refusal', boundaryFocus: 'verification' }
  const phases = [0, .49, .5, .51, 1.49, 1.5, 1.51, 2.49, 2.5, 2.51, 3]
  const forward = phases.map(phase => trainingRuntimeFrame(phase, settings))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = trainingRuntimeFrame(phases[index], settings)
    assert.deepEqual(frame, forward[index])
    const { phase, ...meaning } = frame
    const { phase: integerPhase, ...integerMeaning } = trainingRuntimeFrame(Math.round(phases[index]), settings)
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(phase, phases[index])
    assert.equal(integerPhase, Math.round(phases[index]))
  }
})

test('invalid choices and non-finite phases fail explicitly; finite endpoint seeks are clamped', () => {
  for (const phase of [NaN, Infinity, -Infinity, '2', null, undefined]) assert.throws(() => trainingRuntimeFrame(phase), TypeError)
  for (const options of [null, [], 'permission', 2]) assert.throws(() => trainingRuntimeFrame(2, options), TypeError)
  for (const options of [{ traitFocus: '' }, { traitFocus: null }, { traitFocus: 'all' }, { boundaryFocus: 'operation' }, { boundaryFocus: false }]) assert.throws(() => trainingRuntimeFrame(2, options), RangeError)
  assert.deepEqual(trainingRuntimeFrame(-8), trainingRuntimeFrame(0))
  assert.deepEqual(trainingRuntimeFrame(12), trainingRuntimeFrame(3))
})

test('returned graph and comparison arrays cannot mutate later frames', () => {
  const baseline = trainingRuntimeFrame(3), frame = trainingRuntimeFrame(3)
  frame.traits[0].checks[0] = 'changed'
  frame.associations[0].soleCause = true
  frame.boundaryNodes[1].owner = 'model'
  frame.outputEdges[0].target = 'operation'
  frame.outputRoute.splice(1, 1)
  assert.deepEqual(trainingRuntimeFrame(3), baseline)
  assert.ok(Object.isFrozen(TRAINING_RUNTIME_STAGES) && TRAINING_RUNTIME_STAGES.every(Object.isFrozen))
})
