import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isRecord, errorMessage } from './lib/json-guards.mjs'

export const REGISTRY_START = '<!-- freshness-registry:start -->'
export const REGISTRY_END = '<!-- freshness-registry:end -->'
const DAY = 24 * 60 * 60 * 1000
const FOCUS_IDS = ['models-prompting', 'coding-agents']

/** @param {string} message @returns {never} */
function fail(message: string): never {
  throw new Error(`Freshness registry: ${message}`)
}

/** @param {string} cell @param {string} prefix */
function parsePatterns(cell: string, prefix: string) {
  const entries = cell.split(';').map((value) => value.trim())
  return entries.map((entry) => {
    if (!/^`[^`]+`$/.test(entry)) fail(`対象はバッククォート付きパスで指定してください: ${entry}`)
    const pattern = entry.slice(1, -1)
    if (!pattern.startsWith(`${prefix}/`) || !pattern.endsWith('.md') ||
        pattern.includes('**') || pattern.includes('\\') ||
        pattern.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
        !/^[a-zA-Z0-9_./*-]+$/.test(pattern)) {
      fail(`対象パスが不正です: ${pattern}`)
    }
    return pattern
  })
}

/** Parse the sole system catalog in ROADMAP without filesystem access.
 * @param {string} markdown
 * @returns {import('./lib/freshness-types.d.mts').RegistryPattern[]}
 */
export function parseRegistry(markdown: string): import('./lib/freshness-types.d.mts').RegistryPattern[] {
  if (typeof markdown !== 'string') fail('ROADMAP の内容は文字列で指定してください')
  if (markdown.split(REGISTRY_START).length !== 2 || markdown.split(REGISTRY_END).length !== 2) {
    fail('registry の開始・終了マーカーはそれぞれ 1 個必要です')
  }
  const start = markdown.indexOf(REGISTRY_START) + REGISTRY_START.length
  const end = markdown.indexOf(REGISTRY_END)
  if (end < start) fail('registry マーカーの順序が不正です')
  const lines = markdown.slice(start, end).trim().split(/\r?\n/)
  /** @param {string} line */
  const cells = (line: string) => line.trim().slice(1, -1).split('|').map((value) => value.trim())
  if (lines.some((line) => !/^\s*\|.*\|\s*$/.test(line))) fail('registry 区画には表だけを置いてください')
  if (JSON.stringify(cells(lines[0])) !== JSON.stringify(['ID', '系統', '記事対象', '調査起点', '周期(日)'])) {
    fail('registry 表のヘッダーが不正です')
  }
  if (cells(lines[1] ?? '').length !== 5 || cells(lines[1] ?? '').some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    fail('registry 表の区切り行が不正です')
  }
  const ids = new Set()
  const registry = lines.slice(2).map((line) => {
    const fields = cells(line)
    if (fields.length !== 5) fail('registry 表は 5 列必要です')
    const [idCell, title, docs, research, days] = fields
    const id = idCell.replace(/^`([^`]+)`$/, '$1')
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) fail(`ID が不正です: ${id}`)
    if (ids.has(id)) fail(`ID が重複しています: ${id}`)
    if (!title) fail(`系統名がありません: ${id}`)
    if (!/^\d+$/.test(days) || Number(days) < 1 || Number(days) > 366) fail(`周期が不正です: ${id}`)
    ids.add(id)
    return { id, title, docPatterns: parsePatterns(docs, 'docs'), researchPatterns: parsePatterns(research, 'research'), cadenceDays: Number(days) }
  })
  if (!registry.length) fail('対象系統がありません')
  return registry
}

/** Asterisk matches within one directory segment; recursive glob is deliberately unsupported.
 * @param {string} file @param {string} pattern
 */
export function matchesPattern(file: string, pattern: string) {
  const expression = pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')
  return new RegExp(`^${expression}$`).test(file)
}

/** @param {string} root @param {string} directory @returns {string[]} */
function markdownFiles(root: string, directory: string): string[] {
  const files = []
  for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = `${directory}/${entry.name}`
    if (entry.isSymbolicLink()) fail(`対象ディレクトリにシンボリックリンクは使えません: ${relative}`)
    if (entry.isDirectory()) files.push(...markdownFiles(root, relative))
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') files.push(relative)
  }
  return files
}

/** Resolve patterns and verify that every learning article belongs to at least one system.
 * @param {string} [root]
 * @returns {import('./lib/freshness-types.d.mts').RegistrySystem[]}
 */
