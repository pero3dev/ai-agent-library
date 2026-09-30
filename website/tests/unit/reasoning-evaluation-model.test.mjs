import test from 'node:test'
import assert from 'node:assert/strict'
import { REASONING_EVALUATION_STAGES, REASONING_TASK_FOCI, REASONING_EFFORT_FOCI, reasoningEvaluationFrame as frame } from '../../lib/reasoning-evaluation-model.mjs'

function unmeasured(measurements) {
  assert.deepEqual(measurements.map(metric => metric.id), ['quality', 'cost', 'latency'])
  for (const metric of measurements) {
    assert.equal(metric.value, null)
    assert.equal(metric.unit, null)
    assert.equal(metric.status, 'unmeasured')
  }
}

test('evaluation stages and midpoint transitions are deterministic in forward and reverse order', () => {
  assert.deepEqual(REASONING_EVALUATION_STAGES.map(stage => stage.label), ['同じタスクで比較', '思考量', '追加便益', '必須条件', '複数回の測定'])
  const cases = [[-3, 0], [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [12, 4]]
  for (let stage = 0; stage < 4; stage++) cases.push([stage + .49, stage], [stage + .5, stage + 1], [stage + .51, stage + 1])
  for (const [phase, expected] of [...cases, ...cases.toReversed()]) {
    const result = frame(phase)
    assert.equal(result.stage, expected)
    assert.equal(result.label, REASONING_EVALUATION_STAGES[expected].label)
    assert.ok(result.progress >= 0 && result.progress <= 1)
  }
  assert.equal(frame(-3).phase, 0)
  assert.equal(frame(12).phase, 4)
})

test('all three original task rows and six candidates remain distinct from a single input', () => {
  const expected = [
    ['多段の推論が要る問題(数学・計画・複雑なデバッグ)', '単純な事実検索・定型の抽出・分類'],
    ['検証可能な問題(答えの正しさを確かめられる)', '低レイテンシが要る対話・大量処理'],
    ['制約が多く、慎重な検討が要る判断', '参照先や処理手順が定型化された問い']
  ]
  for (const taskFocus of REASONING_TASK_FOCI) {
    const result = frame(0, { taskFocus })
    assert.deepEqual(result.taskRows.map(row => row.candidates), expected)
    assert.deepEqual(result.taskRows.map(row => row.sourceTopic), ['d2-s2-b1.row0', 'd2-s2-b1.row1', 'd2-s2-b1.row2'])
    assert.deepEqual(result.taskRows.filter(row => row.emphasized).map(row => row.id), [taskFocus])
    assert.equal(result.comparison.inputText, null)
    assert.equal(result.claims.automaticTaskDecision, null)
    assert.match(result.detail, /左右は異なるタスク例/)
    assert.match(result.detail, /各タスク内で同じ実入力/)
  }
})

test('inactive choices are entirely absent from the effective frame, including backward seeks', () => {
  for (const phase of [0, .49, 0]) assert.deepEqual(frame(phase, { effortFocus: 'lower' }), frame(phase, { effortFocus: 'higher' }))
  for (const phase of [.5, 1, 1.5, 2, 2.49, 3, 4, 2]) {
    assert.deepEqual(frame(phase, { taskFocus: 'multi-step' }), frame(phase, { taskFocus: 'constraints' }))
    assert.equal(frame(phase).taskFocus, null)
  }
  for (const phase of [2.5, 3, 3.5, 4, 20, 3]) {
    assert.deepEqual(frame(phase, { taskFocus: 'verifiable', effortFocus: 'higher' }), frame(phase))
    assert.equal(frame(phase).effortFocus, null)
  }
})

test('effort focus only changes emphasis at S1 and S2; both settings always survive', () => {
  assert.deepEqual(REASONING_EFFORT_FOCI, ['lower', 'higher'])
  for (const phase of [.5, 1, 1.5, 2, 2.49]) {
    const lower = frame(phase), higher = frame(phase, { effortFocus: 'higher' })
    assert.deepEqual(lower.variants.map(variant => variant.id), ['lower', 'higher'])
    assert.deepEqual(higher.variants.filter(variant => variant.emphasized).map(variant => variant.id), ['higher'])
    assert.deepEqual(lower.variants.filter(variant => variant.emphasized).map(variant => variant.id), ['lower'])
    assert.deepEqual({ ...higher, effortFocus: 'lower', variants: higher.variants.map(variant => ({ ...variant, emphasized: variant.id === 'lower' })) }, lower)
  }
})

test('same-input comparison fixes model, instructions and criteria and executes nothing', () => {
  for (let phase = 0; phase <= 4; phase += .125) {
    const result = frame(phase)
    assert.deepEqual(result.comparison, { inputId: 'same-input', inputText: null, modelId: 'same-model', modelName: null, promptId: 'same-instructions', criteriaId: 'same-criteria', isExecuted: false })
    unmeasured(result.metrics)
    for (const variant of result.variants) {
      assert.equal(variant.providerValue, null)
      assert.equal(variant.budget, null)
      unmeasured(variant.measurements)
    }
    for (const key of ['qualityMonotonic', 'allSimpleTasksWorsen', 'extraEffortFixesUnclearRequirements', 'extraEffortReplacesPermissionChecks', 'visibleThoughtProvesCause', 'allModelsNeedStepByStepPrompt']) assert.equal(result.claims[key], false)
    for (const key of ['measuredBenefit', 'recommendedEffort', 'automaticTaskDecision']) assert.equal(result.claims[key], null)
  }
})

test('additional work carries no quantified cost, quality, time or guaranteed benefit', () => {
  for (let phase = 0; phase <= 4; phase += .125) {
    const result = frame(phase), work = result.extraWork
    assert.equal(work.visible, result.stage === 2)
    assert.equal(work.effort, 'higher')
    assert.equal(work.quantitative, false)
    assert.equal(work.value, null)
    assert.equal(work.unit, null)
    assert.equal(work.measuredBenefit, null)
  }
  assert.match(frame(2).detail, /すべての簡単な問いやモデルで必ず悪化/)
  assert.match(frame(2).detail, /曖昧な要件・停止条件・権限制御/)
})

test('exploration stays inside a fixed boundary; approval belongs to external execution code', () => {
  for (const phase of [2.5, 2.75, 3, 3.25, 3.49, 3, 2.5]) {
    const result = frame(phase)
    assert.deepEqual(result.requiredConditions.map(condition => condition.id), ['goal', 'constraints', 'approval', 'evidence-check', 'business-rules'])
    assert.equal(result.exploration.visible, true)
    assert.equal(result.exploration.withinBoundary, true)
    assert.ok(result.exploration.presentationOffset >= 0 && result.exploration.presentationOffset <= 240)
    assert.deepEqual(result.executionBoundary, { owner: 'outside-model', enforcedBy: 'execution-code', approvalDecision: null, operationExecuted: false })
  }
  assert.equal(frame(2).exploration.visible, false)
  assert.equal(frame(4).exploration.visible, false)
})

test('four empty trials hold conditions within each setting and all twelve cells stay unmeasured', () => {
  const result = frame(4)
  assert.deepEqual(result.trials.map(trial => trial.id), ['lower-a', 'lower-b', 'higher-a', 'higher-b'])
  assert.deepEqual(result.trials.map(trial => trial.conditionId), ['lower-settings', 'lower-settings', 'higher-settings', 'higher-settings'])
  assert.deepEqual(result.trials.map(trial => trial.effort), ['lower', 'lower', 'higher', 'higher'])
  assert.equal(result.trials.flatMap(trial => trial.measurements).length, 12)
  for (const trial of result.trials) {
    assert.equal(trial.inputId, result.comparison.inputId)
    assert.equal(trial.status, 'not-run')
    unmeasured(trial.measurements)
  }
  assert.match(result.detail, /推奨する試行回数ではありません/)
  assert.match(result.detail, /見える思考から原因を断定しません/)
})

test('evaluation validates object shapes, unknown keys, malformed phases and enum domains', () => {
  for (const phase of [null, undefined, '2', NaN, Infinity, -Infinity, [], {}, 1n]) assert.throws(() => frame(phase), TypeError)
  for (const options of [null, 0, false, '', [], new Date(), () => {}, Object.create({ effortFocus: 'higher' })]) assert.throws(() => frame(0, options), TypeError)
  for (const options of [{ ignored: true }, { [Symbol('taskFocus')]: 'constraints' }, Object.defineProperty({}, 'hidden', { value: 1 })]) assert.throws(() => frame(0, options), TypeError)
  for (const taskFocus of ['', 'all', null, true, 1, {}, []]) assert.throws(() => frame(0, { taskFocus }), RangeError)
  for (const effortFocus of ['', 'maximum', null, true, 1, {}, []]) assert.throws(() => frame(0, { effortFocus }), RangeError)
  assert.deepEqual(frame(0, Object.create(null)), frame(0))
  const options = Object.freeze({ taskFocus: 'constraints', effortFocus: 'higher' })
  frame(0, options)
  assert.deepEqual(options, { taskFocus: 'constraints', effortFocus: 'higher' })
})

test('nested results are isolated across calls, variants, trials and frozen public constants', () => {
  const pristine = frame(4), changed = frame(4)
  changed.taskRows[0].candidates[0] = 'fabricated'
  changed.variants[0].measurements[0].value = 1
  changed.metrics[0].value = 2
  changed.requiredConditions[0].label = 'optional'
  changed.executionBoundary.operationExecuted = true
  changed.trials[0].measurements[0].value = 3
  changed.claims.visibleThoughtProvesCause = true
  assert.equal(changed.trials[1].measurements[0].value, null)
  assert.equal(changed.variants[1].measurements[0].value, null)
  assert.deepEqual(frame(4), pristine)
  for (const value of [REASONING_EVALUATION_STAGES, ...REASONING_EVALUATION_STAGES, REASONING_TASK_FOCI, REASONING_EFFORT_FOCI]) assert.ok(Object.isFrozen(value))
})
