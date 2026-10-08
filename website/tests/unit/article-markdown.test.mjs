import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import { articleMarkdown } from '../../lib/article-markdown.mjs'
import { copyFileForRoute, readArticleMarkdown } from '../../lib/article-copy.mjs'
import { rewriteMarkdownRoutes } from '../../lib/markdown-routes.mjs'
import { applyDecorations } from '../../lib/doc-decorations.mjs'
import { replaceMermaid } from '../../lib/static-mermaid.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const env = { STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_URL: 'https://example.org/library/', NEXT_PUBLIC_BASE_PATH: '/library' }
const nodes = (tree, type) => (tree.type === type ? [tree] : []).concat((tree.children ?? []).flatMap(child => nodes(child, type)))

test('copy Markdown preserves diagrams, math, checklists and definitions before site decorations', () => {
  const source = '---\ntitle: Test\n---\n\n# First\n\n[article](target.md?q=1#part) and [external](https://example.net/a) and [here](#part).\n\n[reference][ref]\n\n[ref]: target.md#part "Title"\n\n```mermaid\nflowchart LR\n  A[Start] --> B[End]\n```\n\n$\\alpha + x_1$\n\n$$\nx^2 + y^2\n$$\n\n### チェックリスト\n\n- [ ] pending\n- [x] done\n\n## Last\n\nLast paragraph.\n'
  const tree = parser.parse(source)
  assert.deepEqual(rewriteMarkdownRoutes(tree, 'docs/01-concepts/source.md', new Map([['docs/01-concepts/target.md', '/docs/concepts/target']])), [])
  const markdown = articleMarkdown(tree, '/docs/concepts/source', env)
  const copied = parser.parse(markdown)
  applyDecorations(tree, { route: '/docs/concepts/source', glossary: [] })
  replaceMermaid(tree, 'Test', new Map())
  assert.equal(nodes(tree, 'code').filter(node => node.lang === 'mermaid').length, 0)
  assert.equal(nodes(copied, 'code')[0].value, 'flowchart LR\n  A[Start] --> B[End]')
  assert.deepEqual(nodes(copied, 'heading').map(node => node.children[0].value), ['First', 'チェックリスト', 'Last'])
  assert.deepEqual(nodes(copied, 'listItem').map(node => node.checked), [false, true])
  assert.equal(nodes(copied, 'inlineMath')[0].value, '\\alpha + x_1')
  assert.equal(nodes(copied, 'math')[0].value, 'x^2 + y^2')
  assert.equal(nodes(copied, 'yaml')[0].value, 'title: Test')
  assert.equal(nodes(copied, 'definition')[0].url, 'https://example.org/library/docs/concepts/target#part')
  assert.deepEqual(nodes(copied, 'link').map(node => node.url), [
    'https://example.org/library/docs/concepts/target?q=1#part', 'https://example.net/a', 'https://example.org/library/docs/concepts/source#part'
  ])
  assert.doesNotMatch(markdown, /<(?:StaticMermaid|GlossaryTerm|PracticeSection|ChecklistBox)\b/)
  assert.match(markdown, /Last paragraph\.\n$/)
})

test('the real agent-loop source retains every Mermaid code block and Markdown heading', async () => {
  const source = parser.parse(await readFile(new URL('../../../docs/01-concepts/agent-loop.md', import.meta.url), 'utf8'))
  const markdown = articleMarkdown(source, '/docs/concepts/agent-loop', env)
  const copied = parser.parse(markdown)
  for (const type of ['heading', 'code', 'math', 'inlineMath', 'listItem']) {
    assert.deepEqual(nodes(copied, type).map(node => ({ value: node.value, lang: node.lang, checked: node.checked, depth: node.depth })), nodes(source, type).map(node => ({ value: node.value, lang: node.lang, checked: node.checked, depth: node.depth })))
  }
  assert.ok(nodes(copied, 'code').some(node => node.lang === 'mermaid'))
  assert.doesNotMatch(markdown, /<(?:StaticMermaid|GlossaryTerm|PracticeSection|ChecklistBox)\b/)
})

test('the server reads only a named route copy and rejects traversal and non-string data', async () => {
  assert.equal(copyFileForRoute('/docs'), 'index.json')
  assert.equal(copyFileForRoute('/docs/concepts/agent-loop'), 'concepts/agent-loop.json')
  for (const route of ['/docs/../secret', '/docs/%2e%2e/secret', '/docs//a', '/elsewhere']) assert.throws(() => copyFileForRoute(route), /Invalid article route/)
  const directory = await mkdtemp(path.join(tmpdir(), 'article-copy-'))
  try {
    await writeFile(path.join(directory, 'index.json'), JSON.stringify('# Only this page\n'))
    assert.equal(await readArticleMarkdown('/docs', directory), '# Only this page\n')
    await assert.rejects(() => readArticleMarkdown('/docs/missing', directory), /ENOENT/)
    await writeFile(path.join(directory, 'index.json'), '{}')
    await assert.rejects(() => readArticleMarkdown('/docs', directory), /Invalid article Markdown/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
