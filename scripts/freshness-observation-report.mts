#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRegistry } from './freshness-registry.mjs'
import { jstToday } from './deadline-report.mjs'
import { isRecord, errorMessage } from './lib/json-guards.mjs'

/** @param {unknown} date @returns {date is string} */
const validDate = (date: unknown): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
/** @param {string | undefined} value */
const day = (value: string | undefined) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value ?? NaN))
/** @param {Pick<import('./lib/freshness-types.d.mts').RegistryPattern, 'id' | 'title' | 'cadenceDays' | 'docPatterns'>[]} registry @param {import('./lib/freshness-types.d.mts').ObservationRun[]} runs @param {{today?: string}} [options] */
export function summarizeObservations(registry: Pick<import('./lib/freshness-types.d.mts').RegistryPattern, 'id' | 'title' | 'cadenceDays' | 'docPatterns'>[], runs: import('./lib/freshness-types.d.mts').ObservationRun[], { today = jstToday() }: { today?: string } = {}) {
  if (!validDate(today)) throw new Error('today は実在する YYYY-MM-DD が必要です')
  return { checked_on: today, systems: registry.map((system) => {
    const observations = runs.flatMap(({ file, record }) => (record.observations ?? []).filter((row) => row.system_id === system.id).map((row) => ({ observed_on: day(record.completed_at ?? record.started_at), status: row.status, affected_docs: row.affected_docs ?? [], evidence: file, summary: row.summary }))).filter((row) => row.observed_on <= today).sort((a, b) => b.observed_on.localeCompare(a.observed_on))
    // Existing records contain partial claims, not proof of system-wide coverage. Never infer coverage from systems[].
    const completed = runs.flatMap(({ file, record }) => (record.coverage ?? []).filter((row) => row.system_id === system.id && row.scope === 'declared-system' && row.status === 'verified' && validDate(row.verified_on) && row.verified_on <= today).map((row) => ({ date: row.verified_on ?? '', evidence: file, declared_scope: row.description }))).sort((a, b) => b.date.localeCompare(a.date))[0]
    const next = completed ? new Date(Date.parse(`${completed.date}T00:00:00Z`) + system.cadenceDays * 86400000).toISOString().slice(0, 10) : null
    return { id: system.id, title: system.title, cadence_days: system.cadenceDays, target_patterns: system.docPatterns, last_verified_at: completed?.date ?? null, verification_scope: completed?.declared_scope ?? null, next_due_on: next, status: next ? next < today ? 'overdue' : 'current' : 'unknown', evidence: completed?.evidence ?? null, last_partial_observation_on: observations[0]?.observed_on ?? null, partial_observations: observations }
  }) }
}
/** Parse a committed record as data before reporting any verified coverage.
 * @param {unknown} value
 * @returns {import('./lib/freshness-types.d.mts').ObservationRecord}
 */
