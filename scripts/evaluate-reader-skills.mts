import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const READER_SKILLS = ['agent-design-review', 'agent-architecture-choice', 'agent-security-review', 'agent-eval-plan'] as const
export type ReaderSkill = typeof READER_SKILLS[number]
export interface TriggerCase { id: string; expected_skill: ReaderSkill | null; prompt: string; rationale: string; fixture: string }
export interface TriggerDataset { schema_version: 1; dataset_id: string; purpose: string; observation: string; cases: TriggerCase[] }
export interface SkillRead { skill: ReaderSkill; tool: string; full_text_matched: boolean; output_sha256: string; command_exit_code: number }
export interface TriggerResult {
  id: string; expected_skill: ReaderSkill | null; observed_skills: ReaderSkill[]; reads: SkillRead[]
  completed: boolean; exit_code: number | null; timed_out: boolean; duration_ms: number; observed_model: string | null
  execution_error: string | null; attempted_skills: ReaderSkill[]
  artifacts: { events: string; stderr: string; answer: string }
}
export interface TriggerReport {
  schema_version: 1; dataset_id: string; dataset_sha256: string; skills_sha256: string
  observed_at: string; cli_version: string; requested_model: 'CLI default (not overridden)'
  backend_model_observation: string; observer_definition: string; execution: Record<string, unknown>
  complete: boolean; results: TriggerResult[]; metrics: ReturnType<typeof scoreTriggerResults>; limitations: string[]
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultDataset = path.join(repoRoot, 'plugins/ai-agent-library/evals/cases.json')
const normalize = (text: string) => text.replace(/\r\n?/g, '\n').trim()
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
export const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')

export function validateTriggerDataset(value: unknown): TriggerDataset {
  if (!record(value) || value.schema_version !== 1 || typeof value.dataset_id !== 'string' || !value.dataset_id.trim()
    || typeof value.purpose !== 'string' || typeof value.observation !== 'string' || !Array.isArray(value.cases) || value.cases.length !== 20) {
    throw new Error('reader eval: schema_version 1 の20例が必要です')
  }
  const ids = new Set<string>()
  let positive = 0
  const covered = new Set<string>()
  for (const item of value.cases) {
    if (!record(item) || typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw new Error('reader eval: case id が不正・重複しています')
    ids.add(item.id)
    for (const field of ['prompt', 'rationale', 'fixture'] as const) {
      if (typeof item[field] !== 'string' || (field !== 'fixture' && !item[field].trim()) || item[field].length > 15000) throw new Error(`reader eval: ${item.id}.${field} が不正です`)
    }
    if (item.expected_skill !== null) {
      if (typeof item.expected_skill !== 'string' || !READER_SKILLS.includes(item.expected_skill as ReaderSkill)) throw new Error('reader eval: 未知の期待スキルです')
      covered.add(item.expected_skill); positive++
    }
  }
  if (positive !== 10 || covered.size !== READER_SKILLS.length) throw new Error('reader eval: positive10/negative10と4スキルの網羅が必要です')
  return value as unknown as TriggerDataset
}

/** A read is counted only when a successful file-reading command emitted the complete entrypoint body. */
export function observeSkillReads(jsonl: string, sources: ReadonlyMap<ReaderSkill, string>, stderr = ''): { reads: SkillRead[]; observed_model: string | null; turn_completed: boolean; execution_error: string | null; attempted_skills: ReaderSkill[] } {
  const reads: SkillRead[] = []
  let observedModel: string | null = null
  let turnCompleted = false
  for (const line of jsonl.split(/\r?\n/).filter(Boolean)) {
    let event: unknown
    try { event = JSON.parse(line) } catch { continue }
    if (!record(event)) continue
    if (event.type === 'turn.completed') turnCompleted = true
    if (typeof event.model === 'string') observedModel = event.model
    if (!record(event.item) || event.type !== 'item.completed') continue
    const item = event.item
    if (item.type !== 'command_execution' || typeof item.exit_code !== 'number' || typeof item.command !== 'string' || typeof item.aggregated_output !== 'string') continue
    const command = item.command.replace(/\\/g, '/').replace(/\/+/g, '/')
    // Directory listing, grep and echo of a filename do not count as activation.
    if (!/\b(?:Get-Content|cat|head|tail|more|type|sed)\b/i.test(command)
      || /\b(?:echo|Write-Output)\s+['"]?(?:Get-Content|cat|head|tail|more|type|sed)\b/i.test(command)) continue
    const output = normalize(item.aggregated_output)
    for (const skill of READER_SKILLS) {
      const source = sources.get(skill)
      if (!source || !command.includes(`${skill}/SKILL.md`) || !output.includes(normalize(source))) continue
      // A multi-command batch may return 1 because a later rg has no matches.
      // The emitted complete entrypoint proves the read independently of that final status.
      reads.push({ skill, tool: 'command_execution', full_text_matched: true, output_sha256: sha256(item.aggregated_output), command_exit_code: item.exit_code })
    }
  }
  const policyBlocked = /tools::router:.*(?:blocked by policy|Rejected\()/i.test(stderr)
  const attemptedSkills = policyBlocked ? READER_SKILLS.filter(skill => stderr.replace(/\\/g, '/').includes(`${skill}/SKILL.md`)) : []
  return { reads, observed_model: observedModel, turn_completed: turnCompleted,
    execution_error: policyBlocked ? 'Tool execution was blocked by host policy; not a routing result' : null, attempted_skills: attemptedSkills }
}

export function scoreTriggerResults(results: ReadonlyArray<Pick<TriggerResult, 'expected_skill' | 'observed_skills' | 'completed'>>) {
  let tp = 0; let fp = 0; let tn = 0; let fn = 0; let expectedSkillHits = 0; let exactRoutes = 0; let executionErrors = 0
  for (const item of results) {
    if (!item.completed) { executionErrors++; continue }
    const activated = item.observed_skills.length > 0
    if (item.expected_skill === null) { if (activated) fp++; else { tn++; exactRoutes++ } }
    else {
      if (activated) tp++; else fn++
      if (item.observed_skills.includes(item.expected_skill)) expectedSkillHits++
      if (item.observed_skills.length === 1 && item.observed_skills[0] === item.expected_skill) exactRoutes++
    }
  }
  const executed = results.length - executionErrors
  return {
    cases_attempted: results.length, executed, execution_errors: executionErrors, true_positive: tp, false_positive: fp,
    true_negative: tn, false_negative: fn, expected_skill_hits: expectedSkillHits, exact_routes: exactRoutes,
    activation_accuracy: executed ? (tp + tn) / executed : null,
    exact_route_accuracy: executed ? exactRoutes / executed : null,
  }
}

export async function forEachBounded<T>(items: readonly T[], concurrency: number, task: (item: T) => Promise<boolean>) {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 2) throw new Error('reader eval: concurrencyは1〜2です')
  let next = 0; let stopped = false
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!stopped) {
      const index = next++
      if (index >= items.length) return
      if (!await task(items[index])) stopped = true
    }
  }))
}

