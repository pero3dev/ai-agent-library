import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { closeSync, copyFileSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontMatter, toLines } from '../lib/md-utils.mjs'
import { formatCommitMessage, formatSquashMessage, validatePr } from '../lib/git-conventions.mjs'
import { requiredChecks, workflowFor } from '../lib/github-policy.mjs'
import { discoverArticles, sourceSections, validateScript } from './core.mjs'
import { reviewProblems } from './pipeline.mjs'
import { validateAudioCatalog } from '../../website/lib/audio-catalog.mjs'
import { verifyGithubEvidence } from '../lib/github-evidence.mjs'

export const AUDIO_REPOSITORY = 'pero3dev/ai-agent-library'
const catalogPath = 'website/audio/catalog.json'
const shaPattern = /^[a-f0-9]{64}$/
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const digest = data => createHash('sha256').update(data).digest('hex')
const sourceDigest = text => digest(text.replace(/\r\n?/g, '\n'))
const textValue = value => typeof value === 'string' && value.trim().length > 0 && value.length < 2000 && !/[\x00-\x08\x0b-\x1f]/.test(value)
const command = (binary, args, cwd) => {
  const result = execFileSync(binary, args, { cwd, encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  return binary === 'git' && args[0] === 'show' ? result : result.trim()
}

export function readPublicationJson(file) {
  assert(statSync(file).size < 16 * 1024 * 1024, 'JSON is too large')
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
}

function safeFile(file, boundary) {
  const absolute = path.resolve(file)
  const root = realpathSync(boundary)
  const relative = path.relative(root, absolute)
  assert(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'File escapes the owned state directory')
  let cursor = root
  for (const part of relative.split(path.sep)) {
    cursor = path.join(cursor, part)
    assert(!lstatSync(cursor).isSymbolicLink(), 'Links are not allowed in publication inputs')
  }
  assert(realpathSync(absolute) === absolute && statSync(absolute).isFile(), 'Publication input must be a regular file')
  return absolute
}

export function validateSource(articlePath, text, expectedDigest) {
  assert(/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9][a-z0-9/-]*\.md$/.test(articlePath ?? '') && !articlePath.split('/').includes('..'), 'Not an article path')
  assert(!/(?:^|\/)README\.md$/i.test(articlePath), 'Indexes cannot be published as episodes')
  const frontMatter = parseFrontMatter(toLines(text))
  const status = frontMatter?.fields.find(field => field.key === 'status')?.value.replace(/^['"]|['"]$/g, '')
  assert(!frontMatter?.errors.length && !frontMatter?.unclosed && status === 'published', 'Only published source articles can have public audio')
  assert(sourceDigest(text) === expectedDigest, 'Source changed after production; regenerate before publication')
}

export function validateReady(manifest, { root, stateDir, sourceText } = {}) {
  assert(manifest?.schema_version === 1 && shaPattern.test(manifest.source_digest), 'Invalid ready manifest')
  const sourceFile = safeFile(path.join(root, manifest.article_path ?? ''), root)
  const source = sourceText ?? readFileSync(sourceFile, 'utf8')
  validateSource(manifest.article_path, source, manifest.source_digest)
  const review = manifest.review
  assert(review?.passed === true && review.source_digest === manifest.source_digest && shaPattern.test(review.script_sha256), 'A source-bound independent script review is required')
  assert(Array.isArray(review.issues) && review.issues.length === 0 && !Number.isNaN(Date.parse(review.reviewed_at)), 'Unresolved or undated review')
  assert(manifest.signal_checks?.passed === true && manifest.signal_checks.method === 'ffprobe+ffmpeg-silencedetect', 'Audio signal checks must pass')
  assert(Array.isArray(manifest.episodes) && manifest.episodes.length > 0 && manifest.episodes.length <= 20, 'Invalid episode count')
  assert(!Number.isNaN(Date.parse(manifest.created_at)), 'Ready manifest needs a creation date')
  const scriptFile = safeFile(manifest.script_file ?? path.join(path.dirname(manifest.episodes[0].audio_file), 'script.json'), stateDir)
  const script = readPublicationJson(scriptFile)
  const sections = sourceSections(source)
  assert(digest(JSON.stringify(script)) === review.script_sha256, 'Reviewed script file digest mismatch')
  assert(!validateScript(script, sections).length && !reviewProblems(review, sections).length, 'Actual script/source coverage did not pass independent review')
  assert(Array.isArray(manifest.signal_checks.parts) && manifest.signal_checks.parts.length === manifest.episodes.length, 'Signal evidence is missing for episode parts')
  const ids = new Set()
  const episodes = manifest.episodes.map((episode, index) => {
    assert(/^[a-z0-9][a-z0-9-]{0,180}$/.test(episode.id ?? '') && !ids.has(episode.id), 'Invalid or duplicate episode ID')
    ids.add(episode.id)
    assert(episode.article_path === manifest.article_path && episode.source_digest === manifest.source_digest && episode.script_sha256 === review.script_sha256, 'Episode/review/source binding mismatch')
    assert(episode.part === index + 1 && episode.parts === manifest.episodes.length, 'Episode parts must be complete and ordered')
    assert(textValue(episode.title) && Number.isFinite(episode.duration_seconds) && episode.duration_seconds > 0 && episode.duration_seconds <= 7200, 'Invalid title or duration')
    assert(Array.isArray(episode.chapters) && episode.chapters.length > 0 && episode.chapters.length <= 100, 'Missing chapters')
    let previous = -1
    const chapterIds = new Set()
    for (const chapter of episode.chapters) {
      assert(textValue(chapter.id) && !chapterIds.has(chapter.id) && textValue(chapter.title) && Number.isFinite(chapter.start_seconds) && chapter.start_seconds > previous && chapter.start_seconds < episode.duration_seconds, 'Invalid chapter boundary')
      chapterIds.add(chapter.id)
      previous = chapter.start_seconds
    }
    assert(episode.chapters[0].start_seconds === 0, 'The first chapter must start at zero')
    assert(textValue(episode.attribution) && Array.isArray(episode.voices) && episode.voices.length === 2, 'Two credited voices are required')
    const roles = new Set(episode.voices.map(voice => voice.role))
    assert(roles.has('listener') && roles.has('explainer'), 'Voice roles must be listener and explainer')
    for (const voice of episode.voices) assert(textValue(String(voice.id)) && textValue(voice.name) && /^https:\/\//.test(voice.license_url ?? ''), 'Voice license evidence is missing')
    const audioFile = safeFile(episode.audio_file, stateDir)
    assert(path.extname(audioFile).toLowerCase() === '.mp3' && statSync(audioFile).size > 0 && statSync(audioFile).size < 2 * 1024 ** 3, 'Invalid MP3 asset size or extension')
    assert(shaPattern.test(episode.audio_sha256) && digest(readFileSync(audioFile)) === episode.audio_sha256, 'Audio file digest mismatch')
    const signal = manifest.signal_checks.parts[index]
    assert(signal?.passed === true && Array.isArray(signal.issues) && !signal.issues.length && signal.audio_sha256 === episode.audio_sha256 && Math.abs(signal.duration_seconds - episode.duration_seconds) < 0.01 && signal.character_count > 0 && Number.isFinite(signal.silence_seconds) && signal.silence_seconds >= 0 && signal.silence_seconds <= episode.duration_seconds * 0.4, 'Signal evidence does not match validated audio')
    return { ...episode, audio_file: audioFile }
  })
  return { ...manifest, episodes }
}

export function mergeCatalog(catalog, episodes, now = new Date().toISOString()) {
  assert(catalog?.schema_version === 1 && Array.isArray(catalog.episodes), 'Invalid existing catalog')
  const replacements = new Set(episodes.map(episode => episode.article_path))
  const merged = [...catalog.episodes.filter(episode => !replacements.has(episode.article_path)), ...episodes]
    .sort((a, b) => a.article_path.localeCompare(b.article_path) || a.part - b.part)
  assert(new Set(merged.map(episode => episode.id)).size === merged.length, 'Catalog episode IDs collide')
  if (JSON.stringify(catalog.episodes) === JSON.stringify(merged)) return catalog
  return { schema_version: 1, updated_at: now, episodes: merged }
}

export function assetCoordinates(manifest, episode) {
  const article = path.posix.basename(manifest.article_path, '.md')
  const tag = `audio-${article}-${manifest.source_digest.slice(0, 16)}-${manifest.review.script_sha256.slice(0, 16)}`
  const name = `${episode.id}-${episode.audio_sha256.slice(0, 16)}.mp3`
  return { tag, name, url: `https://github.com/${AUDIO_REPOSITORY}/releases/download/${tag}/${name}` }
}

/** Probe real Range responses and bytes; a mocked fetch is only a unit check. */
export async function probePublicAsset(url, { size, sha256, fetchImpl = fetch } = {}) {
  assert(url.startsWith(`https://github.com/${AUDIO_REPOSITORY}/releases/download/`), 'Unapproved asset host/repository')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)
  try {
    for (const [start, end] of [[0, Math.min(1023, size - 1)], [Math.max(0, size - 1024), size - 1]]) {
      const response = await fetchImpl(url, { headers: { Range: `bytes=${start}-${end}`, 'Accept-Encoding': 'identity' }, signal: controller.signal, redirect: 'follow' })
      assert(response.status === 206 && response.headers.get('content-range') === `bytes ${start}-${end}/${size}`, 'Host does not provide reliable byte-range audio seeking')
      const type = response.headers.get('content-type')?.split(';')[0]
      assert(['audio/mpeg', 'audio/mp3', 'application/octet-stream'].includes(type), 'Asset MIME type is not audio/binary')
      assert((await response.arrayBuffer()).byteLength === end - start + 1, 'Truncated range response')
    }
    const response = await fetchImpl(url, { signal: controller.signal, redirect: 'follow' })
    assert(response.status === 200 && response.body, 'Public asset cannot be downloaded')
    const hash = createHash('sha256')
    let bytes = 0
    for await (const chunk of response.body) {
      bytes += chunk.length
      assert(bytes <= size, 'Unexpected asset size')
      hash.update(chunk)
    }
    assert(bytes === size && hash.digest('hex') === sha256, 'Published asset does not match validated audio')
    return { verified_at: new Date().toISOString(), range: true, sha256, size }
  } finally { clearTimeout(timeout) }
}

export function findReadyManifests(stateDir) {
  const jobs = path.join(stateDir, 'jobs')
  if (!existsSync(jobs)) return []
  const files = []
  function walk(directory, depth) {
    assert(depth < 6, 'Unexpected job directory nesting')
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), 'Links are not allowed in jobs')
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(file, depth + 1)
      else if (entry.isFile() && entry.name === 'ready.json') files.push(file)
    }
  }
  walk(jobs, 0)
  return files.sort()
}

function atomicJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  renameSync(temporary, file)
}

export async function publishAssets(manifest, { root, stateDir, run = command, probe = probePublicAsset } = {}) {
  const gh = (...args) => run('gh', args, root)
  const first = assetCoordinates(manifest, manifest.episodes[0])
  const endpoint = `repos/${AUDIO_REPOSITORY}/releases/tags/${first.tag}`
  let release
  try { release = JSON.parse(gh('api', endpoint)) } catch (error) {
    // A failed read may mean a transient/authentication failure; establish a real 404.
    const detail = String(error.stderr ?? error.message)
    if (!/\b404\b/.test(detail)) throw error
    const notes = path.join(stateDir, 'publication', `${first.tag}-notes.md`)
    mkdirSync(path.dirname(notes), { recursive: true })
    writeFileSync(notes, `記事: ${manifest.article_path}\n\n原文 SHA-256: ${manifest.source_digest}\n\n${manifest.episodes[0].attribution}\n`, 'utf8')
    gh('release', 'create', first.tag, '--repo', AUDIO_REPOSITORY, '--target', 'main', '--title', `音声: ${manifest.episodes[0].title}`, '--notes-file', notes, '--latest=false')
    release = JSON.parse(gh('api', endpoint))
  }
  assert(release.tag_name === first.tag && release.draft === false && Array.isArray(release.assets), 'Unexpected release metadata')
  const published = []
  for (const episode of manifest.episodes) {
    const asset = assetCoordinates(manifest, episode)
    const prior = release.assets.find(item => item.name === asset.name)
    if (prior) assert(prior.size === statSync(episode.audio_file).size, 'Existing immutable asset has a different size')
    else {
      const uploadFile = path.join(stateDir, 'publication', 'assets', asset.tag, asset.name)
      mkdirSync(path.dirname(uploadFile), { recursive: true })
      copyFileSync(episode.audio_file, uploadFile)
      assert(digest(readFileSync(uploadFile)) === episode.audio_sha256, 'Audio changed between validation and upload; retry the current ready manifest')
      gh('release', 'upload', asset.tag, uploadFile, '--repo', AUDIO_REPOSITORY)
    }
    const evidence = await probe(asset.url, { size: statSync(episode.audio_file).size, sha256: episode.audio_sha256 })
    const { audio_file: _file, ...metadata } = episode
    published.push({ ...metadata, audio_url: asset.url, published_at: prior?.created_at ?? new Date().toISOString() })
    atomicJson(path.join(stateDir, 'publication', 'probes', `${episode.id}.json`), { url: asset.url, ...evidence })
  }
  return published
}

