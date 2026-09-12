import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { collectDocs, forEachLine, parseFrontMatter, toLines, unquote } from '../lib/md-utils.mjs'

export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const sourceDigest = text => sha256(text.replace(/\r\n?/g, '\n'))
export async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT' && arguments.length > 1) return fallback
    throw error
  }
}
// Generated artifacts can be recreated. Preserve malformed evidence instead of retrying
// the same broken cache forever. Never use this recovery for queue/account/source data.
export async function readGeneratedJson(file, fallback = null) {
  try { return await readJson(file, fallback) } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    const quarantine = `${file}.invalid-${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`
    await rename(file, quarantine)
    return fallback
  }
}
export async function writeJson(file, value, { renameFile = rename, pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)) } = {}) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  // Windows readers/antivirus can briefly deny replacement of an open destination.
  // Keep the atomic rename and the previous complete file; never delete it as a fallback.
  for (let attempt = 0; attempt < 8; attempt++) {
    try { await renameFile(temporary, file); return } catch (error) {
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt === 7) throw error
      await pause(40 * 2 ** Math.min(attempt, 4))
    }
  }
}
export function assertSafeArticlePath(articlePath) {
  if (!/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(articlePath)) throw new Error(`Invalid article path: ${articlePath}`)
  return articlePath
}
export function articleSlug(articlePath) { return assertSafeArticlePath(articlePath).replace(/^docs\//, '').replace(/\.md$/, '').replaceAll('/', '--') }
export async function discoverArticles(repoRoot, { section } = {}) {
  const articles = []
  for (const file of collectDocs(repoRoot)) {
    if (!/^\d{2}-/.test(file.section) || file.isReadme || (section && file.section !== section)) continue
    const source = await readFile(file.abs, 'utf8')
    const parsed = parseFrontMatter(toLines(source))
    if (!parsed || parsed.errors.length || parsed.unclosed) continue
    const fields = Object.fromEntries(parsed.fields.map(field => [field.key, unquote(field.value)]))
    if (fields.status !== 'published') continue
    assertSafeArticlePath(file.repoRel)
    articles.push({ article_path: file.repoRel, source_digest: sourceDigest(source), title: fields.title, section: file.section, source })
  }
  return articles
}
export function sourceSections(source) {
  const titles = []
  forEachLine(toLines(source), (line, _lineNo, inFence) => {
    if (inFence) return
    const match = line.match(/^#{2,4}\s+(.+)/)
    if (match && !/^(参考|関連|対象読者)/.test(match[1])) titles.push(match[1])
  })
  return titles.map((title, index) => ({ id: `s${String(index + 1).padStart(3, '0')}`, title }))
}
export class QuotaError extends Error { constructor(message) { super(message); this.name = 'QuotaError' } }
export function supplementalBlocks(source) {
  const lines = toLines(source), starts = []
  forEachLine(lines, (line, index, inFence) => {
    if (inFence) return
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) starts.push({ level: heading[1].length, heading: heading[2], line: index - 1 })
  })
  return starts.flatMap((item, index) => item.level === 3 ? [{ heading: item.heading, excerpt: lines.slice(item.line + 1, starts[index + 1]?.line ?? lines.length).join('\n').trim() }] : [])
}
function termInSource(term, source) {
  if (term.length < 2) return false
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return /^[a-zA-Z0-9][a-zA-Z0-9 -]*$/.test(term)
    ? new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(source)
    : source.toLocaleLowerCase().includes(term.toLocaleLowerCase())
}
export async function readSupplementalSources(repoRoot, article) {
  if (!repoRoot) return { schema_version: 1, entries: [] }
  const entries = []
  async function addDocument(documentPath, select) {
    let source
    try { source = await readFile(path.join(repoRoot, documentPath), 'utf8') } catch (error) { if (error.code === 'ENOENT') return; throw error }
    if (documentPath.startsWith('docs/')) {
      const fields = parseFrontMatter(toLines(source))?.fields ?? []
      if (unquote(fields.find(field => field.key === 'status')?.value ?? '') !== 'published') return
    }
    const blocks = supplementalBlocks(source).filter(select)
    if (documentPath === 'GLOSSARY.md') blocks.sort((a, b) => Number(/^(MCP\(|RAG\(|Human-in-the-Loop|LLM-as-a-Judge|PoC\()/.test(b.heading)) - Number(/^(MCP\(|RAG\(|Human-in-the-Loop|LLM-as-a-Judge|PoC\()/.test(a.heading)))
    for (const block of blocks) {
      if (!block.excerpt || block.excerpt.length > 1800 || entries.length >= 14 || entries.reduce((sum, item) => sum + item.excerpt.length, 0) + block.excerpt.length > 6500) continue
      entries.push({ document_path: documentPath, heading: block.heading, excerpt: block.excerpt, excerpt_sha256: sha256(block.excerpt) })
    }
  }
  // Supply existing definitions, not model-invented prerequisites or another full article.
  if (/\b(?:LLM|Agent)\b/i.test(article.source)) {
    await addDocument('docs/01-concepts/what-is-an-ai-agent.md', block => block.heading === '概要: このライブラリでの定義')
    await addDocument('docs/01-concepts/agent-loop.md', block => block.heading === '概要: ループが Agent を作る')
  }
  await addDocument('GLOSSARY.md', block => {
    const terms = block.heading.split(/[()（）/]/).map(value => value.trim()).filter(Boolean)
    return terms.some(term => termInSource(term, article.source))
  })
  return { schema_version: 1, entries }
}
export function validateSupplementalSnapshot(bundle, documents) {
  if (bundle?.schema_version !== 1 || !Array.isArray(bundle.entries) || !bundle.entries.length || bundle.entries.length > 14) return ['補助資料の形式が不正です']
  const errors = [], seen = new Set()
  if (bundle.entries.reduce((sum, entry) => sum + (entry?.excerpt?.length ?? 0), 0) > 6500) errors.push('補助資料が長すぎます')
  for (const entry of bundle.entries) {
    if (entry?.document_path !== 'GLOSSARY.md') {
      try { assertSafeArticlePath(entry?.document_path) } catch { errors.push('補助資料のパスが不正です'); continue }
    }
    const identity = `${entry.document_path}#${entry.heading}`
    if (seen.has(identity) || typeof entry.excerpt !== 'string' || !entry.excerpt || entry.excerpt.length > 1800 || sha256(entry.excerpt) !== entry.excerpt_sha256) { errors.push('補助資料の抜粋・ハッシュが不正です'); continue }
    seen.add(identity)
    try {
      const source = documents instanceof Map ? documents.get(entry.document_path) : documents[entry.document_path]
      if (typeof source !== 'string') throw new Error('Missing source')
      if (entry.document_path.startsWith('docs/')) {
        const status = parseFrontMatter(toLines(source))?.fields.find(field => field.key === 'status')?.value
        if (unquote(status ?? '') !== 'published') { errors.push(`補助資料が非公開です: ${entry.document_path}`); continue }
      }
      const matches = supplementalBlocks(source).filter(block => block.heading === entry.heading)
      if (matches.length !== 1 || matches[0].excerpt !== entry.excerpt) errors.push(`補助資料が変更されています: ${identity}`)
    } catch { errors.push(`補助資料を確認できません: ${entry.document_path}`) }
  }
  return errors
}
export async function validateSupplementalMaterial(bundle, repoRoot, { readDocument = documentPath => readFile(path.join(repoRoot, documentPath), 'utf8') } = {}) {
  const documents = new Map()
  for (const entry of Array.isArray(bundle?.entries) ? bundle.entries : []) {
    if (entry?.document_path !== 'GLOSSARY.md') {
      try { assertSafeArticlePath(entry?.document_path) } catch { continue }
    }
    if (documents.has(entry.document_path)) continue
    try { documents.set(entry.document_path, await readDocument(entry.document_path)) } catch { documents.set(entry.document_path, null) }
  }
  return validateSupplementalSnapshot(bundle, documents)
}
export const supplementalDigest = bundle => bundle?.entries?.length ? sha256(JSON.stringify(bundle)) : null
export const productionDigest = (base, supplemental) => supplemental ? sha256(JSON.stringify({ base, supplemental_digest: supplemental })) : base
export class PrerequisiteError extends Error { constructor(message) { super(message); this.name = 'PrerequisiteError' } }
export function validateScript(script, sections) {
  const problems = []
  if (!script || !Array.isArray(script.chapters) || script.chapters.length < 2) return ['台本には導入とまとめを含む複数の章が必要です']
  if (JSON.stringify(script).includes('\uFFFD')) problems.push('台本に文字化けを示す置換文字があります')
  const ids = new Set(), covered = new Set(), roles = new Set()
  let total = 0
  for (const chapter of script.chapters) {
    if (!/^[a-z0-9-]+$/.test(chapter.id ?? '') || ids.has(chapter.id)) problems.push('章 ID が不正または重複しています')
    ids.add(chapter.id)
    if (!chapter.title?.trim()) problems.push('章タイトルがありません')
    if (!Array.isArray(chapter.source_sections)) problems.push('元記事との対応がありません')
    for (const id of chapter.source_sections ?? []) {
      if (!sections.some(section => section.id === id)) problems.push(`存在しない参照: ${id}`)
      covered.add(id)
    }
    if (!Array.isArray(chapter.turns) || chapter.turns.length < 2) { problems.push('各章に対話が必要です'); continue }
    let previous = null
    for (const turn of chapter.turns) {
      if (!['listener', 'explainer'].includes(turn.role)) problems.push('話者の役割が不正です')
      if (typeof turn.text !== 'string' || !turn.text.trim() || turn.text.length > 6000) problems.push('発話が空または長すぎます')
      if (/https?:\/\/|```|<\/?(?:script|audio|iframe)/i.test(turn.text ?? '')) problems.push('読み上げに不要な URL・コードブロック・HTML があります')
      if (previous === turn.text) problems.push('同一発話が連続しています')
      previous = turn.text; roles.add(turn.role); total += turn.text?.length ?? 0
    }
  }
  if (total < 300) problems.push('記事の詳細を扱う台本として短すぎます')
  if (total > 180000) problems.push('一記事の台本が上限を超えています')
  if (roles.size !== 2) problems.push('二人の話者が必要です')
  for (const section of sections) if (!covered.has(section.id)) problems.push(`元記事の節が未対応です: ${section.id} ${section.title}`)
  return problems
}
export function splitSpeech(text, maxChars = 180) {
  if (!Number.isInteger(maxChars) || maxChars < 20 || maxChars > 500) throw new Error('max_chunk_chars must be 20..500')
  const chunks = []
  let remaining = text.trim()
  while (remaining.length > maxChars) {
    const prefix = remaining.slice(0, maxChars)
    const boundary = Math.max(prefix.lastIndexOf('。'), prefix.lastIndexOf('！'), prefix.lastIndexOf('？'), prefix.lastIndexOf('、'), prefix.lastIndexOf(' '))
    const cut = boundary >= maxChars / 3 ? boundary + 1 : maxChars
    chunks.push(remaining.slice(0, cut).trim()); remaining = remaining.slice(cut).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}
