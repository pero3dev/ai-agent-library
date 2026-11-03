import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import { publicUrl } from './page-metadata.mjs'
import { markdownRoute } from './library-links.mjs'
import { readmeArticleOrder } from './markdown-routes.mjs'
import type { Nodes, Root } from 'mdast'
import type { GlossaryEntry, Section } from './content-types.ts'

type Environment = Readonly<Record<string, string | undefined>>
export interface LibraryArticleSource {
  source_path: string; route: string; chapter: string; title: string; description: string
  tags: string[]; last_updated: string | null; status: string | null; markdown: string
}
export interface LibraryExportInput {
  articles: LibraryArticleSource[]; sections: Section[]; readmes: ReadonlyMap<string, string>; glossary: GlossaryEntry[]
}
export interface LibraryHeading { depth: number; text: string }
export interface LibraryChecklistItem { text: string; checked: boolean }
export interface LibraryArticle {
  slug: string; title: string; chapter: string; description: string; tags: string[]
  last_updated: string | null; status: 'published'; url: string; md_url: string; source_path: string
  headings: LibraryHeading[]; checklist: LibraryChecklistItem[]
}
export interface LibraryIndex {
  schema_version: 1
  license: { text: 'CC-BY-4.0'; code: 'MIT'; attribution: string; url: string }
  articles: LibraryArticle[]
  glossary: { term: string; english: string | null; definition: string; url: string }[]
}

export const LLMS_MAX_BYTES = { root: 16 * 1024, chapter: 48 * 1024 } as const
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const indexSchema: unknown = JSON.parse(readFileSync(new URL('./library-index.schema.json', import.meta.url), 'utf8'))
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const label = (value: string) => value.replace(/\s+/g, ' ').replace(/[\\[\]]/g, '\\$&').trim()
const line = (title: string, url: string, description: string) => `- [${label(title)}](${url}): ${label(description)}`

/** Validate the JSON Schema vocabulary used by the bundled, versioned data contract. */
export function assertLibraryIndex(value: unknown): asserts value is LibraryIndex {
  const check = (item: unknown, schema: unknown, location: string): void => {
    if (!record(schema)) throw new Error('library export: 不正な索引スキーマ')
    const fail = () => { throw new Error(`library export: 索引スキーマ違反 ${location}`) }
    if (typeof schema.$ref === 'string') {
      if (!schema.$ref.startsWith('#/')) throw new Error('library export: 外部スキーマ参照は未対応です')
      let resolved: unknown = indexSchema
      for (const key of schema.$ref.slice(2).split('/')) resolved = record(resolved) ? resolved[key] : undefined
      return check(item, resolved, location)
    }
    if ('const' in schema && item !== schema.const) fail()
    const types = typeof schema.type === 'string' ? [schema.type] : Array.isArray(schema.type) ? schema.type : []
    if (types.length && !types.some(type => type === 'null' ? item === null : type === 'array' ? Array.isArray(item)
      : type === 'object' ? record(item) : type === 'integer' ? typeof item === 'number' && Number.isInteger(item) : typeof item === type)) fail()
    if (record(item)) {
      if (Array.isArray(schema.required) && schema.required.some(key => typeof key !== 'string' || !(key in item))) fail()
      if (record(schema.properties)) for (const [key, child] of Object.entries(schema.properties)) if (key in item) check(item[key], child, `${location}.${key}`)
    }
    if (Array.isArray(item) && schema.items) item.forEach((child: unknown, index: number) => check(child, schema.items, `${location}[${index}]`))
    if (typeof item === 'string') {
      if (typeof schema.minLength === 'number' && [...item].length < schema.minLength) fail()
      if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(item)) fail()
      if (schema.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(item) || Number.isNaN(Date.parse(item)) || new Date(item).toISOString().slice(0, 10) !== item)) fail()
      if (schema.format === 'uri') { try { new URL(item) } catch { fail() } }
    }
    if (typeof item === 'number' && ((typeof schema.minimum === 'number' && item < schema.minimum) || (typeof schema.maximum === 'number' && item > schema.maximum))) fail()
  }
  check(value, indexSchema, '$')
}

/** Read AST nodes, so headings and checkboxes inside code fences never enter the index. */
function plain(node: Nodes): string {
  if (node.type === 'image' || node.type === 'imageReference') return node.alt || ''
  if ('value' in node) return node.value
  if ('children' in node) return node.children.map(plain).join('')
  return ''
}

