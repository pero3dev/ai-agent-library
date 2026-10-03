#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRegistry } from './freshness-registry.mjs'
import { jstToday } from './deadline-report.mjs'

const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
const day = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
export function summarizeObservations(registry, runs, { today = jstToday() } = {}) {
  if (!validDate(today)) throw new Error('today は実在する YYYY-MM-DD が必要です')
  return { checked_on: today, systems: registry.map(system => {
    const observations = runs.flatMap(({ file, record }) => (record.observations ?? []).filter(row => row.system_id === system.id).map(row => ({ observed_on: day(record.completed_at ?? record.started_at), status: row.status, affected_docs: row.affected_docs ?? [], evidence: file, summary: row.summary }))).filter(row => row.observed_on <= today).sort((a, b) => b.observed_on.localeCompare(a.observed_on))
    // Existing records contain partial claims, not proof of system-wide coverage. Never infer coverage from systems[].
    const completed = runs.flatMap(({ file, record }) => (record.coverage ?? []).filter(row => row.system_id === system.id && row.scope === 'declared-system' && row.status === 'verified' && validDate(row.verified_on) && row.verified_on <= today).map(row => ({ date: row.verified_on, evidence: file, declared_scope: row.description }))).sort((a, b) => b.date.localeCompare(a.date))[0]
    const next = completed ? new Date(Date.parse(`${completed.date}T00:00:00Z`) + system.cadenceDays * 86400000).toISOString().slice(0, 10) : null
    return { id: system.id, title: system.title, cadence_days: system.cadenceDays, target_patterns: system.docPatterns, last_verified_at: completed?.date ?? null, verification_scope: completed?.declared_scope ?? null, next_due_on: next, status: next ? next < today ? 'overdue' : 'current' : 'unknown', evidence: completed?.evidence ?? null, last_partial_observation_on: observations[0]?.observed_on ?? null, partial_observations: observations }
  }) }
}
export function observationReport(root = process.cwd(), options = {}) {
  const registry = parseRegistry(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8'))
  const runs = ['freshness-runs', 'freshness-observations'].flatMap(folder => {
    const directory = path.join(root, 'research', folder)
    return existsSync(directory) ? readdirSync(directory).filter(file => file.endsWith('.json')).map(name => ({ file: `research/${folder}/${name}`, record: JSON.parse(readFileSync(path.join(directory, name), 'utf8')) })) : []
  })
  return summarizeObservations(registry, runs, options)
}
export function observationTable(report) {
  return ['<!-- freshness-observation-summary:start -->', '| 系統 | 宣言範囲の最終完了日 | 最新の部分観測 | 次回目標 |', '| --- | --- | --- | --- |', ...report.systems.map(row => `| \`${row.id}\` | ${row.last_verified_at ?? '記録なし'} | ${row.last_partial_observation_on ?? '記録なし'} | ${row.next_due_on ?? '未確定(完了範囲の記録が必要)'} |`), '<!-- freshness-observation-summary:end -->'].join('\n')
}
export function trackingBody(report) {
  const attention = report.systems.filter(row => row.status !== 'current')
  return `<!-- ai-agent-library:freshness-monitor -->\n確認日: ${report.checked_on}(JST)。コミット済み観測記録の読み取りだけで集計します。部分観測を系統全体の完了に換算しません。\n\n${attention.map(row => `- ${row.id}: ${row.status === 'unknown' ? '宣言範囲の完了記録なし' : `周期超過(目標 ${row.next_due_on})`}、部分観測 ${row.last_partial_observation_on ?? '記録なし'}`).join('\n')}\n\n検知・復旧は [freshness-automation.md](https://github.com/pero3dev/ai-agent-library/blob/main/freshness-automation.md#停止遅延の検知と復旧) に従います。`
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const report = observationReport(); const args = process.argv.slice(2); console.log(args.includes('--table') ? observationTable(report) : args.includes('--issue-body') ? trackingBody(report) : JSON.stringify(report, null, 2)) } catch (error) { console.error(error.message); process.exitCode = 1 }
}
