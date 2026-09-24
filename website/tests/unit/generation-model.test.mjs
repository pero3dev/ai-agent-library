import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GENERATION_STAGES, GENERATION_TOKENS,
  softmaxProbabilities, nucleusFilter, selectToken, distributionFromLogits,
  distributionForPrefix, generationComparison, stoppingTrace, generationFrame
} from '../../lib/generation-model.mjs'

const approximate = (actual, expected, epsilon = 1e-12) => {
  assert.equal(actual.length, expected.length)
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) <= epsilon, `${value} != ${expected[index]}`))
}
const probabilities = distribution => distribution.rows.map(row => row.probability)
const selection = distribution => distribution.rows.map(row => row.selectionProbability)
const ids = prefix => prefix.map(token => token.tokenId)

test('base and each changed prefix have independently specified distributions', () => {
  const cases = [
    [[0, 1], [.4, .3, .2, .1], 1],
    [[0, 1, 0], [.1, .1, .2, .6], 3],
    [[0, 1, 1], [.1, .2, .6, .1], 2],
    [[0, 1, 2], [.5, .2, .2, .1], 1],
    [[0, 1, 3], [.1, .5, .1, .3], 2]
  ]
  for (const [prefix, expected, chosen] of cases) {
    const result = distributionForPrefix(prefix)
    approximate(probabilities(result), expected)
    assert.equal(result.selectedTokenId, chosen)
    assert.deepEqual(ids(result.prefix), prefix)
  }
  for (const prefix of [[], [0], [1, 0], [0, 1, 1, 2], [0, 1, 4], [0, 1, NaN], ['0', 1]]) {
    assert.throws(() => distributionForPrefix(prefix))
  }
})

test('temperature numeric oracles, normalization, and stable subtraction', () => {
  const logits = [.4, .3, .2, .1].map(Math.log)
  approximate(softmaxProbabilities(logits, .5), [8 / 15, 3 / 10, 2 / 15, 1 / 30])
  approximate(softmaxProbabilities(logits, 1), [.4, .3, .2, .1])
  approximate(softmaxProbabilities(logits, 2), [.32540090689572504, .2818054517861928, .23009318787021957, .16270045344786255])
  approximate(softmaxProbabilities(logits.map(value => value + 1000), 1), [.4, .3, .2, .1])
  approximate(softmaxProbabilities([1000, 999, -1000], Number.MIN_VALUE), [1, 0, 0])
  for (const t of [0, -1, Infinity, NaN, '1']) assert.throws(() => softmaxProbabilities(logits, t))
  for (const bad of [[], [NaN], [Infinity], ['0'], null]) assert.throws(() => softmaxProbabilities(bad))
})

test('greedy is a separate argmax branch and ties use token order', () => {
  for (const draw of [0, .22, .62, 1 - Number.EPSILON]) {
    const d = distributionFromLogits([2, 2, 1, 0], { temperature: 0, topP: .01, draw })
    assert.equal(d.selectedTokenId, 0)
    assert.equal(d.selectionKind, 'greedy')
    assert.equal(d.probabilityKind, 'reference-t1')
    assert.equal(d.effectiveTopP, null)
    assert.deepEqual(selection(d), [1, 0, 0, 0])
    assert.ok(d.rows[0].probability < 1, 'one-hot is a selection result, not model certainty')
  }
})

test('top-p uses >= at an exact binary boundary and renormalizes retained mass', () => {
  const p = [.5, .25, .125, .125], delta = 2 ** -20
  for (const threshold of [.75 - delta, .75]) {
    const f = nucleusFilter(p, threshold)
    assert.deepEqual(f.kept, [true, true, false, false])
    assert.equal(f.retainedMass, .75)
    approximate(f.probabilities, [2 / 3, 1 / 3, 0, 0])
  }
  assert.deepEqual(nucleusFilter(p, .75 + delta).kept, [true, true, true, false])
  assert.deepEqual(nucleusFilter(p, 1).probabilities, p)
  assert.deepEqual(nucleusFilter(p, Number.MIN_VALUE).probabilities, [1, 0, 0, 0])
  assert.deepEqual(nucleusFilter([0, .5, .5, 0], 1).kept, [false, true, true, false])
  assert.deepEqual(nucleusFilter([.25, .25, .25, .25], .5).kept, [true, true, false, false])
  for (const threshold of [0, -1, 1.01, NaN, Infinity]) assert.throws(() => nucleusFilter(p, threshold))
  for (const bad of [[0, 0], [.5, .4], [-.1, 1.1], [NaN, 1], []]) assert.throws(() => nucleusFilter(bad))
})