function ensureRemote(root, run) {
  const remote = run('git', ['remote', 'get-url', 'origin'], root)
  assert([`https://github.com/${AUDIO_REPOSITORY}.git`, `https://github.com/${AUDIO_REPOSITORY}`, `git@github.com:${AUDIO_REPOSITORY}.git`].includes(remote), 'Origin is not the approved repository')
  const repo = JSON.parse(run('gh', ['repo', 'view', AUDIO_REPOSITORY, '--json', 'nameWithOwner,visibility,defaultBranchRef'], root))
  assert(repo.nameWithOwner === AUDIO_REPOSITORY && repo.visibility === 'PUBLIC' && repo.defaultBranchRef?.name === 'main', 'Unexpected repository visibility/default branch')
}

/** Only the catalog is staged. The ordinary checkout is never reset or cleaned. */
export function createCatalogPr(episodes, { root, stateDir, run = command } = {}) {
  const hash = digest(JSON.stringify(episodes.map(episode => [episode.id, episode.audio_sha256]).sort())).slice(0, 20)
  const branch = `chore/audio-catalog-${hash}`
  const gh = (...args) => run('gh', args, root)
  const existing = JSON.parse(gh('pr', 'list', '--repo', AUDIO_REPOSITORY, '--head', branch, '--state', 'all', '--json', 'number,url,state,headRefOid,headRefName,baseRefName,isCrossRepository'))
  if (existing.length) {
    assert(existing.length === 1 && ['OPEN', 'MERGED'].includes(existing[0].state), 'Existing catalog PR was closed; inspect before retrying')
    assert(existing[0].headRefName === branch && existing[0].baseRefName === 'main' && existing[0].isCrossRepository === false, 'Existing catalog PR repository/branch mismatch')
    return existing[0]
  }
  const worktree = path.join(stateDir, 'publication', 'worktrees', hash)
  mkdirSync(path.dirname(worktree), { recursive: true })
  if (!existsSync(worktree)) run('git', ['worktree', 'add', '-b', branch, worktree, 'origin/main'], root)
  assert(run('git', ['branch', '--show-current'], worktree) === branch, 'Publication worktree branch changed')
  const dirty = run('git', ['status', '--porcelain', '--untracked-files=all'], worktree).split('\n').filter(Boolean)
  assert(dirty.every(line => line.slice(3).replaceAll('"', '') === catalogPath), 'Unowned changes in the publication worktree')
  const file = path.join(worktree, catalogPath)
  const catalog = readPublicationJson(file)
  const merged = mergeCatalog(catalog, episodes)
  const catalogProblems = validateAudioCatalog(merged)
  assert(!catalogProblems.length, catalogProblems.join('\n'))
  const needsCommit = JSON.stringify(catalog) !== JSON.stringify(merged)
  if (!needsCommit && !run('git', ['diff', '--name-only', 'origin/main...HEAD'], worktree)) return { state: 'UNCHANGED', branch }
  if (needsCommit) {
    atomicJson(file, merged)
    run('git', ['add', '--', catalogPath], worktree)
    run('git', ['diff', '--cached', '--check'], worktree)
    const changed = run('git', ['diff', '--cached', '--name-only'], worktree)
    assert(changed === catalogPath, 'Only the public audio catalog may be staged')
  }
  const scope = run('git', ['diff', '--name-only', 'origin/main', '--'], worktree).split('\n').filter(Boolean)
  assert(scope.length === 1 && scope[0] === catalogPath, 'Publication branch has changes outside the catalog')
  const title = 'chore(website): 検証済みの記事音声をカタログへ反映する'
  const reason = `${new Set(episodes.map(episode => episode.article_path)).size} 記事の検査済み音声を掲載し、同じ記事の旧版を差し替えます。Claude が生成した台本と独立レビューに基づく音声のメタデータを、決められた規則でカタログへ反映しています。`
  const validation = '原文と独立台本レビューの SHA-256、音声信号検査、実配信の Range 応答と全音声 SHA-256 を確認済み。サイトの CI は PR で実行します。'
  const impact = '変更は音声カタログのみです。旧音声ファイルは保持します。iPhone 実機の再生品質は自動検査の対象外です。'
  const message = formatCommitMessage({ type: 'chore', scope: 'website', summary: '検証済みの記事音声をカタログへ反映する', reason, validation, impact, agent: 'claude' })
  const body = `## 変更内容\n\n${reason}\n\n## 検証\n\n${validation}\n\n## 影響・残件\n\n${impact}\n\nAgent: claude\nCo-authored-by: Claude <noreply@anthropic.com>\n`
  const errors = validatePr({ title, body, branch, baseRefName: 'main' })
  assert(errors.length === 0, errors.join('\n'))
  const messageFile = path.join(stateDir, 'publication', `${hash}-commit.txt`)
  const bodyFile = path.join(stateDir, 'publication', `${hash}-pr.md`)
  writeFileSync(messageFile, message, 'utf8')
  writeFileSync(bodyFile, body, 'utf8')
  if (needsCommit) run('git', ['commit', '-F', messageFile], worktree)
  ensureRemote(root, run)
  run('git', ['push', '--set-upstream', 'origin', branch], worktree)
  gh('pr', 'create', '--repo', AUDIO_REPOSITORY, '--base', 'main', '--head', branch, '--title', title, '--body-file', bodyFile)
  return JSON.parse(gh('pr', 'view', branch, '--repo', AUDIO_REPOSITORY, '--json', 'number,url,state,headRefOid'))
}