export function readRegistry(root: string = process.cwd()): import('./lib/freshness-types.d.mts').RegistrySystem[] {
  const registry = parseRegistry(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8'))
  const inventory = { docs: markdownFiles(root, 'docs'), research: markdownFiles(root, 'research') }
  /** @param {string[]} patterns @param {'docs' | 'research'} kind @param {string} id */
  const expand = (patterns: string[], kind: 'docs' | 'research', id: string) => [...new Set(patterns.flatMap((pattern) => {
    const matches = inventory[kind].filter((file) => matchesPattern(file, pattern))
    if (!matches.length) fail(`実在する対象がありません (${id}): ${pattern}`)
    return matches
  }))].sort()
  const resolved = registry.map(({ id, title, docPatterns, researchPatterns, cadenceDays }) => ({
    id, title, docs: expand(docPatterns, 'docs', id), research: expand(researchPatterns, 'research', id), cadenceDays
  }))
  const covered = new Set(resolved.flatMap((system) => system.docs))
  const missing = inventory.docs.filter((file) => !covered.has(file))
  if (missing.length) fail(`系統に所属しない記事があります: ${missing.join(', ')}`)
  return resolved
}

/** @param {unknown} value @param {string} field @param {number} [fallback] */
function timestamp(value: unknown, field: string, fallback: number = NaN) {
  if (value === undefined || value === null || value === '') return fallback
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) fail(`${field} が不正な日時です`)
    return value.getTime()
  }
  // Require an explicit timezone for times, and reject Date.parse's rollover of invalid dates.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(value)) {
    fail(`${field} は ISO 日付またはタイムゾーン付き日時で指定してください`)
  }
  const midnight = Date.parse(`${value.slice(0, 10)}T00:00:00.000Z`)
  const parsed = Date.parse(value)
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== value.slice(0, 10) || !Number.isFinite(parsed)) {
    fail(`${field} が不正な日時です: ${value}`)
  }
  return parsed
}

/**
 * Return up to three system objects without mutating registry or state.
 * last_verified_at represents a completed observation, never front-matter last_updated.
 * Rotation ignores pending urgency so fixed weekly work cannot starve other systems.
 * @template {import('./lib/freshness-types.d.mts').RegistryEntry} T
 * @param {T[]} registry
 * @param {unknown} [state]
 * @param {import('./lib/freshness-types.d.mts').SelectionOptions} [options]
 * @returns {T[]}
 */
