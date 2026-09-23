import test from 'node:test'
import assert from 'node:assert/strict'
import { loopFrame, workflowChoice, RESPONSE_OPTIONS } from '../../lib/concept-diagram-model.mjs'

test('only a complete tool request reaches application execution', () => {
  for (const response of RESPONSE_OPTIONS) {
    const frame = loopFrame(3, response.id)
    assert.equal(frame.toolExecuted, response.id === 'tool')
    assert.equal(frame.history.some(value => value.startsWith('ツール結果')), response.id === 'tool')
  }
  assert.equal(loopFrame(2, 'tool').toolExecuted, false)
})

test('final responses, refusal and truncation never pass through a tool or repeat', () => {
  for (const response of ['complete', 'truncated', 'refused']) {
    for (const boundary of ['continue', 'stop']) {
      const frame = loopFrame(4, response, boundary)
      assert.equal(frame.terminal, response === 'complete' ? 'complete' : 'incomplete')
      assert.equal(frame.toolExecuted, false)
      assert.equal(frame.repeats, false)
      assert.equal(frame.history.length, 1)
      assert.doesNotMatch(frame.formula, /アプリが実行/)
      assert.doesNotMatch(frame.title, /続ける前|実行結果/)
    }
  }
})

test('a resumable stop bypasses the tool and still obeys the application boundary', () => {
  assert.deepEqual(loopFrame(3, 'continue').edges, ['response', 'resume'])
  assert.equal(loopFrame(4, 'continue', 'continue').repeats, true)
  assert.equal(loopFrame(4, 'continue', 'stop').terminal, 'incomplete')
  assert.equal(loopFrame(4, 'continue', 'stop').toolExecuted, false)
  assert.match(loopFrame(3, 'continue').formula, /ツール実行を省略/)
})

test('a tool failure remains an observation without guaranteeing recovery', () => {
  const frame = loopFrame(3, 'tool', 'continue', 'failure')
  assert.deepEqual(frame.history, ['モデルの応答', 'ツール結果（失敗）'])
  assert.equal(frame.terminal, null)
  assert.match(frame.detail, /必ず回復できるとは限りません/)
  assert.equal(loopFrame(4, 'tool', 'stop', 'failure').terminal, 'incomplete')
})

test('decisions retain all four exits and do not turn routing into an agent', () => {
  assert.equal(workflowChoice('fixed').result, 'Workflow')
  assert.equal(workflowChoice('routing').result, 'Workflow ＋ ルーティング')
  assert.equal(workflowChoice('bounded').result, 'ハイブリッド')
  assert.equal(workflowChoice('open').answer, '停止条件・権限を最初に設計')
  assert.deepEqual(workflowChoice('routing').steps, [0, 1])
})

test('invalid reading states and unknown choices are rejected', () => {
  for (const stage of [-1, 5, 1.2, NaN]) assert.throws(() => loopFrame(stage), RangeError)
  assert.throws(() => loopFrame(2, 'invented'), RangeError)
  assert.throws(() => loopFrame(4, 'tool', 'skip'), RangeError)
  assert.throws(() => workflowChoice('automatic-best'), RangeError)
})