export function validateTriggerReport(value: unknown, dataset: TriggerDataset): TriggerReport {
  if (!record(value) || value.schema_version !== 1 || value.dataset_id !== dataset.dataset_id || !Array.isArray(value.results)
    || value.results.length > dataset.cases.length || !record(value.execution) || typeof value.cli_version !== 'string'
    || typeof value.dataset_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.dataset_sha256)
    || typeof value.skills_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.skills_sha256)) throw new Error('reader eval: report形式が不正です')
  const seen = new Set<string>()
  for (const result of value.results) {
    if (!record(result) || typeof result.id !== 'string' || seen.has(result.id)) throw new Error('reader eval: report caseが不正・重複しています')
    seen.add(result.id)
    const expected = dataset.cases.find(item => item.id === result.id)
    if (!expected || result.expected_skill !== expected.expected_skill) throw new Error('reader eval: reportの期待値がdatasetと一致しません')
    if (typeof result.completed !== 'boolean' || typeof result.timed_out !== 'boolean' || !Array.isArray(result.reads)
      || !Array.isArray(result.observed_skills) || result.observed_skills.some(skill => typeof skill !== 'string' || !READER_SKILLS.includes(skill as ReaderSkill))
      || result.observed_skills.length !== new Set(result.observed_skills).size || !record(result.artifacts)
      || result.artifacts.events !== `${result.id}/events.jsonl` || result.artifacts.stderr !== `${result.id}/stderr.txt`
      || result.artifacts.answer !== `${result.id}/answer.txt` || (result.exit_code !== null && !Number.isSafeInteger(result.exit_code))
      || typeof result.duration_ms !== 'number' || !Number.isFinite(result.duration_ms) || result.duration_ms < 0) throw new Error('reader eval: reportの実行結果が不正です')
  }
  return value as unknown as TriggerReport
}