test('inverse-CDF boundaries are distinct from the top-p inclusion boundary', () => {
  const p = [.5, .25, .125, .125], delta = 2 ** -20
  for (const [draw, expected] of [[0, 0], [.5 - delta, 0], [.5, 1], [.75 - delta, 1], [.75, 2], [.875, 3], [1 - Number.EPSILON, 3]]) {
    assert.equal(selectToken(p, draw), expected)
  }
  assert.equal(selectToken([0, 1, 0, 0], 0), 1)
  assert.equal(selectToken([0, 1, 0, 0], 1 - Number.EPSILON), 1)
  for (const bad of [-.1, 1, NaN, Infinity, '.5']) assert.throws(() => selectToken(p, bad))
})

test('stage-4 temperature and nucleus settings affect the same AB prefix only', () => {
  const d = generationFrame(4, { temperature: .5, topP: .8 }).activeDistribution
  assert.deepEqual(ids(d.prefix), [0, 1])
  assert.deepEqual(d.rows.map(row => row.kept), [true, true, false, false])
  approximate(selection(d), [16 / 25, 9 / 25, 0, 0])
  assert.equal(d.selectedTokenId, 0)
  const options = { temperature: 0, topP: .6, draw: .22 }
  for (const phase of [0, 1, 2, 3]) {
    const base = generationFrame(phase), changed = generationFrame(phase, options)
    assert.deepEqual(changed.loop, base.loop)
    assert.deepEqual(changed.activeDistribution, base.activeDistribution)
  }
})

test('sampling variation changes only the draw; logit variation changes only A score', () => {
  const random = generationComparison('sampling')
  assert.equal(random.changedField, 'draw')
  assert.deepEqual(random.left.rows.map(row => row.logit), random.right.rows.map(row => row.logit))
  assert.deepEqual(probabilities(random.left), probabilities(random.right))
  assert.equal(random.left.draw, .22); assert.equal(random.right.draw, .62)
  assert.equal(random.left.selectedLabel, 'A'); assert.equal(random.right.selectedLabel, 'B')
  approximate(random.left.nextProbabilities, [.1, .1, .2, .6])
  approximate(random.right.nextProbabilities, [.1, .2, .6, .1])
  const drift = generationComparison('logit')
  assert.equal(drift.changedField, 'logit-A')
  assert.equal(drift.left.temperature, 0); assert.equal(drift.right.temperature, 0)
  assert.equal(drift.left.draw, drift.right.draw)
  assert.equal(drift.left.topP, drift.right.topP)
  assert.deepEqual(drift.left.rows.slice(1).map(row => row.logit), drift.right.rows.slice(1).map(row => row.logit))
  assert.equal(drift.left.rows[0].logit, 1.000001); assert.equal(drift.right.rows[0].logit, .999999)
  assert.equal(drift.left.selectedLabel, 'A'); assert.equal(drift.right.selectedLabel, 'B')
  assert.ok(Math.abs(drift.left.rows[0].probability - drift.right.rows[0].probability) < 1e-6)
  for (const variation of ['sampling', 'logit']) {
    assert.deepEqual(generationFrame(5, { variation, temperature: .5, topP: .6, draw: .1 }).comparison, generationFrame(5, { variation }).comparison)
  }
})

test('all three stopping cases derive from the same fixed conditional distribution path', () => {
  const expected = {
    natural: { ids: [0, 1, 2, 4], text: 'ABC', visible: 'ABC', count: 4 },
    sequence: { ids: [0, 1, 2], text: 'ABC', visible: 'A', count: 3 },
    limit: { ids: [0, 1], text: 'AB', visible: 'AB', count: 2 }
  }
  for (const [kind, oracle] of Object.entries(expected)) {
    const trace = stoppingTrace(kind)
    assert.equal(trace.reason, kind)
    assert.deepEqual(ids(trace.selectedTokens), oracle.ids)
    assert.equal(trace.generatedText, oracle.text)
    assert.equal(trace.visibleText, oracle.visible)
    assert.equal(trace.selectedCount, oracle.count)
    assert.equal(trace.textTokenCount, oracle.text.length)
    assert.equal(trace.outputValidated, false)
    assert.equal(trace.events.filter(event => event.finished).length, 1)
    assert.equal(trace.events.at(-1).finished, true)
    for (const [index, event] of trace.events.slice(1).entries()) {
      assert.equal(selectToken(event.probabilities, event.draw), event.selectedToken.tokenId)
      assert.deepEqual(ids(event.conditionPrefix), [0, 1, ...oracle.ids.slice(0, index)])
    }
  }
  assert.equal(stoppingTrace('natural').selectedCount, stoppingTrace('natural').maxSelections, 'EOS takes precedence on the fixed budget boundary')
  assert.equal(stoppingTrace('sequence').stopSequence, 'BC')
})

