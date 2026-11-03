import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeCatalog, decodeChecks, decodeFullPr, decodeQueue, decodeRefresh, decodePreparedRefresh, decodeRelease, parsePublicationJson } from '../../scripts/audio/publication-json.mts'

test('publication decoders check every untrusted list item and scalar before naming its type', () => {
  assert.throws(() => decodeChecks({ total_count: 1, check_runs: [false] }), /structure/)
  assert.throws(() => decodeChecks({ total_count: '1', check_runs: [] }), /structure/)
  assert.throws(() => decodeRelease({ tag_name: 'audio', draft: false, assets: [{ name: 'audio.mp3', size: '100' }] }), /structure/)
  assert.throws(() => parsePublicationJson('{"state":"OPEN"}', decodeFullPr), /structure/)
})

test('catalog decoding preserves legacy string speaker IDs, optional license metadata and raw key order', () => {
  const episode = { id: 'episode', article_path: 'docs/01-concepts/agent-loop.md', source_digest: 'a'.repeat(64), title: '音声', part: 1, parts: 1,
    duration_seconds: 1, chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }], audio_sha256: 'b'.repeat(64), script_sha256: 'c'.repeat(64),
    voices: [{ id: 'legacy-voice', name: '声', role: 'listener' }], attribution: 'credit', audio_url: 'https://example.invalid/audio.mp3', published_at: '2026-11-03' }
  const catalog = { episodes: [episode], schema_version: 1, updated_at: null, extra: 'retained' }
  const before = JSON.stringify(catalog)
  assert.equal(decodeCatalog(catalog), catalog)
  assert.equal(JSON.stringify(catalog), before)
  assert.throws(() => decodeCatalog({ ...catalog, episodes: [{ ...episode, voices: [false] }] }), /structure/)
})

test('PR decoding requires consumed fields and permits URL omission in the metadata-only query', () => {
  const pr = { number: 1, state: 'OPEN', headRefOid: 'a'.repeat(40), headRefName: 'branch', baseRefName: 'main', isCrossRepository: false, title: 'title', body: 'body' }
  assert.equal(decodeFullPr(pr), pr)
  assert.throws(() => decodeFullPr({ ...pr, isCrossRepository: 'false' }), /structure/)
  assert.throws(() => decodeFullPr({ ...pr, files: [{ path: 4 }] }), /structure/)
})

test('incomplete historical refresh phases remain readable while prepared execution needs complete evidence', () => {
  const history = { status: 'closing-obsolete', number: 1, previous_head: 'a'.repeat(40), regeneration: [] }
  assert.equal(decodeRefresh(history), history)
  assert.throws(() => decodePreparedRefresh(history), /structure/)
  assert.throws(() => decodeRefresh({ status: 'prepared', previous_head: 'a'.repeat(40) }), /structure/)
})

test('publication keeps partial queue history and treats missing consumed fields as absent', () => {
  const queue = { jobs: { legacy: { status: 'held' }, old: {} }, extra: 'retained' }
  assert.equal(decodeQueue(queue), queue)
  assert.deepEqual(decodeQueue({}), {})
  assert.throws(() => decodeQueue({ jobs: { legacy: { status: 1 } } }), /structure/)
})