async function assertPlainDirectory(directory: string): Promise<void> {
  const stat = await lstat(directory)
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`reader eval: 通常ディレクトリが必要です: ${directory}`)
}

async function assertNoLinks(directory: string): Promise<void> {
  await assertPlainDirectory(directory)
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    const stat = await lstat(file)
    if (stat.isSymbolicLink()) throw new Error(`reader eval: シンボリックリンクを拒否します: ${file}`)
    if (stat.isDirectory()) await assertNoLinks(file)
    else if (!stat.isFile()) throw new Error(`reader eval: 特殊ファイルを拒否します: ${file}`)
  }
}

async function skillInputs(root: string) {
  const directory = path.join(root, 'plugins/ai-agent-library/skills')
  const sources = new Map<ReaderSkill, string>()
  const digest = createHash('sha256')
  async function walk(file: string, relative: string) {
    const stat = await lstat(file)
    if (stat.isSymbolicLink()) throw new Error(`reader eval: リンクを拒否します: ${relative}`)
    if (stat.isDirectory()) for (const name of (await readdir(file)).sort()) await walk(path.join(file, name), `${relative}/${name}`)
    else if (stat.isFile()) { digest.update(relative); digest.update('\0'); digest.update(await readFile(file)); digest.update('\0') }
    else throw new Error(`reader eval: 特殊ファイルを拒否します: ${relative}`)
  }
  for (const skill of READER_SKILLS) {
    const folder = path.join(directory, skill)
    await assertNoLinks(folder)
    const text = await readFile(path.join(folder, 'SKILL.md'), 'utf8')
    if (!text.includes(`name: ${skill}`)) throw new Error(`reader eval: スキル名が一致しません: ${skill}`)
    // References must exist before an actual model run; do not evaluate broken copies.
    for (const match of text.matchAll(/\]\((references\/[^)]+)\)/g)) {
      const reference = await lstat(path.join(folder, match[1]))
      if (!reference.isFile() || reference.isSymbolicLink()) throw new Error(`reader eval: 参照が不正です: ${match[1]}`)
    }
    sources.set(skill, text); await walk(folder, skill)
  }
  return { directory, sources, digest: digest.digest('hex') }
}

interface ChildResult { stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; durationMs: number }
async function callCodex(cli: string, workspace: string, prompt: string, answer: string, timeoutMs: number, automaticReview: boolean): Promise<ChildResult> {
  const began = Date.now()
  return await new Promise((resolve, reject) => {
    const approval = automaticReview ? ['--approve-for-me'] : ['--sandbox', 'read-only', '-c', 'approval_policy="never"']
    const child = spawn(process.execPath, [cli, 'exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check',
      ...approval, '--color', 'never', '--json', '-C', workspace, '-o', answer, '-'],
    { cwd: workspace, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    let stdout = ''; let stderr = ''; let timedOut = false
    const stop = () => {
      if (!child.pid || child.exitCode !== null) return
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
      else child.kill('SIGTERM')
    }
    const timer = setTimeout(() => { timedOut = true; stop() }, timeoutMs)
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => { stdout += chunk; if (Buffer.byteLength(stdout) > 8 * 1024 * 1024) { timedOut = true; stop() } })
    child.stderr.on('data', (chunk: string) => { stderr += chunk; if (Buffer.byteLength(stderr) > 2 * 1024 * 1024) { timedOut = true; stop() } })
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('close', exitCode => { clearTimeout(timer); resolve({ stdout, stderr, exitCode, timedOut, durationMs: Date.now() - began }) })
    child.stdin.end(prompt, 'utf8')
  })
}

interface Options { check: boolean; run: boolean; replay: boolean; dataset: string; cli?: string; output?: string; maxCases: number; timeoutMs: number; resume: boolean; automaticReview: boolean; concurrency: number }
export function parseReaderEvalArgs(args: string[]): Options {
  const options: Options = { check: false, run: false, replay: false, dataset: defaultDataset, maxCases: 20, timeoutMs: 120000, resume: false, automaticReview: false, concurrency: 1 }
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--check') options.check = true
    else if (flag === '--run') options.run = true
    else if (flag === '--replay') options.replay = true
    else if (flag === '--resume') options.resume = true
    else if (flag === '--approve-for-me') options.automaticReview = true
    else if (['--dataset', '--codex-js', '--output-dir', '--max-cases', '--timeout-ms', '--concurrency'].includes(flag)) {
      const value = args[++i]
      if (!value || value.startsWith('--')) throw new Error(`reader eval: ${flag} の値が必要です`)
      if (flag === '--dataset') options.dataset = path.resolve(value)
      if (flag === '--codex-js') options.cli = path.resolve(value)
      if (flag === '--output-dir') { if (!path.isAbsolute(value)) throw new Error('reader eval: output-dirは絶対パスが必要です'); options.output = value }
      if (flag === '--max-cases') options.maxCases = Number(value)
      if (flag === '--timeout-ms') options.timeoutMs = Number(value)
      if (flag === '--concurrency') options.concurrency = Number(value)
    } else throw new Error(`reader eval: 未知の引数 ${flag}`)
  }
  if ([options.check, options.run, options.replay].filter(Boolean).length !== 1) throw new Error('reader eval: --check/--run/--replayを1つ指定してください')
  if (options.run && (!options.cli || !options.output)) throw new Error('reader eval: --runには--codex-jsと--output-dirが必要です')
  if (options.replay && !options.output) throw new Error('reader eval: --replayには--output-dirが必要です')
  if (!Number.isSafeInteger(options.maxCases) || options.maxCases < 1 || options.maxCases > 20) throw new Error('reader eval: max-casesは1〜20です')
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 10000 || options.timeoutMs > 180000) throw new Error('reader eval: timeout-msは10000〜180000です')
  if (!Number.isSafeInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 2) throw new Error('reader eval: concurrencyは1〜2です')
  return options
}

