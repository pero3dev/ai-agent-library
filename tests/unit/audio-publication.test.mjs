import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AUDIO_REPOSITORY, assetCoordinates, mergeCatalog, probePublicAsset, publishAssets, queueCatalogMerge, runPublication, selectPublicationBatches, validateReady, validateSource } from '../../scripts/audio/publication.mjs'

const sha = data => createHash('sha256').update(data).digest('hex')
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'audio-publication-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const stateDir = path.join(root, '.state')
  mkdirSync(path.join(root, 'docs', '01-concepts'), { recursive: true })
  mkdirSync(path.join(root, 'website', 'audio'), { recursive: true })
  mkdirSync(stateDir)
  const source = '---\ntitle: 音声試験\nstatus: published\n---\n\n## 仕組み\n\n説明。\n'
  const articlePath = 'docs/01-concepts/agent-loop.md'
  writeFileSync(path.join(root, articlePath), source)
  writeFileSync(path.join(root, 'website/audio/catalog.json'), JSON.stringify({ schema_version: 1, updated_at: null, episodes: [] }))
  const audio = Buffer.from('ID3 synthetic fixture bytes only')
  const audioFile = path.join(stateDir, 'part01.mp3')
  writeFileSync(audioFile, audio)
  const script = { chapters: [{ id: 'intro', title: '導入', source_sections: ['s001'], turns: [{ role: 'listener', text: 'これは何ですか。' }, { role: 'explainer', text: '最初に仕組みを説明します。' }] }, { id: 'recap', title: 'まとめ', source_sections: [], turns: [{ role: 'listener', text: '要点を振り返ります。' }, { role: 'explainer', text: '理解できたことを整理しましょう。' }] }] }
  script.chapters[0].turns[1].text += 'これは台本の内容量を検証するための固定された試験入力です。'.repeat(12)
  const sourceHash = sha(source), scriptHash = sha(JSON.stringify(script))
  writeFileSync(path.join(stateDir, 'script.json'), JSON.stringify(script, null, 2))
  const episode = { id: 'agent-loop-version-p01', article_path: articlePath, source_digest: sourceHash, title: '音声試験', part: 1, parts: 1, duration_seconds: 60, chapters: [{ id: 'start', title: '導入', start_seconds: 0 }], audio_sha256: sha(audio), script_sha256: scriptHash, voices: [{ id: 1, name: '聞き手', role: 'listener', license_url: 'https://voicevox.hiroshiba.jp/term/' }, { id: 2, name: '解説者', role: 'explainer', license_url: 'https://voicevox.hiroshiba.jp/term/' }], attribution: 'VOICEVOX', audio_file: audioFile }
  const manifest = { schema_version: 1, article_path: articlePath, source_digest: sourceHash, created_at: '2026-09-13T00:00:00Z', review: { passed: true, source_digest: sourceHash, script_sha256: scriptHash, issues: [], coverage: [{ source_section: 's001', adequate: true, reason: '仕組みの節を確認した' }], reviewed_at: '2026-09-13T00:00:00Z' }, signal_checks: { passed: true, method: 'ffprobe+ffmpeg-silencedetect', parts: [{ passed: true, duration_seconds: 60, character_count: 100, silence_seconds: 0, issues: [], audio_sha256: sha(audio) }] }, episodes: [episode] }
  return { root, stateDir, source, audio, episode, manifest }
}

test('publication requires current published source, bound review and complete checked audio', t => {
  const { root, stateDir, manifest, source } = fixture(t)
  assert.equal(validateReady(manifest, { root, stateDir }).episodes.length, 1)
  assert.throws(() => validateSource(manifest.article_path, source.replace('説明', '変更'), manifest.source_digest), /Source changed/)
  assert.throws(() => validateSource(manifest.article_path, source.replace('published', 'draft'), manifest.source_digest), /published/)
  const failed = structuredClone(manifest)
  failed.review.source_digest = 'a'.repeat(64)
  assert.throws(() => validateReady(failed, { root, stateDir }), /source-bound/)
  failed.review = manifest.review
  failed.episodes[0].parts = 2
  assert.throws(() => validateReady(failed, { root, stateDir }), /complete and ordered/)
  failed.episodes[0].parts = 1
  failed.signal_checks.passed = false
  assert.throws(() => validateReady(failed, { root, stateDir }), /signal checks/)
})

