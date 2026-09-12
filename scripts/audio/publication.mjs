import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { closeSync, copyFileSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontMatter, toLines } from '../lib/md-utils.mjs'
import { formatCommitMessage, formatSquashMessage, validatePr } from '../lib/git-conventions.mjs'
import { requiredChecks, workflowFor } from '../lib/github-policy.mjs'
import { discoverArticles, sourceSections, validateScript, validateSupplementalSnapshot } from './core.mjs'
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

export function validateReadySupplemental(manifest, { root, stateDir, readDocument } = {}) {
  const present = manifest.supplemental_file !== undefined || manifest.supplemental_digest !== undefined || manifest.review?.supplemental_digest !== undefined
  if (!present) return
  assert(shaPattern.test(manifest.supplemental_digest ?? '') && manifest.review?.supplemental_digest === manifest.supplemental_digest, 'Supplemental review digest mismatch')
  const file = safeFile(manifest.supplemental_file, stateDir)
  const scriptFile = manifest.script_file ?? path.join(path.dirname(manifest.episodes[0].audio_file), 'script.json')
  assert(file === path.join(path.dirname(scriptFile), 'supplemental.json'), 'Supplemental file must belong to the reviewed script job')
  const bundle = readPublicationJson(file)
  assert(digest(JSON.stringify(bundle)) === manifest.supplemental_digest, 'Supplemental file digest mismatch')
  assert(bundle?.schema_version === 1 && Array.isArray(bundle.entries) && bundle.entries.length > 0 && bundle.entries.length <= 14, 'Invalid supplemental material')
  const documents = new Map()
  for (const entry of bundle.entries) {
    const name = entry?.document_path
    if (name !== 'GLOSSARY.md' && !/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(name ?? '')) continue
    if (documents.has(name)) continue
    try { documents.set(name, readDocument ? readDocument(name) : readFileSync(safeFile(path.join(root, name), root), 'utf8')) } catch { /* The shared validator reports unavailable material. */ }
  }
  const errors = validateSupplementalSnapshot(bundle, documents)
  assert(!errors.length, `Supplemental material is no longer current: ${errors.join('; ')}`)
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
  validateReadySupplemental(manifest, { root, stateDir })
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

const catalogGroups = catalog => {
  const groups = new Map()
  for (const episode of catalog.episodes) {
    if (!groups.has(episode.article_path)) groups.set(episode.article_path, [])
    groups.get(episode.article_path).push(episode)
  }
  for (const group of groups.values()) group.sort((a, b) => a.part - b.part)
  return groups
}

/** Rebuild from current main, preserving its unrelated episodes and complete parts. */
export function reconcileCatalogCandidate({ baseCatalog, headCatalog, mainCatalog, readSource, checkMaterial = () => null }) {
  for (const catalog of [baseCatalog, headCatalog, mainCatalog]) {
    const errors = validateAudioCatalog(catalog)
    assert(!errors.length, errors.join('\n'))
  }
  const base = catalogGroups(baseCatalog), head = catalogGroups(headCatalog), main = catalogGroups(mainCatalog)
  const episodes = [], regeneration = [], conflicts = []
  for (const [articlePath, previous] of base) assert(head.has(articlePath), `Candidate unexpectedly deletes catalog audio: ${articlePath}`)
  for (const [articlePath, candidate] of head) {
    const baseline = JSON.stringify(base.get(articlePath) ?? [])
    if (JSON.stringify(candidate) === baseline) continue
    let source
    try { source = readSource(articlePath) } catch {
      regeneration.push({ article_path: articlePath, previous_source_digest: candidate[0].source_digest, source_digest: null, status: 'excluded', reason: 'Source is no longer available on main' })
      continue
    }
    try { validateSource(articlePath, source, candidate[0].source_digest) } catch (error) {
      const fields = parseFrontMatter(toLines(source))?.fields ?? []
      const published = fields.find(field => field.key === 'status')?.value.replace(/^['"]|['"]$/g, '') === 'published'
      regeneration.push({ article_path: articlePath, previous_source_digest: candidate[0].source_digest, source_digest: sourceDigest(source), status: published ? 'pending' : 'excluded', reason: error.message })
      continue
    }
    const materialIssue = checkMaterial(candidate)
    if (materialIssue) {
      regeneration.push({ article_path: articlePath, previous_source_digest: candidate[0].source_digest, source_digest: sourceDigest(source), status: 'pending', reason: materialIssue })
      continue
    }
    const current = JSON.stringify(main.get(articlePath) ?? [])
    if (current !== baseline && current !== JSON.stringify(candidate)) {
      conflicts.push({ article_path: articlePath, reason: 'main contains another audio version for the same article' })
      continue
    }
    episodes.push(...candidate)
  }
  const catalog = mergeCatalog(mainCatalog, episodes)
  const errors = validateAudioCatalog(catalog)
  assert(!errors.length, errors.join('\n'))
  return { catalog, episodes, regeneration, conflicts, changed: JSON.stringify(catalog.episodes) !== JSON.stringify(mainCatalog.episodes) }
}

function recordRegeneration(stateDir, articles) {
  if (!articles.length) return
  const file = path.join(stateDir, 'publication', 'regeneration-needed.json')
  const previous = existsSync(file) ? readPublicationJson(file) : { articles: [] }
  const byPath = new Map(previous.articles.map(article => [article.article_path, article]))
  for (const article of articles) byPath.set(article.article_path, { ...article, requested_at: new Date().toISOString() })
  atomicJson(file, { schema_version: 1, articles: [...byPath.values()] })
}

function refreshPrMetadata(fresh, episodes, mainSha) {
  const footer = /^Agent: [\s\S]*$/m.exec(formatSquashMessage(fresh).body)?.[0]
  assert(footer, 'Catalog PR attribution is missing')
  const count = new Set(episodes.map(episode => episode.article_path)).size
  const body = `## 変更内容\n\n最新 main の原文に一致する ${count} 記事の検査済み音声をカタログへ掲載します。同じ記事の旧音声を差し替え、ほかの記事の音声を保持します。\n\n## 検証\n\n原文 SHA-256 と音声候補の対応、カタログの完全性を main ${mainSha} で再確認しました。台本の独立レビュー・音声信号検査・公開音声の Range と全体 SHA-256 は元候補の検証記録を保持しています。同期後の新 head の CI は再実行待ちです。\n\n## 影響・残件\n\n差分は音声カタログのみです。公開済み音声ファイルは保持します。同期中に原文が変わった候補は再生成の対象です。iPhone 実機の品質確認は自動検査に含めません。\n\n${footer}`
  const errors = validatePr({ ...fresh, body })
  assert(!errors.length, errors.join('\n'))
  return { title: fresh.title, body }
}

function finishCatalogRefresh(journal, { root, stateDir, run }) {
  const gh = (...args) => run('gh', args, root)
  assert(/^[a-f0-9]{40}$/.test(journal.new_head) && /^[a-f0-9]{40}$/.test(journal.previous_head), 'Invalid catalog refresh journal')
  assert(/^chore\/audio-catalog-[a-f0-9]{20}$/.test(journal.branch) && Number.isInteger(journal.number) && journal.number > 0, 'Invalid refresh branch/PR')
  assert(journal.worktree === path.join(stateDir, 'publication', 'worktrees', journal.branch.slice('chore/audio-catalog-'.length)) && realpathSync(journal.worktree) === path.resolve(journal.worktree), 'Refresh worktree is outside its owned directory')
  assert(journal.body_file === path.join(stateDir, 'publication', `refresh-pr-${journal.number}-body.md`) && digest(readFileSync(journal.body_file)) === journal.body_sha256, 'Prepared PR metadata changed')
  assert(run('git', ['branch', '--show-current'], journal.worktree) === journal.branch && run('git', ['rev-parse', `refs/heads/${journal.branch}`], journal.worktree) === journal.new_head, 'Prepared refresh branch changed')
  assert(run('git', ['rev-parse', 'HEAD'], journal.worktree) === journal.new_head && !run('git', ['status', '--porcelain', '--untracked-files=all'], journal.worktree), 'Prepared refresh worktree changed')
  run('git', ['merge-base', '--is-ancestor', journal.previous_head, journal.new_head], journal.worktree)
  assert(run('git', ['diff', '--name-only', journal.main_sha, journal.new_head], journal.worktree) === catalogPath, 'Prepared refresh contains changes outside the catalog')
  const observed = JSON.parse(gh('pr', 'view', String(journal.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,url,state,headRefOid,headRefName,baseRefName,isCrossRepository,autoMergeRequest'))
  assert(observed.state === 'OPEN' && observed.headRefName === journal.branch && observed.baseRefName === 'main' && observed.isCrossRepository === false && [journal.previous_head, journal.new_head].includes(observed.headRefOid), 'Catalog PR changed during refresh')
  if (observed.autoMergeRequest) gh('pr', 'merge', String(journal.number), '--repo', AUDIO_REPOSITORY, '--disable-auto')
  if (observed.headRefOid !== journal.new_head) run('git', ['push', 'origin', `${journal.new_head}:refs/heads/${journal.branch}`], journal.worktree)
  const updated = JSON.parse(gh('pr', 'view', String(journal.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,url,state,headRefOid'))
  assert(updated.state === 'OPEN' && updated.headRefOid === journal.new_head, 'Refreshed PR head was not observed')
  atomicJson(path.join(stateDir, 'publication', 'pending-pr.json'), updated)
  gh('pr', 'edit', String(journal.number), '--repo', AUDIO_REPOSITORY, '--title', journal.title, '--body-file', journal.body_file)
  const confirmed = JSON.parse(gh('pr', 'view', String(journal.number), '--repo', AUDIO_REPOSITORY, '--json', 'state,headRefOid,title,body'))
  assert(confirmed.state === 'OPEN' && confirmed.headRefOid === journal.new_head && confirmed.title === journal.title && confirmed.body.replace(/\r\n/g, '\n') === readFileSync(journal.body_file, 'utf8').replace(/\r\n/g, '\n'), 'Refreshed PR metadata/head were not observed together')
  atomicJson(path.join(stateDir, 'publication', `refresh-pr-${journal.number}.json`), { ...journal, status: 'pushed' })
  return { status: 'BRANCH_UPDATED', pr: updated, head: journal.new_head, regeneration_needed: journal.regeneration, reason: 'Waiting for all required checks on the refreshed head' }
}

/** Refresh only an unchanged, automation-owned catalog PR. Never rewrite its history. */
export function refreshCatalogPr(fresh, { root, stateDir, run = command } = {}) {
  assert(fresh.isCrossRepository === false && fresh.baseRefName === 'main' && /^chore\/audio-catalog-[a-f0-9]{20}$/.test(fresh.headRefName), 'Catalog refresh requires the owned repository/branch')
  assert(Number.isInteger(fresh.number) && fresh.number > 0 && /^[a-f0-9]{40}$/.test(fresh.headRefOid) && fresh.files?.length === 1 && fresh.files[0].path === catalogPath, 'Refresh is restricted to the known catalog-only PR head')
  assert(!validatePr(fresh).length, 'Catalog PR metadata does not satisfy repository conventions')
  ensureRemote(root, run)
  run('git', ['fetch', 'origin', 'main'], root)
  const journalFile = path.join(stateDir, 'publication', `refresh-pr-${fresh.number}.json`)
  const priorJournal = existsSync(journalFile) ? readPublicationJson(journalFile) : null
  if (priorJournal?.status === 'prepared' && [priorJournal.previous_head, priorJournal.new_head].includes(fresh.headRefOid)) return finishCatalogRefresh(priorJournal, { root, stateDir, run })
  const hash = fresh.headRefName.slice('chore/audio-catalog-'.length)
  const worktree = path.join(stateDir, 'publication', 'worktrees', hash)
  if (!existsSync(worktree)) return { status: 'HELD_WORKTREE_MISSING', reason: 'Restore the owned catalog worktree before automatic refresh' }
  assert(realpathSync(worktree) === path.resolve(worktree), 'Catalog worktree must not be a link')
  assert(run('git', ['branch', '--show-current'], worktree) === fresh.headRefName && run('git', ['rev-parse', 'HEAD'], worktree) === fresh.headRefOid, 'Owned catalog branch head changed')
  if (run('git', ['status', '--porcelain', '--untracked-files=all'], worktree)) return { status: 'HELD_WORKTREE_CHANGED', reason: 'Owned catalog worktree has unsaved changes; inspect them before refreshing' }
  const mainSha = run('git', ['rev-parse', 'origin/main'], worktree)
  const baseSha = run('git', ['merge-base', fresh.headRefOid, mainSha], worktree)
  assert(run('git', ['diff', '--name-only', baseSha, fresh.headRefOid], worktree) === catalogPath, 'Candidate branch contains changes outside the catalog')
  const readCatalog = sha => JSON.parse(run('git', ['show', `${sha}:${catalogPath}`], worktree))
  const readMainSource = articlePath => run('git', ['show', `${mainSha}:${articlePath}`], worktree)
  const readyManifests = findReadyManifests(stateDir).flatMap(file => {
    try { safeFile(file, stateDir); return [readPublicationJson(file)] } catch { return [] }
  })
  const checkMaterial = episodes => {
    const ids = episodes.map(episode => episode.id).sort().join('|')
    const ready = readyManifests.find(manifest => manifest.article_path === episodes[0].article_path && manifest.review?.script_sha256 === episodes[0].script_sha256 && manifest.episodes?.map(episode => episode.id).sort().join('|') === ids)
    if (!ready) return 'The reviewed local candidate was replaced or is missing; use the current production result'
    try {
      validateReady(ready, { root, stateDir, sourceText: readMainSource(ready.article_path) })
      validateReadySupplemental(ready, { root, stateDir, readDocument: readMainSource })
    } catch (error) { return error.message }
    return null
  }
  const headCatalog = readCatalog(fresh.headRefOid)
  const reconciliation = reconcileCatalogCandidate({ baseCatalog: readCatalog(baseSha), headCatalog, mainCatalog: readCatalog(mainSha), readSource: readMainSource, checkMaterial })
  recordRegeneration(stateDir, reconciliation.regeneration)
  if (reconciliation.conflicts.length) return { status: 'HELD_CATALOG_CONFLICT', conflicts: reconciliation.conflicts, regeneration_needed: reconciliation.regeneration }
  if (baseSha === mainSha && reconciliation.changed && JSON.stringify(headCatalog.episodes) === JSON.stringify(reconciliation.catalog.episodes)) return { status: 'WAITING_CHECKS', head: fresh.headRefOid, reason: 'This PR already contains fetched main; GitHub merge-state metadata has not caught up yet' }
  const gh = (...args) => run('gh', args, root)
  const observed = JSON.parse(gh('pr', 'view', String(fresh.number), '--repo', AUDIO_REPOSITORY, '--json', 'headRefOid,state,autoMergeRequest'))
  assert(observed.state === 'OPEN' && observed.headRefOid === fresh.headRefOid, 'Catalog PR changed before refresh')
  if (observed.autoMergeRequest) gh('pr', 'merge', String(fresh.number), '--repo', AUDIO_REPOSITORY, '--disable-auto')
  if (!reconciliation.changed) {
    atomicJson(journalFile, { status: 'closing-obsolete', number: fresh.number, previous_head: fresh.headRefOid, regeneration: reconciliation.regeneration })
    gh('pr', 'close', String(fresh.number), '--repo', AUDIO_REPOSITORY)
    const closed = JSON.parse(gh('pr', 'view', String(fresh.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,url,state,headRefOid'))
    assert(closed.state === 'CLOSED' && closed.headRefOid === fresh.headRefOid, 'Obsolete PR closure was not observed')
    atomicJson(journalFile, { status: 'closed-obsolete', number: fresh.number, previous_head: fresh.headRefOid, regeneration: reconciliation.regeneration })
    const pendingFile = path.join(stateDir, 'publication', 'pending-pr.json')
    if (existsSync(pendingFile)) unlinkSync(pendingFile)
    return { status: 'REGENERATION_QUEUED', pr: closed, regeneration_needed: reconciliation.regeneration }
  }
  const metadata = refreshPrMetadata(fresh, reconciliation.episodes, mainSha)
  mkdirSync(path.dirname(journalFile), { recursive: true })
  const bodyFile = path.join(stateDir, 'publication', `refresh-pr-${fresh.number}-body.md`)
  const messageFile = path.join(stateDir, 'publication', `refresh-pr-${fresh.number}-commit.txt`)
  writeFileSync(bodyFile, metadata.body, 'utf8')
  writeFileSync(messageFile, formatCommitMessage({ type: 'chore', scope: 'repo', summary: '音声カタログ候補へ最新 main を取り込む', reason: `main ${mainSha} に同期し、原文が一致する検査済み音声だけを候補として保持します。`, validation: '原文 SHA-256 と共有カタログ検査を再確認しました。新 head の CI は再実行待ちです。', impact: 'PR の最終差分は音声カタログのみです。原文が更新された候補は再生成へ戻します。', agent: 'claude' }), 'utf8')
  atomicJson(journalFile, { status: 'merging', number: fresh.number, previous_head: fresh.headRefOid, main_sha: mainSha, worktree, branch: fresh.headRefName })
  try { if (baseSha !== mainSha) run('git', ['merge', '--no-commit', '--no-ff', mainSha], worktree) } catch (error) {
    const conflicts = run('git', ['diff', '--name-only', '--diff-filter=U'], worktree).split('\n').filter(Boolean)
    if (!conflicts.length || conflicts.some(file => file !== catalogPath)) {
      try { run('git', ['merge', '--abort'], worktree) } catch { /* Preserve unresolved evidence for inspection. */ }
      return { status: 'HELD_CONFLICT', conflicts, reason: error.message }
    }
  }
  atomicJson(path.join(worktree, catalogPath), reconciliation.catalog)
  run('git', ['add', '--', catalogPath], worktree)
  run('git', ['diff', '--cached', '--check'], worktree)
  assert(run('git', ['diff', '--cached', '--name-only', mainSha], worktree) === catalogPath, 'Merge result changes more than the catalog relative to main')
  run('git', ['commit', '-F', messageFile], worktree)
  const newHead = run('git', ['rev-parse', 'HEAD'], worktree)
  const journal = { status: 'prepared', number: fresh.number, previous_head: fresh.headRefOid, new_head: newHead, main_sha: mainSha, worktree, branch: fresh.headRefName, body_file: bodyFile, body_sha256: digest(readFileSync(bodyFile)), title: metadata.title, regeneration: reconciliation.regeneration }
  atomicJson(journalFile, journal)
  return finishCatalogRefresh(journal, { root, stateDir, run })
}

export function queueCatalogMerge(pr, { root, stateDir, run = command } = {}) {
  if (pr.state !== 'OPEN') return { status: pr.state }
  const gh = (...args) => run('gh', args, root)
  const fresh = JSON.parse(gh('pr', 'view', String(pr.number), '--repo', AUDIO_REPOSITORY, '--json', 'number,title,body,headRefName,headRefOid,baseRefName,state,files,mergeStateStatus,isCrossRepository'))
  assert(fresh.state === 'OPEN' && fresh.headRefOid === pr.headRefOid && /^chore\/audio-catalog-[a-f0-9]{20}$/.test(fresh.headRefName), 'Catalog PR identity changed')
  assert(fresh.files?.length === 1 && fresh.files[0].path === catalogPath, 'Auto-merge scope is catalog-only')
  const problems = validatePr(fresh)
  assert(!problems.length, problems.join('\n'))
  const refreshFile = path.join(stateDir, 'publication', `refresh-pr-${fresh.number}.json`)
  const refresh = existsSync(refreshFile) ? readPublicationJson(refreshFile) : null
  if (refresh?.status === 'prepared' && [refresh.previous_head, refresh.new_head].includes(fresh.headRefOid)) return finishCatalogRefresh(refresh, { root, stateDir, run })
  if (fresh.mergeStateStatus === 'BEHIND') return refreshCatalogPr(fresh, { root, stateDir, run })
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
    const refreshFile = path.join(stateDir, 'publication', `refresh-pr-${pending.number}.json`)
    const refresh = existsSync(refreshFile) ? readPublicationJson(refreshFile) : null
    if (refresh?.status === 'prepared' && [refresh.previous_head, refresh.new_head].includes(pending.headRefOid)) {
      result.merge = finishCatalogRefresh(refresh, { root, stateDir, run })
      result.pr = result.merge.pr
      atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
      return result
    }
    assert(observed.headRefOid === pending.headRefOid && observed.number === pending.number, 'Pending catalog PR head changed')
    result.pr = observed
    if (observed.state === 'OPEN') {
      result.waiting_existing_pr = true
      if (autoMerge) {
        result.merge = queueCatalogMerge(observed, { root, stateDir, run })
        if (result.merge.pr) result.pr = result.merge.pr
        result.waiting_existing_pr = result.pr.state === 'OPEN'
      }
      atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
      return result
    }
    if (observed.state === 'CLOSED' && ['closing-obsolete', 'closed-obsolete'].includes(refresh?.status) && refresh.previous_head === observed.headRefOid) {
      unlinkSync(pendingFile)
      result.regeneration_needed = refresh.regeneration
      atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
      return result
    }
    assert(observed.state === 'MERGED', 'Pending catalog PR was closed; inspect before creating another batch')
    try {
      result.published_evidence = verifyPublication({ root, prUrl: observed.url, expectedHead: observed.headRefOid, requirePublication: true, publicationUrls: ['https://pero3dev.github.io/ai-agent-library/audio'] })
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
      if (apply) {
        validateSource(manifest.article_path, run('git', ['show', `origin/main:${manifest.article_path}`], root), manifest.source_digest)
        validateReadySupplemental(manifest, { root, stateDir, readDocument: documentPath => run('git', ['show', `origin/main:${documentPath}`], root) })
      }
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
    if (autoMerge) {
      result.merge = queueCatalogMerge(result.pr, { root, stateDir, run })
      if (result.merge.pr) result.pr = result.merge.pr
    }
  }
  atomicJson(path.join(stateDir, 'publication', 'last-result.json'), result)
  return result
  } finally { releaseLock() }
}