export function queueCatalogMerge(pr, { root, stateDir, run = command } = {}) {
  if (pr.state !== 'OPEN') return { status: pr.state }
  const gh = (...args) => run('gh', args, root)
  const fresh = JSON.parse(gh('pr', 'view', String(pr.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,title,body,headRefName,headRefOid,baseRefName,state,files,mergeStateStatus'))
  assert(fresh.state === 'OPEN' && fresh.headRefOid === pr.headRefOid && /^chore\/audio-catalog-[a-f0-9]{20}$/.test(fresh.headRefName), 'Catalog PR identity changed')
  assert(fresh.files?.length === 1 && fresh.files[0].path === catalogPath, 'Auto-merge scope is catalog-only')
  const problems = validatePr(fresh)
  assert(!problems.length, problems.join('\n'))
  if (fresh.mergeStateStatus === 'BEHIND') return { status: 'HELD_BASE_CHANGED', reason: 'main advanced. Revalidate every catalog article against current main, then update the owned catalog PR and rerun CI. Automatic publication is held to preserve source/review binding.' }
  if (fresh.mergeStateStatus === 'DIRTY') return { status: 'HELD_CONFLICT', reason: 'The catalog PR conflicts with main. Resolve its catalog-only diff, revalidate source bindings and rerun CI.' }
  const protection = JSON.parse(gh('api', `repos/${AUDIO_REPOSITORY}/branches/main/protection`))
  assert(protection.required_status_checks?.strict === true && protection.enforce_admins?.enabled === true, 'Strict branch protection is required')
  const required = protection.required_status_checks.checks
  assert(Array.isArray(required) && requiredChecks.every(name => required.some(check => check.context === name && check.app_id === 15368)), 'Required checks are missing')
  const checks = JSON.parse(gh('api', `repos/${AUDIO_REPOSITORY}/commits/${fresh.headRefOid}/check-runs?per_page=100`))
  assert(checks.total_count <= 100, 'Check pagination must be inspected before auto-merge')
  for (const policy of [...required, { context: 'Audio playback regression', app_id: 15368 }]) {
    assert(policy.app_id === 15368, 'Unexpected required check application')
    const check = checks.check_runs.filter(item => item.name === policy.context && item.app?.id === 15368 && item.head_sha === fresh.headRefOid).sort((a, b) => b.id - a.id)[0]
    if (!check || check.status !== 'completed') return { status: 'WAITING_CHECKS', check: policy.context }
    if (check.conclusion !== 'success') return { status: 'HELD_CHECK_FAILED', check: policy.context, conclusion: check.conclusion }
    const expected = policy.context === 'Audio playback regression' ? { path: '.github/workflows/ci.yml', event: 'pull_request' } : workflowFor(policy.context)
    const runId = /^https:\/\/github\.com\/pero3dev\/ai-agent-library\/actions\/runs\/(\d+)(?:\/job\/\d+)?$/.exec(check.details_url ?? '')?.[1]
    assert(runId, 'Unexpected check URL')
    const workflow = JSON.parse(gh('api', `repos/${AUDIO_REPOSITORY}/actions/runs/${runId}`))
    assert(workflow.head_sha === fresh.headRefOid && workflow.path === expected.path && workflow.event === expected.event && workflow.repository?.full_name === AUDIO_REPOSITORY && workflow.head_branch === fresh.headRefName && workflow.conclusion === 'success', 'Check workflow identity mismatch')
    assert(check.check_suite?.id === workflow.check_suite_id && Number.isInteger(workflow.check_suite_id), 'Check suite does not match its workflow run')
    if (expected.runName) assert(workflow.display_title === `${expected.runName}${fresh.number}`, 'Policy check belongs to another PR')
  }
  const squash = formatSquashMessage(fresh)
  const finalMetadata = JSON.parse(gh('pr', 'view', String(pr.number), '--repo', AUDIO_REPOSITORY, '--json', 'title,body,headRefOid,state'))
  assert(finalMetadata.state === 'OPEN' && finalMetadata.headRefOid === fresh.headRefOid && finalMetadata.title === fresh.title && finalMetadata.body === fresh.body, 'PR changed while checks were being verified')
  const bodyFile = path.join(stateDir, 'publication', `pr-${fresh.number}-squash.txt`)
  writeFileSync(bodyFile, squash.body, 'utf8')
  gh('pr', 'merge', String(fresh.number), '--repo', AUDIO_REPOSITORY, '--auto', '--squash', '--match-head-commit', fresh.headRefOid, '--subject', squash.subject, '--body-file', bodyFile)
  return { status: 'MERGE_REQUESTED', head: fresh.headRefOid }
}

export function selectPublicationBatches(manifests, { articles, catalog, queue = { jobs: {} }, minimumBatch = 3 }) {
  assert(Number.isInteger(minimumBatch) && minimumBatch >= 1 && minimumBatch <= 50, 'Invalid minimum batch size')
  const current = new Map()
  for (const manifest of manifests) {
    const prior = current.get(manifest.article_path)
    if (!prior || Date.parse(manifest.created_at) > Date.parse(prior.created_at)) current.set(manifest.article_path, manifest)
  }
  const published = new Map(catalog.episodes.map(episode => [episode.article_path, episode.source_digest]))
  const selected = [], waiting = []
  const groups = new Map()
  for (const manifest of current.values()) {
    if (catalog.episodes.filter(episode => episode.article_path === manifest.article_path).map(episode => episode.id).sort().join('|') === manifest.episodes.map(episode => episode.id).sort().join('|')) continue
    if (published.has(manifest.article_path)) { selected.push(manifest); continue }
    const section = manifest.article_path.split('/')[1]
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section).push(manifest)
  }
  for (const [section, group] of groups) {
    const groupPaths = new Set(group.map(manifest => manifest.article_path))
    const complete = articles.filter(article => article.article_path.split('/')[1] === section).every(article => {
      const job = queue.jobs?.[article.article_path]
      return groupPaths.has(article.article_path) || published.get(article.article_path) === article.source_digest || (job?.status === 'held' && job.source_digest === article.source_digest)
    })
    if (group.length >= minimumBatch || complete) selected.push(...group)
    else waiting.push({ section, ready_articles: group.length, minimum_batch: minimumBatch })
  }
  return { selected, waiting }
}

function publicationLock(stateDir) {
  const file = path.join(stateDir, 'publication.lock')
  try {
    const handle = openSync(file, 'wx')
    writeFileSync(handle, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }))
    closeSync(handle)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    safeFile(file, stateDir)
    const owner = readPublicationJson(file)
    assert(Number.isInteger(owner.pid) && owner.pid > 0, 'Invalid publication lock; inspect the owning process')
    try { process.kill(owner.pid, 0); throw new Error('Audio publication is already running') } catch (check) {
      if (check.code !== 'ESRCH') throw check
      unlinkSync(file)
      return publicationLock(stateDir)
    }
  }
  return () => unlinkSync(file)
}