export async function runReaderEvaluation(options: Options, root = repoRoot) {
  const raw = await readFile(options.dataset, 'utf8')
  const dataset = validateTriggerDataset(JSON.parse(raw))
  const inputs = await skillInputs(root)
  if (options.check) return { evidence: 'static', dataset_id: dataset.dataset_id, positive: 10, negative: 10, skills: READER_SKILLS.length, dataset_sha256: sha256(raw), skills_sha256: inputs.digest }
  const output = options.output!
  if (options.replay) {
    await assertNoLinks(output)
    const reportFile = path.join(output, 'report.json')
    const report = validateTriggerReport(JSON.parse(await readFile(reportFile, 'utf8')), dataset)
    if (report.schema_version !== 1 || report.dataset_sha256 !== sha256(raw) || report.skills_sha256 !== inputs.digest) throw new Error('reader eval: replayの入力・スキルが一致しません')
    for (const result of report.results) {
      if (!dataset.cases.some(item => item.id === result.id)) throw new Error('reader eval: replayのcaseが不正です')
      const observed = observeSkillReads(await readFile(path.join(output, result.id, 'events.jsonl'), 'utf8'), inputs.sources,
        await readFile(path.join(output, result.id, 'stderr.txt'), 'utf8'))
      result.reads = observed.reads; result.observed_skills = [...new Set(observed.reads.map(read => read.skill))]
      result.observed_model = observed.observed_model; result.execution_error = observed.execution_error; result.attempted_skills = observed.attempted_skills
      result.completed = result.exit_code === 0 && !result.timed_out && observed.turn_completed && !observed.execution_error
    }
    report.metrics = scoreTriggerResults(report.results)
    report.complete = report.results.length === dataset.cases.length && report.results.every(result => result.completed)
    report.execution.replayed_at = new Date().toISOString()
    await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8')
    return report
  }
  const cli = options.cli!
  const cliStat = await lstat(cli)
  if (!cliStat.isFile() || cliStat.isSymbolicLink()) throw new Error('reader eval: trusted Codex JS entrypointが必要です')
  const version = spawnSync(process.execPath, [cli, '--version'], { encoding: 'utf8', windowsHide: true, timeout: 10000 })
  if (version.status !== 0) throw new Error('reader eval: Codex版を取得できません')
  const cliVersion = version.stdout.trim()
  const reportFile = path.join(output, 'report.json')
  let report: TriggerReport
  if (options.resume) {
    await assertNoLinks(output)
    report = validateTriggerReport(JSON.parse(await readFile(reportFile, 'utf8')), dataset)
    if (report.schema_version !== 1 || report.dataset_sha256 !== sha256(raw) || report.skills_sha256 !== inputs.digest || report.cli_version !== cliVersion
      || report.execution.automatic_review !== options.automaticReview) throw new Error('reader eval: resumeの入力・スキル・CLI版・承認モードが一致しません')
    if (report.results.some(item => !item.completed)) throw new Error('reader eval: 実行エラーを含むrunは自動再実行しません')
  } else {
    await mkdir(output, { recursive: false })
    report = {
      schema_version: 1, dataset_id: dataset.dataset_id, dataset_sha256: sha256(raw), skills_sha256: inputs.digest,
      observed_at: new Date().toISOString(), cli_version: cliVersion, requested_model: 'CLI default (not overridden)',
      backend_model_observation: 'JSONLにmodelフィールドがある場合だけ記録する。モデルの自己申告からは補わない。',
      observer_definition: dataset.observation,
      execution: { host: 'Codex CLI', mode: 'consumer .agents/skills copy', sandbox: options.automaticReview ? 'workspace-write (owned fixture only)' : 'read-only',
        automatic_review: options.automaticReview, ignore_user_config: true, concurrency_ceiling: options.concurrency,
        ephemeral: true, runs_per_case: 1, timeout_ms: options.timeoutMs, mcp_configured: false, model_override: false },
      complete: false, results: [], metrics: scoreTriggerResults([]), limitations: [
        '設計者が作った10正例・10負例で、実利用分布を代表しない。',
        'SKILL.mdの実読込を暗黙選択の観測代理として測る。内部の全発火状態やレビュー品質全体を直接測らない。',
        'MCPなし・同梱参照で評価する。Claude Codeのモデル実行とプラグイン自動選択の結果ではない。',
        '各ケース1回であり、確率的な選択の再現率や小差の有意性を立証しない。',
      ],
    }
  }
  report.execution.concurrency_ceiling = Math.max(Number(report.execution.concurrency_ceiling ?? 1), options.concurrency)
  const pending = dataset.cases.filter(item => !report.results.some(result => result.id === item.id)).slice(0, Math.max(0, options.maxCases - report.results.length))
  let saveChain = Promise.resolve()
  await forEachBounded(pending, options.concurrency, async item => {
    const workspace = path.join(output, item.id)
    await mkdir(workspace, { recursive: false })
    await mkdir(path.join(workspace, '.agents/skills'), { recursive: true })
    for (const skill of READER_SKILLS) await cp(path.join(inputs.directory, skill), path.join(workspace, '.agents/skills', skill), { recursive: true, errorOnExist: true, force: false })
    await writeFile(path.join(workspace, 'input.md'), item.fixture, 'utf8')
    const eventsFile = path.join(workspace, 'events.jsonl')
    const stderrFile = path.join(workspace, 'stderr.txt')
    const answerFile = path.join(workspace, 'answer.txt')
    const result = await callCodex(cli, workspace, item.prompt, answerFile, options.timeoutMs, options.automaticReview)
    await writeFile(eventsFile, result.stdout, 'utf8'); await writeFile(stderrFile, result.stderr, 'utf8')
    const observed = observeSkillReads(result.stdout, inputs.sources, result.stderr)
    report.results.push({ id: item.id, expected_skill: item.expected_skill, observed_skills: [...new Set(observed.reads.map(read => read.skill))], reads: observed.reads,
      completed: result.exitCode === 0 && !result.timedOut && observed.turn_completed && !observed.execution_error, exit_code: result.exitCode, timed_out: result.timedOut,
      execution_error: observed.execution_error, attempted_skills: observed.attempted_skills,
      duration_ms: result.durationMs, observed_model: observed.observed_model, artifacts: { events: `${item.id}/events.jsonl`, stderr: `${item.id}/stderr.txt`, answer: `${item.id}/answer.txt` } })
    const current = report.results.at(-1)!
    report.results.sort((a, b) => dataset.cases.findIndex(item => item.id === a.id) - dataset.cases.findIndex(item => item.id === b.id))
    report.metrics = scoreTriggerResults(report.results)
    report.complete = report.results.length === dataset.cases.length && report.results.every(result => result.completed)
    const snapshot = JSON.stringify(report, null, 2) + '\n'
    saveChain = saveChain.then(() => writeFile(reportFile, snapshot, 'utf8'))
    await saveChain
    console.error(`reader eval: ${item.id} completed=${current.completed} observed=${current.observed_skills.join(',') || '(none)'}`)
    return current.completed
  })
  await saveChain
  return report
}

export async function runCli() {
  try {
    const options = parseReaderEvalArgs(process.argv.slice(2))
    const result = await runReaderEvaluation(options)
    console.log(JSON.stringify(result, null, 2))
    if ('complete' in result && !result.complete) process.exitCode = 2
    else if ('metrics' in result && result.metrics.exact_route_accuracy !== 1) process.exitCode = 1
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { runCli() }