function observationRecord(value: unknown): import('./lib/freshness-types.d.mts').ObservationRecord {
  if (!isRecord(value)) throw new Error('観測記録はobjectで指定してください')
  for (const key of ['started_at', 'completed_at']) if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error(`観測記録の${key}が文字列ではありません`)
  /** @type {import('./lib/freshness-types.d.mts').ObservationRow[] | undefined} */
  let observations: import('./lib/freshness-types.d.mts').ObservationRow[] | undefined
  if (value.observations !== undefined) {
    if (!Array.isArray(value.observations)) throw new Error('観測記録のobservationsが配列ではありません')
    observations = ((value.observations as unknown[])).map((row) => {
      if (!isRecord(row) || typeof row.system_id !== 'string' || typeof row.status !== 'string' || row.summary !== undefined && typeof row.summary !== 'string' || row.affected_docs !== undefined && (!Array.isArray(row.affected_docs) || !row.affected_docs.every((doc) => typeof doc === 'string'))) throw new Error('観測記録のobservations項目が不正です')
      return { system_id: row.system_id, status: row.status, ...(typeof row.summary === 'string' ? { summary: row.summary } : {}), ...(Array.isArray(row.affected_docs) ? { affected_docs: row.affected_docs } : {}) }
    })
  }
  /** @type {import('./lib/freshness-types.d.mts').CoverageRow[] | undefined} */
  let coverage: import('./lib/freshness-types.d.mts').CoverageRow[] | undefined
  if (value.coverage !== undefined) {
    if (!Array.isArray(value.coverage)) throw new Error('観測記録のcoverageが配列ではありません')
    coverage = ((value.coverage as unknown[])).map((row) => {
      if (!isRecord(row) || typeof row.system_id !== 'string' || typeof row.scope !== 'string' || typeof row.status !== 'string' || row.verified_on !== undefined && typeof row.verified_on !== 'string' || row.description !== undefined && typeof row.description !== 'string') throw new Error('観測記録のcoverage項目が不正です')
      return { system_id: row.system_id, scope: row.scope, status: row.status, ...(typeof row.verified_on === 'string' ? { verified_on: row.verified_on } : {}), ...(typeof row.description === 'string' ? { description: row.description } : {}) }
    })
  }
  return { ...(typeof value.started_at === 'string' ? { started_at: value.started_at } : {}), ...(typeof value.completed_at === 'string' ? { completed_at: value.completed_at } : {}), ...(observations ? { observations } : {}), ...(coverage ? { coverage } : {}) }
}
/** @param {string} [root] @param {{today?: string}} [options] */
export function observationReport(root: string = process.cwd(), options: { today?: string } = {}) {
  const registry = parseRegistry(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8'))
  const runs = ['freshness-runs', 'freshness-observations'].flatMap((folder) => {
    const directory = path.join(root, 'research', folder)
    return existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith('.json')).map((name) => ({ file: `research/${folder}/${name}`, record: observationRecord((JSON.parse(readFileSync(path.join(directory, name), 'utf8')) as unknown)) })) : []
  })
  return summarizeObservations(registry, runs, options)
}
/** @param {ReturnType<typeof summarizeObservations>} report */
export function observationTable(report: ReturnType<typeof summarizeObservations>) {
  return ['<!-- freshness-observation-summary:start -->', '| 系統 | 宣言範囲の最終完了日 | 最新の部分観測 | 次回目標 |', '| --- | --- | --- | --- |', ...report.systems.map((row) => `| \`${row.id}\` | ${row.last_verified_at ?? '記録なし'} | ${row.last_partial_observation_on ?? '記録なし'} | ${row.next_due_on ?? '未確定(完了範囲の記録が必要)'} |`), '<!-- freshness-observation-summary:end -->'].join('\n')
}
/** @param {ReturnType<typeof summarizeObservations>} report */
export function trackingBody(report: ReturnType<typeof summarizeObservations>) {
  const attention = report.systems.filter((row) => row.status !== 'current')
  return `<!-- ai-agent-library:freshness-monitor -->\n確認日: ${report.checked_on}(JST)。コミット済み観測記録の読み取りだけで集計します。部分観測を系統全体の完了に換算しません。\n\n${attention.map((row) => `- ${row.id}: ${row.status === 'unknown' ? '宣言範囲の完了記録なし' : `周期超過(目標 ${row.next_due_on})`}、部分観測 ${row.last_partial_observation_on ?? '記録なし'}`).join('\n')}\n\n検知・復旧は [freshness-automation.md](https://github.com/pero3dev/ai-agent-library/blob/main/freshness-automation.md#停止遅延の検知と復旧) に従います。`
}
export function runCli() {
  try { const report = observationReport(); const args = process.argv.slice(2); console.log(args.includes('--table') ? observationTable(report) : args.includes('--issue-body') ? trackingBody(report) : JSON.stringify(report, null, 2)) } catch (error) { console.error(errorMessage(error)); process.exitCode = 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { runCli() }
