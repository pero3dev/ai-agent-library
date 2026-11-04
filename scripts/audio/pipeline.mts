import type { AudioConfig, Article, AudioScript, ScriptReview, BoundScriptReview, SupplementalBundle, Execute, Generate, Progress } from './contracts.ts'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { articleSlug, discoverArticles, PrerequisiteError, productionDigest, QuotaError, readGeneratedJson, readJson, readSupplementalSources, sha256, sourceDigest, sourceSections, supplementalDigest, validateScript, validateSupplementalMaterial, writeJson } from './core.mjs'
import { askClaude, checkSubscription, execute, reviewPrompt, reviewSchema, scriptPrompt, scriptSchema } from './claude.mjs'
import { checkEngine, synthesizeScript } from './synthesis.mjs'
import { AuthorshipError, readScriptAuthorship, recordScriptAuthorship } from './authorship.mjs'
import { acquireAudioLock } from './lock.mjs'
import { errorCode, errorMessage } from './errors.mjs'
import { assertAudioConfig } from './config-contract.mjs'
import { audioScript, boundReview, supplementalBundle, readyCache, assertQueue, assertRegeneration, record as reviewRecord, reviewCoverage } from './cache-contracts.mjs'










type ToolKey = keyof Pick<AudioConfig, 'engine_url' | 'ffmpeg_path' | 'ffprobe_path' | 'claude_command'>

