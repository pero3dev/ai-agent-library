#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateResultShape } from './freshness-policy.mjs'

/** Allowlisted export only. Local auth, lock owners, paths, notes and pending values never enter the public record. */
export function publicObservation(checkpoint) {
  if (!/^[a-z0-9][a-z0-9-]{3,79}$/.test(checkpoint?.run_id ?? '')) throw new Error('run_id が不正です')
  const value = { schema_version: 1, run_id: checkpoint.run_id, started_at: checkpoint.started_at, completed_at: checkpoint.completed_at ?? checkpoint.finished_at, systems: checkpoint.systems, observations: checkpoint.public_observations, coverage: checkpoint.public_coverage ?? [], vendor_checks: checkpoint.vendor_checks ?? [] }
  const resultSchema = JSON.parse(readFileSync(new URL('./schemas/freshness-result.schema.json', import.meta.url), 'utf8'))
  for (const key of ['started_at', 'completed_at', 'systems', 'observations', 'coverage', 'vendor_checks']) validateResultShape(value[key], resultSchema.properties[key], `$.${key}`, resultSchema)
  if (!Array.isArray(value.observations) || !value.observations.length) throw new Error('公開する実観測 public_observations が必要です')
  const time = timestamp => {
    const parsed = Date.parse(timestamp)
    if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 19) !== timestamp.slice(0, 19)) throw new Error('実在する観測UTC日時が必要です')
    return parsed
  }
  const started = time(value.started_at), completed = time(value.completed_at)
  if (started > completed) throw new Error('観測時刻の順序が不正です')
  const validateSource = source => {
    const url = new URL(source.url)
    if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'localhost' || /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(?:1[6-9]|2\d|3[01])\.|^\[/.test(url.hostname)) throw new Error('公開一次資料のHTTPS URLが必要です')
    const accessed = time(source.accessed_at)
    if (accessed < started || accessed > completed) throw new Error('根拠の取得時刻は観測区間内が必要です')
  }
  for (const row of value.observations) {
    if (!value.systems.includes(row.system_id)) throw new Error('対象外の観測があります')
    if (['changed', 'unchanged'].includes(row.status) && !row.sources.length) throw new Error('確認済みの観測に根拠が必要です')
    row.sources.forEach(validateSource)
  }
  for (const system of value.systems) if (!value.observations.some(row => row.system_id === system)) throw new Error('列挙した系統には実観測が必要です')
  for (const vendor of value.vendor_checks) {
    if (['release_notes', 'deprecations', 'pricing'].some(field => vendor[field] !== 'not_checked') && !vendor.sources.length) throw new Error('確認済みvendorには根拠が必要です')
    vendor.sources.forEach(validateSource)
  }
  for (const row of value.coverage) if (!value.systems.includes(row.system_id) || value.observations.some(observation => observation.system_id === row.system_id && ['failed', 'unverifiable'].includes(observation.status))) throw new Error('対象外または未完了系統の coverage を公開できません')
  for (const row of value.coverage) {
    if (!(checkpoint.completed_systems ?? []).includes(row.system_id) || (checkpoint.pending ?? []).some(item => item.system_id === row.system_id)) throw new Error('checkpoint の未完了系統を完了coverageにできません')
    const completedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(completed))
    if (row.verified_on !== completedDate) throw new Error('coverage完了日は観測完了のJST日付が必要です')
    if (row.system_id === 'models-prompting' && (value.vendor_checks.length !== 3 || new Set(value.vendor_checks.map(vendor => vendor.vendor)).size !== 3 || value.vendor_checks.some(vendor => ['release_notes', 'deprecations', 'pricing'].some(field => vendor[field] === 'not_checked')))) throw new Error('models完了には3社のvendor_checks完了が必要です')
  }
  return value
}

export function writePublicObservation(root, value) {
  if (!/^[a-z0-9][a-z0-9-]{3,79}$/.test(value?.run_id ?? '')) throw new Error('run_id が不正です')
  root = path.resolve(root)
  const output = path.join(root, 'research/freshness-observations', `${value.run_id}.json`)
  for (let current = output; ; current = path.dirname(current)) {
    try { if (lstatSync(current).isSymbolicLink()) throw new Error('symlink は公開観測の出力先にできません') } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (current === root) break
  }
  if (existsSync(output)) throw new Error('既存観測記録は上書きしません')
  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(output, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
  return path.relative(root, output).replaceAll('\\', '/')
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.length !== 2 || args[0] !== '--checkpoint') throw new Error('Usage: node scripts/freshness-public-observation.mjs --checkpoint <file>')
    const value = publicObservation(JSON.parse(readFileSync(args[1], 'utf8')))
    console.log(writePublicObservation(process.cwd(), value))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