export async function runPublication({ root, stateDir, manifestFiles, apply = false, autoMerge = false, minimumBatch = 3, run = command, probe = probePublicAsset, verifyPublication = verifyGithubEvidence } = {}) {
  assert(!autoMerge || apply, '--auto-merge requires --apply')
  mkdirSync(stateDir, { recursive: true })
  const releaseLock = publicationLock(stateDir)
  try {
  const result = { mode: apply ? 'apply' : 'dry-run', ready: [], held: [], publications: [] }
  if (apply) { ensureRemote(root, run); run('git', ['fetch', 'origin', 'main'], root) }
  const pendingFile = path.join(stateDir, 'publication', 'pending-pr.json')
  if (apply && existsSync(pendingFile)) {
    const pending = readPublicationJson(pendingFile)
    assert(Number.isInteger(pending.number) && pending.number > 0 && /^[a-f0-9]{40}$/.test(pending.headRefOid ?? ''), 'Invalid pending catalog PR state')
    const observed = JSON.parse(run('gh', ['pr', 'view', String(pending.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,url,state,headRefOid'], root))
    assert(observed.headRefOid === pending.headRefOid && observed.number === pending.number, 'Pending catalog PR head changed')
    result.pr = observed
    if (observed.state === 'OPEN') {
      result.waiting_existing_pr = true
      if (autoMerge) result.merge = queueCatalogMerge(observed, { root, stateDir, run })
      atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
      return result
    }
    assert(observed.state === 'MERGED', 'Pending catalog PR was closed; inspect before creating another batch')
    try {
      result.published_evidence = verifyPublication({ root, prUrl: observed.url, expectedHead: observed.headRefOid, requirePublication: true, publicationUrls: ['https://pero3dev.github.io/ai-agent-library/audio/'] })
    } catch (error) {
      result.waiting_deployment = error.message
      atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
      return result
    }
    atomicJson(path.join(stateDir, 'publication', `published-pr-${observed.number}.json`), { pr: observed, evidence: result.published_evidence })
    unlinkSync(pendingFile)
    run('git', ['fetch', 'origin', 'main'], root)
  }
  const valid = []
  for (const file of manifestFiles ?? findReadyManifests(stateDir)) {
    try {
      safeFile(file, stateDir)
      const input = readPublicationJson(file)
      const manifest = validateReady(input, { root, stateDir })
      if (apply) validateSource(manifest.article_path, run('git', ['show', `origin/main:${manifest.article_path}`], root), manifest.source_digest)
      result.ready.push({ manifest: file, article_path: manifest.article_path, episodes: manifest.episodes.map(episode => assetCoordinates(manifest, episode)) })
      valid.push(manifest)
    } catch (error) { result.held.push({ manifest: file, reason: error.message }) }
  }
  const catalog = apply ? JSON.parse(run('git', ['show', `origin/main:${catalogPath}`], root)) : readPublicationJson(path.join(root, catalogPath))
  const queueFile = path.join(stateDir, 'queue.json')
  const batches = selectPublicationBatches(valid, { articles: await discoverArticles(root), catalog, queue: existsSync(queueFile) ? readPublicationJson(queueFile) : undefined, minimumBatch })
  result.waiting_batches = batches.waiting
  result.selected_articles = batches.selected.map(manifest => manifest.article_path)
  for (const manifest of apply ? batches.selected : []) {
    try { result.publications.push(...await publishAssets(manifest, { root, stateDir, run, probe })) }
    catch (error) { result.held.push({ article_path: manifest.article_path, reason: error.message }) }
  }
  if (result.publications.length) {
    result.pr = createCatalogPr(result.publications, { root, stateDir, run })
    if (['OPEN', 'MERGED'].includes(result.pr.state)) atomicJson(pendingFile, result.pr)
    if (autoMerge) result.merge = queueCatalogMerge(result.pr, { root, stateDir, run })
  }
  atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
  return result
  } finally { releaseLock() }
}