/** @param {string} file @param {NodeJS.ProcessEnv} [env] @param {string} [stateDir] @returns {Promise<AudioConfig>} */
export async function loadConfig(file: string, env: NodeJS.ProcessEnv = process.env, stateDir?: string): Promise<AudioConfig> {
  const config = await readJson(file)
  if (!reviewRecord(config)) throw new Error('Invalid audio configuration: expected an object')
  const localTools = stateDir ? await readJson(path.join(stateDir, 'tools.json'), {}) : {}
  if (!reviewRecord(localTools)) throw new Error('Invalid local audio tools configuration')
  /** @type {ToolKey[]} */
  const toolKeys: ToolKey[] = ['engine_url', 'ffmpeg_path', 'ffprobe_path', 'claude_command']
  for (const key of toolKeys) {
    if (localTools[key] !== undefined && typeof localTools[key] !== 'string') throw new Error(`Invalid local audio tool: ${key}`)
    if (localTools[key]) config[key] = localTools[key]
  }
  /** @type {[ToolKey, string][]} */
  const overrides: [ToolKey, string][] = [['engine_url', 'AUDIO_ENGINE_URL'], ['ffmpeg_path', 'AUDIO_FFMPEG'], ['ffprobe_path', 'AUDIO_FFPROBE'], ['claude_command', 'AUDIO_CLAUDE']]
  for (const [key, variable] of overrides) { const value = env[variable]; if (value) config[key] = value }
  assertAudioConfig(config)
  /** @type {(keyof Pick<AudioConfig, 'claude_command' | 'claude_model' | 'ffmpeg_path' | 'ffprobe_path'>)[]} */
  const requiredStrings: (keyof Pick<AudioConfig, 'claude_command' | 'claude_model' | 'ffmpeg_path' | 'ffprobe_path'>)[] = ['claude_command', 'claude_model', 'ffmpeg_path', 'ffprobe_path']
  for (const key of requiredStrings) if (typeof config[key] !== 'string' || !config[key]) throw new Error(`Missing config: ${key}`)
  /** @type {[keyof Pick<AudioConfig, 'claude_timeout_seconds' | 'max_repair_attempts' | 'max_articles_per_run' | 'inter_article_delay_seconds' | 'quota_retry_hours'>, number, number][]} */
  const ranges: [keyof Pick<AudioConfig, 'claude_timeout_seconds' | 'max_repair_attempts' | 'max_articles_per_run' | 'inter_article_delay_seconds' | 'quota_retry_hours'>, number, number][] = [['claude_timeout_seconds', 30, 3600], ['max_repair_attempts', 0, 3], ['max_articles_per_run', 1, 1999], ['inter_article_delay_seconds', 0, 3600], ['quota_retry_hours', 1, 168]]
  for (const [key, min, max] of ranges) if (!Number.isInteger(config[key]) || config[key] < min || config[key] > max) throw new Error(`Invalid config: ${key}`)
  if (!(config.synthesis?.speed_scale >= 0.8 && config.synthesis.speed_scale <= 1.3)) throw new Error('synthesis.speed_scale must be 0.8..1.3')
  if (![48, 64, 80, 96, 128].includes(config.synthesis?.bitrate_kbps)) throw new Error('Invalid MP3 bitrate')
  return config
}
/** @param {string} repoRoot @param {Execute} [run] */
export async function defaultStateDirectory(repoRoot: string, run: Execute = execute) {
  const result = await run('git', ['rev-parse', '--git-common-dir'], { cwd: repoRoot })
  if (result.code) throw new Error('Cannot resolve the common Git directory')
  return path.join(path.resolve(repoRoot, result.stdout.trim()), 'audio-learning')
}
/** @param {string} [stateDir] */
export async function checkAccountConfirmation(stateDir?: string) {
  const confirmation = stateDir ? await readJson(path.join(stateDir, 'account-confirmation.json'), null) : null
  if (!reviewRecord(confirmation) || confirmation.subscription_only_confirmed !== true || confirmation.extra_usage_disabled_confirmed !== true || typeof confirmation.confirmed_at !== 'string' || !Number.isFinite(Date.parse(confirmation.confirmed_at))) throw new PrerequisiteError('Account owner confirmation is required: subscription-only use and Extra usage disabled (account-confirmation.json). This cannot be inferred from Claude auth status.')
  return { confirmed_at: confirmation.confirmed_at, method: 'account-owner-confirmation', limitation: 'Account settings were confirmed by the owner, not queried by this program.' }
}
/** @param {AudioConfig} config @param {{run?: Execute, request?: typeof fetch, cwd?: string, env?: NodeJS.ProcessEnv, stateDir?: string}} [options] */
export async function doctor(config: AudioConfig, { run = execute, request = fetch, cwd, env = process.env, stateDir }: { run?: Execute; request?: typeof fetch; cwd?: string; env?: NodeJS.ProcessEnv; stateDir?: string } = {}) {
  const checks = []
  /** @type {[string, () => Promise<unknown>][]} */
  const operations: [string, () => Promise<unknown>][] = [
    ['account_confirmation', () => checkAccountConfirmation(stateDir)],
    ['claude_subscription', () => checkSubscription(config, { run, cwd, env })],
    ['voicevox', () => checkEngine(config, { request })],
    ['ffmpeg', async () => { const result = await run(config.ffmpeg_path, ['-version'], { timeout: 15_000 }); if (result.code) throw new Error('ffmpeg version check failed'); return { version: result.stdout.split('\n')[0] } }],
    ['ffprobe', async () => { const result = await run(config.ffprobe_path, ['-version'], { timeout: 15_000 }); if (result.code) throw new Error('ffprobe version check failed'); return { version: result.stdout.split('\n')[0] } }],
  ]
  for (const [name, check] of operations) {
    try { checks.push({ name, passed: true, detail: await check() }) } catch (error) { checks.push({ name, passed: false, error: errorMessage(error) }) }
  }
  return { passed: checks.every((check) => check.passed), checks, note: 'Account Extra usage must be disabled by the account owner; auth status cannot verify that setting. Signal checks do not prove pronunciation or semantic correctness.' }
}
/** @param {unknown} review @param {import('./contracts.ts').SourceSection[]} sections */
export function reviewProblems(review: unknown, sections: import('./contracts.ts').SourceSection[]) {
  const problems = []
  if (JSON.stringify(review)?.includes('\uFFFD')) problems.push('レビューに文字化けを示す置換文字があります')
  if (!reviewRecord(review)) return [...problems, 'レビュー形式が不正です']
  if (review.passed !== true) problems.push('独立レビューが不合格です')
  if (!Array.isArray(review.issues) || [...review.issues].some((issue) => typeof issue !== 'string')) problems.push('レビュー形式が不正です')
  else if (review.issues.length) problems.push(...review.issues)
  const coverage = Array.isArray(review.coverage) ? [...review.coverage] : []
  if (!Array.isArray(review.coverage) || !coverage.every(reviewCoverage)) problems.push('レビュー形式が不正です: coverage')
  for (const key of ['source_digest', 'script_sha256', 'supplemental_digest', 'reviewed_at']) if (review[key] !== undefined && typeof review[key] !== 'string') problems.push(`レビュー形式が不正です: ${key}`)
  const checkedCoverage = coverage.filter(reviewCoverage)
  for (const section of sections) {
    const matching = checkedCoverage.filter((item) => item.source_section === section.id)
    const entry = matching.length === 1 ? matching[0] : null
    if (!entry || entry.adequate !== true || typeof entry.reason !== 'string' || !entry.reason.trim()) problems.push(`独立レビューで未確認または不足: ${section.id} ${section.title}`)
  }
  return problems
}
/** @param {Article} article @param {AudioConfig} config @param {string} jobDir @param {{generate?: Generate, onProgress?: Progress, repoRoot?: string, saveScript?: typeof writeJson}} [options] */
export async function prepareReviewedScript(article: Article, config: AudioConfig, jobDir: string, { generate = askClaude, onProgress = () => {}, repoRoot, saveScript = writeJson }: { generate?: Generate; onProgress?: Progress; repoRoot?: string; saveScript?: typeof writeJson } = {}) {
  const sections = sourceSections(article.source), scriptFile = path.join(jobDir, 'script.json'), reviewFile = path.join(jobDir, 'review.json')
  const supplementalFile = path.join(jobDir, 'supplemental.json')
  const cachedScript = await readGeneratedJson(scriptFile), cachedReview = await readGeneratedJson(reviewFile)
  let script = audioScript(cachedScript) ? cachedScript : null
  let review = boundReview(cachedReview) ? cachedReview : null
  /** @type {unknown} */
  let invalidCandidate: unknown = script ? null : cachedScript
  /** @param {string | null} scriptHash */
  const authorBinding = (scriptHash: string | null) => ({ article_path: article.article_path, source_digest: article.source_digest, script_sha256: scriptHash })
  let authorship = readScriptAuthorship(jobDir, authorBinding(cachedScript ? sha256(JSON.stringify(cachedScript)) : null))
  if (cachedScript && !authorship) throw new AuthorshipError('a cached script requires its authorship binding')
  let issues = cachedScript ? validateScript(cachedScript, sections) : []
  const cachedSupplemental = review?.supplemental_digest ? await readGeneratedJson(supplementalFile) : null
  let supplemental = supplementalBundle(cachedSupplemental) ? cachedSupplemental : null
  const supplementalValid = !review?.supplemental_digest || (supplementalDigest(supplemental) === review.supplemental_digest && !(await validateSupplementalMaterial(supplemental, repoRoot)).length)
  if (script && !validateScript(script, sections).length && review?.source_digest === article.source_digest && review.script_sha256 === sha256(JSON.stringify(script)) && !reviewProblems(review, sections).length && supplementalValid) return { script, review, supplemental }
  supplemental = await readSupplementalSources(repoRoot, article)
  const supplementalHash = supplementalDigest(supplemental)
  if (supplementalHash) await writeJson(supplementalFile, supplemental)
  const groundedArticle = { ...article, supplemental }
  for (let attempt = 0; attempt <= config.max_repair_attempts; attempt++) {
    if (!script || attempt > 0 || validateScript(script, sections).length) {
      await onProgress({ phase: 'writing', repair_attempt: attempt })
      const nextScript = await generate(config, scriptPrompt(groundedArticle, sections, { previous: script ?? invalidCandidate, issues }), scriptSchema, { cwd: path.join(jobDir, 'claude-workspace') })
      issues = validateScript(nextScript, sections)
      if (!audioScript(nextScript) && !issues.length) issues.push('台本の形式が不正です')
      const previousCandidate = script ?? invalidCandidate
      const previousHash = previousCandidate ? sha256(JSON.stringify(previousCandidate)) : null, nextHash = sha256(JSON.stringify(nextScript))
      // Materialize legacy attribution before introducing any newer hash record.
      // An interruption before script.json changes must still resolve its old authors.
      if (previousCandidate && authorship) recordScriptAuthorship(jobDir, { ...authorBinding(previousHash), agents: authorship.agents })
      /** @type {import('./contracts.ts').ScriptAgent} */
      const writer: import('./contracts.ts').ScriptAgent = 'claude'
      const agents = previousHash === nextHash && authorship ? authorship.agents : [...new Set([...(authorship?.agents ?? []), writer])]
      const nextAuthorship = recordScriptAuthorship(jobDir, { ...authorBinding(nextHash), agents })
      await saveScript(scriptFile, nextScript)
      if (issues.length || !audioScript(nextScript)) { invalidCandidate = nextScript; script = null; authorship = nextAuthorship; continue }
      script = nextScript; authorship = nextAuthorship
    }
    issues = validateScript(script, sections)
    if (issues.length) continue
    await onProgress({ phase: 'reviewing', repair_attempt: attempt })
    const independentReview = await generate(config, reviewPrompt(groundedArticle, sections, script), reviewSchema, { cwd: path.join(jobDir, 'claude-workspace') })
    const candidateReview = { ...(reviewRecord(independentReview) ? independentReview : {}), source_digest: article.source_digest, script_sha256: sha256(JSON.stringify(script)), ...(supplementalHash ? { supplemental_digest: supplementalHash } : {}), reviewed_at: new Date().toISOString() }
    await writeJson(reviewFile, candidateReview)
    issues = reviewProblems(candidateReview, sections)
    if (script && !issues.length && boundReview(candidateReview)) {
      review = candidateReview
      return { script, review, supplemental }
    }
  }
  throw new Error(`台本の自動修正上限に達しました: ${issues.join('; ')}`)
}
/** @param {string} file @param {Article} article @param {string} productionSignature @param {string} repoRoot */
async function readyIsCurrent(file: string, article: Article, productionSignature: string, repoRoot: string) {
  const ready = await readGeneratedJson(file)
  if (!readyCache(ready) || ready.source_digest !== article.source_digest || ready.review.passed !== true || ready.signal_checks.passed !== true || !ready.episodes.length) return false
  if (ready.supplemental_digest || ready.review.supplemental_digest || ready.supplemental_file) {
    if (ready.supplemental_file !== path.join(path.dirname(file), 'supplemental.json') || ready.supplemental_digest !== ready.review.supplemental_digest) return false
    const supplemental = await readGeneratedJson(ready.supplemental_file)
    if (!supplementalBundle(supplemental) || supplementalDigest(supplemental) !== ready.supplemental_digest || (await validateSupplementalMaterial(supplemental, repoRoot)).length) return false
  }
  if (ready.production_signature !== productionDigest(productionSignature, ready.supplemental_digest)) return false
  const scriptFile = path.join(path.dirname(file), 'script.json')
  if (ready.script_file !== scriptFile || ready.review.source_digest !== article.source_digest || !Array.isArray(ready.signal_checks.parts) || ready.signal_checks.parts.length !== ready.episodes.length) return false
  const script = await readGeneratedJson(scriptFile)
  const sections = sourceSections(article.source)
  if (!script || validateScript(script, sections).length || reviewProblems(ready.review, sections).length) return false
  const scriptHash = sha256(JSON.stringify(script))
  if (scriptHash !== ready.review.script_sha256) return false
  readScriptAuthorship(path.dirname(file), { article_path: article.article_path, source_digest: article.source_digest, script_sha256: scriptHash })
  for (const [index, episode] of ready.episodes.entries()) {
    const signal = ready.signal_checks.parts[index]
    if (episode.script_sha256 !== scriptHash || episode.source_digest !== article.source_digest || episode.part !== index + 1 || episode.parts !== ready.episodes.length) return false
    if (signal?.passed !== true || !Array.isArray(signal.issues) || signal.issues.length || signal.audio_sha256 !== episode.audio_sha256 || !Number.isFinite(signal.duration_seconds) || signal.duration_seconds <= 0 || !Number.isFinite(episode.duration_seconds) || Math.abs(signal.duration_seconds - episode.duration_seconds) > 0.05) return false
    if (!Number.isFinite(signal.silence_seconds) || signal.silence_seconds < 0 || signal.silence_seconds > signal.duration_seconds * 0.4) return false
    try { if (sha256(await readFile(episode.audio_file)) !== episode.audio_sha256) return false } catch (error) { if (errorCode(error) === 'ENOENT') return false; throw error }
  }
  return true
}
/** @param {{repoRoot: string, stateDir: string, config: AudioConfig, section?: string, limit?: number, retryHeld?: boolean}} options @param {{preflight?: typeof checkSubscription, engineCheck?: typeof checkEngine, generate?: Generate, synthesize?: typeof synthesizeScript, discover?: typeof discoverArticles, delay?: (ms: number) => Promise<unknown>, progress?: Progress}} [deps] */
export async function runProduction({ repoRoot, stateDir, config, section, limit = config.max_articles_per_run, retryHeld = false }: { repoRoot: string; stateDir: string; config: AudioConfig; section?: string; limit?: number; retryHeld?: boolean }, deps: { preflight?: typeof checkSubscription; engineCheck?: typeof checkEngine; generate?: Generate; synthesize?: typeof synthesizeScript; discover?: typeof discoverArticles; delay?: (ms: number) => Promise<unknown>; progress?: Progress } = {}) {
  const { preflight = checkSubscription, engineCheck = checkEngine, generate = askClaude, synthesize = synthesizeScript, discover = discoverArticles, delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), progress = (message) => process.stderr.write(`${JSON.stringify(message)}\n`) } = deps
  await mkdir(stateDir, { recursive: true })
  const { release: releaseLock } = acquireAudioLock(stateDir, 'run')
  const queueFile = path.join(stateDir, 'queue.json')
  /** @type {import('./cache-contracts.mjs').PersistedQueue | undefined} */
  let queue: import('./cache-contracts.mjs').PersistedQueue | undefined
  /** @type {import('./contracts.ts').ProductionSummary} */
  const summary: import('./contracts.ts').ProductionSummary = { status: 'completed', ready: [], held: [], processed: 0, skipped: 0 }
  const productionSignature = sha256(JSON.stringify({ voices: config.voices, synthesis: config.synthesis, attribution: config.attribution }))
  try {
    const storedQueue = await readJson(queueFile, { schema_version: 1, jobs: {} })
    assertQueue(storedQueue)
    queue = storedQueue
    if (queue.pause_until && Date.parse(queue.pause_until) > Date.now()) return { ...summary, status: 'paused', pause_until: queue.pause_until, reason: queue.pause_reason }
    const articles = await discover(repoRoot, { section })
    queue.total_articles = articles.length
    const pending = []
    for (const article of articles) {
      const jobDir = path.join(stateDir, 'jobs', articleSlug(article.article_path), article.source_digest)
      const readyFile = path.join(jobDir, 'ready.json'), previous = queue.jobs[article.article_path]
      try {
        if (await readyIsCurrent(readyFile, article, productionSignature, repoRoot)) { summary.ready.push(readyFile); summary.skipped++; continue }
      } catch (error) {
        if (!(error instanceof AuthorshipError)) throw error
        const update = { source_digest: article.source_digest, job_dir: jobDir, status: 'held', phase: 'held', error: errorMessage(error), updated_at: new Date().toISOString() }
        queue.jobs[article.article_path] = { ...previous, ...update }
        await writeJson(queueFile, queue)
        await progress({ article_path: article.article_path, ...update })
        summary.held.push({ article_path: article.article_path, error: errorMessage(error) })
        continue
      }
      if (previous?.source_digest === article.source_digest && previous.status === 'held' && !retryHeld) { summary.held.push({ article_path: article.article_path, error: previous.error }); continue }
      pending.push({ article, jobDir, readyFile })
    }
    const regeneration = await readJson(path.join(stateDir, 'publication/regeneration-needed.json'), null)
    assertRegeneration(regeneration)
    const priority = new Set((Array.isArray(regeneration?.articles) ? regeneration.articles : []).filter((item) => articles.some((article) => article.article_path === item.article_path && article.source_digest === item.source_digest)).map((item) => item.article_path))
    pending.sort((a, b) => Number(priority.has(b.article.article_path)) - Number(priority.has(a.article.article_path)))
    if (!pending.length) { await writeJson(queueFile, queue); return summary }
    await checkAccountConfirmation(stateDir)
    await preflight(config, { cwd: repoRoot })
    const engine = await engineCheck(config)
    for (const { article, jobDir, readyFile } of pending.slice(0, limit)) {
      if (summary.processed) await delay(config.inter_article_delay_seconds * 1000)
      const job = { source_digest: article.source_digest, status: 'working', started_at: new Date().toISOString(), job_dir: jobDir }
      queue.jobs[article.article_path] = job
      /** @param {import('./contracts.ts').ProgressUpdate} update @returns {Promise<void>} */
      const onProgress = async (update: import('./contracts.ts').ProgressUpdate): Promise<void> => { Object.assign(job, update, { updated_at: new Date().toISOString() }); await writeJson(queueFile, queue); progress({ article_path: article.article_path, ...update }) }
      await mkdir(jobDir, { recursive: true })
      await onProgress({ phase: 'starting' })
      try {
        const { script, review, supplemental } = await prepareReviewedScript(article, config, jobDir, { generate, onProgress, repoRoot })
        const parts = await synthesize(script, config, jobDir, engine, { progress: onProgress })
        if (!parts.length || parts.some((part) => part.signal?.passed !== true)) throw new Error('Audio signal validation did not pass')
        // An article may change while synthesis is running. Keep old public audio until a current replacement is ready.
        const currentSource = await readFile(path.join(repoRoot, article.article_path), 'utf8')
        if (sourceDigest(currentSource) !== article.source_digest) throw new Error('Source changed during production; this version will not be published')
        const supplementalHash = supplementalDigest(supplemental)
        if (supplementalHash && (await validateSupplementalMaterial(supplemental, repoRoot)).length) throw new Error('Supplemental source changed during production; this version will not be published')
        readScriptAuthorship(jobDir, { article_path: article.article_path, source_digest: article.source_digest, script_sha256: review.script_sha256 })
        const episodes = parts.map((part) => ({ id: `${articleSlug(article.article_path)}-${article.source_digest.slice(0, 12)}-${review.script_sha256.slice(0, 12)}-${part.audio_sha256.slice(0, 12)}-p${String(part.part).padStart(2, '0')}`, article_path: article.article_path, source_digest: article.source_digest, title: `${article.title}${part.parts > 1 ? ` (${part.part}/${part.parts})` : ''}`, part: part.part, parts: part.parts, duration_seconds: part.duration_seconds, chapters: part.chapters, audio_sha256: part.audio_sha256, audio_file: part.audio_file, script_sha256: review.script_sha256, voices: engine.voices, attribution: config.attribution }))
        await writeJson(readyFile, { schema_version: 1, article_path: article.article_path, source_digest: article.source_digest, production_signature: productionDigest(productionSignature, supplementalHash), ...(supplementalHash ? { supplemental_file: path.join(jobDir, 'supplemental.json'), supplemental_digest: supplementalHash } : {}), script_file: path.join(jobDir, 'script.json'), created_at: new Date().toISOString(), review, signal_checks: { passed: true, method: 'ffprobe+ffmpeg-silencedetect', parts: parts.map((part) => ({ ...part.signal, audio_sha256: part.audio_sha256 })), limitation: 'Text review and signal checks do not verify actual pronunciation or listening comprehension.' }, episodes })
        await onProgress({ status: 'ready', phase: 'ready', ready_file: readyFile })
        summary.ready.push(readyFile)
      } catch (error) {
        if (error instanceof QuotaError) { job.status = 'paused'; throw error }
        await onProgress({ status: 'held', phase: 'held', error: errorMessage(error) })
        summary.held.push({ article_path: article.article_path, error: errorMessage(error) })
      }
      summary.processed++
    }
    delete queue.pause_until; delete queue.pause_reason
    await writeJson(queueFile, queue)
    return summary
  } catch (error) {
    if (queue && (error instanceof QuotaError || error instanceof PrerequisiteError)) {
      queue.pause_reason = errorMessage(error)
      if (error instanceof QuotaError) queue.pause_until = new Date(Date.now() + config.quota_retry_hours * 3_600_000).toISOString()
      await writeJson(queueFile, queue)
      return { ...summary, status: error instanceof QuotaError ? 'paused' : 'blocked', reason: errorMessage(error), pause_until: queue.pause_until }
    }
    throw error
  } finally { await releaseLock() }
}
