#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { cli, git, parseOptions, ROOT } from './lib/tooling-common.mjs'

export function measureStorage(common, { threshold = 500 * 1024 * 1024 } = {}) {
  const base = realpathSync(common)
  const areas = ['harness', 'freshness', 'harness-evaluations', 'harness-eval']
  const excluded = ['checkout', 'node_modules', '.git']
  let files = 0, bytes = 0
  const skipped = []
  const visit = absolute => {
    const relative = path.relative(base, absolute)
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('状態の計測対象は common Git 配下に限定します')
    let stat
    try { stat = lstatSync(absolute) } catch (error) { if (error.code === 'ENOENT') return; throw error }
    if (stat.isSymbolicLink()) { skipped.push(relative); return }
    if (stat.isDirectory()) for (const item of readdirSync(absolute)) { if (!excluded.includes(item)) visit(path.join(absolute, item)) }
    else if (stat.isFile()) { files++; bytes += stat.size }
  }
  for (const dir of areas) visit(path.join(base, dir))
  return { common_dir: base, areas, excluded_directories: excluded, files, bytes, threshold_bytes: threshold, inventory_required: bytes > threshold, completeness: skipped.length ? 'partial' : 'complete', skipped_symbolic_links: skipped, automatic_deletion: false }
}

function timestamp(value) { const number = typeof value === 'number' ? value : Date.parse(value); return Number.isFinite(number) ? new Date(number).toISOString() : null }
export function summarizeHealth({ freshness, harness, registration }, now = new Date()) {
  const summarize = runtime => {
    if (!runtime || runtime.error || runtime.status === 'recovery_required' || runtime.recovery?.needed || runtime.compatibility?.supported === false) return { availability: 'unknown', reason: runtime?.error ?? runtime?.status ?? (runtime?.recovery?.needed ? 'recovery_required' : runtime?.compatibility?.supported === false ? 'unsupported-schema' : '状態未取得'), started: 'unknown', successful: 'unknown', published: 'unknown', waiting: [], recovery: runtime?.recovery ?? null, compatibility: runtime?.compatibility ?? null }
    const records = runtime.records ?? runtime.interrupted ?? []
    const state = runtime.state ?? runtime
    const entries = [...Object.values(state.runs ?? {}), ...records]
    const latest = field => entries.map(row => timestamp(row[field])).filter(Boolean).sort().at(-1) ?? null
    const outcomes = Object.values(state.runs ?? {}).map(row => row.outcome ?? row.status)
    const successful = value => ['local', 'completed', 'merged', 'observed', 'published'].includes(value)
    const publications = records.filter(row => row.github_verification?.verified && row.github_verification.publication?.verified)
    return {
      availability: 'available', started: latest('started_at'), successful: outcomes.filter(successful).length, failed: outcomes.filter(value => value === 'failed').length,
      last_success_at: entries.filter(row => successful(row.outcome ?? row.status)).map(row => timestamp(row.finished_at ?? row.completed_at)).filter(Boolean).sort().at(-1) ?? null,
      published: publications.map(row => ({ run_id: row.run_id, checked_at: row.github_verification.checked_at, state: row.github_verification.publication.state ?? 'unknown' })),
      pending_observations: (state.pending ?? []).filter(item => !['resolved', 'closed', 'completed'].includes(item.status)).map(item => ({ id: item.id, status: item.status ?? 'unknown', next_retry_at: item.next_retry_at ?? null })),
      waiting: Object.entries(runtime.queue ?? {}).flatMap(([kind, rows]) => (Array.isArray(rows) ? rows : []).map(row => ({ run_id: row.run_id, kind, reason: typeof row.wait_reason === 'string' ? row.wait_reason.slice(0, 512) : null, next_eligible_at: row.next_eligible_at ?? null, overdue: !!row.next_eligible_at && Date.parse(row.next_eligible_at) < now.getTime() }))),
      lock: runtime.lock ? { run_id: runtime.lock.run_id, expires_at: runtime.lock.expires_at ?? null } : null,
      recovery: runtime.recovery ?? null, compatibility: runtime.compatibility ?? null
    }
  }
  return { schema_version: 1, checked_at: now.toISOString(), freshness: summarize(freshness), harness: summarize(harness), automation: registration?.tasks ? { availability: 'available', expected: registration.expected, registered: registration.registered, tasks: registration.tasks.map(row => ({ id: row.id, configured: row.configured_status ?? 'unknown', registered_status: row.status ?? 'unknown', last_started_at: timestamp(row.last_run_at), next_run_at: timestamp(row.next_run_at) })) } : { availability: 'unknown', reason: registration?.error ?? '登録状態未取得' }, evidence_boundary: 'ローカルに保存された実行証拠の集計です。新しい GitHub 公開確認や Agent 実行は行いません。' }
}
export async function health(root = ROOT, { statusReader, registrationReader, storageReader } = {}) {
  const readStatus = statusReader ?? (async name => {
    const file = path.join(root, `scripts/${name}-run.mjs`)
    if (!existsSync(file)) return { error: 'runtime が未導入です' }
    try { return await (await import(pathToFileURL(file))).main(['status', '--root', root]) } catch (error) { return { error: error.message } }
  })
  const registration = registrationReader ?? (() => {
    if (process.platform !== 'win32') return { error: 'Windows desktop の登録照合はこの OS で未実施です' }
    try {
      const result = execFileSync('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/register-freshness-tasks.ps1'), '-Mode', 'Status', '-ProjectRoot', root], { encoding: 'utf8', timeout: 30000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      return JSON.parse(result)
    } catch { return { error: '定期登録 Status の取得に失敗しました。登録・起動済みとは扱いません。' } }
  })
  let retained
  try { retained = (storageReader ?? (() => measureStorage(path.resolve(root, git(root, 'rev-parse', '--git-common-dir')))))() } catch (error) { retained = { availability: 'unknown', reason: error.message } }
  return { ...summarizeHealth({ freshness: await readStatus('freshness'), harness: await readStatus('harness'), registration: await registration() }), retained_storage: retained }
}
await cli(import.meta.url, () => { const options = parseOptions(process.argv.slice(2), ['root']); return health(options.root ?? ROOT) })
