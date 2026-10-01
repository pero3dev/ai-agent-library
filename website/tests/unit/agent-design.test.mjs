import assert from 'node:assert/strict'
import test from 'node:test'
import { reflectionTransition, planningTrigger, retrievalPath, delegatedExecution } from '../../lib/agent-design-model.mjs'

test('reflection closes the revision path at completion, iteration limit or small improvement', () => {
  assert.equal(reflectionTransition('continue').revise, true)
  for (const reason of ['complete', 'limit', 'small']) {
    assert.equal(reflectionTransition(reason).revise, false)
    assert.equal(reflectionTransition(reason).stop, true)
  }
  assert.throws(() => reflectionTransition('unknown'), RangeError)
})
test('all planning triggers update persistent state before the next input', () => {
  for (const trigger of ['step', 'failure', 'information']) {
    assert.equal(planningTrigger(trigger).review, true)
    assert.equal(planningTrigger(trigger).stateBeforeNextInput, true)
  }
  assert.throws(() => planningTrigger('__proto__'), RangeError)
})
test('multiple searches and calculations do not imply model-owned execution paths', () => {
  const workflow = retrievalPath('workflow')
  assert.equal(workflow.owner, 'コード')
  assert.ok(workflow.nodes.includes('複数検索') && workflow.nodes.includes('照合・計算'))
  assert.equal(workflow.feedback, false)
  assert.equal(retrievalPath('agentic').owner, 'モデル')
  assert.equal(retrievalPath('agentic').feedback, true)
  assert.equal(retrievalPath('full').retrieval, false)
  workflow.nodes.push('changed')
  assert.equal(retrievalPath('workflow').nodes.length, 5)
  assert.throws(() => retrievalPath('__proto__'), RangeError)
})
test('isolated contexts do not bypass application-side approval or share parent history', () => {
  for (const approval of ['waiting', 'approved', 'denied']) {
    const frame = delegatedExecution(approval)
    assert.equal(frame.independentContexts, true)
    assert.equal(frame.parentHistoryShared, false)
    assert.equal(frame.execute, approval === 'approved')
  }
  assert.throws(() => delegatedExecution('unknown'), RangeError)
})
