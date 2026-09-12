import assert from 'node:assert/strict'
import { test } from 'node:test'
import { audioSourceDigest, buildAudioCatalog, isAudioAssetUrl, validateAudioCatalog } from '../../lib/audio-catalog.mjs'

const hash = 'a'.repeat(64)
const article = { article_path: 'docs/01-concepts/agent-loop.md', title: 'ループ', route: '/docs/concepts/agent-loop', section: 'concepts', section_title: '基礎概念', source_digest: hash }
const episode = { id: 'agent-loop-abc-1', article_path: article.article_path, source_digest: hash, title: 'ループの仕組み', part: 1, parts: 1, audio_url: 'https://github.com/pero3dev/ai-agent-library/releases/download/audio-abc/agent-loop.mp3', duration_seconds: 120, chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }, { id: 'design', title: '設計', start_seconds: 60 }], published_at: '2026-09-13T00:00:00Z', audio_sha256: hash, script_sha256: hash, voices: [{ id: 1, name: '女性1', role: 'listener' }, { id: 7, name: '男性1', role: 'explainer' }], attribution: 'VOICEVOX Nemo' }
const catalog = episodes => ({ schema_version: 1, updated_at: null, episodes })

test('article hash is independent of Windows line endings but detects body changes', () => {
  assert.equal(audioSourceDigest('a\r\nb\r\n'), audioSourceDigest('a\nb\n'))
  assert.notEqual(audioSourceDigest('a\nb\n'), audioSourceDigest('a\nc\n'))
})
test('keeps old audio with stale flag, removes unpublished article and strips local artifact fields', () => {
  const result = buildAudioCatalog(catalog([{ ...episode, audio_file: 'C:/private/audio.mp3' }]), [{ ...article, source_digest: 'b'.repeat(64) }])
  assert.equal(result.episodes[0].stale, true)
  assert.equal(result.episodes[0].route, article.route)
  assert.equal(result.episodes[0].audio_file, undefined)
  assert.equal(buildAudioCatalog(catalog([episode]), []).episodes.length, 0)
  assert.equal(buildAudioCatalog(catalog([episode]), [article]).episodes[0].stale, false)
})
test('requires complete multipart versions and unique IDs and disallows mixed script/source versions', () => {
  assert.deepEqual(validateAudioCatalog(catalog([episode])), [])
  assert.ok(validateAudioCatalog(catalog([{ ...episode, parts: 2 }])).length)
  const pair = [{ ...episode, parts: 2 }, { ...episode, id: 'part-two', part: 2, parts: 2 }]
  assert.deepEqual(validateAudioCatalog(catalog(pair)), [])
  assert.ok(validateAudioCatalog(catalog([pair[0], { ...pair[1], script_sha256: 'b'.repeat(64) }])).length)
  assert.ok(validateAudioCatalog(catalog([episode, episode])).length)
})
test('rejects malformed media, voice metadata and invalid chapter offsets', () => {
  for (const change of [{ duration_seconds: 0 }, { duration_seconds: Infinity }, { voices: [] }, { attribution: '' }, { audio_sha256: '' }, { chapters: [{ id: 'end', title: '終了', start_seconds: 120 }] }, { chapters: [episode.chapters[0], episode.chapters[0]] }]) {
    assert.ok(validateAudioCatalog(catalog([{ ...episode, ...change }])).length, JSON.stringify(change))
  }
})
test('only accepts the pinned repository release MP3 URL, without credentials or query strings', () => {
  assert.equal(isAudioAssetUrl(episode.audio_url), true)
  for (const url of ['javascript:alert(1)', episode.audio_url.replace('github.com', 'github.com.evil.invalid'), episode.audio_url.replace('pero3dev', 'another'), `${episode.audio_url}?token=secret`, episode.audio_url.replace('https:', 'http:'), episode.audio_url.replace('github.com', 'user:password@github.com')]) assert.equal(isAudioAssetUrl(url), false)
})