export function selectSystems<T extends import('./lib/freshness-types.d.mts').RegistryEntry>(registry: T[], state: unknown = {}, { mode = 'rotation', now = new Date(), limit = 3, ids = [], excludeIds = [], priorityIds = [] }: import('./lib/freshness-types.d.mts').SelectionOptions = {}): T[] {
  if (!Array.isArray(registry) || !registry.length) fail('選定対象の registry がありません')
  if (!Number.isInteger(limit) || limit < 1 || limit > 3) fail('limit は 1〜3 にしてください')
  if (!['weekly_focus', 'rotation', 'manual'].includes(mode)) fail(`未対応の選定モードです: ${mode}`)
  const nowMs = timestamp(now, 'now')
  if (!Number.isFinite(nowMs)) fail('now がありません')
  const byId = new Map(registry.map((system) => [system.id, system]))
  if (!Array.isArray(priorityIds) || priorityIds.some((id) => !byId.has(id))) fail('期限優先対象に未知の ID があります')
  if (byId.size !== registry.length) fail('選定対象の ID が重複しています')
  if (!isRecord(state)) fail('state はオブジェクトで指定してください')
  const systems = state.systems ?? {}
  if (!isRecord(systems)) fail('state.systems はオブジェクトで指定してください')
  if (!Array.isArray(state.pending ?? [])) fail('state.pending は配列で指定してください')
  for (const [id, entry] of Object.entries(systems)) {
    if (!byId.has(id)) fail(`state に未知の系統があります: ${id}`)
    if (!isRecord(entry)) fail(`state.systems.${id} が不正です`)
    for (const field of ['last_attempted_at', 'last_verified_at', 'next_retry_at']) {
      const parsed = timestamp(entry[field], `${id}.${field}`)
      if (field !== 'next_retry_at' && parsed > nowMs) fail(`${id}.${field} は未来にできません`)
    }
  }
  if (mode === 'manual') {
    if (!Array.isArray(ids) || !ids.length || ids.length > limit || new Set(ids).size !== ids.length) fail('manual の ids は重複なしで 1〜limit 件必要です')
    return ids.map((id) => {
      const selected = byId.get(id)
      if (!selected) fail(`未知の系統 ID です: ${id}`)
      return selected
    })
  }
  /** @param {string} id @returns {Record<string, unknown>} */
  const systemState = (id: string): Record<string, unknown> => { const entry = systems[id]; return isRecord(entry) ? entry : {} }
  /** @param {string} id */
  const observed = (id: string) => timestamp(systemState(id).last_verified_at, `${id}.last_verified_at`, -Infinity)
  /** @param {string} id */
  const attempted = (id: string) => timestamp(systemState(id).last_attempted_at, `${id}.last_attempted_at`, -Infinity)
  /** @param {T} a @param {T} b */
  const oldest = (a: T, b: T) => {
    // Explicit comparisons avoid Infinity - Infinity producing NaN.
    if (observed(a.id) !== observed(b.id)) return observed(a.id) < observed(b.id) ? -1 : 1
    if (attempted(a.id) !== attempted(b.id)) return attempted(a.id) < attempted(b.id) ? -1 : 1
    return a.id.localeCompare(b.id, 'en')
  }
  /** @type {Map<string, number>} */
  const pendingDue: Map<string, number> = new Map()
  for (const item of ((state.pending ?? []) as unknown[])) {
    if (!isRecord(item)) fail('pending の項目はオブジェクトで指定してください')
    const targets = item.system_ids ?? item.systems ?? [item.system_id ?? item.systemId]
    if (!Array.isArray(targets) || !targets.length || targets.some((id) => typeof id !== 'string' || !byId.has(id))) fail('pending に未知の系統 ID があります')
    const retry = timestamp(item.next_retry_at, 'pending.next_retry_at', -Infinity)
    const due = timestamp(item.due_at, 'pending.due_at', nowMs)
    if (typeof item.status === 'string' && ['closed', 'resolved', 'completed'].includes(item.status) || retry > nowMs) continue
    for (const id of targets) pendingDue.set(id, Math.min(pendingDue.get(id) ?? Infinity, due))
  }
  /** @param {number} value */
  const jstDay = (value: number) => Number.isFinite(value) ? new Date(value + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) : null
  if (!Array.isArray(excludeIds) || excludeIds.some((id) => !byId.has(id))) fail('除外対象に未知の ID があります')
  const eligible = registry.filter(({ id, cadenceDays }) => {
    if (excludeIds.includes(id) || timestamp(systemState(id).next_retry_at, `${id}.next_retry_at`, -Infinity) > nowMs) return false
    if (jstDay(Math.max(observed(id), attempted(id))) === jstDay(nowMs)) return false
    return observed(id) + cadenceDays * DAY <= nowMs || pendingDue.has(id) || priorityIds.includes(id) || Boolean(systemState(id).next_retry_at)
  })
  if (mode === 'rotation') return [...eligible].sort((a, b) => Number(priorityIds.includes(b.id)) - Number(priorityIds.includes(a.id)) || oldest(a, b)).slice(0, limit)
  const selected = FOCUS_IDS.map((id) => eligible.find((system) => system.id === id)).filter((system) => system !== undefined).slice(0, limit)
  const others = eligible.filter((system) => !selected.includes(system)).sort((a, b) => {
    if (priorityIds.includes(a.id) !== priorityIds.includes(b.id)) return priorityIds.includes(a.id) ? -1 : 1
    const aDue = pendingDue.get(a.id) ?? Infinity
    const bDue = pendingDue.get(b.id) ?? Infinity
    if (aDue !== bDue) return aDue < bDue ? -1 : 1
    const aOverdue = observed(a.id) + a.cadenceDays * DAY <= nowMs
    const bOverdue = observed(b.id) + b.cadenceDays * DAY <= nowMs
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    return oldest(a, b)
  })
  return [...selected, ...others].slice(0, limit)
}

/** @param {string[]} args */
function main(args: string[]) {
  let root = process.cwd()
  let state = {}
  /** @type {import('./lib/freshness-types.d.mts').SelectionOptions} */
  const options: import('./lib/freshness-types.d.mts').SelectionOptions = {}
  let selection = false
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    if (flag === '--help') {
      console.log('Usage: node scripts/freshness-registry.mjs [--root path] [--mode rotation|weekly_focus|manual --state file --now ISO --limit 1..3 --ids id,id]')
      return
    }
    if (!['--root', '--state', '--mode', '--now', '--limit', '--ids'].includes(flag) || !args[index + 1] || args[index + 1].startsWith('--')) fail(`CLI 引数が不正です: ${flag}`)
    const value = args[++index]
    if (flag === '--root') root = path.resolve(value)
    else if (flag === '--state') state = JSON.parse(readFileSync(value, 'utf8'))
    else {
      selection = true
      if (flag === '--limit') options.limit = Number(value)
      else if (flag === '--ids') options.ids = value.split(',')
      else if (flag === '--now') options.now = value
      else if (flag === '--mode') options.mode = value
    }
  }
  const registry = readRegistry(root)
  console.log(JSON.stringify(selection ? selectSystems(registry, state, options) : registry, null, 2))
}

export function runCli() {
  try { main(process.argv.slice(2)) } catch (error) { console.error(errorMessage(error)); process.exitCode = 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { runCli() }
