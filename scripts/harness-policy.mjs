#!/usr/bin/env node
/**
 * trusted base のコード・schema・依存から候補 Git tree をデータとして読む。
 * 候補 checkout / import / npm / Markdown 内命令の実行はしない。
 * 意味的な変更分類と独立判断の実在を機械的に証明するものではない。
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import { validateResultShape } from './freshness-policy.mjs'
import { validateDoc } from './lib/validate-core.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'
import { parseFrontMatter, parseScalar, splitLocalDestination, toLines } from './lib/md-utils.mjs'
import { GENERATED_DIRS, GENERATED_FILES } from './lib/hook-core.mjs'

const schema = JSON.parse(readFileSync(new URL('./schemas/harness-change.schema.json', import.meta.url), 'utf8'))
const articlePattern = /^docs\/[0-9]{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/
const articleCandidate = file => file.startsWith('docs/') && /\.md$/i.test(file) && path.posix.basename(file) !== 'README.md'
const manifestPattern = /^harness\/changes\/([a-z0-9][a-z0-9-]{3,79})\.json$/
export const requiredChecks = Object.freeze(['lint', 'actionlint', 'docs', 'examples', 'build', 'freshness-policy', 'harness', 'harness-windows', 'harness-policy'])
const assert = (ok, message) => { if (!ok) throw new Error(message) }
const git = (cwd, args) => execFileSync('git', ['--no-pager', ...args], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
const sha = (value, label) => assert(typeof value === 'string' && /^[a-f0-9]{40}$/.test(value), `${label}: 40 桁の SHA が必要です`)
const normalize = text => toLines(text).join('\n')
const uniqueSorted = items => [...new Set(items)].sort()
const equalSet = (a, b) => JSON.stringify(uniqueSorted(a)) === JSON.stringify(uniqueSorted(b))
const markdown = new MarkdownIt({ html: true, linkify: false, typographer: false })

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

export function classifyPath(file) {
  if (manifestPattern.test(file)) return 'evidence'
  if (articleCandidate(file)) return 'articles'
  if (file.startsWith('docs/') || ['GLOSSARY.md', 'ROADMAP.md'].includes(file)) return 'article-support'
  if (file.startsWith('examples/')) return 'examples'
  if (file.startsWith('website/')) return 'website'
  if (/^(?:\.agents\/|\.codex\/|\.claude\/|\.github\/|scripts\/|harness\/|tests\/harness\/)/.test(file) || ['AGENTS.md', 'CLAUDE.md', 'package.json', 'package-lock.json'].includes(file)) return 'harness'
  if (file.startsWith('research/')) return 'research'
  return 'repository'
}

export function isGenerated(file) {
  const lower = file.toLowerCase()
  return GENERATED_FILES.includes(lower) || GENERATED_DIRS.some(dir => lower === dir || lower.startsWith(`${dir}/`))
}

export function readChanges({ cwd, base, head }) {
  sha(base, 'base'); sha(head, 'head')
  const raw = git(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--raw', '--abbrev=40', '-z', base, head, '--']).split('\0')
  const changes = []
  for (let i = 0; i < raw.length - 1; i += 2) {
    const match = /^:(\d{6}) (\d{6}) ([a-f0-9]{40}) ([a-f0-9]{40}) ([A-Z])$/.exec(raw[i])
    assert(match, 'Git raw 差分を解析できません')
    changes.push({ path: raw[i + 1], oldMode: match[1], newMode: match[2], oldBlob: match[3], newBlob: match[4], status: match[5] })
  }
  return changes.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
}

function treeReader(cwd, revision) {
  sha(revision, 'revision')
  const entries = new Map(git(cwd, ['ls-tree', '-r', '-z', revision, '--']).split('\0').filter(Boolean).map(record => {
    const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([\s\S]+)$/.exec(record)
    assert(match, 'Git tree を解析できません')
    return [match[4], { mode: match[1], oid: match[3] }]
  }))
  const cache = new Map()
  const text = file => {
    assert(entries.get(file)?.mode === '100644', `${file}: 通常ファイルが必要です`)
    if (!cache.has(file)) {
      const content = normalize(git(cwd, ['cat-file', 'blob', entries.get(file).oid]))
      assert(!content.includes('\0'), `${file}: テキストファイルが必要です`)
      cache.set(file, content)
    }
    return cache.get(file)
  }
  return { entries, text }
}

function timestamp(value, label) {
  const result = Date.parse(value)
  assert(Number.isFinite(result) && new Date(result).toISOString().slice(0, 19) === value.slice(0, 19), `${label}: 実在する UTC 日時が必要です`)
  return result
}

function metadata(text, file) {
  const frontMatter = parseFrontMatter(toLines(text))
  assert(frontMatter && !frontMatter.unclosed && !frontMatter.errors.length, `${file}: 正しい front matter が必要です`)
  const field = name => {
    const fields = frontMatter.fields.filter(field => field.key === name)
    assert(fields.length === 1, `${file}: ${name} は 1 件必要です`)
    const value = parseScalar(fields[0].value)
    assert(value !== null, `${file}: ${name} は文字列が必要です`)
    return value
  }
  const status = field('status')
  assert(['draft', 'published'].includes(status), `${file}: status が不正です`)
  return { status, updated: field('last_updated') }
}

function withoutMetadataFields(text, fields) {
  return text.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, block => block.split('\n').filter(line => !fields.some(field => line.startsWith(`${field}:`))).join('\n'))
}

/** ROADMAP のタスク表だけを読む。新しい未作成成果物には docs/ または節付きのパスが必要。 */
export function roadmapTasks(text, inventory) {
  const tasks = new Map()
  const byName = new Map()
  for (const file of inventory.filter(file => articlePattern.test(file))) {
    const name = path.posix.basename(file)
    assert(!byName.has(name), `記事ファイル名が重複しています: ${name}`)
    byName.set(name, file)
  }
  // 行の見た目ではなく Markdown の実 table を読む。fence / HTML コメント中の
  // 表を進捗の正本にせず、参照形式リンクも文書全体の定義で解決する。
  const tables = []
  let table = null
  let row = null
  for (const token of markdown.parse(text, {})) {
    if (token.type === 'table_open') table = []
    else if (token.type === 'table_close') { tables.push(table); table = null }
    else if (table && token.type === 'tr_open') row = []
    else if (table && token.type === 'tr_close') { table.push(row); row = null }
    else if (row && token.type === 'inline') row.push(token)
  }
  for (const rows of tables) {
    const headers = rows[0].map(cell => cell.content.trim())
    if (!['タスク', '成果物', 'ステータス'].every(header => headers.includes(header))) continue
    const columns = { id: headers.indexOf('タスク'), artifacts: headers.indexOf('成果物'), status: headers.indexOf('ステータス') }
    for (const cells of rows.slice(1)) {
      const id = cells[columns.id]?.content.trim()
      const status = cells[columns.status]?.content.trim()
      assert(id && ['未着手', '執筆中', 'レビュー待ち', '完了', '対象外'].includes(status), `ROADMAP: タスク行が不正です: ${id}`)
      assert(!tasks.has(id), `ROADMAP: タスク ID が重複しています: ${id}`)
      const artifacts = []
      const tokens = (cells[columns.artifacts]?.children ?? []).flatMap(token => token.type === 'code_inline' ? [token.content] : token.type === 'link_open' ? [token.attrGet('href')] : [])
      for (const token of tokens) {
        if (!token.endsWith('.md') || token.endsWith('README.md') || /^(research|templates|examples|harness)\//.test(token)) continue
        const candidate = token.startsWith('docs/') ? token : /^[0-9]{2}-[^/]+\//.test(token) ? `docs/${token}` : byName.get(token)
        // GLOSSARY 等の補助成果物は記事状態との同期対象外。
        if (!candidate && !/^[a-z0-9-]+\.md$/.test(token)) continue
        assert(candidate && articlePattern.test(candidate), `ROADMAP: 成果物 ${token} は節を含む記事パスで明示してください`)
        artifacts.push(candidate)
      }
      assert(status !== '対象外' || artifacts.length === 0, `ROADMAP: ${id} の記事成果物を対象外として省略できません`)
      tasks.set(id, { id, status, artifacts: uniqueSorted(artifacts) })
    }
  }
  assert(tasks.size > 0, 'ROADMAP: タスク表を取得できません')
  return tasks
}

function resolveLink(file, target) {
  const parsed = splitLocalDestination(target)
  if (parsed.external) return null
  assert(!parsed.error, `${file}: ${parsed.error}`)
  if (!parsed.pathname) return file
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), parsed.pathname)).replace(/\/$/, '')
  assert(resolved !== '..' && !resolved.startsWith('../'), `${file}: リポジトリ外の相対リンクです`)
  return resolved
}

