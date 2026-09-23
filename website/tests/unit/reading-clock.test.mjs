import test from 'node:test'
import assert from 'node:assert/strict'
import { clampPhase, stageForPhase, phaseAtElapsed, readingStageAtLine } from '../../lib/reading-clock.mjs'

test('presentation clocks support one, three and eight stages without a six-stage assumption', () => {
  for (const count of [1, 3, 8]) {
    assert.equal(clampPhase(-2, count), 0)
    assert.equal(clampPhase(99, count), count - 1)
    assert.equal(phaseAtElapsed(0, 4500 * count, count), count - 1)
  }
})

test('all semantic labels use the same midpoint for forward and backward seeking', () => {
  assert.deepEqual([3.49, 3.5, 3.7, 4, 3.7, 3.49].map(phase => stageForPhase(phase, 6)), [3, 4, 4, 4, 4, 3])
})

test('playback uses elapsed time and resumes from the selected fractional phase', () => {
  assert.equal(phaseAtElapsed(1.25, 2250, 8), 1.75)
  assert.equal(phaseAtElapsed(1.25, 4500, 8), 2.25)
  assert.equal(phaseAtElapsed(6.9, 4500, 8), 7)
})

test('reduced motion has discrete states and reaches the final state exactly', () => {
  assert.equal(phaseAtElapsed(0, 4499, 3, true), 0)
  assert.equal(phaseAtElapsed(0, 4500, 3, true), 1)
  assert.equal(phaseAtElapsed(0, 9000, 3, true), 2)
})

test('reading can skip a diagram-only stage and finish at a stage without prose', () => {
  const steps = [{ stage: 0, top: 100, bottom: 200 }, { stage: 2, top: 230, bottom: 330 }]
  assert.equal(readingStageAtLine(steps, 50, 4), 0)
  assert.equal(readingStageAtLine(steps, 230, 4), 2)
  assert.equal(readingStageAtLine(steps, 330, 4), 2)
  assert.equal(readingStageAtLine(steps, 331, 4), 3)
  assert.equal(readingStageAtLine(steps, 150, 4), 0)
})

test('reading is determined by viewport positions, independent of document scroll anchoring', () => {
  const steps = [{ stage: 0, top: 332, bottom: 480 }, { stage: 1, top: 520, bottom: 700 }]
  assert.equal(readingStageAtLine(steps, 340, 3), 0)
  assert.equal(readingStageAtLine(steps.map(step => ({ ...step, top: step.top - 190, bottom: step.bottom - 190 })), 340, 3), 1)
  assert.equal(readingStageAtLine([], 340, 3), 0)
})

test('invalid clocks and prose positions fail explicitly', () => {
  for (const count of [0, -1, 2.5, NaN]) assert.throws(() => clampPhase(0, count), RangeError)
  for (const phase of [NaN, Infinity, -Infinity]) assert.throws(() => stageForPhase(phase, 3), TypeError)
  assert.throws(() => phaseAtElapsed(0, -1, 3), RangeError)
  assert.throws(() => readingStageAtLine([{ stage: 3, top: 0, bottom: 50 }], 30, 3), RangeError)
  assert.throws(() => readingStageAtLine([{ stage: 0, top: 50, bottom: 0 }], 30, 3), RangeError)
})