export function articleStructure(tree: Root) {
  const headings: LibraryHeading[] = []
  const checklist: LibraryChecklistItem[] = []
  let checklistDepth: number | undefined
  const collectList = (node: Nodes) => {
    if (node.type === 'listItem' && typeof node.checked === 'boolean') {
      const text = node.children.filter(child => child.type !== 'list').map(plain).join(' ').replace(/\s+/g, ' ').trim()
      checklist.push({ text, checked: node.checked })
    }
    if ('children' in node) for (const child of node.children) collectList(child)
  }
  for (const node of tree.children) {
    if (node.type === 'heading') {
      const text = plain(node).replace(/\s+/g, ' ').trim()
      headings.push({ depth: node.depth, text })
      if (checklistDepth !== undefined && node.depth <= checklistDepth) checklistDepth = undefined
      if (text === 'チェックリスト') checklistDepth = node.depth
    } else if (checklistDepth !== undefined) collectList(node)
  }
  return { headings, checklist }
}

/** Pure, ordered generation shared by sync and tests. No clock or build-path data is emitted. */
export function buildLibraryExport(input: LibraryExportInput, env: Environment = process.env) {
  const files = new Map<string, string>()
  const eligible = input.articles.filter(article => article.status === 'published'
    && /^docs\/\d\d-[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(article.source_path)
    && !/\/readme\.md$/i.test(article.source_path))
  const sources: LibraryArticleSource[] = []
  const seen = new Set<string>()
  for (const section of input.sections) {
    const chapter = eligible.filter(article => article.chapter === section.slug)
    const order = readmeArticleOrder(parser.parse(input.readmes.get(section.slug) || ''))
    const bySlug = new Map(chapter.map(article => [article.route.split('/').at(-1)!, article]))
    if (chapter.some(article => !order.includes(article.route.split('/').at(-1)!))) throw new Error(`library export: ${section.slug} にREADME収録表のないpublished記事があります`)
    for (const slug of order) {
      const article = bySlug.get(slug)
      if (!article) continue
      if (seen.has(article.route) || !new RegExp(`^/docs/${section.slug}/[a-z0-9]+(?:-[a-z0-9]+)*$`).test(article.route)) throw new Error(`library export: 記事ルートが不正または重複: ${article.route}`)
      seen.add(article.route)
      sources.push(article)
    }
  }
  if (sources.length !== eligible.length) throw new Error('library export: 章のないpublished記事、または重複した記事があります')

  const articles: LibraryArticle[] = sources.map(article => {
    const mdRoute = markdownRoute(article.route)
    files.set(mdRoute.slice(1), article.markdown.replace(/\r\n/g, '\n'))
    return { slug: article.route.slice('/docs/'.length), title: article.title, chapter: article.chapter,
      description: article.description, tags: [...article.tags], last_updated: article.last_updated, status: 'published',
      url: publicUrl(article.route, env), md_url: publicUrl(mdRoute, env), source_path: article.source_path,
      ...articleStructure(parser.parse(article.markdown)) }
  })
  const glossary = input.glossary.map(entry => ({ term: entry.name, english: entry.english, definition: entry.summary,
    url: publicUrl(entry.href && seen.has(entry.href) ? entry.href : '/glossary', env) }))
  const index: LibraryIndex = { schema_version: 1,
    license: { text: 'CC-BY-4.0', code: 'MIT', attribution: 'AI Agent Library contributors', url: 'https://github.com/pero3dev/ai-agent-library/blob/main/LICENSE' },
    articles, glossary }
  assertLibraryIndex(index)
  const quote = '> 日本語話者のソフトウェアエンジニア向けAI Agent学習ライブラリ。本文はCC BY 4.0、コードはMIT。必要な記事のMarkdown版を選んで参照してください。'
  const firstRoutes = ['/docs/overview/learning-roadmap', '/docs/concepts/what-is-an-ai-agent', '/docs/concepts/agent-loop']
  const starters = firstRoutes.map(route => articles.find(article => article.url === publicUrl(route, env))).filter((article): article is LibraryArticle => Boolean(article))
  const root = ['# AI Agent Library', '', quote, '', '## まず読む記事', '',
    ...starters.map(article => line(article.title, article.md_url, article.description)), '', '## 章ごとの索引', '']
  for (const section of input.sections) {
    const chapter = articles.filter(article => article.chapter === section.slug)
    const route = `${section.route}/llms.txt`
    root.push(line(section.title, publicUrl(route, env), section.description))
    files.set(route.slice(1), [`# AI Agent Library — ${label(section.title)}`, '', quote, '', '## 記事', '',
      ...chapter.map(article => line(article.title, article.md_url, article.description)), ''].join('\n'))
  }
  root.push('', '## Optional', '', line('用語集', publicUrl('/glossary.md', env), '用語の定義と詳しい解説記事へのリンク'),
    line('機械可読な索引', publicUrl('/library-index.json', env), '記事・見出し・チェックリスト・用語・ライセンス。schema_version: 1'),
    line('索引JSONのスキーマ', publicUrl('/library-index.schema.json', env), 'schema_version 1のJSON Schema'), '')
  files.set('llms.txt', root.join('\n'))
  files.set('glossary.md', ['# AI Agent Library — 用語集', '', '> 本文はCC BY 4.0、コードはMIT。', '',
    ...glossary.flatMap(entry => [`## ${label(entry.term)}${entry.english ? ` (${label(entry.english)})` : ''}`, '',
      label(entry.definition), '', `[詳しい解説](${entry.url})`, ''])].join('\n'))
  files.set('library-index.json', json(index))
  for (const [name, text] of files) {
    if (!name.endsWith('llms.txt')) continue
    const limit = name === 'llms.txt' ? LLMS_MAX_BYTES.root : LLMS_MAX_BYTES.chapter
    if (Buffer.byteLength(text) > limit) throw new Error(`library export: ${name} がサイズ上限 ${limit} bytesを超えました`)
  }
  return { index, files }
}

export async function writeLibraryExport(directory: string, input: LibraryExportInput, env: Environment = process.env) {
  const { index, files } = buildLibraryExport(input, env)
  const schema = await readFile(new URL('./library-index.schema.json', import.meta.url), 'utf8')
  files.set('library-index.schema.json', schema)
  await mkdir(directory, { recursive: true })
  for (const entry of await readdir(directory)) await rm(path.join(directory, entry), { recursive: true, force: true })
  for (const [name, text] of files) {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true })
    await writeFile(path.join(directory, name), text, 'utf8')
  }
  return index
}