test('streaming can group tokens, holds a split stop sequence, and never retracts text', () => {
  const natural = stoppingTrace('natural').events
  assert.deepEqual(natural.map(event => event.chunk), ['', 'A', '', 'BC', ''])
  assert.equal(natural[2].generatedText, 'AB')
  assert.equal(natural[2].visibleText, 'A')
  assert.equal(natural[2].pendingText, 'B')
  assert.deepEqual(stoppingTrace('sequence').events.map(event => event.visibleText), ['', 'A', 'A', 'A'])
  assert.equal(stoppingTrace('sequence').events[2].pendingText, 'B')
  assert.equal(stoppingTrace('sequence').events[3].pendingText, '')
  assert.deepEqual(stoppingTrace('limit').events.map(event => event.chunk), ['', 'A', 'B'])
  for (const kind of ['natural', 'sequence', 'limit']) {
    const trace = stoppingTrace(kind)
    trace.events.forEach((event, index) => {
      if (index) assert.ok(event.visibleText.startsWith(trace.events[index - 1].visibleText))
      assert.ok(event.generatedText.startsWith(event.visibleText))
      assert.equal(generationFrame(7, { stop: kind, streamStep: index }).streaming.visibleText, event.visibleText)
    })
    assert.equal(trace.events.map(event => event.chunk).join(''), trace.visibleText)
    assert.equal(generationFrame(7, { stop: kind }).streaming.finished, true)
  }
})

test('phase midpoint, append completion, next distribution, and repeated token identity agree', () => {
  assert.equal(GENERATION_STAGES.length, 8)
  assert.equal(generationFrame(1.499999).stage, 1)
  assert.equal(generationFrame(1.5).stage, 2)
  assert.equal(generationFrame(2).loop.appendProgress, .5)
  const before = generationFrame(2.499999), after = generationFrame(2.5)
  assert.equal(before.stage, 2); assert.equal(before.loop.appended, false)
  assert.deepEqual(ids(before.loop.committedPrefix), [0, 1])
  assert.deepEqual(ids(before.activeDistribution.prefix), [0, 1])
  assert.equal(after.stage, 3); assert.equal(after.loop.appended, true)
  assert.deepEqual(ids(after.loop.committedPrefix), [0, 1, 1])
  assert.deepEqual(ids(after.activeDistribution.prefix), [0, 1, 1])
  approximate(probabilities(after.activeDistribution), [.1, .2, .6, .1])
  assert.equal(new Set(after.loop.after.map(token => token.occurrenceId)).size, 3)
  assert.equal(after.loop.after[1].tokenId, after.loop.after[2].tokenId)
  assert.equal(generationFrame(6.5).streaming.eventIndex, 0)
  assert.equal(generationFrame(6.75).streaming.eventIndex, 2)
  assert.equal(generationFrame(7).streaming.eventIndex, 4)
})

test('reverse seeks and repeated rendering are deterministic without state or random reads', () => {
  const oldRandom = Math.random
  Math.random = () => { throw new Error('rendering must not sample runtime randomness') }
  try {
    const snapshots = new Map([0, 1.5, 2, 2.5, 4, 5, 6.5, 6.75, 7].map(phase => [phase, generationFrame(phase)]))
    for (const phase of [7, 4, 2.5, 2, 0, 1.5, 6.75, 6.5, 5]) assert.deepEqual(generationFrame(phase), snapshots.get(phase))
  } finally { Math.random = oldRandom }
  const first = generationFrame(3)
  first.loop.after[0].label = 'changed externally'
  assert.equal(generationFrame(3).loop.after[0].label, 'A')
  assert.equal(GENERATION_TOKENS[0].label, 'A')
})

test('bad options and indices fail instead of selecting a fallback fixture', () => {
  for (const phase of [NaN, Infinity, '2']) assert.throws(() => generationFrame(phase))
  for (const options of [null, [], { temperature: -1 }, { temperature: NaN }, { topP: 0 }, { topP: 2 }, { draw: 1 }, { variation: 'unknown' }, { stop: 'unknown' }, { streamStep: -1 }, { streamStep: 5 }, { streamStep: .5 }]) assert.throws(() => generationFrame(7, options))
  assert.equal(generationFrame(-1).stage, 0)
  assert.equal(generationFrame(100).stage, 7)
})
