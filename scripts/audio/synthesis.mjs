import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execute } from './claude.mjs'
import { PrerequisiteError, readGeneratedJson, sha256, splitSpeech, writeJson } from './core.mjs'

export function engineBase(value) {
  const url = new URL(value)
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new PrerequisiteError('VOICEVOX must use a local loopback HTTP endpoint')
  return url.origin
}
export async function engineRequest(base, endpoint, options = {}, request = fetch) {
  const response = await request(`${engineBase(base)}${endpoint}`, { ...options, signal: AbortSignal.timeout(180_000) })
  if (!response.ok) throw new Error(`VOICEVOX ${endpoint.split('?')[0]} returned ${response.status}`)
  return response
}
export async function checkEngine(config, { request = fetch } = {}) {
  const speakers = await (await engineRequest(config.engine_url, '/speakers', {}, request)).json()
  const version = await (await engineRequest(config.engine_url, '/version', {}, request)).json()
  const voices = []
  for (const role of ['listener', 'explainer']) {
    const voice = config.voices?.[role]
    if (!Number.isInteger(voice?.speaker_id) || !voice.name || !/^https:\/\//.test(voice.license_url ?? '')) throw new PrerequisiteError(`Configure a verified voice ID, name and license_url for ${role}`)
    const actual = speakers.find(speaker => speaker.styles?.some(style => style.id === voice.speaker_id))
    if (!actual) throw new PrerequisiteError(`Configured VOICEVOX speaker ${voice.speaker_id} is unavailable`)
    if (actual.name !== voice.name) throw new PrerequisiteError(`VOICEVOX name mismatch for ${role}; expected ${voice.name}, got ${actual.name}`)
    voices.push({ id: voice.speaker_id, name: voice.name, role, license_url: voice.license_url })
  }
  if (voices[0].id === voices[1].id) throw new PrerequisiteError('Use two distinct speaker IDs')
  if (!config.attribution?.trim()) throw new PrerequisiteError('Voice attribution must be configured before producing public audio')
  return { version, voices }
}
export async function probeAudio(file, config, { run = execute } = {}) {
  const result = await run(config.ffprobe_path, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,sample_rate,channels', '-of', 'json', file], { timeout: 60_000 })
  if (result.code) throw new Error(`ffprobe failed: ${result.stderr.slice(0, 300)}`)
  const info = JSON.parse(result.stdout), duration = Number(info.format?.duration)
  if (!Number.isFinite(duration) || duration <= 0 || !info.streams?.some(stream => stream.codec_type === 'audio')) throw new Error('Audio has no valid stream or duration')
  return { duration, streams: info.streams }
}
export function evaluateSignal(duration, stderr, characterCount) {
  const intervals = [...stderr.matchAll(/silence_duration:\s*([\d.]+)/g)].map(match => Number(match[1]))
  const silence = intervals.reduce((sum, value) => sum + value, 0)
  const problems = []
  if (silence > duration * 0.4) problems.push('音声の40%以上が無音です')
  if (intervals.some(value => value > 5)) problems.push('5秒を超える無音が含まれます')
  if (duration < characterCount / 25 || duration > characterCount / 1.2 + 10) problems.push('発話文字数と音声の長さが大きく不整合です')
  return { passed: problems.length === 0, duration_seconds: duration, silence_seconds: silence, character_count: characterCount, issues: problems }
}
async function inspectSignal(file, config, characterCount, run) {
  const info = await probeAudio(file, config, { run })
  const result = await run(config.ffmpeg_path, ['-hide_banner', '-nostdin', '-i', file, '-af', 'silencedetect=noise=-45dB:d=0.3', '-f', 'null', '-'], { timeout: 10 * 60_000 })
  if (result.code) throw new Error(`Audio decode/signal check failed: ${result.stderr.slice(-500)}`)
  const checks = evaluateSignal(info.duration, result.stderr, characterCount)
  if (!checks.passed) throw new Error(checks.issues.join('; '))
  return checks
}
async function synthesizeChunk(text, role, config, engine, cacheDir, { run, request, force = false }) {
  const voice = config.voices[role]
  const signature = sha256(JSON.stringify({ text, speaker_id: voice.speaker_id, engine: engine.version, synthesis: config.synthesis }))
  const file = path.join(cacheDir, `${signature}.wav`), metadataFile = `${file}.json`
  const cached = await readGeneratedJson(metadataFile)
  if (!force && cached?.signature === signature) {
    try {
      if (sha256(await readFile(file)) === cached.sha256 && cached.duration_seconds > 0) return { file, ...cached }
    } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  const queryParams = new URLSearchParams({ text, speaker: String(voice.speaker_id) })
  const query = await (await engineRequest(config.engine_url, `/audio_query?${queryParams}`, { method: 'POST' }, request)).json()
  query.speedScale = config.synthesis.speed_scale; query.outputSamplingRate = 24000; query.outputStereo = false
  query.prePhonemeLength = 0.04; query.postPhonemeLength = 0.16
  const response = await engineRequest(config.engine_url, `/synthesis?speaker=${voice.speaker_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(query) }, request)
  const audio = Buffer.from(await response.arrayBuffer())
  if (audio.length < 48 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') throw new Error('VOICEVOX did not return a WAV file')
  await writeFile(file, audio)
  const info = await probeAudio(file, config, { run })
  const checks = evaluateSignal(info.duration, '', text.length)
  if (!checks.passed) throw new Error(`Chunk duration check failed: ${checks.issues.join('; ')}`)
  const metadata = { signature, sha256: sha256(audio), duration_seconds: info.duration, character_count: text.length }
  await writeJson(metadataFile, metadata)
  return { file, ...metadata }
}

// Keep whole utterances together when a chapter needs more than one episode.
// Measured durations are recalculated after repairs, since regenerated speech may differ.
export function groupAudioChapters(chapters, maximumSeconds = 3600) {
  if (!Number.isFinite(maximumSeconds) || maximumSeconds <= 0) throw new Error('Invalid episode duration limit')
  const usedIds = new Set(chapters.map(chapter => chapter.id)), split = []
  for (const chapter of chapters) {
    const turns = []
    for (const chunk of chapter.chunks) {
      if (!Number.isFinite(chunk.duration_seconds) || chunk.duration_seconds <= 0) throw new Error(`Invalid speech duration: ${chapter.id}`)
      const previous = turns.at(-1)
      if (previous && previous.index === chunk.turn_index) previous.chunks.push(chunk)
      else turns.push({ index: chunk.turn_index, chunks: [chunk] })
    }
    const segments = [[]]
    for (const turn of turns) {
      const duration = turn.chunks.reduce((sum, chunk) => sum + chunk.duration_seconds, 0)
      if (duration > maximumSeconds) throw new Error(`A single utterance exceeds ${maximumSeconds} seconds and cannot be split at an utterance boundary: ${chapter.id}, turn ${turn.index + 1}`)
      const segment = segments.at(-1)
      if (segment.length && segment.reduce((sum, chunk) => sum + chunk.duration_seconds, 0) + duration > maximumSeconds) segments.push([...turn.chunks])
      else segment.push(...turn.chunks)
    }
    if (!segments[0].length) throw new Error(`Chapter contains no speech: ${chapter.id}`)
    for (const [index, chunks] of segments.entries()) {
      let id = chapter.id
      if (index) {
        let suffix = index + 1
        do { id = `${chapter.id}-continued-${suffix++}` } while (usedIds.has(id))
        usedIds.add(id)
      }
      split.push({ id, title: segments.length > 1 ? `${chapter.title} (${index + 1}/${segments.length})` : chapter.title, chunks, duration: chunks.reduce((sum, chunk) => sum + chunk.duration_seconds, 0) })
    }
  }
  const groups = [[]]
  for (const chapter of split) {
    const group = groups.at(-1)
    if (group.length && group.reduce((sum, item) => sum + item.duration, 0) + chapter.duration > maximumSeconds) groups.push([chapter])
    else group.push(chapter)
  }
  return groups
}

async function repairPartChunks(group, chapters, config, engine, cacheDir, { run, request }) {
  // A bad MP3 alone does not justify replacing valid speech or completed episodes.
  const unique = new Map(group.flatMap(chapter => chapter.chunks).map(chunk => [chunk.signature, chunk]))
  for (const chunk of unique.values()) {
    let valid = false
    try {
      if (sha256(await readFile(chunk.file)) === chunk.sha256) {
        const signal = await inspectSignal(chunk.file, config, chunk.character_count, run)
        valid = Math.abs(signal.duration_seconds - chunk.duration_seconds) <= 0.05
      }
    } catch { /* Regenerate only the source fragment that failed inspection. */ }
    if (valid) continue
    const replacement = await synthesizeChunk(chunk.text, chunk.role, config, engine, cacheDir, { run, request, force: true })
    // Identical speech can occur more than once, including in later chapters.
    for (const chapter of chapters) for (const reference of chapter.chunks) if (reference.signature === chunk.signature) Object.assign(reference, replacement)
  }
}

export async function synthesizeScript(script, config, jobDir, engine, { run = execute, request = fetch, progress = () => {} } = {}) {
  const cacheDir = path.join(jobDir, 'chunks')
  await mkdir(cacheDir, { recursive: true })
  const chapters = []
  for (const chapter of script.chapters) {
    const chunks = []
    for (const [turnIndex, turn] of chapter.turns.entries()) {
      for (const text of splitSpeech(turn.text, config.synthesis.max_chunk_chars)) {
        let result
        for (let attempt = 0; attempt <= config.max_repair_attempts; attempt++) {
          try { result = await synthesizeChunk(text, turn.role, config, engine, cacheDir, { run, request }); break } catch (error) { if (attempt === config.max_repair_attempts) throw error }
        }
        chunks.push({ ...result, text, role: turn.role, turn_index: turnIndex })
      }
      await progress({ phase: 'synthesizing', chapter: chapter.id, turn: turnIndex + 1 })
    }
    chapters.push({ id: chapter.id, title: chapter.title, chunks, duration: chunks.reduce((sum, chunk) => sum + chunk.duration_seconds, 0) })
  }
  const groups = groupAudioChapters(chapters)
  const outputs = []
  for (let index = 0; index < groups.length; index++) {
    const part = index + 1, output = path.join(jobDir, `part-${String(part).padStart(2, '0')}.mp3`)
    const concatFile = path.join(jobDir, `part-${part}.concat.txt`)
    for (let attempt = 0; attempt <= config.max_repair_attempts; attempt++) {
      try {
        if (attempt) {
          await progress({ phase: 'repairing-audio', part, repair_attempt: attempt })
          await repairPartChunks(groups[index], chapters, config, engine, cacheDir, { run, request })
          // Preserve successful earlier outputs. Repack only the remaining speech if
          // regenerated durations move chapter markers or cross an episode boundary.
          groups.splice(index, groups.length - index, ...groupAudioChapters(groups.slice(index).flat()))
        }
        const group = groups[index], chunks = group.flatMap(chapter => chapter.chunks)
        const concat = chunks.map(chunk => `file '${chunk.file.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`).join('\n')
        await writeFile(concatFile, `${concat}\n`, 'utf8')
        const encoded = await run(config.ffmpeg_path, ['-hide_banner', '-nostdin', '-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-vn', '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7', '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', `${config.synthesis.bitrate_kbps}k`, '-map_metadata', '-1', output], { timeout: 30 * 60_000 })
        if (encoded.code) throw new Error(`MP3 encode failed: ${encoded.stderr.slice(-500)}`)
        const signal = await inspectSignal(output, config, chunks.reduce((sum, chunk) => sum + chunk.character_count, 0), run)
        const expectedDuration = group.reduce((sum, chapter) => sum + chapter.duration, 0)
        if (Math.abs(signal.duration_seconds - expectedDuration) > Math.max(1, expectedDuration * 0.01)) throw new Error('Encoded audio lost or repeated chunks')
        let offset = 0
        const markers = group.map(chapter => { const marker = { id: chapter.id, title: chapter.title, start_seconds: Number(offset.toFixed(3)) }; offset += chapter.duration; return marker })
        outputs.push({ part, audio_file: output, audio_sha256: sha256(await readFile(output)), duration_seconds: signal.duration_seconds, chapters: markers, signal })
        break
      } catch (error) {
        if (attempt === config.max_repair_attempts) throw new Error(`Audio repair limit reached for part ${part}: ${error.message}`, { cause: error })
      }
    }
  }
  return outputs.map(output => ({ ...output, parts: outputs.length }))
}
