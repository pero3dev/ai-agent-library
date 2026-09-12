import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AUDIO_STORAGE_KEY, audioProblemReportUrl, createAudioController, formatTime, normalizeArticleRoute, readSavedState
} from '../../lib/audio-player.mjs'

const episodes = ['a', 'b', 'c'].map(id => ({
  id, title: `Article ${id}`, duration_seconds: 180, audio_url: `https://example.invalid/${id}.mp3`,
  chapters: [{ id: 'intro', title: 'Intro', start_seconds: 0 }]
}))
class FakeAudio extends EventTarget {
  currentTime = 0
  duration = 180
  readyState = 0
  playbackRate = 1
  loadCount = 0
  playCount = 0
  paused = true
  src = ''
  load() { this.loadCount++; this.readyState = 0; this.currentTime = 0 }
  play() { this.playCount++; this.paused = false; return Promise.resolve() }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')) }
  removeAttribute(name) { if (name === 'src') this.src = '' }
  event(name) { if (name === 'loadedmetadata') this.readyState = 1; this.dispatchEvent(new Event(name)) }
}
function setup(saved, extras = {}) {
  const audio = new FakeAudio()
  const items = new Map(saved ? [[AUDIO_STORAGE_KEY, JSON.stringify(saved)]] : [])
  const storage = { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value) }
  const player = createAudioController({ audio, episodes, storage, ...extras })
  return { audio, player, items, state: () => player.getSnapshot() }
}

