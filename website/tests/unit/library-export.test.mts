import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { articleStructure, assertLibraryIndex, buildLibraryExport, LLMS_MAX_BYTES, materializeLibraryExport, writeLibraryExport } from '../../lib/library-export.mts'
import { plainSummary } from '../../lib/page-metadata.mjs'
import { parseFrontMatter, parseTagsArray, toLines, unquote } from '../../../scripts/lib/md-utils.mjs'
import type { LibraryArticleSource, LibraryExportInput } from '../../lib/library-export.mts'
import type { Section } from '../../lib/content-types.ts'

const env = { STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_URL: 'https://example.org/library/', NEXT_PUBLIC_BASE_PATH: '/library' }
const section: Section = { slug: 'concepts', num: '01', title: '01. 基礎概念', description: 'Agentの基礎概念', route: '/docs/concepts', count: 2 }
const markdown = '# Sample\n\n## 使い方\n\n### チェックリスト\n\n- [ ] **未確認**を調べる\n- [x] [確認済み](https://example.org)\n  - [ ] 子項目\n\n```markdown\n# Fake heading\n- [ ] Fake checkbox\n```\n\n### 次の節\n\n- [ ] Other checkbox\n'
function article(slug: string, status = 'published'): LibraryArticleSource {
  return { source_path: `docs/01-concepts/${slug}.md`, route: `/docs/concepts/${slug}`, chapter: 'concepts',
    title: `記事 ${slug}`, description: `説明 ${slug}`, tags: ['Agent'], last_updated: '2026-11-04', status, markdown }
}
function fixture(): LibraryExportInput {
  return { articles: [article('first'), article('second'), article('hidden', 'draft'), article('missing', 'review'),
    { ...article('fixture'), source_path: 'tests/fixtures/fixture.md' }, { ...article('readme'), source_path: 'docs/01-concepts/README.md' }],
    sections: [section], readmes: new Map([['concepts', '| 記事 |\n| --- |\n| [second](second.md) |\n| [first](first.md) |\n| [hidden](hidden.md) |']]),
    glossary: [{ name: 'Agent', english: 'Agent', summary: '自律的に処理する主体。', href: '/docs/concepts/first' },
      { name: '非公開の用語', english: null, summary: '定義。', href: '/docs/concepts/hidden' }] }
}

