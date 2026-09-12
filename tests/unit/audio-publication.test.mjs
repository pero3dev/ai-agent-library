import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AUDIO_REPOSITORY, assetCoordinates, mergeCatalog, probePublicAsset, publishAssets, queueCatalogMerge, reconcileCatalogCandidate, refreshCatalogPr, runPublication, selectPublicationBatches, validateReady, validateReadySupplemental, validateSource } from '../../scripts/audio/publication.mjs'
import { requiredChecks, workflowFor } from '../../scripts/lib/github-policy.mjs'

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

function mergeFixture(t, { target = 'lint', workflowOverrides = {} } = {}) {
  const { root, stateDir } = fixture(t)
  mkdirSync(path.join(stateDir, 'publication'))
  const pr = { number: 123, state: 'OPEN', headRefOid: 'a'.repeat(40), title: 'chore(website): 検証済みの記事音声をカタログへ反映する', body: '## 変更内容\n\n検証済み音声を反映します。\n\n## 検証\n\n実音声の配信を確認しました。\n\n## 影響・残件\n\n音声カタログを更新します。\n\nAgent: claude\nCo-authored-by: Claude <noreply@anthropic.com>\n', headRefName: `chore/audio-catalog-${'b'.repeat(20)}`, baseRefName: 'main', isCrossRepository: false, files: [{ path: 'website/audio/catalog.json' }], mergeStateStatus: 'BLOCKED' }
  const names = [...requiredChecks, 'Audio playback regression']
  const checks = names.map((name, index) => ({ id: 100 + index, name, app: { id: 15368 }, head_sha: pr.headRefOid, status: 'completed', conclusion: 'success', details_url: `https://github.com/${AUDIO_REPOSITORY}/actions/runs/${1000 + index}/job/${100 + index}`, check_suite: { id: 2000 + index } }))
  const workflows = new Map(names.map((name, index) => {
    const expected = name === 'Audio playback regression' ? { path: '.github/workflows/ci.yml', event: 'pull_request' } : workflowFor(name)
    return [String(1000 + index), { head_sha: pr.headRefOid, path: expected.path, event: expected.event, repository: { full_name: AUDIO_REPOSITORY }, head_branch: pr.headRefName, check_suite_id: 2000 + index, display_title: expected.runName ? `${expected.runName}${pr.number}` : pr.title, status: 'completed', conclusion: 'success', ...(name === target ? workflowOverrides : {}) }]
  }))
  const calls = []
  const run = (binary, args) => {
    calls.push([binary, ...args])
    assert.equal(binary, 'gh')
    if (args[0] === 'pr' && args[1] === 'view') return JSON.stringify(pr)
    if (args[0] === 'api' && args[1].endsWith('/branches/main/protection')) return JSON.stringify({ required_status_checks: { strict: true, checks: requiredChecks.map(context => ({ context, app_id: 15368 })) }, enforce_admins: { enabled: true } })
    if (args[0] === 'api' && args[1].endsWith('/check-runs?per_page=100')) return JSON.stringify({ total_count: checks.length, check_runs: checks })
    if (args[0] === 'api' && args[1].includes('/actions/runs/')) return JSON.stringify(workflows.get(args[1].split('/').at(-1)))
    if (args[0] === 'pr' && args[1] === 'merge') return ''
    throw new Error(`Unexpected command: ${binary} ${args.join(' ')}`)
  }
  return { root, stateDir, pr, calls, run }
}

test('auto-merge waits when an individual check passes before its complete workflow', t => {
  const data = mergeFixture(t, { workflowOverrides: { status: 'in_progress', conclusion: null } })
  assert.deepEqual(queueCatalogMerge(data.pr, data), { status: 'WAITING_CHECKS', check: 'lint', workflow_run: '1000' })
  assert.equal(data.calls.some(call => call.includes('merge')), false)
})

test('auto-merge holds a completed failed workflow even when its selected check passes', t => {
  const data = mergeFixture(t, { workflowOverrides: { status: 'completed', conclusion: 'failure' } })
  assert.deepEqual(queueCatalogMerge(data.pr, data), { status: 'HELD_CHECK_FAILED', check: 'lint', workflow_run: '1000', conclusion: 'failure' })
  assert.equal(data.calls.some(call => call.includes('merge')), false)
})