test('time and deployment routes normalize without stripping a partial prefix', () => {
  assert.equal(formatTime(3662), '1:01:02')
  assert.equal(formatTime(NaN), '0:00')
  assert.equal(normalizeArticleRoute('/library/docs/concepts/a.html?x=1', '/library'), '/docs/concepts/a')
  assert.equal(normalizeArticleRoute('/library-other/docs/', '/library'), '/library-other/docs')
})
test('problem report is an unsent issue URL with the exact public episode revision and time', () => {
  const url = new URL(audioProblemReportUrl({ id: 'episode-1', title: '題名 & 条件', route: '/docs/concepts/a', source_digest: 'revision' }, 75))
  assert.equal(url.origin + url.pathname, 'https://github.com/pero3dev/ai-agent-library/issues/new')
  assert.equal(url.searchParams.get('title'), '[音声] 題名 & 条件 の内容について')
  assert.match(url.searchParams.get('body'), /音声 ID: episode-1\n/)
  assert.match(url.searchParams.get('body'), /元記事の版: revision\n再生時刻: 1:15/)
})
test('invalid storage recovers and stale versions never receive another version position', () => {
  assert.match(readSavedState('{', episodes).notice, /初期状態/)
  const value = readSavedState(JSON.stringify({ schema_version: 1, queue: ['a-old', 'a', 'a'], currentId: 'a-old', positions: { 'a-old': 90, a: -1, b: Infinity }, rate: 20 }), episodes)
  assert.deepEqual(value.queue, ['a'])
  assert.equal(value.currentId, null)
  assert.deepEqual(value.positions, {})
  assert.equal(value.rate, 1)
  assert.match(value.notice, /新しい版/)
})
test('restore preserves position and rate without loading media or autoplay', () => {
  const { audio, player, state } = setup({ schema_version: 1, queue: ['a'], currentId: 'a', positions: { a: 71 }, rate: 1.5 })
  assert.equal(state().position, 71)
  assert.equal(audio.loadCount, 0)
  assert.equal(audio.playCount, 0)
  player.play()
  audio.event('loadedmetadata')
  assert.equal(audio.currentTime, 71)
  assert.equal(audio.playbackRate, 1.5)
})
test('enqueue deduplicates and start does not replace the user ordered list', () => {
  const { player, state } = setup()
  player.enqueue(['b', 'unknown', 'b'])
  player.start('a', ['a', 'c'])
  assert.deepEqual(state().queue, ['b', 'a', 'c'])
  assert.equal(state().currentId, 'a')
})
test('move affects next playback and media element is reused', () => {
  const { audio, player, state } = setup()
  player.start('a', ['a', 'b', 'c'])
  player.move('c', -1)
  player.move('a', -1)
  assert.deepEqual(state().queue, ['a', 'c', 'b'])
  audio.event('loadedmetadata')
  audio.currentTime = 180
  audio.event('ended')
  assert.equal(state().currentId, 'c')
  assert.equal(audio.src, episodes[2].audio_url)
  assert.equal(audio.playCount, 2)
})
test('finishing last episode stops and replay starts at zero', () => {
  const { audio, player, state, items } = setup()
  player.start('a')
  audio.event('loadedmetadata')
  audio.currentTime = 180
  audio.ended = true
  audio.event('ended')
  assert.equal(state().playing, false)
  assert.equal(JSON.parse(items.get(AUDIO_STORAGE_KEY)).positions.a, 0)
  player.play()
  assert.equal(audio.currentTime, 0)
})
test('seeking before metadata waits and clamps to actual media duration', () => {
  const { audio, player, state } = setup()
  player.start('a')
  player.seek(190)
  assert.equal(audio.currentTime, 0)
  audio.duration = 160
  audio.event('loadedmetadata')
  assert.equal(state().position, 160)
  assert.equal(audio.currentTime, 160)
  player.seek(-20)
  assert.equal(audio.currentTime, 0)
})
test('resume retries a temporarily unseekable stream when canplay arrives, then follows media time', () => {
  const { audio, player, state } = setup({ schema_version: 1, queue: ['a'], currentId: 'a', positions: { a: 80 }, rate: 1 })
  let actualTime = 0
  let seekable = false
  Object.defineProperty(audio, 'currentTime', {
    get: () => actualTime,
    set(value) { if (!seekable && value > 0) throw new DOMException('not seekable yet', 'InvalidStateError'); actualTime = value }
  })
  player.play()
  audio.event('loadedmetadata')
  assert.equal(actualTime, 0)
  assert.equal(state().position, 80)
  actualTime = 1
  audio.event('timeupdate')
  assert.equal(state().position, 80)
  seekable = true
  audio.event('canplay')
  assert.equal(actualTime, 80)
  actualTime = 81
  audio.event('timeupdate')
  assert.equal(state().position, 81)
})
test('pause persists exact progress and switching episodes resumes independently', () => {
  const { audio, player, state, items } = setup()
  player.start('a')
  audio.event('loadedmetadata')
  audio.currentTime = 57
  audio.event('timeupdate')
  player.pause()
  assert.equal(JSON.parse(items.get(AUDIO_STORAGE_KEY)).positions.a, 57)
  player.start('b')
  audio.event('loadedmetadata')
  assert.equal(state().position, 0)
  player.start('a')
  audio.event('loadedmetadata')
  assert.equal(audio.currentTime, 57)
})
test('removing current keeps remaining list paused and removing final unloads media', () => {
  const { audio, player, state } = setup()
  player.start('a', ['a', 'b'])
  player.remove('a')
  assert.equal(state().currentId, 'b')
  assert.equal(audio.playCount, 1)
  assert.equal(state().playing, false)
  player.remove('b')
  assert.equal(state().current, null)
  assert.deepEqual(state().queue, [])
  assert.equal(audio.src, '')
})
test('storage exceptions are visible but do not prevent playback', () => {
  const { player, state } = setup(null, { storage: { getItem() { throw new Error('blocked') } } })
  player.start('a')
  assert.equal(state().storageAvailable, false)
  assert.equal(state().currentId, 'a')
})
test('play rejection explains gesture requirement and keeps saved location for retry', async () => {
  const { audio, player, state } = setup()
  audio.play = () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
  player.start('a')
  await Promise.resolve()
  assert.match(state().error, /再生ボタン/)
  assert.equal(state().loading, false)
})
test('an old play rejection cannot overwrite a newly selected episode', async () => {
  const { audio, player, state } = setup()
  let reject
  audio.play = () => new Promise((_, value) => { reject = value })
  player.start('a')
  const rejectFirst = reject
  player.start('b')
  rejectFirst(new Error('old failure'))
  await Promise.resolve()
  assert.equal(state().error, '')
  assert.equal(state().currentId, 'b')
})
test('media errors reload the same episode and preserve progress', () => {
  const { audio, player, state } = setup()
  player.start('a')
  audio.event('loadedmetadata')
  player.seek(90)
  audio.event('error')
  assert.match(state().error, /読み込めません/)
  player.play()
  audio.event('loadedmetadata')
  assert.equal(audio.currentTime, 90)
  assert.equal(audio.loadCount, 2)
})
test('Media Session seek/next controls use same player, unsupported actions are tolerated', () => {
  const actions = new Map()
  const mediaSession = { setActionHandler(name, handler) { if (name === 'stop') throw new Error('unsupported'); actions.set(name, handler) }, setPositionState() {} }
  const { audio, player, state } = setup(null, { mediaSession, MediaMetadataClass: class { constructor(value) { Object.assign(this, value) } } })
  player.start('a', ['a', 'b'])
  audio.event('loadedmetadata')
  actions.get('seekforward')({})
  assert.equal(state().position, 15)
  actions.get('seekto')({ seekTime: 60 })
  assert.equal(state().position, 60)
  actions.get('nexttrack')()
  assert.equal(state().currentId, 'b')
  player.destroy()
  assert.equal(actions.get('play'), null)
  assert.equal(audio.paused, true)
})
