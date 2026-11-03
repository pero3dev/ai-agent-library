#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { cli, git, parseOptions, ROOT } from './lib/tooling-common.mjs'
import { isRecord } from './lib/json-guards.mjs'

/** @param {string} common @param {{threshold?: number}} [options] */
export function measureStorage(common, { threshold = 500 * 1024 * 1024 } = {}) {
  const base = realpathSync(common)
  const areas = ['harness', 'freshness', 'harness-evaluations', 'harness-eval']
  const excluded = ['checkout', 'node_modules', '.git']
  let files = 0, bytes = 0
  /** @type {string[]} */
  const skipped = []
  /** @param {string} absolute */
  const visit = absolute => {
    const relative = path.relative(base, absolute)
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('状態の計測対象は common Git 配下に限定します')
    let stat
    try { stat = lstatSync(absolute) } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return; throw error }
    if (stat.isSymbolicLink()) { skipped.push(relative); return }
    if (stat.isDirectory()) for (const item of readdirSync(absolute)) { if (!excluded.includes(item)) visit(path.join(absolute, item)) }
    else if (stat.isFile()) { files++; bytes += stat.size }
  }
  for (const dir of areas) visit(path.join(base, dir))
  return { common_dir: base, areas, excluded_directories: excluded, files, bytes, threshold_bytes: threshold, inventory_required: bytes > threshold, completeness: skipped.length ? 'partial' : 'complete', skipped_symbolic_links: skipped, automatic_deletion: false }
}