test('publication rejects escaping inputs, altered bytes and missing voice credits', t => {
  const { root, stateDir, manifest } = fixture(t)
  const altered = structuredClone(manifest)
  altered.episodes[0].audio_file = path.join(root, altered.article_path)
  assert.throws(() => validateReady(altered, { root, stateDir }), /escapes/)
  altered.episodes[0] = { ...manifest.episodes[0], audio_sha256: 'b'.repeat(64) }
  assert.throws(() => validateReady(altered, { root, stateDir }), /digest mismatch/)
  altered.episodes[0] = { ...manifest.episodes[0], attribution: '' }
  assert.throws(() => validateReady(altered, { root, stateDir }), /credited voices/)
})

test('publication verifies the stored script and per-part signal evidence rather than pass flags alone', t => {
  const { root, stateDir, manifest } = fixture(t)
  const badSignal = structuredClone(manifest)
  badSignal.signal_checks.parts[0].audio_sha256 = 'b'.repeat(64)
  assert.throws(() => validateReady(badSignal, { root, stateDir }), /Signal evidence/)
  const scriptFile = path.join(stateDir, 'script.json')
  const script = JSON.parse(readFileSync(scriptFile, 'utf8'))
  script.chapters[0].turns[0].text += '変更後の台本です。'
  writeFileSync(scriptFile, JSON.stringify(script))
  assert.throws(() => validateReady(manifest, { root, stateDir }), /script file digest/)
})

test('catalog replacement is atomic for all article parts and retains unrelated audio', t => {
  const { episode } = fixture(t)
  const other = { ...episode, id: 'other', article_path: 'docs/02-patterns/other.md' }
  const old = { ...episode, id: 'old', part: 1, parts: 2 }
  const catalog = { schema_version: 1, updated_at: null, episodes: [old, { ...old, id: 'old-2', part: 2 }, other] }
  const result = mergeCatalog(catalog, [episode], '2026-09-13T00:00:00Z')
  assert.deepEqual(result.episodes.map(item => item.id), [episode.id, 'other'])
  assert.equal(mergeCatalog(result, [episode]), result)
})

test('host probing verifies beginning/end range and complete file digest', async t => {
  const { audio, manifest, episode } = fixture(t)
  const calls = []
  const fetchImpl = async (_url, options) => {
    const range = options.headers?.Range
    calls.push(range ?? 'full')
    if (!range) return new Response(audio)
    const [, startText, endText] = /bytes=(\d+)-(\d+)/.exec(range)
    const start = Number(startText), end = Number(endText)
    return new Response(audio.subarray(start, end + 1), { status: 206, headers: { 'content-range': `bytes ${start}-${end}/${audio.length}`, 'content-type': 'audio/mpeg' } })
  }
  const result = await probePublicAsset(assetCoordinates(manifest, episode).url, { size: audio.length, sha256: sha(audio), fetchImpl })
  assert.equal(result.range, true)
  assert.equal(calls.length, 3)
  await assert.rejects(probePublicAsset(assetCoordinates(manifest, episode).url, { size: audio.length, sha256: sha(audio), fetchImpl: async () => new Response(audio) }), /byte-range/)
  await assert.rejects(probePublicAsset('https://other.invalid/asset.mp3', { size: audio.length, sha256: sha(audio), fetchImpl }), /Unapproved/)
})

