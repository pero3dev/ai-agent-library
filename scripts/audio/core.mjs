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
export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
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