test('waiting workflows still require matching head, workflow, repository, branch, suite and policy PR', t => {
  const changes = [
    { head_sha: 'c'.repeat(40) },
    { path: '.github/workflows/other.yml' },
    { event: 'push' },
    { repository: { full_name: 'another/repository' } },
    { head_branch: 'other-branch' },
    { check_suite_id: 9999 },
    { display_title: 'Harness policy PR #999' }
  ]
  for (const change of changes) {
    const data = mergeFixture(t, { target: Object.hasOwn(change, 'display_title') ? 'harness-policy' : 'lint', workflowOverrides: { status: 'in_progress', conclusion: null, ...change } })
    assert.throws(() => queueCatalogMerge(data.pr, data), /identity mismatch|suite does not match|belongs to another PR/)
    assert.equal(data.calls.some(call => call.includes('merge')), false)
  }
})

test('auto-merge requests an exact-head squash only after every workflow completes successfully', t => {
  const data = mergeFixture(t)
  assert.deepEqual(queueCatalogMerge(data.pr, data), { status: 'MERGE_REQUESTED', head: data.pr.headRefOid })
  const merges = data.calls.filter(call => call.includes('merge'))
  assert.equal(merges.length, 1)
  assert.deepEqual(merges[0].slice(0, 10), ['gh', 'pr', 'merge', '123', '--repo', AUDIO_REPOSITORY, '--auto', '--squash', '--match-head-commit', data.pr.headRefOid])
  assert.match(readFileSync(merges[0][merges[0].indexOf('--body-file') + 1], 'utf8'), /Agent: claude\nCo-authored-by: Claude <noreply@anthropic.com>/)
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

test('merged catalog waits for deployment and resumes using the exported audio page URL', async t => {
  const { root, stateDir } = fixture(t)
  const pending = { number: 123, url: `https://github.com/${AUDIO_REPOSITORY}/pull/123`, state: 'MERGED', headRefOid: 'a'.repeat(40) }
  mkdirSync(path.join(stateDir, 'publication'))
  const pendingFile = path.join(stateDir, 'publication/pending-pr.json')
  writeFileSync(pendingFile, JSON.stringify(pending))
  const run = (binary, args) => {
    if (binary === 'git' && args[0] === 'remote') return `https://github.com/${AUDIO_REPOSITORY}.git`
    if (binary === 'git' && args[0] === 'fetch') return ''
    if (binary === 'git' && args[0] === 'show') return readFileSync(path.join(root, 'website/audio/catalog.json'), 'utf8')
    if (binary === 'gh' && args[0] === 'repo') return JSON.stringify({ nameWithOwner: AUDIO_REPOSITORY, visibility: 'PUBLIC', defaultBranchRef: { name: 'main' } })
    if (binary === 'gh' && args[0] === 'pr' && args[1] === 'view') return JSON.stringify(pending)
    throw new Error(`Unexpected command: ${binary} ${args.join(' ')}`)
  }
  const waiting = await runPublication({ root, stateDir, apply: true, run, manifestFiles: [], verifyPublication: () => { throw new Error('Deployment is still running') } })
  assert.equal(waiting.waiting_deployment, 'Deployment is still running')
  assert.equal(existsSync(pendingFile), true)
  const evidence = { published: true }
  const completed = await runPublication({ root, stateDir, apply: true, run, manifestFiles: [], verifyPublication: options => {
    assert.deepEqual(options.publicationUrls, ['https://pero3dev.github.io/ai-agent-library/audio'])
    assert.equal(options.expectedHead, pending.headRefOid)
    assert.equal(options.requirePublication, true)
    return evidence
  } })
  assert.deepEqual(completed.published_evidence, evidence)
  assert.equal(existsSync(pendingFile), false)
  assert.deepEqual(JSON.parse(readFileSync(path.join(stateDir, 'publication/published-pr-123.json'), 'utf8')).evidence, evidence)
})

function refreshFixture(t, { changedSource = false, changedSupplemental = false } = {}) {
  const data = fixture(t)
  const { root, stateDir, source, manifest, episode } = data
  if (changedSupplemental) {
    const excerpt = 'ツールの呼び出しを接続する仕組みです。'
    writeFileSync(path.join(root, 'GLOSSARY.md'), `# 用語集\n\n### MCP\n\n${excerpt}\n`)
    const bundle = { schema_version: 1, entries: [{ document_path: 'GLOSSARY.md', heading: 'MCP', excerpt, excerpt_sha256: sha(excerpt) }] }
    manifest.supplemental_file = path.join(stateDir, 'supplemental.json')
    manifest.supplemental_digest = sha(JSON.stringify(bundle))
    manifest.review.supplemental_digest = manifest.supplemental_digest
    writeFileSync(manifest.supplemental_file, JSON.stringify(bundle))
  }
  const readyDirectory = path.join(stateDir, 'jobs', '01-concepts--agent-loop', manifest.source_digest)
  mkdirSync(readyDirectory, { recursive: true })
  writeFileSync(path.join(readyDirectory, 'ready.json'), JSON.stringify(manifest))
  const git = (args, cwd = root) => {
    const output = execFileSync('git', ['-c', 'user.name=Audio test', '-c', 'user.email=audio-test@example.invalid', ...args], { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    return args[0] === 'show' ? output : output.trim()
  }
  git(['init', '-b', 'main'])
  git(['add', '--', 'docs', 'website'])
  if (changedSupplemental) git(['add', '--', 'GLOSSARY.md'])
  git(['commit', '-m', 'test fixture base'])
  const baseSha = git(['rev-parse', 'HEAD'])
  git(['update-ref', 'refs/remotes/origin/main', baseSha])
  const branch = `chore/audio-catalog-${'b'.repeat(20)}`
  const worktree = path.join(stateDir, 'publication', 'worktrees', 'b'.repeat(20))
  mkdirSync(path.dirname(worktree), { recursive: true })
  git(['worktree', 'add', '-b', branch, worktree, 'origin/main'])
  const { audio_file: _file, ...publicEpisode } = episode
  Object.assign(publicEpisode, { audio_url: assetCoordinates(manifest, episode).url, published_at: '2026-09-13T00:00:00Z' })
  const candidateCatalog = { schema_version: 1, updated_at: '2026-09-13T00:00:00Z', episodes: [publicEpisode] }
  writeFileSync(path.join(worktree, 'website/audio/catalog.json'), JSON.stringify(candidateCatalog))
  git(['add', '--', 'website/audio/catalog.json'], worktree)
  git(['commit', '-m', 'test fixture audio candidate'], worktree)
  const oldHead = git(['rev-parse', 'HEAD'], worktree)
  if (changedSupplemental) {
    writeFileSync(path.join(root, 'GLOSSARY.md'), '# 用語集\n\n### MCP\n\n根拠資料が更新されました。\n')
    git(['add', '--', 'GLOSSARY.md'])
  } else if (changedSource) {
    writeFileSync(path.join(root, manifest.article_path), source + '\n変更された内容です。\n')
    git(['add', '--', manifest.article_path])
  } else { writeFileSync(path.join(root, 'unrelated.txt'), 'ordinary main update\n'); git(['add', '--', 'unrelated.txt']) }
  git(['commit', '-m', 'test fixture main advances'])
  const mainSha = git(['rev-parse', 'HEAD'])
  git(['update-ref', 'refs/remotes/origin/main', mainSha])
  const fresh = { number: 123, url: `https://github.com/${AUDIO_REPOSITORY}/pull/123`, state: 'OPEN', headRefOid: oldHead, title: 'chore(website): 検証済みの記事音声をカタログへ反映する', body: '## 変更内容\n\n検証済み音声を反映します。\n\n## 検証\n\n実音声の配信を確認しました。\n\n## 影響・残件\n\n音声カタログを更新します。\n\nAgent: claude\nCo-authored-by: Claude <noreply@anthropic.com>\n', headRefName: branch, baseRefName: 'main', isCrossRepository: false, autoMergeRequest: { enabledAt: '2026-09-13' }, files: [{ path: 'website/audio/catalog.json' }], mergeStateStatus: 'BEHIND' }
  writeFileSync(path.join(stateDir, 'publication/pending-pr.json'), JSON.stringify(fresh))
  const calls = []
  const run = (binary, args, cwd) => {
    calls.push([binary, ...args])
    if (binary === 'git') {
      if (args[0] === 'remote') return `https://github.com/${AUDIO_REPOSITORY}.git`
      if (args[0] === 'fetch') return ''
      if (args[0] === 'push') {
        const current = git(['rev-parse', 'HEAD'], cwd)
        git(['merge-base', '--is-ancestor', fresh.headRefOid, current], cwd)
        fresh.headRefOid = current; fresh.mergeStateStatus = 'BLOCKED'
        return ''
      }
      return git(args, cwd)
    }
    assert.equal(binary, 'gh')
    if (args[0] === 'repo') return JSON.stringify({ nameWithOwner: AUDIO_REPOSITORY, visibility: 'PUBLIC', defaultBranchRef: { name: 'main' } })
    if (args[0] === 'pr' && args[1] === 'view') return JSON.stringify(fresh)
    if (args[0] === 'pr' && args[1] === 'merge' && args.includes('--disable-auto')) { fresh.autoMergeRequest = null; return '' }
    if (args[0] === 'pr' && args[1] === 'edit') { fresh.title = args[args.indexOf('--title') + 1]; fresh.body = readFileSync(args[args.indexOf('--body-file') + 1], 'utf8'); return '' }
    if (args[0] === 'pr' && args[1] === 'close') { fresh.state = 'CLOSED'; return '' }
    throw new Error(`Unexpected external fixture command: ${binary} ${args.join(' ')}`)
  }
  return { ...data, git, run, calls, worktree, oldHead, mainSha, fresh, candidateCatalog }
}

test('normal main advancement refreshes the same catalog PR with a merge commit and waits for new CI', t => {
  const data = refreshFixture(t)
  const { root, stateDir, run, git, calls, worktree, oldHead, mainSha, fresh } = data
  const result = queueCatalogMerge({ ...fresh }, { root, stateDir, run })
  assert.equal(result.status, 'BRANCH_UPDATED')
  assert.notEqual(result.head, oldHead)
  assert.equal(git(['rev-list', '--parents', '-n', '1', result.head], worktree).split(' ').length, 3)
  assert.equal(git(['diff', '--name-only', mainSha, result.head], worktree), 'website/audio/catalog.json')
  assert.match(git(['show', '--no-patch', '--format=%B', result.head], worktree), /Agent: claude\nCo-authored-by: Claude <noreply@anthropic.com>/)
  assert.equal(JSON.parse(readFileSync(path.join(stateDir, 'publication/pending-pr.json'))).headRefOid, result.head)
  assert.match(fresh.body, /新 head の CI は再実行待ち/)
  assert.ok(calls.findIndex(call => call.includes('--disable-auto')) < calls.findIndex(call => call[1] === 'push'))
  assert.equal(calls.some(call => call.includes('--force') || call.includes('--admin') || call.includes('--auto')), false)
  const replay = queueCatalogMerge({ ...fresh, mergeStateStatus: 'BEHIND' }, { root, stateDir, run: (binary, args, cwd) => {
    if (binary === 'gh' && args[0] === 'pr' && args[1] === 'view') return JSON.stringify({ ...fresh, mergeStateStatus: 'BEHIND' })
    return run(binary, args, cwd)
  } })
  assert.equal(replay.status, 'WAITING_CHECKS')
  assert.equal(git(['rev-parse', 'HEAD'], worktree), result.head)
})

test('changed article closes only its obsolete owned PR and records the new digest for production', t => {
  const { root, stateDir, fresh, run, calls, manifest, git, mainSha } = refreshFixture(t, { changedSource: true })
  const result = refreshCatalogPr({ ...fresh }, { root, stateDir, run })
  assert.equal(result.status, 'REGENERATION_QUEUED')
  assert.equal(result.pr.state, 'CLOSED')
  assert.equal(calls.some(call => call[0] === 'git' && ['merge', 'push'].includes(call[1])), false)
  assert.equal(existsSync(path.join(stateDir, 'publication/pending-pr.json')), false)
  const marker = JSON.parse(readFileSync(path.join(stateDir, 'publication/regeneration-needed.json')))
  assert.equal(marker.articles[0].article_path, manifest.article_path)
  assert.equal(marker.articles[0].source_digest, sha(git(['show', `${mainSha}:${manifest.article_path}`])))
  assert.equal(marker.articles[0].status, 'pending')
})

test('changed supplemental source requeues the same article digest instead of publishing outdated premises', t => {
  const { root, stateDir, fresh, run, calls, manifest } = refreshFixture(t, { changedSupplemental: true })
  const result = refreshCatalogPr({ ...fresh }, { root, stateDir, run })
  assert.equal(result.status, 'REGENERATION_QUEUED')
  assert.equal(result.regeneration_needed[0].source_digest, manifest.source_digest)
  assert.match(result.regeneration_needed[0].reason, /Supplemental material/)
  assert.equal(calls.some(call => call[0] === 'git' && call[1] === 'push'), false)
})

test('normal publication supplemental guard binds the stored review and checks only the cited current excerpts', t => {
  const { root, stateDir, manifest } = fixture(t)
  const excerpt = 'ツールの呼び出しを接続する仕組みです。'
  const bundle = { schema_version: 1, entries: [{ document_path: 'GLOSSARY.md', heading: 'MCP', excerpt, excerpt_sha256: sha(excerpt) }] }
  manifest.supplemental_file = path.join(stateDir, 'supplemental.json')
  manifest.supplemental_digest = sha(JSON.stringify(bundle)); manifest.review.supplemental_digest = manifest.supplemental_digest
  writeFileSync(manifest.supplemental_file, JSON.stringify(bundle))
  const readDocument = () => `# 用語集\n\n### MCP\n\n${excerpt}\n\n### 別の用語\n\n無関係な節は更新されても構いません。\n`
  assert.doesNotThrow(() => validateReadySupplemental(manifest, { root, stateDir, readDocument }))
  assert.throws(() => validateReadySupplemental(manifest, { root, stateDir, readDocument: () => '# 用語集\n\n### MCP\n\n更新された説明。\n' }), /no longer current/)
  manifest.review.supplemental_digest = 'b'.repeat(64)
  assert.throws(() => validateReadySupplemental(manifest, { root, stateDir, readDocument }), /review digest mismatch/)
})

test('refresh excludes a stale article while retaining another current candidate and unrelated main audio', t => {
  const { source, episode, manifest } = fixture(t)
  const publicEpisode = { ...episode, audio_url: assetCoordinates(manifest, episode).url, published_at: '2026-09-13T00:00:00Z' }
  const second = { ...publicEpisode, id: 'second', article_path: 'docs/01-concepts/second.md' }
  const unrelated = { ...publicEpisode, id: 'unrelated', article_path: 'docs/02-patterns/other.md' }
  const empty = { schema_version: 1, updated_at: null, episodes: [] }
  const result = reconcileCatalogCandidate({ baseCatalog: empty, headCatalog: { ...empty, episodes: [publicEpisode, second] }, mainCatalog: { ...empty, episodes: [unrelated] }, readSource: articlePath => articlePath === episode.article_path ? source + 'changed' : source })
  assert.deepEqual(result.catalog.episodes.map(item => item.id), ['second', 'unrelated'])
  assert.equal(result.regeneration.length, 1)
  assert.equal(result.conflicts.length, 0)
})

test('refresh preserves unknown local changes and holds another audio version already on main', t => {
  const { root, stateDir, fresh, run, worktree, calls, candidateCatalog, source } = refreshFixture(t)
  const unowned = path.join(worktree, 'unknown.txt')
  writeFileSync(unowned, 'do not discard\n')
  assert.equal(refreshCatalogPr({ ...fresh }, { root, stateDir, run }).status, 'HELD_WORKTREE_CHANGED')
  assert.equal(readFileSync(unowned, 'utf8'), 'do not discard\n')
  assert.equal(calls.some(call => call[0] === 'git' && ['merge', 'push'].includes(call[1])), false)
  const empty = { schema_version: 1, updated_at: null, episodes: [] }
  const result = reconcileCatalogCandidate({ baseCatalog: empty, headCatalog: candidateCatalog, mainCatalog: { ...empty, episodes: [{ ...candidateCatalog.episodes[0], id: 'other-public-version' }] }, readSource: () => source })
  assert.equal(result.conflicts.length, 1)
  assert.equal(result.catalog.episodes[0].id, 'other-public-version')
})

test('interruption after preparing a refresh retries the same commit without rewriting published history', t => {
  const { root, stateDir, fresh, run, git, worktree } = refreshFixture(t)
  let failed = false
  const interrupted = (binary, args, cwd) => {
    if (!failed && binary === 'git' && args[0] === 'push') { failed = true; throw new Error('Simulated network interruption') }
    return run(binary, args, cwd)
  }
  assert.throws(() => refreshCatalogPr({ ...fresh }, { root, stateDir, run: interrupted }), /Simulated/)
  const preparedHead = git(['rev-parse', 'HEAD'], worktree)
  const retried = refreshCatalogPr({ ...fresh }, { root, stateDir, run })
  assert.equal(retried.status, 'BRANCH_UPDATED')
  assert.equal(retried.head, preparedHead)
})

test('prepared refresh refuses a worktree switched to another branch before any push or metadata edit', t => {
  const { root, stateDir, fresh, run, git, worktree } = refreshFixture(t)
  assert.throws(() => refreshCatalogPr({ ...fresh }, { root, stateDir, run: (binary, args, cwd) => {
    if (binary === 'git' && args[0] === 'push') throw new Error('Simulated push interruption')
    return run(binary, args, cwd)
  } }), /Simulated/)
  git(['switch', '-c', 'chore/another-task'], worktree)
  const calls = []
  assert.throws(() => refreshCatalogPr({ ...fresh }, { root, stateDir, run: (binary, args, cwd) => { calls.push([binary, ...args]); return run(binary, args, cwd) } }), /branch changed/)
  assert.equal(calls.some(call => call[1] === 'push' || call[2] === 'edit'), false)
})

test('metadata update interruption resumes on the already pushed new head before considering merge checks', t => {
  const { root, stateDir, fresh, run, git, worktree } = refreshFixture(t)
  assert.throws(() => refreshCatalogPr({ ...fresh }, { root, stateDir, run: (binary, args, cwd) => {
    if (binary === 'gh' && args[0] === 'pr' && args[1] === 'edit') throw new Error('Simulated metadata interruption')
    return run(binary, args, cwd)
  } }), /Simulated/)
  const newHead = git(['rev-parse', 'HEAD'], worktree)
  assert.equal(fresh.headRefOid, newHead)
  const calls = []
  const resumed = queueCatalogMerge({ ...fresh }, { root, stateDir, run: (binary, args, cwd) => { calls.push([binary, ...args]); return run(binary, args, cwd) } })
  assert.equal(resumed.status, 'BRANCH_UPDATED')
  assert.equal(resumed.head, newHead)
  assert.match(fresh.body, /新 head の CI は再実行待ち/)
  assert.equal(calls.some(call => call[1] === 'push' || call.includes('--auto')), false)
  assert.equal(JSON.parse(readFileSync(path.join(stateDir, 'publication/refresh-pr-123.json'))).status, 'pushed')
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
  assert.equal(typeof plan.node, 'string')
  assert.ok(existsSync(plan.node))
  assert.equal(plan.starts_engine, false)
  assert.ok(plan.production.includes('--plan'))
  assert.ok(!plan.publication.includes('--apply'))
  assert.ok(!plan.publication.includes('--auto-merge'))
  assert.equal(AUDIO_REPOSITORY, 'pero3dev/ai-agent-library')
})

test('PowerShell 7 task XML resolves one real shell even when PATH contains multiple pwsh applications', { skip: process.platform !== 'win32' || spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0'], { windowsHide: true }).error?.code === 'ENOENT' }, () => {
  const xml = execFileSync('pwsh', ['-NoProfile', '-File', path.join(repoRoot, 'scripts/Register-AudioLearningTask.ps1'), '-Mode', 'Xml', '-ProjectRoot', repoRoot], { encoding: 'utf8', windowsHide: true })
  const command = xml.match(/<Command>([^<]+)<\/Command>/)?.[1].replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  assert.ok(command)
  assert.equal(path.basename(command).toLowerCase(), 'pwsh.exe')
  assert.ok(existsSync(command), `Task shell must be a single executable path: ${command}`)
})