test('preexisting content-addressed assets are probed and never overwritten', async t => {
  const { root, stateDir, manifest, episode, audio } = fixture(t)
  const coordinates = assetCoordinates(manifest, episode)
  const calls = []
  const run = (binary, args) => {
    calls.push([binary, ...args])
    return JSON.stringify({ tag_name: coordinates.tag, draft: false, assets: [{ name: coordinates.name, size: audio.length, created_at: '2026-09-13T00:00:00Z' }] })
  }
  const output = await publishAssets(manifest, { root, stateDir, run, probe: async (url, parameters) => ({ url, ...parameters, range: true }) })
  assert.equal(output[0].audio_url, coordinates.url)
  assert.equal(Object.hasOwn(output[0], 'audio_file'), false)
  assert.equal(calls.some(call => call.includes('upload')), false)
  assert.equal(calls.some(call => call.includes('--clobber')), false)
  await assert.rejects(publishAssets(manifest, { root, stateDir, run, probe: async () => { throw new Error('range failed') } }), /range failed/)
})

test('authentication/network errors reading release cannot create a duplicate release', async t => {
  const { root, stateDir, manifest } = fixture(t)
  const calls = []
  await assert.rejects(publishAssets(manifest, { root, stateDir, run: (binary, args) => { calls.push([binary, ...args]); throw new Error('HTTP 403') } }), /403/)
  assert.equal(calls.length, 1)
})

test('chapter batches wait, release completed leftovers, and do not let held articles block them', t => {
  const { manifest } = fixture(t)
  const otherPath = 'docs/01-concepts/other.md'
  const articles = [{ article_path: manifest.article_path, source_digest: manifest.source_digest }, { article_path: otherPath, source_digest: 'c'.repeat(64) }]
  const catalog = { schema_version: 1, episodes: [] }
  assert.equal(selectPublicationBatches([manifest], { articles, catalog }).selected.length, 0)
  const queue = { jobs: { [otherPath]: { status: 'held', source_digest: 'c'.repeat(64) } } }
  assert.equal(selectPublicationBatches([manifest], { articles, catalog, queue }).selected.length, 1)
  assert.equal(selectPublicationBatches([manifest], { articles: articles.slice(0, 1), catalog }).selected.length, 1)
  assert.equal(selectPublicationBatches([manifest], { articles, catalog: { ...catalog, episodes: manifest.episodes } }).selected.length, 0)
})

test('cataloged article updates proceed without waiting for an initial batch', t => {
  const { manifest } = fixture(t)
  const catalog = { schema_version: 1, episodes: [{ ...manifest.episodes[0], id: 'old-version' }] }
  assert.equal(selectPublicationBatches([manifest], { articles: [], catalog }).selected.length, 1)
})

test('dry-run never invokes GitHub, uploads, or creates a PR; invalid article does not hide valid articles', async t => {
  const { root, stateDir, manifest } = fixture(t)
  const readyFile = path.join(stateDir, 'ready.json'), invalidFile = path.join(stateDir, 'bad-ready.json')
  writeFileSync(readyFile, JSON.stringify(manifest))
  writeFileSync(invalidFile, JSON.stringify({ ...manifest, review: { passed: false } }))
  const result = await runPublication({ root, stateDir, manifestFiles: [invalidFile, readyFile], run: () => { throw new Error('External command unexpectedly executed') } })
  assert.equal(result.mode, 'dry-run')
  assert.equal(result.ready.length, 1)
  assert.equal(result.held.length, 1)
  assert.equal(result.publications.length, 0)
})

test('auto-merge refuses changed PR head before any merge operation', t => {
  const { root, stateDir } = fixture(t)
  const calls = []
  const pr = { number: 123, state: 'OPEN', headRefOid: 'a'.repeat(40) }
  assert.throws(() => queueCatalogMerge(pr, { root, stateDir, run: (binary, args) => { calls.push([binary, ...args]); return JSON.stringify({ state: 'OPEN', headRefOid: 'b'.repeat(40) }) } }), /identity changed/)
  assert.equal(calls.some(call => call.includes('merge')), false)
})

