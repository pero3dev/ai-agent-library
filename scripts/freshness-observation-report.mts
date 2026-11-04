#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRegistry, readRegistry } from './freshness-registry.mjs'
import { jstToday } from './deadline-report.mjs'
import { isRecord, errorMessage } from './lib/json-guards.mjs'

/** @param {unknown} date @returns {date is string} */
const validDate = (date: unknown): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
/** @param {string | undefined} value */
const day = (value: string | undefined) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value ?? NaN))
/** @param {Pick<import('./lib/freshness-types.d.mts').RegistryPattern, 'id' | 'title' | 'cadenceDays' | 'docPatterns'>[]} registry @param {import('./lib/freshness-types.d.mts').ObservationRun[]} runs @param {{today?: string}} [options] */
export function summarizeObservations(registry: Array<Pick<import('./lib/freshness-types.d.mts').RegistryPattern, 'id' | 'title' | 'cadenceDays' | 'docPatterns'> & { docs?: string[] }>, runs: import('./lib/freshness-types.d.mts').ObservationRun[], { today = jstToday() }: { today?: string } = {}) {
  if (!validDate(today)) throw new Error('today は実在する YYYY-MM-DD が必要です')
  return { checked_on: today, systems: registry.map((system) => {
    const observations = runs.flatMap(({ file, record }) => (record.observations ?? []).filter((row) => row.system_id === system.id).map((row) => ({ observed_on: day(record.completed_at ?? record.started_at), status: row.status, affected_docs: row.affected_docs ?? [], evidence: file, summary: row.summary ?? '' }))).filter((row) => row.observed_on <= today).sort((a, b) => b.observed_on.localeCompare(a.observed_on))
    // Existing records contain partial claims, not proof of system-wide coverage. Never infer coverage from systems[].
    const coverage = runs.flatMap(({ file, record }) => (record.coverage ?? []).filter((row) => row.system_id === system.id && row.status === 'verified' && validDate(row.verified_on) && row.verified_on <= today && !record.observations?.some(item => item.system_id === system.id && ['unverifiable', 'failed'].includes(item.status) && (row.scope === 'declared-system' || item.affected_docs?.includes(row.doc ?? '')))).map(row => ({ ...row, evidence: file })))
    const due = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + system.cadenceDays * 86400000).toISOString().slice(0, 10)
    const articleRows = coverage.filter(row => row.scope === 'declared-article' && row.claims?.length && row.claims.every(claim => typeof claim === 'string' && claim.trim()) && row.sources?.length && row.sources.every(source => /^https:\/\//.test(source.url) && Number.isFinite(Date.parse(source.accessed_at)))).sort((a, b) => (b.verified_on ?? '').localeCompare(a.verified_on ?? ''))
    const history = new Map((system.docs ?? []).map(doc => [doc, articleRows.filter(row => row.doc === doc)]))
    const articles = (system.docs ?? []).map(doc => {
      const latest = history.get(doc)?.[0]
      const verified = latest?.verified_on ?? null
      return { doc, last_verified_at: verified, next_due_on: verified ? due(verified) : null, status: verified ? due(verified) < today ? 'overdue' : 'current' : 'unknown', evidence: latest?.evidence ?? null, claims: latest?.claims ?? [] }
    })
    const vendors = system.id === 'models-prompting' ? runs.filter(({ record }) => record.vendor_checks?.length === 3 && ['anthropic', 'openai', 'google'].every(vendor => record.vendor_checks?.some(row => row.vendor === vendor && [row.release_notes, row.deprecations, row.pricing].every(status => ['changed', 'unchanged'].includes(status))))).map(({ file, record }) => ({ date: day(record.completed_at ?? record.started_at), evidence: file })).filter(row => row.date <= today).sort((a, b) => b.date.localeCompare(a.date)) : []
    const legacy = coverage.filter(row => row.scope === 'declared-system').map(row => ({ date: row.verified_on ?? '', evidence: row.evidence, declared_scope: row.description }))
    // Reconstruct completion snapshots: a later partial check must not erase an earlier complete cycle.
    const cutoffs = [...new Set([...articleRows.map(row => row.verified_on ?? ''), ...vendors.map(row => row.date)])]
    const aggregate = cutoffs.flatMap(cutoff => {
      const snapshot = [...history.values()].map(rows => rows.find(row => (row.verified_on ?? '') <= cutoff))
      if (!snapshot.length || snapshot.some(row => !row)) return []
      const dates = snapshot.flatMap(row => row?.verified_on ? [row.verified_on] : []).sort()
      const oldest = dates[0]
      if (!oldest || due(oldest) < cutoff) return []
      const vendor = vendors.find(row => row.date <= cutoff)
      if (system.id === 'models-prompting' && (!vendor || due(vendor.date) < cutoff)) return []
      const date = vendor && vendor.date < oldest ? vendor.date : oldest
      const evidence = vendor && date === vendor.date ? vendor.evidence : snapshot.find(row => row?.verified_on === oldest)?.evidence ?? ''
      return [{ date, evidence, declared_scope: '台帳の全対象記事で宣言した確認範囲を周期内に確認(各記事の証拠を参照)' }]
    })
    const completed = [...legacy, ...aggregate].sort((a, b) => b.date.localeCompare(a.date))[0]
    const next = completed ? new Date(Date.parse(`${completed.date}T00:00:00Z`) + system.cadenceDays * 86400000).toISOString().slice(0, 10) : null
    return { id: system.id, title: system.title, cadence_days: system.cadenceDays, target_patterns: system.docPatterns, last_verified_at: completed?.date ?? null, verification_scope: completed?.declared_scope ?? null, next_due_on: next, status: next ? next < today ? 'overdue' : 'current' : 'unknown', evidence: completed?.evidence ?? null, article_progress: { verified: articles.filter(article => article.status === 'current').length, total: articles.length }, articles, last_partial_observation_on: observations[0]?.observed_on ?? null, partial_observations: observations }
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
      if (row.scope === 'declared-article' && (typeof row.doc !== 'string' || !Array.isArray(row.claims) || !row.claims.length || !row.claims.every(claim => typeof claim === 'string' && claim.trim()) || !Array.isArray(row.sources) || !row.sources.length || !row.sources.every(source => isRecord(source) && typeof source.url === 'string' && /^https:\/\//.test(source.url) && typeof source.accessed_at === 'string' && Number.isFinite(Date.parse(source.accessed_at))))) throw new Error('記事coverageにはdoc・確認したclaims・一次情報sourcesが必要です')
      return { system_id: row.system_id, scope: row.scope, status: row.status, ...(typeof row.verified_on === 'string' ? { verified_on: row.verified_on } : {}), ...(typeof row.description === 'string' ? { description: row.description } : {}), ...(typeof row.doc === 'string' ? { doc: row.doc } : {}), ...(Array.isArray(row.claims) ? { claims: row.claims as string[] } : {}), ...(Array.isArray(row.sources) ? { sources: row.sources as Array<{ url: string; accessed_at: string }> } : {}) }
    })
  }
  const vendors = Array.isArray(value.vendor_checks) ? value.vendor_checks.map(row => {
    if (!isRecord(row) || typeof row.vendor !== 'string' || typeof row.release_notes !== 'string' || typeof row.deprecations !== 'string' || typeof row.pricing !== 'string') throw new Error('vendor_checks項目が不正です')
    return { vendor: row.vendor, release_notes: row.release_notes, deprecations: row.deprecations, pricing: row.pricing }
  }) : undefined
  return { ...(typeof value.started_at === 'string' ? { started_at: value.started_at } : {}), ...(typeof value.completed_at === 'string' ? { completed_at: value.completed_at } : {}), ...(observations ? { observations } : {}), ...(coverage ? { coverage } : {}), ...(vendors ? { vendor_checks: vendors } : {}) }
}
/** @param {string} [root] @param {{today?: string}} [options] */
export function observationReport(root: string = process.cwd(), options: { today?: string } = {}) {
  const resolved = readRegistry(root)
  const registry = parseRegistry(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8')).map(system => ({ ...system, docs: resolved.find(item => item.id === system.id)?.docs ?? [] }))
  const runs = ['freshness-runs', 'freshness-observations'].flatMap((folder) => {
    const directory = path.join(root, 'research', folder)
    return existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith('.json')).map((name) => ({ file: `research/${folder}/${name}`, record: observationRecord((JSON.parse(readFileSync(path.join(directory, name), 'utf8')) as unknown)) })) : []
  })
  return summarizeObservations(registry, runs, options)
}
/** @param {ReturnType<typeof summarizeObservations>} report */
export function observationTable(report: ReturnType<typeof summarizeObservations>) {
  return ['<!-- freshness-observation-summary:start -->', '| 系統 | 宣言範囲の最終完了日 | 周期内の記事確認 | 最新の部分観測 | 次回目標 |', '| --- | --- | --- | --- | --- |', ...report.systems.map((row) => `| \`${row.id}\` | ${row.last_verified_at ?? '記録なし'} | ${row.article_progress.verified}/${row.article_progress.total} 記事 | ${row.last_partial_observation_on ?? '記録なし'} | ${row.next_due_on ?? '未確定(完了範囲の記録が必要)'} |`), '<!-- freshness-observation-summary:end -->'].join('\n')
}
/** @param {ReturnType<typeof summarizeObservations>} report */
export function trackingBody(report: ReturnType<typeof summarizeObservations>) {
  const attention = report.systems.filter((row) => row.status !== 'current')
  return `<!-- ai-agent-library:freshness-monitor -->\n確認日: ${report.checked_on}(JST)。コミット済み観測記録の読み取りだけで集計します。部分観測を系統全体の完了に換算しません。\n\n${attention.map((row) => `- ${row.id}: ${row.status === 'unknown' ? '宣言範囲の完了記録なし' : `周期超過(目標 ${row.next_due_on})`}、${row.article_progress.verified}/${row.article_progress.total} 記事確認済み、部分観測 ${row.last_partial_observation_on ?? '記録なし'}`).join('\n')}\n\n検知・復旧は [freshness-automation.md](https://github.com/pero3dev/ai-agent-library/blob/main/freshness-automation.md#停止遅延の検知と復旧) に従います。`
}
export function runCli() {
  try { const report = observationReport(); const args = process.argv.slice(2); console.log(args.includes('--table') ? observationTable(report) : args.includes('--issue-body') ? trackingBody(report) : JSON.stringify(report, null, 2)) } catch (error) { console.error(errorMessage(error)); process.exitCode = 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { runCli() }
