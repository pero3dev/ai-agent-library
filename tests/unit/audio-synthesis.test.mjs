import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { sha256 } from '../../scripts/audio/core.mjs'
import { execute } from '../../scripts/audio/claude.mjs'
import { groupAudioChapters, synthesizeScript } from '../../scripts/audio/synthesis.mjs'

const config = {
  engine_url: 'http://127.0.0.1:50121', ffmpeg_path: 'fixture-ffmpeg', ffprobe_path: 'fixture-ffprobe',
  voices: { listener: { speaker_id: 1 }, explainer: { speaker_id: 2 } },
  synthesis: { speed_scale: 1, max_chunk_chars: 500, bitrate_kbps: 64 }, max_repair_attempts: 2
}
const engine = { version: 'synthetic-test-only' }
const script = { chapters: [
  { id: 'intro', title: '導入', turns: [{ role: 'listener', text: '処理が終わる条件を、初めて学ぶ人向けに説明してください。' }] },
  { id: 'summary', title: 'まとめ', turns: [{ role: 'explainer', text: '停止条件を決めておけば、処理の回数を制限して終了できます。' }] }
] }
async function directory(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'audio-synthesis-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}
const chapter = (id, turns) => ({ id, title: id, chunks: turns.flatMap((durations, turn_index) => durations.map(duration_seconds => ({ duration_seconds, turn_index }))) })

test('long chapters split at whole utterances without dropping or reordering speech', () => {
  const original = [chapter('long', [[900, 900], [900], [900, 900]]), chapter('long-continued-2', [[100]])]
  const grouped = groupAudioChapters(original)
  assert.deepEqual(grouped.map(group => group.map(item => item.duration)), [[2700], [1800, 100]])
  const flattened = grouped.flat()
  assert.deepEqual(flattened.flatMap(item => item.chunks), original.flatMap(item => item.chunks))
  assert.equal(flattened[0].id, 'long')
  assert.equal(new Set(flattened.map(item => item.id)).size, 3)
  assert.deepEqual(flattened.slice(0, 2).map(item => item.title), ['long (1/2)', 'long (2/2)'])
})

test('a single excessive utterance gives an explicit unsplittable reason', () => {
  assert.throws(() => groupAudioChapters([chapter('long-turn', [[1800, 1801]])]), /single utterance.*cannot be split.*long-turn, turn 1/)
})

// These adapters inject media failures; their byte buffers are never learner audio.
function adapters({ speech = () => ({ duration: 8 }), encodedDuration = (_part, _attempt, duration) => duration, finalFailure = () => false, decodeFailure = () => false } = {}) {
  const speechCalls = new Map(), encodes = new Map(), encoded = new Map(), requests = [], progress = []
  const request = async (url, options) => {
    if (url.includes('/audio_query?')) return { ok: true, json: async () => ({ text: new URL(url).searchParams.get('text') }) }
    const text = JSON.parse(options.body).text
    const count = (speechCalls.get(text) ?? 0) + 1
    speechCalls.set(text, count); requests.push(text)
    const value = speech(text, count), wav = Buffer.alloc(64)
    wav.write('RIFF', 0); wav.write('WAVE', 8); wav.writeDoubleLE(value.duration, 16); wav[24] = Number(Boolean(value.bad))
    return { ok: true, arrayBuffer: async () => wav }
  }
  const run = async (command, args) => {
    if (command === config.ffprobe_path) {
      const file = args.at(-1)
      const duration = file.endsWith('.wav') ? (await readFile(file)).readDoubleLE(16) : encoded.get(file).duration
      return { code: 0, stdout: JSON.stringify({ format: { duration }, streams: [{ codec_type: 'audio' }] }), stderr: '' }
    }
    const input = args[args.indexOf('-i') + 1]
    if (args.at(-1).endsWith('.mp3')) {
      const output = args.at(-1), part = Number(output.match(/part-(\d+)/)[1]), attempt = (encodes.get(part) ?? 0) + 1
      encodes.set(part, attempt)
      const files = (await readFile(input, 'utf8')).trim().split('\n').map(line => line.slice(6, -1))
      const buffers = await Promise.all(files.map(file => readFile(file)))
      const duration = encodedDuration(part, attempt, buffers.reduce((sum, bytes) => sum + bytes.readDoubleLE(16), 0))
      encoded.set(output, { duration, bad: buffers.some(bytes => bytes[24]) || finalFailure(part, attempt) })
      await writeFile(output, `synthetic fixture ${part}:${attempt}:${duration}`)
      return { code: 0, stdout: '', stderr: '' }
    }
    if (input.endsWith('.mp3')) {
      const part = Number(input.match(/part-(\d+)/)[1])
      if (decodeFailure(part, encodes.get(part))) return { code: 1, stdout: '', stderr: 'injected truncated MP3 decoder failure' }
    }
    const bad = input.endsWith('.wav') ? (await readFile(input))[24] : encoded.get(input).bad
    return { code: 0, stdout: '', stderr: bad ? 'silence_duration: 6' : '' }
  }
  return { run, request, progress: async message => { progress.push(message) }, speechCalls, encodes, requests, events: progress }
}

test('a final duration mismatch re-encodes without regenerating healthy speech', async t => {
  const deps = adapters({ encodedDuration: (_part, attempt, duration) => duration + (attempt === 1 ? 3 : 0) })
  const outputs = await synthesizeScript(script, config, await directory(t), engine, deps)
  assert.equal(deps.encodes.get(1), 2)
  assert.equal(deps.requests.length, 2)
  assert.equal(outputs[0].duration_seconds, 16)
  assert.equal(outputs[0].audio_sha256, sha256(await readFile(outputs[0].audio_file)))
  assert.equal(deps.events.filter(event => event.phase === 'repairing-audio').length, 1)
})

test('final signal failure repairs only bad speech and recalculates following chapter offsets and hashes', async t => {
  const firstText = script.chapters[0].turns[0].text
  const deps = adapters({ speech: (text, count) => text === firstText ? { duration: count === 1 ? 8 : 5, bad: count === 1 } : { duration: 8 } })
  const outputs = await synthesizeScript(script, config, await directory(t), engine, deps)
  assert.equal(deps.speechCalls.get(firstText), 2)
  assert.equal(deps.speechCalls.get(script.chapters[1].turns[0].text), 1)
  assert.deepEqual(outputs[0].chapters.map(item => item.start_seconds), [0, 5])
  assert.equal(outputs[0].duration_seconds, 13)
  assert.equal(outputs[0].audio_sha256, sha256(await readFile(outputs[0].audio_file)))
})

test('an MP3 decoder failure retries encoding without replacing healthy source fragments', async t => {
  const deps = adapters({ decodeFailure: (_part, attempt) => attempt === 1 })
  const outputs = await synthesizeScript(script, config, await directory(t), engine, deps)
  assert.equal(outputs.length, 1)
  assert.equal(deps.encodes.get(1), 2)
  assert.equal(deps.requests.length, 2)
})

test('persistent final signal failures stop at the configured repair limit', async t => {
  const deps = adapters({ finalFailure: () => true })
  await assert.rejects(synthesizeScript(script, config, await directory(t), engine, deps), /Audio repair limit reached for part 1.*無音/)
  assert.equal(deps.encodes.get(1), 3)
  assert.equal(deps.requests.length, 2)
  assert.equal(deps.events.filter(event => event.phase === 'repairing-audio').length, 2)
})

const longScript = { chapters: [
  { id: 'first', title: '前半', turns: [{ role: 'listener', text: '甲'.repeat(2500) }] },
  { id: 'second', title: '後半', turns: [{ role: 'explainer', text: '乙'.repeat(2500) }] }
] }
test('repairing a later episode preserves an already successful output', async t => {
  const deps = adapters({ speech: () => ({ duration: 400 }), encodedDuration: (part, attempt, duration) => duration + (part === 2 && attempt === 1 ? 50 : 0) })
  const outputs = await synthesizeScript(longScript, config, await directory(t), engine, deps)
  assert.equal(deps.encodes.get(1), 1)
  assert.equal(deps.encodes.get(2), 2)
  assert.deepEqual(outputs.map(item => [item.part, item.parts, item.duration_seconds]), [[1, 2, 2000], [2, 2, 2000]])
  assert.equal(deps.requests.length, 2)
})

test('regenerated duration crossing 60 minutes repacks remaining chapters and final part counts', async t => {
  const deps = adapters({ speech: (text, count) => text.startsWith('甲') ? { duration: count === 1 ? 320 : 418, bad: count === 1 } : { duration: 320 } })
  const outputs = await synthesizeScript(longScript, config, await directory(t), engine, deps)
  assert.deepEqual(outputs.map(item => [item.part, item.parts, item.duration_seconds]), [[1, 2, 2090], [2, 2, 1600]])
  assert.deepEqual(outputs.map(item => item.chapters.map(marker => marker.start_seconds)), [[0], [0]])
  assert.equal(deps.requests.length, 3)
})

// Real FFmpeg acceptance uses generated tones, never human speech or a live TTS service.
function toneWav(duration, silentSeconds = 0) {
  const rate = 24000, count = Math.round(duration * rate), bytes = Buffer.alloc(44 + count * 2)
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8)
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36); bytes.writeUInt32LE(count * 2, 40)
  for (let index = Math.floor(silentSeconds * rate); index < count; index++) bytes.writeInt16LE(Math.round(5000 * Math.sin(2 * Math.PI * 440 * index / rate)), 44 + index * 2)
  return bytes
}
const ffmpeg = process.env.AUDIO_FFMPEG || 'ffmpeg', ffprobe = process.env.AUDIO_FFPROBE || 'ffprobe'
const realToolsAvailable = [ffmpeg, ffprobe].every(command => spawnSync(command, ['-version'], { windowsHide: true, timeout: 10000 }).status === 0)
test('real FFmpeg catches silent source speech, repairs it and verifies the new MP3 duration', { skip: !realToolsAvailable && 'Set AUDIO_FFMPEG and AUDIO_FFPROBE or install them on PATH' }, async t => {
  const firstText = script.chapters[0].turns[0].text, calls = new Map(), events = []
  const request = async (url, options) => {
    if (url.includes('/audio_query?')) return { ok: true, json: async () => ({ text: new URL(url).searchParams.get('text') }) }
    const text = JSON.parse(options.body).text, count = (calls.get(text) ?? 0) + 1
    calls.set(text, count)
    return { ok: true, arrayBuffer: async () => text === firstText ? (count === 1 ? toneWav(8, 6) : toneWav(5)) : toneWav(6) }
  }
  const outputs = await synthesizeScript(script, { ...config, ffmpeg_path: ffmpeg, ffprobe_path: ffprobe }, await directory(t), engine, { run: execute, request, progress: async event => { events.push(event) } })
  assert.equal(calls.get(firstText), 2)
  assert.equal(calls.get(script.chapters[1].turns[0].text), 1)
  assert.equal(outputs[0].chapters[1].start_seconds, 5)
  assert.ok(Math.abs(outputs[0].duration_seconds - 11) < 0.1)
  assert.equal(outputs[0].signal.passed, true)
  assert.equal(outputs[0].audio_sha256, sha256(await readFile(outputs[0].audio_file)))
  assert.equal(events.filter(event => event.phase === 'repairing-audio').length, 1)
})