/** Copy only generated public artifacts; link validation is repeated against actual out/ files. */
export async function materializeLibraryExport(directory: string, output: string, env: Environment = process.env) {
  const index: unknown = JSON.parse(await readFile(path.join(directory, 'library-index.json'), 'utf8'))
  assertLibraryIndex(index)
  let previous: unknown
  try { previous = JSON.parse(await readFile(path.join(output, 'library-index.json'), 'utf8')) }
  catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error }
  if (previous !== undefined) {
    assertLibraryIndex(previous)
    for (const article of previous.articles) {
      if (!index.articles.some(current => current.slug === article.slug)) await rm(path.join(output, 'docs', `${article.slug}.md`), { force: true })
      if (!index.articles.some(current => current.chapter === article.chapter)) await rm(path.join(output, 'docs', article.chapter, 'llms.txt'), { force: true })
    }
  }
  await cp(directory, output, { recursive: true, force: true })
  const generated = await readdir(directory, { recursive: true, withFileTypes: true })
  const base = new URL(publicUrl('/', env))
  const targetFor = (url: string) => {
    const target = new URL(url)
    if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) throw new Error(`library export: 公開外リンク: ${url}`)
    const relative = target.pathname.slice(base.pathname.length)
    if (!relative || relative.split('/').some(segment => segment === '..')) throw new Error(`library export: 不正な公開パス: ${url}`)
    return path.join(output, relative)
  }
  for (const article of index.articles) await readFile(targetFor(article.md_url))
  for (const entry of generated.filter(entry => entry.isFile() && entry.name === 'llms.txt')) {
    const text = await readFile(path.join(entry.parentPath, entry.name), 'utf8')
    const tree = parser.parse(text)
    const verify = async (node: Nodes): Promise<void> => {
      if (node.type === 'link') await readFile(targetFor(node.url))
      if ('children' in node) for (const child of node.children) await verify(child)
    }
    await verify(tree)
  }
  return generated.filter(entry => entry.isFile()).length
}
