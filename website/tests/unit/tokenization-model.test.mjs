import test from 'node:test'
import assert from 'node:assert/strict'
import { TOKENIZATION_TEXT, TOKENIZATION_STAGES, TOKEN_VOCABULARIES, TOKEN_BOUNDARIES,
  fixtureTokens, decodeFixture, tokenizationFrame } from '../../lib/tokenization-model.mjs'

test('both vocabularies cover the same nine characters exactly and round-trip through their IDs', () => {
  assert.equal(TOKENIZATION_TEXT, 'tokenizer')
  for (const vocabulary of TOKEN_VOCABULARIES) {
    const tokens = fixtureTokens(vocabulary.id)
    assert.equal(tokens[0].start, 0)
    assert.equal(tokens.at(-1).end, 9)
    tokens.forEach((token, i) => {
      assert.equal(token.piece, TOKENIZATION_TEXT.slice(token.start, token.end))
      if (i) assert.equal(token.start, tokens[i - 1].end)
    })
    assert.equal(tokens.map(token => token.piece).join(''), TOKENIZATION_TEXT)
    assert.equal(decodeFixture(vocabulary.id, tokens.map(token => token.tokenId)), TOKENIZATION_TEXT)
    assert.equal(tokens.length, vocabulary.id === 'a' ? 2 : 4)
  }
})

test('token IDs identify vocabulary entries, while occurrence IDs identify individual appearances', () => {
  const first = fixtureTokens('a', 'previous'), second = fixtureTokens('a', 'current')
  assert.deepEqual(first.map(t => t.tokenId), second.map(t => t.tokenId))
  assert.equal(new Set([...first, ...second].map(t => t.occurrenceId)).size, 4)
  assert.equal(decodeFixture('a', [12, 27, 12, 27]), 'tokenizertokenizer')
  assert.throws(() => decodeFixture('b', first.map(t => t.tokenId)), /vocabulary/)
})

test('character and word comparisons preserve text but do not invent token IDs', () => {
  for (const { id } of TOKEN_BOUNDARIES) {
    const frame = tokenizationFrame(2, { boundary: id })
    assert.equal(frame.segments.map(s => s.piece).join(''), TOKENIZATION_TEXT)
    assert.equal(frame.segmentCount, { character: 9, word: 1, subword: 2 }[id])
    assert.equal(frame.showTokenIds, id === 'subword')
    if (id !== 'subword') assert.ok(frame.segments.every(s => s.tokenId === null && s.vocabulary === null))
    assert.equal(frame.tokenCount, 2, 'character/word comparisons do not replace the tokenizer result')
  }
})

test('selectors affect only the intended stage, including reverse visits', () => {
  const options = { vocabulary: 'b', boundary: 'character', dependency: 'content', measurement: 'history' }
  for (const stage of [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0]) {
    const frame = tokenizationFrame(stage, options)
    assert.equal(frame.stage, stage)
    assert.equal(frame.vocabulary, stage === 4 ? 'b' : 'a')
    assert.equal(frame.boundary, stage === 2 ? 'character' : 'subword')
    assert.equal(frame.dependency, stage === 3 ? 'content' : null)
    assert.equal(frame.measurement, stage === 5 ? 'history' : null)
    assert.equal(frame.reconstructed, TOKENIZATION_TEXT)
  }
})

test('the measurement stage already contains both sides of past history and current input', () => {
  for (const stage of [5, 6]) {
    for (const measurement of ['estimate', 'usage', 'history']) {
      const frame = tokenizationFrame(stage, { measurement })
      assert.deepEqual(frame.history, { visible: true, includesPastInput: true, includesPastOutput: true,
        includesCurrentInput: true, measuredTokenCount: null })
      assert.equal(frame.measuredUsage, null)
      assert.equal(frame.price, null)
    }
  }
})

test('dependency comparisons change focus without inventing language efficiency or quality measurements', () => {
  const language = tokenizationFrame(3, { dependency: 'language' }), content = tokenizationFrame(3, { dependency: 'content' })
  assert.deepEqual(language.tokens, content.tokens)
  for (const frame of [language, content]) {
    assert.equal(frame.languageRatio, null)
    assert.equal(frame.qualityJudgment, null)
    assert.equal(frame.measuredUsage, null)
  }
})

test('all stages have static meaning and source character positions stay fixed across comparisons', () => {
  assert.equal(TOKENIZATION_STAGES.length, 7)
  const source = tokenizationFrame(0).characters
  for (let stage = 0; stage < 7; stage++) {
    for (const vocabulary of ['a', 'b']) {
      const frame = tokenizationFrame(stage, { vocabulary })
      assert.deepEqual(frame.characters, source)
      assert.ok(frame.title && frame.detail && frame.formula)
      assert.ok(frame.segments.every(s => s.width > 0 && s.x >= 80 && s.x + s.width <= 560))
    }
  }
  const frame = tokenizationFrame(4, { vocabulary: 'b' })
  frame.tokens[0].piece = 'changed'
  assert.equal(tokenizationFrame(4, { vocabulary: 'b' }).tokens[0].piece, 'tok')
})

test('invalid stages, choices, IDs and occurrence prefixes fail explicitly', () => {
  for (const stage of [-1, 7, 1.5, NaN, Infinity]) assert.throws(() => tokenizationFrame(stage), /stage/)
  for (const options of [null, [], 'a']) assert.throws(() => tokenizationFrame(0, options), /Options/)
  for (const key of ['vocabulary', 'boundary', 'dependency', 'measurement']) assert.throws(() => tokenizationFrame(0, { [key]: 'invalid' }), /Unknown/)
  assert.throws(() => fixtureTokens('a', ''), /prefix/)
  assert.throws(() => decodeFixture('a', [999]), /vocabulary/)
  assert.throws(() => decodeFixture('a', '12'), /array/)
})