test('pending catalog PR prevents another batch from uploading or creating a PR', async t => {
  const { root, stateDir } = fixture(t)
  const pending = { number: 123, url: `https://github.com/${AUDIO_REPOSITORY}/pull/123`, state: 'OPEN', headRefOid: 'a'.repeat(40) }
  mkdirSync(path.join(stateDir, 'publication'))
  writeFileSync(path.join(stateDir, 'publication/pending-pr.json'), JSON.stringify(pending))
  const calls = []
  const run = (binary, args) => {
    calls.push([binary, ...args])
    if (binary === 'git' && args[0] === 'remote') return `https://github.com/${AUDIO_REPOSITORY}.git`
    if (binary === 'git' && args[0] === 'fetch') return ''
    if (binary === 'gh' && args[0] === 'repo') return JSON.stringify({ nameWithOwner: AUDIO_REPOSITORY, visibility: 'PUBLIC', defaultBranchRef: { name: 'main' } })
    if (binary === 'gh' && args[0] === 'pr' && args[1] === 'view') return JSON.stringify(pending)
    throw new Error('Unexpected command')
  }
  const result = await runPublication({ root, stateDir, apply: true, run, manifestFiles: ['/deliberately/not/read.json'] })
  assert.equal(result.waiting_existing_pr, true)
  assert.equal(calls.some(call => call.includes('upload') || call.includes('create')), false)
})

test('catalog PR behind main is explicitly held before waiting for checks or merging', t => {
  const { root, stateDir } = fixture(t)
  const pr = { number: 123, state: 'OPEN', headRefOid: 'a'.repeat(40) }
  const fresh = { ...pr, title: 'chore(website): 検証済みの記事音声をカタログへ反映する', body: '## 変更内容\n\n検証済み音声を反映します。\n\n## 検証\n\n実音声の配信を確認しました。\n\n## 影響・残件\n\n音声カタログを更新します。\n\nAgent: claude\nCo-authored-by: Claude <noreply@anthropic.com>\n', headRefName: `chore/audio-catalog-${'b'.repeat(20)}`, baseRefName: 'main', files: [{ path: 'website/audio/catalog.json' }], mergeStateStatus: 'BEHIND' }
  const calls = []
  const result = queueCatalogMerge(pr, { root, stateDir, run: (binary, args) => { calls.push([binary, ...args]); return JSON.stringify(fresh) } })
  assert.equal(result.status, 'HELD_BASE_CHANGED')
  assert.equal(calls.length, 1)
})

test('Windows task XML and wrapper dry-run keep registration, publication and engine launch explicit', { skip: process.platform !== 'win32' }, () => {
  const xml = execFileSync('powershell.exe', ['-NoProfile', '-File', path.join(repoRoot, 'scripts/Register-AudioLearningTask.ps1'), '-Mode', 'Xml', '-ProjectRoot', repoRoot], { encoding: 'utf8', windowsHide: true })
  assert.match(xml, /<MultipleInstancesPolicy>IgnoreNew<\/MultipleInstancesPolicy>/)
  assert.match(xml, /<LogonType>InteractiveToken<\/LogonType>/)
  assert.match(xml, /<Priority>7<\/Priority>/)
  assert.match(xml, /<WakeToRun>false<\/WakeToRun>/)
  assert.match(xml, /-WindowStyle Hidden/)
  assert.doesNotMatch(xml, /-Publish|-AutoMerge|ExecutionPolicy Bypass/)
  const output = execFileSync('powershell.exe', ['-NoProfile', '-File', path.join(repoRoot, 'scripts/Invoke-AudioLearning.ps1'), '-ProjectRoot', repoRoot, '-DryRun', '-Publish', '-AutoMerge'], { encoding: 'utf8', windowsHide: true })
  const plan = JSON.parse(output)
  assert.equal(plan.starts_engine, false)
  assert.ok(plan.production.includes('--plan'))
  assert.ok(!plan.publication.includes('--apply'))
  assert.ok(!plan.publication.includes('--auto-merge'))
  assert.equal(AUDIO_REPOSITORY, 'pero3dev/ai-agent-library')
})