function documentGraph(reader) {
  const articles = [...reader.entries.keys()].filter(file => articlePattern.test(file))
  const links = new Map()
  const localLinks = file => {
    if (!links.has(file)) links.set(file, parseMarkdownLinks(reader.text(file)).links.map(link => ({ ...link, resolved: resolveLink(file, link.target) })).filter(link => link.resolved))
    return links.get(file)
  }
  // 索引のラベルだけではなく、実際のリンク先を確認する。
  for (const article of articles) {
    const index = `${path.posix.dirname(article)}/README.md`
    assert(reader.entries.has(index), `${article}: セクション README がありません`)
    assert(localLinks(index).some(link => link.inTable && link.resolved === article), `${article}: セクション README の収録表リンクがありません`)
  }
  const sampleDirs = uniqueSorted([...reader.entries.keys()].map(file => /^(examples\/(?:python|typescript)\/[^/]+)\//.exec(file)?.[1]).filter(Boolean))
  for (const dir of sampleDirs) {
    const readme = `${dir}/README.md`
    assert(reader.entries.has(readme), `${dir}: サンプル README がありません`)
    const docs = localLinks(readme).map(link => link.resolved).filter(file => articlePattern.test(file))
    assert(docs.length > 0, `${readme}: 対応する記事へのリンクが必要です`)
    for (const doc of docs) assert(reader.entries.has(doc), `${readme}: 参照記事がありません: ${doc}`)
    // README には前提知識や関連する権限設計もリンクできる。実装の対応関係は
    // 相互リンクで確定し、少なくとも 1 対が必要。記事側から張った全リンクは下で照合する。
    assert(docs.some(doc => localLinks(doc).some(link => link.resolved === dir || link.resolved.startsWith(`${dir}/`))), `${readme}: 対応する記事からの戻りリンクがありません`)
  }
  for (const doc of articles) {
    for (const link of localLinks(doc)) {
      const dir = /^(examples\/(?:python|typescript)\/[^/]+)(?:\/|$)/.exec(link.resolved)?.[1]
      if (!dir) continue
      const readme = `${dir}/README.md`
      assert(reader.entries.has(readme), `${doc}: サンプル README がありません: ${readme}`)
      assert(localLinks(readme).some(back => back.resolved === doc), `${doc}: サンプルから記事への戻りリンクがありません`)
    }
  }
  return { articles, localLinks }
}

function validateTaskStates(before, after, reader, deleted) {
  for (const [id, task] of before) {
    const retained = task.artifacts.filter(file => !deleted.has(file))
    if (!retained.length) continue
    assert(after.has(id), `ROADMAP: 既存の記事タスク ${id} を削除できません`)
    assert(retained.every(file => after.get(id).artifacts.includes(file)), `ROADMAP: ${id} の既存成果物を省略できません`)
  }
  for (const task of after.values()) {
    if (!task.artifacts.length) continue
    const states = task.artifacts.map(file => reader.entries.has(file) ? metadata(reader.text(file), file).status : 'missing')
    const expected = states.every(state => state === 'published') ? '完了' : states.every(state => state === 'draft') ? 'レビュー待ち' : states.every(state => state === 'missing') ? '未着手' : '執筆中'
    assert(task.status === expected, `ROADMAP: ${task.id} は全成果物の状態から ${expected} が必要です`)
  }
  for (const task of after.values()) {
    if (!/-R$/.test(task.id) || task.status !== '完了') continue
    const prefix = task.id.slice(0, -1)
    const siblings = [...after.values()].filter(other => other.id !== task.id && other.id.startsWith(prefix) && other.artifacts.length)
    assert(siblings.every(other => other.status === '完了'), `ROADMAP: ${task.id} はフェーズの全記事タスク完了前に完了にできません`)
  }
}

function validateManifestShape(manifest) {
  // 共通の小さい schema validator の対象外である oneOf を、この 1 箇所だけ展開する。
  const reviewRule = manifest?.review === null ? schema.properties.review.oneOf[0] : schema.properties.review.oneOf[1]
  validateResultShape(manifest, { ...schema, properties: { ...schema.properties, review: reviewRule } })
}

function manifestFromHead(options, changes) {
  const evidence = changes.filter(change => manifestPattern.test(change.path))
  assert(evidence.length === 1 && evidence[0].status === 'A' && evidence[0].newMode === '100644', '通常の記事変更には新しい harness/changes/<run_id>.json が 1 件必要です')
  const manifest = JSON.parse(git(options.cwd, ['show', `${options.head}:${evidence[0].path}`]))
  return { manifest, evidence: evidence[0] }
}

export function reviewDigest(options) {
  const changes = readChanges(options)
  const { manifest, evidence } = manifestFromHead(options, changes)
  const { schema_version, run_id, base_sha, writer_run_id, changes: declarations, tasks, sources } = manifest
  assert(schema_version === 1, 'digest: schema_version 1 が必要です')
  for (const key of ['run_id', 'base_sha', 'writer_run_id', 'changes', 'tasks', 'sources']) assert(Object.hasOwn(manifest, key), `digest: ${key} が必要です`)
  const payload = { records: changes.filter(change => !manifestPattern.test(change.path)), evidence_path: evidence.path, evidence: { schema_version, run_id, base_sha, writer_run_id, changes: declarations, tasks, sources } }
  return createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')
}

function referenceComparable(text) {
  // 実際の参考資料セクションだけを除く。コード中の同名見出しは除かない。
  const headings = parseMarkdownLinks(text).headings.filter(heading => heading.level === 2)
  const reference = headings.findIndex(heading => heading.text === '参考資料')
  const lines = text.split('\n')
  if (reference >= 0) lines.splice(headings[reference].line, (headings[reference + 1]?.line ?? lines.length + 1) - headings[reference].line - 1)
  // AST の実リンク先だけを可変にする。コード・inline code にある ](URL) は本文として残す。
  const tokenValue = token => ({
    type: token.type, tag: token.tag, nesting: token.nesting, markup: token.markup, info: token.info,
    content: token.children?.length ? undefined : token.content,
    attrs: token.attrs?.map(([key, value]) => [key, ['href', 'src'].includes(key) ? 'URL' : value]) ?? null,
    children: token.children?.map(tokenValue) ?? null,
  })
  return JSON.stringify(markdown.parse(lines.join('\n'), {}).map(tokenValue))
}

export function checkHarnessPolicy({ cwd = process.cwd(), base, head, branch, now = Date.now() }) {
  assert(typeof branch === 'string' && branch.length > 0, 'branch が必要です')
  const options = { cwd, base, head }
  const changes = readChanges(options)
  const before = treeReader(cwd, base)
  const after = treeReader(cwd, head)
  for (const [file, entry] of after.entries) {
    assert(!isGenerated(file), `${file}: 生成物は追跡できません`)
    if (articleCandidate(file)) assert(articlePattern.test(file), `${file}: 記事の配置・ファイル名が不正です`)
    if (/^(?:docs|examples|harness)\//.test(file) || ['AGENTS.md', 'CLAUDE.md', 'ROADMAP.md'].includes(file)) assert(entry.mode === '100644', `${file}: symlink・実行属性・submodule は許可されません`)
  }
  const scopes = uniqueSorted(changes.map(change => classifyPath(change.path)))
  const graph = documentGraph(after)
  const oldTasks = roadmapTasks(before.text('ROADMAP.md'), [...before.entries.keys()])
  const tasks = roadmapTasks(after.text('ROADMAP.md'), [...after.entries.keys()])
  const deleted = new Set(changes.filter(change => change.status === 'D').map(change => change.path))
  validateTaskStates(oldTasks, tasks, after, deleted)
  for (const article of graph.articles) assert([...tasks.values()].some(task => task.artifacts.includes(article)), `${article}: ROADMAP の成果物に含まれていません`)
  const articles = changes.filter(change => articlePattern.test(change.path))
  for (const article of articles.filter(change => change.status !== 'D')) {
    const issues = validateDoc(article.path, after.text(article.path))
    assert(issues.length === 0, `${article.path}: 記事規約違反: ${issues.map(issue => issue.message).join(' / ')}`)
  }
  const freshness = branch.startsWith('automation/freshness-')
  if (freshness || articles.length === 0) {
    assert(!changes.some(change => manifestPattern.test(change.path)), '通常記事の変更がない PR に通常記事 manifest は置きません')
    return { scopes, required_checks: requiredChecks, articles: articles.length, freshness_managed: freshness }
  }
  const { manifest, evidence } = manifestFromHead(options, changes)
  validateManifestShape(manifest)
  assert(evidence.path === `harness/changes/${manifest.run_id}.json`, 'manifest の run_id とパスが不一致です')
  assert(manifest.base_sha === base, 'manifest の base_sha が検証 base と不一致です')
  assert(equalSet(manifest.changes.map(item => item.path), articles.map(item => item.path)) && manifest.changes.length === articles.length, 'changes は変更記事を過不足なく列挙してください')
  const relocationSources = manifest.changes.filter(item => item.kind === 'relocate').map(item => item.previous_path)
  assert(new Set(relocationSources).size === relocationSources.length, '同じ旧記事を複数の relocate 元にできません')
  for (const item of manifest.changes) assert(item.kind === 'relocate' ? typeof item.previous_path === 'string' : !Object.hasOwn(item, 'previous_path'), `${item.path}: previous_path は relocate だけに必要です`)
  const changedPaths = new Set(articles.map(article => article.path))
  const relatedTasks = new Map()
  for (const task of [...oldTasks.values(), ...tasks.values()]) {
    if (!task.artifacts.some(file => changedPaths.has(file))) continue
    const all = uniqueSorted([...(oldTasks.get(task.id)?.artifacts ?? []), ...(tasks.get(task.id)?.artifacts ?? [])])
    relatedTasks.set(task.id, all)
  }
  assert(manifest.tasks.length === relatedTasks.size && new Set(manifest.tasks.map(task => task.id)).size === relatedTasks.size, 'tasks は対応するタスクを過不足なく列挙してください')
  for (const task of manifest.tasks) assert(relatedTasks.has(task.id) && equalSet(task.artifacts, relatedTasks.get(task.id)), `tasks: ${task.id} の全成果物が必要です`)
  const completed = timestamp(manifest.completed_at, 'completed_at')
  assert(completed <= now + 15 * 60 * 1000, '完了時刻が未来です')
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(completed)
  const needsReview = articles.some(article => article.status === 'D' || (before.entries.has(article.path) && metadata(before.text(article.path), article.path).status === 'published') || (after.entries.has(article.path) && metadata(after.text(article.path), article.path).status === 'published'))
  if (needsReview) assert(manifest.review !== null && manifest.review.verdict === 'approved', '公開済み記事・公開昇格・削除には最終独立レビューが必要です')
  let reviewed = completed
  if (manifest.review !== null) {
    assert(manifest.review.reviewer_run_id !== manifest.writer_run_id, '執筆とレビューの実行 ID を分けてください')
    reviewed = timestamp(manifest.review.reviewed_at, 'reviewed_at')
    assert(reviewed <= completed, 'レビュー時刻は完了時刻以前が必要です')
    assert(manifest.review.content_digest === reviewDigest(options), '最終レビュー後に本文・根拠・分類が変わっています(content_digest 不一致)')
  }
  for (const source of manifest.sources) {
    const url = new URL(source.url)
    assert(url.protocol === 'https:' && !url.username && !url.password, '根拠 URL は認証情報を含まない HTTPS が必要です')
    assert(timestamp(source.accessed_at, 'accessed_at') <= reviewed, '根拠の取得は最終レビュー以前が必要です')
    assert(source.affected_docs.every(file => changedPaths.has(file)), '出典に対象外の記事が含まれています')
  }
  for (const article of articles) {
    const declaration = manifest.changes.find(item => item.path === article.path)
    if (article.status === 'D') { assert(declaration.kind === 'remove', `${article.path}: 削除には remove が必要です`); continue }
    const current = metadata(after.text(article.path), article.path)
    const source = manifest.sources.some(item => item.affected_docs.includes(article.path))
    if (article.status === 'A') {
      if (declaration.kind === 'relocate') {
        const previous = declaration.previous_path
        assert(before.entries.has(previous) && deleted.has(previous) && manifest.changes.some(item => item.path === previous && item.kind === 'remove'), `${article.path}: relocate には旧記事の remove 記録が必要です`)
        const old = metadata(before.text(previous), previous)
        assert(current.status === old.status && current.updated === old.updated, `${article.path}: relocate は公開状態と更新日を維持してください`)
        assert(referenceComparable(withoutMetadataFields(before.text(previous), ['category'])) === referenceComparable(withoutMetadataFields(after.text(article.path), ['category'])), `${article.path}: relocate に本文・コードの実質変更を含められません`)
        continue
      }
      assert(declaration.kind === 'new', `${article.path}: 新規記事には new が必要です`)
      assert(current.updated === date, `${article.path}: 新規記事の日付は ${date} が必要です`)
      if (current.status === 'published') assert(source, `${article.path}: 新規公開には根拠が必要です`)
      continue
    }
    assert(article.status === 'M', `${article.path}: 未対応の変更種別です`)
    const old = metadata(before.text(article.path), article.path)
    const priorText = before.text(article.path)
    const currentText = after.text(article.path)
    if (declaration.kind === 'substantive') {
      assert(current.updated === date, `${article.path}: 実質変更の日付は ${date} が必要です`)
      assert(source, `${article.path}: 実質変更には根拠が必要です`)
      const withoutStatusDate = text => withoutMetadataFields(text, ['last_updated', 'status'])
      assert(withoutStatusDate(priorText) !== withoutStatusDate(currentText), `${article.path}: 日付・公開状態だけの実質変更はできません`)
    } else {
      assert(['reference-only', 'editorial', 'status-only'].includes(declaration.kind), `${article.path}: 既存記事の変更分類が不正です`)
      assert(current.updated === old.updated, `${article.path}: 参考資料・表記・状態だけの変更では last_updated を維持してください`)
      if (declaration.kind === 'reference-only') assert(referenceComparable(priorText) === referenceComparable(currentText), `${article.path}: reference-only に本文変更を含められません`)
      if (declaration.kind === 'status-only') assert(priorText.replace(/^status:.*$/m, '') === currentText.replace(/^status:.*$/m, ''), `${article.path}: status-only に本文変更を含められません`)
    }
    // 通常改訂で公開状態を落とす変更もレビュー対象。機械的な published 維持は freshness 専用。
  }
  return { scopes, required_checks: requiredChecks, articles: articles.length, run_id: manifest.run_id, content_digest: manifest.review?.content_digest ?? null, freshness_managed: false }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.includes('--help')) console.log('node scripts/harness-policy.mjs --base <SHA> --head <commit/tree SHA> --branch <name> [--print-digest]')
    else {
      const options = {}
      for (let index = 0; index < args.length; index++) {
        if (args[index] === '--print-digest') { options.printDigest = true; continue }
        assert(['--base', '--head', '--branch'].includes(args[index]), `未知の引数: ${args[index]}`)
        const key = args[index].slice(2)
        assert(!Object.hasOwn(options, key) && args[index + 1] && !args[index + 1].startsWith('--'), `${args[index]} の値が不正です`)
        options[key] = args[++index]
      }
      assert(options.base && options.head && options.branch, '--base / --head / --branch が必要です')
      options.cwd = process.cwd()
      console.log(options.printDigest ? reviewDigest(options) : JSON.stringify(checkHarnessPolicy(options)))
    }
  } catch (error) {
    console.error(`harness-policy: ${error.message}`)
    process.exitCode = 1
  }
}
