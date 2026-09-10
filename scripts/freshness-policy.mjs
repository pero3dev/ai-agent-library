#!/usr/bin/env node
/** 信頼する base のコードで候補 tree と証拠を検査する。記事の事実の真偽は検証しない。 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchesPattern, parseRegistry } from './freshness-registry.mjs'

const schema = JSON.parse(readFileSync(new URL('./schemas/freshness-result.schema.json', import.meta.url), 'utf8'))
const evidencePattern = /^research\/freshness-runs\/([a-z0-9][a-z0-9-]{3,79})\.json$/
const articlePattern = /^docs\/[0-9]{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/
const fail = message => { throw new Error(message) }
const assert = (condition, message) => { if (!condition) fail(message) }
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
const show = (cwd, revision, file) => git(cwd, ['show', `${revision}:${file}`]).replace(/\r\n/g, '\n')

/** schema が使用する JSON Schema のサブセットだけを検査する(依存ゼロ)。 */
export function validateResultShape(value, rule = schema, location = '$', root = rule) {
  if (rule.$ref) return validateResultShape(value, root.$defs[rule.$ref.split('/').at(-1)], location, root)
  if ('const' in rule) assert(value === rule.const, `${location}: const が不一致`)
  if (rule.enum) assert(rule.enum.includes(value), `${location}: 許可されていない値`)
  if (rule.type) {
    const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
    assert(rule.type === 'integer' ? Number.isInteger(value) : type === rule.type, `${location}: ${rule.type} が必要`)
  }
  if (typeof value === 'string') {
    assert(value.length >= (rule.minLength ?? 0) && value.length <= (rule.maxLength ?? Infinity), `${location}: 文字数が不正`)
    if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${location}: 書式が不正`)
  }
  if (typeof value === 'number') assert(value >= (rule.minimum ?? -Infinity) && value <= (rule.maximum ?? Infinity), `${location}: 範囲外`)
  if (Array.isArray(value)) {
    assert(value.length >= (rule.minItems ?? 0) && value.length <= (rule.maxItems ?? Infinity), `${location}: 件数が不正`)
    if (rule.uniqueItems) assert(new Set(value.map(item => JSON.stringify(item))).size === value.length, `${location}: 重複`)
    value.forEach((item, index) => validateResultShape(item, rule.items, `${location}[${index}]`, root))
  } else if (value && typeof value === 'object') {
    for (const key of rule.required ?? []) assert(Object.hasOwn(value, key), `${location}.${key}: 必須`)
    for (const [key, item] of Object.entries(value)) {
      assert(rule.additionalProperties !== false || Object.hasOwn(rule.properties ?? {}, key), `${location}.${key}: 未知のキー`)
      if (rule.properties?.[key]) validateResultShape(item, rule.properties[key], `${location}.${key}`, root)
    }
  }
}

function changesBetween(cwd, base, head) {
  for (const [label, sha] of [['base', base], ['head', head]]) assert(/^[a-f0-9]{40}$/.test(sha), `${label}: 40 桁の SHA が必要`)
  const parts = git(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--raw', '--abbrev=40', '-z', base, head, '--']).split('\0')
  const changes = []
  for (let index = 0; index < parts.length - 1; index += 2) {
    const match = /^:(\d{6}) (\d{6}) ([a-f0-9]{40}) ([a-f0-9]{40}) ([A-Z])$/.exec(parts[index])
    assert(match, '差分の raw record が不正')
    changes.push({ path: parts[index + 1], oldMode: match[1], newMode: match[2], oldBlob: match[3], newBlob: match[4], status: match[5] })
  }
  return changes.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
}

/** 過去 schema 1 の閲覧・検証専用。新しい PR の受理には使用しない。 */
export function legacyContentDigest({ cwd = process.cwd(), base, head }) {
  const records = changesBetween(cwd, base, head).filter(change => !evidencePattern.test(change.path))
  return createHash('sha256').update(JSON.stringify(records)).digest('hex')
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

/** 本文の Git 差分と根拠・変更分類を束縛する。レビュー自身と保存時刻は自己参照を避けて除く。 */
export function contentDigest({ cwd = process.cwd(), base, head }) {
  const changes = changesBetween(cwd, base, head)
  const evidence = changes.filter(change => evidencePattern.test(change.path))
  assert(evidence.length === 1, 'digest: 根拠を含む manifest を 1 件 stage してから計算する必要がある')
  const manifest = JSON.parse(show(cwd, head, evidence[0].path))
  assert(manifest.schema_version === 2, 'digest: 新規レビューには schema_version 2 が必要')
  const { schema_version, run_id, base_sha, writer_run_id, systems, observations, changes: declarations } = manifest
  for (const key of ['run_id', 'base_sha', 'writer_run_id', 'systems', 'observations', 'changes']) assert(Object.hasOwn(manifest, key), `digest: ${key} が必要`)
  const payload = {
    records: changes.filter(change => !evidencePattern.test(change.path)),
    evidence_path: evidence[0].path,
    evidence: { schema_version, run_id, base_sha, writer_run_id, systems, observations, changes: declarations }
  }
  return createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')
}

export function validateArchivedResultShape(value) {
  const legacy = JSON.parse(readFileSync(new URL('./schemas/freshness-result-v1.schema.json', import.meta.url), 'utf8'))
  validateResultShape(value, legacy)
}

function timestamp(value, label) {
  const time = Date.parse(value)
  assert(Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19), `${label}: 日時が不正`)
  return time
}

function frontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text)
  assert(match, 'front matter が必要')
  const field = key => {
    const lines = match[1].split('\n').filter(line => line.startsWith(`${key}:`))
    assert(lines.length === 1, `front matter: ${key} は 1 件必要`)
    return lines[0].slice(key.length + 1).trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  return { status: field('status'), lastUpdated: field('last_updated') }
}

function referenceComparable(text) {
  return text.replace(/^## 参考資料\n[\s\S]*?(?=^## |$(?![\s\S]))/m, '## 参考資料\n')
    .replace(/\]\([^\s)]+\)/g, '](URL)')
    .replace(/\(最終確認: \d{4}-\d{2}\)/g, '(最終確認: DATE)')
}

function unchangedOutsideWatchlist(before, after) {
  const start = '<!-- freshness-watchlist:start -->'
  const end = '<!-- freshness-watchlist:end -->'
  const strip = text => {
    assert(text.split(start).length === 2 && text.split(end).length === 2, 'ROADMAP: 観測欄マーカーが不正')
    const a = text.indexOf(start) + start.length
    const b = text.indexOf(end)
    assert(a <= b, 'ROADMAP: 観測欄マーカーの順序が不正')
    return `${text.slice(0, a)}${text.slice(b)}`
  }
  assert(strip(before) === strip(after), 'ROADMAP: 観測欄以外の変更は禁止')
}

export function checkFreshnessPolicy({ cwd = process.cwd(), base, head, branch, now = Date.now() }) {
  assert(typeof branch === 'string' && branch.length > 0, 'branch が必要')
  if (!branch.startsWith('automation/freshness-')) return { skipped: true, reason: '通常ブランチ' }
  const changes = changesBetween(cwd, base, head)
  const evidence = changes.filter(change => evidencePattern.test(change.path))
  assert(evidence.length === 1 && evidence[0].status === 'A', '新規 run manifest が 1 件必要(過去の記録の編集は禁止)')
  const manifest = JSON.parse(show(cwd, head, evidence[0].path))
  validateResultShape(manifest)
  assert(evidence[0].path === `research/freshness-runs/${manifest.run_id}.json`, 'run_id と manifest path が不一致')
  assert(branch === `automation/freshness-${manifest.run_id}`, 'run_id と branch が不一致')
  assert(manifest.base_sha === base, 'manifest の base_sha が検証 base と不一致')

  const started = timestamp(manifest.started_at, 'started_at')
  const completed = timestamp(manifest.completed_at, 'completed_at')
  assert(started <= completed && completed <= now + 15 * 60 * 1000, '実行日時の順序または未来の日時が不正')
  const reviewed = timestamp(manifest.review.reviewed_at, 'reviewed_at')
  assert(reviewed >= started && reviewed <= completed, 'レビューは記録された実行区間内である必要がある')
  assert(manifest.review.verdict === 'approved' && manifest.review.risk === 'low', '自動更新には approved かつ low のレビューが必要')
  assert(manifest.writer_run_id !== manifest.review.reviewer_run_id, '執筆とレビューの run ID を分離する必要がある')
  assert(manifest.review.content_digest === contentDigest({ cwd, base, head }), 'レビュー後に内容差分が変わっている(content_digest 不一致)')

  const registry = parseRegistry(show(cwd, base, 'ROADMAP.md'))
  const systems = manifest.systems.map(id => {
    const system = registry.find(entry => entry.id === id)
    assert(system, `未知の系統: ${id}`)
    return system
  })
  const inventory = new Set(git(cwd, ['ls-tree', '-r', '--name-only', '-z', base, '--']).split('\0').filter(Boolean))
  const belongs = (file, system) => system.docPatterns.some(pattern => matchesPattern(file, pattern))
  for (const [index, observation] of manifest.observations.entries()) {
    const system = systems.find(entry => entry.id === observation.system_id)
    assert(system, `observations[${index}]: 対象外の系統`)
    if (['changed', 'unchanged'].includes(observation.status)) assert(observation.sources.length > 0, `observations[${index}]: 確認済みには根拠 URL が必要`)
    for (const file of observation.affected_docs) assert(inventory.has(file) && belongs(file, system), `observations[${index}]: 対象外の記事 ${file}`)
    for (const source of observation.sources) {
      const url = new URL(source.url)
      assert(url.protocol === 'https:' && !url.username && !url.password, '根拠 URL は認証情報を含まない HTTPS が必要')
      assert(url.hostname !== 'localhost' && !/^127\.|^10\.|^192\.168\.|^169\.254\.|^\[/.test(url.hostname), '根拠 URL は公開一次情報が必要')
      const accessed = timestamp(source.accessed_at, 'accessed_at')
      assert(accessed >= started && accessed <= reviewed, 'accessed_at は実行開始後かつレビュー以前である必要がある')
      for (const field of ['published_at', 'effective_at']) if (source[field]) timestamp(`${source[field]}T00:00:00Z`, field)
    }
  }
  for (const id of manifest.systems) assert(manifest.observations.some(item => item.system_id === id), `観測記録のない系統: ${id}`)

  const entries = new Map(manifest.changes.map(entry => [entry.path, entry]))
  assert(entries.size === manifest.changes.length, 'changes.path の重複')
  assert(entries.size === changes.length - 1, 'changes は evidence 以外の全変更を過不足なく列挙する必要がある')
  let articles = 0
  const updateDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(completed))
  for (const change of changes) {
    assert(change.status === 'A' || change.status === 'M', `${change.path}: 削除・改名などは禁止`)
    assert(change.newMode === '100644' && (change.oldMode === '000000' || change.oldMode === '100644'), `${change.path}: symlink・実行属性・mode 変更は禁止`)
    assert(!change.path.includes('..') && !change.path.includes('\\'), '不正なファイルパス')
    if (evidencePattern.test(change.path)) continue
    const entry = entries.get(change.path)
    assert(entry, `${change.path}: changes にない変更`)
    const observations = entry.observation_indices.map(index => {
      assert(index < manifest.observations.length, `${change.path}: observation_indices が範囲外`)
      return manifest.observations[index]
    })
    assert(observations.every(item => ['changed', 'unchanged'].includes(item.status)), `${change.path}: 未確認・失敗した観測での変更は禁止`)
    const after = show(cwd, head, change.path)
    assert(!after.includes('\0'), `${change.path}: バイナリは禁止`)
    if (articlePattern.test(change.path)) {
      articles++
      assert(change.status === 'M' && systems.some(system => belongs(change.path, system)), `${change.path}: 新記事または対象外の記事は禁止`)
      assert(observations.some(item => item.affected_docs.includes(change.path)), `${change.path}: 対応する記事観測が必要`)
      const before = show(cwd, base, change.path)
      const oldMetadata = frontMatter(before)
      const metadata = frontMatter(after)
      assert(oldMetadata.status === 'published' && metadata.status === 'published', `${change.path}: published を維持する必要がある`)
      if (entry.kind === 'substantive') {
        assert(observations.some(item => item.status === 'changed'), `${change.path}: 実質変更には changed の観測が必要`)
        assert(metadata.lastUpdated === updateDate, `${change.path}: last_updated は完了日の JST 日付 ${updateDate} が必要`)
        assert(before.replace(/^last_updated:.*$/m, '') !== after.replace(/^last_updated:.*$/m, ''), `${change.path}: 日付だけの更新は禁止`)
      } else {
        assert(entry.kind === 'reference-only', `${change.path}: 記事には substantive または reference-only が必要`)
        assert(oldMetadata.lastUpdated === metadata.lastUpdated, `${change.path}: 参考資料のみの修正で last_updated を変更しない`)
        assert(referenceComparable(before) === referenceComparable(after), `${change.path}: reference-only に本文変更を含めない`)
      }
    } else {
      assert(entry.kind === 'supporting', `${change.path}: 補助資料は supporting を指定する`)
      if (change.path === 'ROADMAP.md') unchangedOutsideWatchlist(show(cwd, base, change.path), after)
      else if (change.path === 'GLOSSARY.md') assert(change.status === 'M', 'GLOSSARY は既存ファイルのみ')
      else if (/^docs\/[0-9]{2}-[a-z0-9-]+\/README\.md$/.test(change.path)) {
        assert(change.status === 'M' && manifest.changes.some(item => articlePattern.test(item.path) && path.posix.dirname(item.path) === path.posix.dirname(change.path)), `${change.path}: 更新記事と同じセクションの README のみ許可`)
      } else {
        assert(/^research\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md$/.test(change.path), `${change.path}: 自動更新の許可範囲外`)
        assert(systems.some(system => system.researchPatterns.some(pattern => matchesPattern(change.path, pattern) || (change.status === 'A' && path.posix.dirname(change.path) === path.posix.dirname(pattern)))), `${change.path}: 対象外の調査メモ`)
      }
    }
  }
  assert(articles > 0, '本文/参考資料の変更がない場合は PR を作成せず観測記録として保存する')
  return { skipped: false, run_id: manifest.run_id, articles, files: changes.length, content_digest: manifest.review.content_digest }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.includes('--help')) {
      console.log('node scripts/freshness-policy.mjs --base <SHA> --head <commit/tree SHA> --branch <name> [--print-digest]')
    } else {
      const options = {}
      for (let index = 0; index < args.length; index++) {
        if (args[index] === '--print-digest') { options.printDigest = true; continue }
        assert(['--base', '--head', '--branch'].includes(args[index]), `未知の引数: ${args[index]}`)
        const key = args[index].slice(2)
        assert(args[index + 1] && !args[index + 1].startsWith('--'), `${args[index]} の値が必要`)
        options[key] = args[++index]
      }
      assert(options.base && options.head && options.branch, '--base / --head / --branch が必要')
      console.log(options.printDigest ? contentDigest(options) : JSON.stringify(checkFreshnessPolicy(options)))
    }
  } catch (error) {
    console.error(`freshness-policy: ${error.message}`)
    process.exitCode = 1
  }
}
