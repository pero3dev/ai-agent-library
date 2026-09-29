import test from 'node:test'
import assert from 'node:assert/strict'
import { PRETRAINING_DATA_STAGES, pretrainingDataFrame } from '../../lib/pretraining-data-model.mjs'

test('reuse preserves four documents and eight source positions while creating twelve distinct occurrences', () => {
  const frame = pretrainingDataFrame(1)
  assert.deepEqual(frame.documents.map(document => [document.id, document.positions.map(position => position.id)]), [['A', ['A0', 'A1']], ['B', ['B0', 'B1']], ['C', ['C0', 'C1']], ['D', ['D0', 'D1']]])
  assert.deepEqual(frame.reads.map(read => read.documentId), ['A', 'B', 'C', 'D', 'A', 'B'])
  assert.deepEqual([frame.readCount, frame.sourceDocumentCount, frame.processedTokenOccurrences, frame.sourceTokenPositions], [6, 4, 12, 8])
  const occurrences = frame.reads.flatMap(read => read.occurrences)
  assert.equal(new Set(occurrences.map(occurrence => occurrence.id)).size, 12)
  assert.equal(new Set(occurrences.map(occurrence => occurrence.sourcePositionId)).size, 8)
  for (const [index, read] of frame.reads.entries()) {
    assert.equal(read.index, index)
    assert.deepEqual(read.occurrences.map(occurrence => [occurrence.documentId, occurrence.sourcePositionId, occurrence.readIndex]), [0, 1].map(position => [read.documentId, `${read.documentId}${position}`, index]))
  }
  assert.deepEqual(frame.reads[4].occurrences.map(x => x.sourcePositionId), frame.reads[0].occurrences.map(x => x.sourcePositionId))
  assert.notEqual(frame.reads[4].occurrences[0].id, frame.reads[0].occurrences[0].id)
})

test('all stages keep processing counts separate from unmeasured quality, vocabulary, information and effects', () => {
  for (let stage = 0; stage < 4; stage++) {
    const frame = pretrainingDataFrame(stage)
    assert.deepEqual([frame.readCount, frame.sourceDocumentCount, frame.processedTokenOccurrences, frame.sourceTokenPositions], [6, 4, 12, 8])
    for (const field of ['uniqueVocabularyCount', 'independentInformation', 'qualityScores', 'optimalMixture', 'overfittingStart', 'learningEffect', 'investmentDecision']) assert.equal(frame[field], null)
    assert.equal(frame.additionalValueIsConstant, false)
    assert.equal(frame.reuseIncreasesProcessedCount, true)
    assert.equal(frame.evaluationMustBeSeparated, true)
  }
})

test('each selection emphasizes exactly one aspect while retaining all four and their cautions', () => {
  const baseline = pretrainingDataFrame(2), content = frame => frame.aspects.map(({ emphasized, ...aspect }) => aspect)
  assert.equal(baseline.dataFocus, 'quality')
  assert.deepEqual(baseline.aspects.map(aspect => aspect.id), ['quality', 'mixture', 'reuse', 'contamination'])
  for (const dataFocus of ['quality', 'mixture', 'reuse', 'contamination']) {
    const frame = pretrainingDataFrame(2, { dataFocus })
    assert.deepEqual(content(frame), content(baseline))
    assert.deepEqual(frame.aspects.filter(aspect => aspect.emphasized).map(aspect => aspect.id), [dataFocus])
    assert.equal(frame.detail, baseline.detail)
  }
  for (const stage of [0, 1, 3]) assert.deepEqual(pretrainingDataFrame(stage), pretrainingDataFrame(stage, { dataFocus: 'contamination' }))
})

test('midpoint boundaries and reverse seeks preserve whole identities without interpolating semantic counts', () => {
  const phases = [0, .49, .5, .51, 1.49, 1.5, 1.51, 2.49, 2.5, 2.51, 3]
  const frames = phases.map(phase => pretrainingDataFrame(phase, { dataFocus: 'reuse' }))
  for (let index = phases.length - 1; index >= 0; index--) {
    const frame = pretrainingDataFrame(phases[index], { dataFocus: 'reuse' })
    assert.deepEqual(frame, frames[index])
    const { phase, ...meaning } = frame, { phase: integer, ...integerMeaning } = pretrainingDataFrame(Math.round(phase), { dataFocus: 'reuse' })
    assert.deepEqual(meaning, integerMeaning)
    assert.equal(integer, Math.round(phase))
  }
})

test('invalid phases and choices fail explicitly and finite endpoint seeks clamp', () => {
  for (const phase of [NaN, Infinity, -Infinity, '1', null, undefined]) assert.throws(() => pretrainingDataFrame(phase), TypeError)
  for (const options of [null, [], 'quality', 3]) assert.throws(() => pretrainingDataFrame(2, options), TypeError)
  for (const dataFocus of ['', null, false, 'all']) assert.throws(() => pretrainingDataFrame(2, { dataFocus }), RangeError)
  assert.deepEqual(pretrainingDataFrame(-3), pretrainingDataFrame(0))
  assert.deepEqual(pretrainingDataFrame(10), pretrainingDataFrame(3))
})

test('mutating returned data cannot alter another frame or the frozen stage definitions', () => {
  const baseline = pretrainingDataFrame(1), frame = pretrainingDataFrame(1)
  frame.documents[0].positions[0].id = 'new-position'
  frame.reads[0].occurrences[0].sourcePositionId = 'new-source'
  frame.reads.splice(4, 2)
  frame.aspects[0].lines[0] = 'changed'
  assert.deepEqual(pretrainingDataFrame(1), baseline)
  assert.equal(PRETRAINING_DATA_STAGES.length, 4)
  assert.ok(Object.isFrozen(PRETRAINING_DATA_STAGES) && PRETRAINING_DATA_STAGES.every(Object.isFrozen))
})
