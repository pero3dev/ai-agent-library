import assert from 'node:assert/strict'
import test from 'node:test'
import { loopResponse, screenExecution, screenRoute, SCREEN_LOOP_STAGES } from '../../lib/screen-loop-model.mjs'

test('truncation, refusal and continued turns cannot become completed output or executable tool requests', () => {
  for (const reason of ['truncated', 'refused', 'continue']) {
    assert.equal(loopResponse(reason).completed, false)
    assert.equal(loopResponse(reason).execute, false)
  }
  assert.equal(loopResponse('complete').completed, true)
  assert.equal(loopResponse('tool').execute, true)
  assert.throws(() => loopResponse('__proto__'), RangeError)
})
test('waiting and denied approval keep the irreversible execution path closed', () => {
  for (const status of ['waiting', 'denied']) assert.equal(screenExecution(status).execute, false)
  assert.equal(screenExecution('approved').execute, true)
  assert.throws(() => screenExecution('complete'), RangeError)
})
test('API and hybrid routes retain authorization and GUI isolation without invented cost scores', () => {
  assert.deepEqual(screenRoute('api'), ['API', '認可と結果確認'])
  assert.deepEqual(screenRoute('hybrid'), ['API ＋ GUI区間', 'GUIだけを隔離'])
  assert.deepEqual(screenRoute('gui'), ['GUI', '隔離・承認・確認'])
  assert.throws(() => screenRoute('unsafe'), RangeError)
  assert.equal(Object.values(SCREEN_LOOP_STAGES).reduce((n, stages) => n + stages.length, 0), 23)
})