/** @param {unknown} value */
function timestamp(value) { const number = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN; const date = new Date(number); return Number.isFinite(date.getTime()) ? date.toISOString() : null }
/** @param {unknown} value @returns {Record<string, unknown>[]} */
const records = value => Array.isArray(value) ? value.filter(isRecord) : []
/** @param {unknown} value */
const recordValues = value => isRecord(value) ? Object.values(value).filter(isRecord) : []
/** @param {unknown} value */
const successful = value => typeof value === 'string' && ['local', 'completed', 'merged', 'observed', 'published'].includes(value)
/** @param {{freshness?: unknown, harness?: unknown, registration?: unknown}} input @param {Date} [now] */
export function summarizeHealth({ freshness, harness, registration }, now = new Date()) {
  /** @param {unknown} value */
  const summarize = value => {
    const runtime = isRecord(value) ? value : null
    const recovery = isRecord(runtime?.recovery) ? runtime.recovery : null
    const compatibility = isRecord(runtime?.compatibility) ? runtime.compatibility : null
    if (!runtime || runtime.error || runtime.status === 'recovery_required' || recovery?.needed || compatibility?.supported === false) return { availability: 'unknown', reason: runtime?.error ?? runtime?.status ?? (recovery?.needed ? 'recovery_required' : compatibility?.supported === false ? 'unsupported-schema' : '状態未取得'), started: 'unknown', successful: 'unknown', published: 'unknown', waiting: [], recovery: runtime?.recovery ?? null, compatibility: runtime?.compatibility ?? null }
    const saved = records(runtime.records ?? runtime.interrupted)
    const state = isRecord(runtime.state) ? runtime.state : runtime
    const runs = recordValues(state.runs)
    const entries = [...runs, ...saved]
    /** @param {string} field */
    const latest = field => entries.map(row => timestamp(row[field])).filter(Boolean).sort().at(-1) ?? null
    const outcomes = runs.map(row => row.outcome ?? row.status)
    const publications = saved.flatMap(row => {
      const evidence = row.github_verification
      return isRecord(evidence) && evidence.verified === true && isRecord(evidence.publication) && evidence.publication.verified === true ? [{ run_id: row.run_id, checked_at: evidence.checked_at, state: evidence.publication.state ?? 'unknown' }] : []
    })
    return {
      availability: 'available', started: latest('started_at'), successful: outcomes.filter(successful).length, failed: outcomes.filter(value => value === 'failed').length,
      last_success_at: entries.filter(row => successful(row.outcome ?? row.status)).map(row => timestamp(row.finished_at ?? row.completed_at)).filter(Boolean).sort().at(-1) ?? null,
      published: publications,
      pending_observations: records(state.pending).filter(item => typeof item.status !== 'string' || !['resolved', 'closed', 'completed'].includes(item.status)).map(item => ({ id: item.id, status: item.status ?? 'unknown', next_retry_at: item.next_retry_at ?? null })),
      waiting: Object.entries(isRecord(runtime.queue) ? runtime.queue : {}).flatMap(([kind, rows]) => records(rows).map(row => { const eligible = timestamp(row.next_eligible_at); return { run_id: row.run_id, kind, reason: typeof row.wait_reason === 'string' ? row.wait_reason.slice(0, 512) : null, next_eligible_at: row.next_eligible_at ?? null, overdue: eligible !== null && Date.parse(eligible) < now.getTime() } })),
      lock: isRecord(runtime.lock) ? { run_id: runtime.lock.run_id, expires_at: runtime.lock.expires_at ?? null } : null,
      recovery: runtime.recovery ?? null, compatibility: runtime.compatibility ?? null
    }
  }
  const automation = isRecord(registration) ? registration : null
  return { schema_version: 1, checked_at: now.toISOString(), freshness: summarize(freshness), harness: summarize(harness), automation: Array.isArray(automation?.tasks) ? { availability: 'available', expected: automation.expected, registered: automation.registered, tasks: records(automation.tasks).map(row => ({ id: row.id, configured: row.configured_status ?? 'unknown', registered_status: row.status ?? 'unknown', last_started_at: timestamp(row.last_run_at), next_run_at: timestamp(row.next_run_at) })) } : { availability: 'unknown', reason: automation?.error ?? '登録状態未取得' }, evidence_boundary: 'ローカルに保存された実行証拠の集計です。新しい GitHub 公開確認や Agent 実行は行いません。' }
}
/** @param {string} [root] @param {import('./types/diagnostics.d.mts').HealthOptions} [options] */
export async function health(root = ROOT, { statusReader, registrationReader, storageReader } = {}) {
  const readStatus = statusReader ?? (async (/** @type {string} */ name) => {
    const file = path.join(root, `scripts/${name}-run.mjs`)
    if (!existsSync(file)) return { error: 'runtime が未導入です' }
    try {
      const runtime = /** @type {unknown} */ (await import(pathToFileURL(file).href))
      if (!isRecord(runtime) || typeof runtime.main !== 'function') throw new Error('runtime に status の入口がありません')
      return /** @type {unknown} */ (await runtime.main(['status', '--root', root]))
    } catch (error) { return { error: error instanceof Error ? error.message : String(error) } }
  })
  const registration = registrationReader ?? (() => {
    if (process.platform !== 'win32') return { error: 'Windows desktop の登録照合はこの OS で未実施です' }
    try {
      const result = execFileSync('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/register-freshness-tasks.ps1'), '-Mode', 'Status', '-ProjectRoot', root], { encoding: 'utf8', timeout: 30000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      return /** @type {unknown} */ (JSON.parse(result))
    } catch { return { error: '定期登録 Status の取得に失敗しました。登録・起動済みとは扱いません。' } }
  })
  let retained
  try { retained = (storageReader ?? (() => measureStorage(path.resolve(root, git(root, 'rev-parse', '--git-common-dir')))))() } catch (error) { retained = { availability: 'unknown', reason: error instanceof Error ? error.message : String(error) } }
  return { ...summarizeHealth({ freshness: await readStatus('freshness'), harness: await readStatus('harness'), registration: await registration() }), retained_storage: retained }
}
await cli(import.meta.url, () => { const options = parseOptions(process.argv.slice(2), ['root']); return health(options.root ?? ROOT) })