test('library artifacts use published sources only, README ordering, absolute base-path URLs and schema version 1', () => {
  const { index, files } = buildLibraryExport(fixture(), env)
  assert.deepEqual(index.articles.map(item => item.slug), ['concepts/second', 'concepts/first'])
  assert.deepEqual(index.articles[0].headings, [{ depth: 1, text: 'Sample' }, { depth: 2, text: '使い方' }, { depth: 3, text: 'チェックリスト' }, { depth: 3, text: '次の節' }])
  assert.deepEqual(index.articles[0].checklist, [{ text: '未確認を調べる', checked: false }, { text: '確認済み', checked: true }, { text: '子項目', checked: false }])
  assert.equal(index.articles[0].md_url, 'https://example.org/library/docs/concepts/second.md')
  assert.equal(index.articles[0].url, 'https://example.org/library/docs/concepts/second')
  assert.equal(index.glossary[1].url, 'https://example.org/library/glossary')
  assert.deepEqual(index.license, { text: 'CC-BY-4.0', code: 'MIT', attribution: 'AI Agent Library contributors', url: 'https://github.com/pero3dev/ai-agent-library/blob/main/LICENSE' })
  assertLibraryIndex(JSON.parse(files.get('library-index.json')!))
  assert.ok(files.has('docs/concepts/second.md'))
  assert.ok(![...files.keys()].some(name => /hidden|missing|fixture|README/.test(name)))
  assert.match(files.get('docs/concepts/first.md')!, /```markdown\n# Fake heading/)
  assert.match(files.get('llms.txt')!, /> .*本文はCC BY 4.0、コードはMIT/)
  assert.deepEqual([...files.get('llms.txt')!.matchAll(/^## (.+)$/gm)].map(match => match[1]), ['まず読む記事', '章ごとの索引', 'Optional'])
  for (const [name, text] of files) if (name.endsWith('llms.txt')) {
    assert.equal([...text.matchAll(/^# /gm)].length, 1)
    for (const list of text.split('\n').filter(line => line.startsWith('- '))) assert.match(list, /^- \[[^\n]+\]\(https:\/\/example\.org\/library\/[^\s)]+\): .+$/)
    assert.ok(Buffer.byteLength(text) <= (name === 'llms.txt' ? LLMS_MAX_BYTES.root : LLMS_MAX_BYTES.chapter))
  }
})

test('schema validation rejects missing fields, bad dates, unsupported versions and malformed nested data', () => {
  const { index } = buildLibraryExport(fixture(), env)
  for (const invalid of [null, {}, { ...index, schema_version: 2 }, { ...index, license: { text: 'MIT' } },
    { ...index, articles: [{ ...index.articles[0], last_updated: '2026-02-30' }] },
    { ...index, articles: [{ ...index.articles[0], checklist: [{ text: 'test', checked: 'yes' }] }] },
    { ...index, articles: [{ ...index.articles[0], headings: [{ depth: 7, text: 'bad' }] }] }]) assert.throws(() => assertLibraryIndex(invalid), /スキーマ/)
  assert.doesNotThrow(() => assertLibraryIndex({ ...index, future_optional_field: 'compatible' }))
})

test('generation is byte-for-byte deterministic across input enumeration and has bounded llms files', () => {
  const input = fixture()
  const first = buildLibraryExport(input, env)
  assert.deepEqual([...buildLibraryExport({ ...input, articles: [...input.articles].reverse() }, env).files], [...first.files])
  assert.deepEqual([...buildLibraryExport(input, env).files], [...first.files])
  const tooLarge = fixture(); tooLarge.sections[0] = { ...section, description: '大'.repeat(LLMS_MAX_BYTES.root) }
  assert.throws(() => buildLibraryExport(tooLarge, env), /サイズ上限/)
  const hugeChapter = fixture(); hugeChapter.articles[0].description = '大'.repeat(LLMS_MAX_BYTES.chapter)
  assert.throws(() => buildLibraryExport(hugeChapter, env), /サイズ上限/)
  const unordered = fixture(); unordered.readmes = new Map()
  assert.throws(() => buildLibraryExport(unordered, env), /README収録表/)
})

test('AST extraction ignores fenced examples, checkboxes outside the checklist and handles nested lists', () => {
  const parser = unified().use(remarkParse).use(remarkGfm)
  assert.deepEqual(articleStructure(parser.parse(markdown)).checklist.map(item => item.text), ['未確認を調べる', '確認済み', '子項目'])
})

test('materialization verifies every llms link and article Markdown, and regeneration removes stale files', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'library-export-'))
  const generated = path.join(temporary, 'generated'), output = path.join(temporary, 'out')
  try {
    await writeLibraryExport(generated, fixture(), env)
    await mkdir(output)
    await writeFile(path.join(generated, 'stale.md'), '# obsolete')
    await writeLibraryExport(generated, fixture(), env)
    assert.ok(!(await readdir(generated)).includes('stale.md'))
    assert.equal(await materializeLibraryExport(generated, output, env), 7)
    const input = fixture(); input.articles = input.articles.filter(item => !item.route.endsWith('/second'))
    await writeLibraryExport(generated, input, env)
    await materializeLibraryExport(generated, output, env)
    await assert.rejects(() => readFile(path.join(output, 'docs/concepts/second.md')), /ENOENT/)
    await writeFile(path.join(generated, 'llms.txt'), '# Broken\n\n- [missing](https://example.org/library/missing.md): broken\n')
    await assert.rejects(() => materializeLibraryExport(generated, output, env), /ENOENT/)
    await writeFile(path.join(generated, 'llms.txt'), '# Broken\n\n- [external](https://other.example/missing.md): broken\n')
    await assert.rejects(() => materializeLibraryExport(generated, output, env), /公開外リンク/)
    await writeFile(path.join(generated, 'library-index.json'), '{"schema_version":2}')
    await assert.rejects(() => materializeLibraryExport(generated, output, env), /スキーマ/)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})

test('the complete published corpus fits the fixed llms budgets and exports all articles in chapter README order', async () => {
  const root = new URL('../../../docs/', import.meta.url)
  const sections: Section[] = [], articles: LibraryArticleSource[] = [], readmes = new Map<string, string>()
  for (const directory of (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const chapter = directory.name.slice(3)
    const readme = await readFile(new URL(`${directory.name}/README.md`, root), 'utf8')
    readmes.set(chapter, readme)
    sections.push({ slug: chapter, num: directory.name.slice(0, 2), title: directory.name, route: `/docs/${chapter}`, description: '章の説明', count: 0 })
    for (const filename of (await readdir(new URL(`${directory.name}/`, root))).filter(name => name.endsWith('.md') && name !== 'README.md')) {
      const source = (await readFile(new URL(`${directory.name}/${filename}`, root), 'utf8')).replace(/\r\n/g, '\n')
      const fm = parseFrontMatter(toLines(source))
      const field = (name: string) => { const found = fm?.fields.find(item => item.key === name); return found ? unquote(found.value) : null }
      const title = field('title')!
      articles.push({ source_path: `docs/${directory.name}/${filename}`, route: `/docs/${chapter}/${filename.slice(0, -3)}`, chapter,
        title, description: plainSummary(source, title), tags: parseTagsArray(field('tags') || '[]') || [], last_updated: field('last_updated'), status: field('status'), markdown: source })
    }
  }
  const result = buildLibraryExport({ articles, sections, readmes, glossary: [] }, env)
  assert.equal(result.index.articles.length, articles.filter(article => article.status === 'published').length)
  assert.ok(result.index.articles.length > 190)
  assert.ok(result.index.articles.every(article => article.checklist.length > 0))
  assert.equal(result.files.size, result.index.articles.length + sections.length + 3)
})
