import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { wrapRegisteredDiagrams } from '../../lib/diagram-decoration.mjs'
import { applyDecorations } from '../../lib/doc-decorations.mjs'
import { assertDiagramSource, diagramRegistry, diagramSourceDigest, validateDiagramRegistry } from '../../lib/diagram-registry.mjs'
import { getDiagramCoverage } from '../../lib/diagram-coverage.mjs'
import { rewriteMarkdownRoutes } from '../../lib/markdown-routes.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const sources = new Map(diagramRegistry.diagrams.map(entry => [entry.id, readFileSync(new URL('../../../' + entry.article, import.meta.url), 'utf8')]))
const reviewed = () => {
  const registry = structuredClone(diagramRegistry)
  for (const entry of registry.diagrams) { entry.reviewedDigest = entry.sourceDigest; entry.status = 'reviewed' }
  return registry
}
const walk = (node, match, result = []) => {
  if (match(node)) result.push(node)
  for (const child of node.children ?? []) walk(child, match, result)
  return result
}
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node => {
  const result = { type: node.type }
  for (const key of ['value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'align', 'identifier', 'label']) {
    if (node[key] !== undefined) result[key] = node[key]
  }
  return result
})

for (const id of ['agent-loop', 'workflow-comparison']) {
  test(`${id}: original content and structure survive wrapping and MDX round trip`, () => {
    const registry = reviewed(), entry = registry.diagrams.find(item => item.id === id)
    const tree = parser.parse(sources.get(id)), before = facts(tree)
    wrapRegisteredDiagrams(tree, entry.route, registry)
    assert.deepEqual(facts(tree), before)
    const figure = walk(tree, node => node.name === 'ReadingWalkthrough')
    assert.equal(figure.length, 1)
    assert.deepEqual(figure[0].attributes, [{ type: 'mdxJsxAttribute', name: 'diagramId', value: id }])
    const steps = walk(figure[0], node => node.name === 'ReadingStep')
    assert.deepEqual(steps.map(node => node.attributes[0].value), ['0', '1', '2', '3', '4'])
    assert.ok(steps.every(node => node.children.length > 0))
    const mdx = writer.stringify(tree)
    assert.deepEqual(findUnsafeMdx(mdx), [])
    assert.deepEqual(facts(mdxParser.parse(mdx)), before)
    if (id === 'agent-loop') {
      const lists = walk(figure[0], node => node.type === 'list')
      assert.equal(lists.length, 1)
      assert.equal(lists[0].ordered, true)
      assert.equal(lists[0].start, 1)
      assert.equal(lists[0].children.length, 5)
      assert.ok(lists[0].children.every(item => item.children[0].name === 'ReadingStep'))
    } else {
      assert.deepEqual(steps.map(node => node.children[0].type), Array(5).fill('heading'))
      assert.equal(walk(figure[0], node => node.type === 'code' && node.lang === 'mermaid').length, 1)
      assert.equal(walk(figure[0], node => node.type === 'table').length, 1)
    }
  })
}

test('each current source has the pinned normalized digest; line endings and unrelated edits do not change it', () => {
  for (const entry of diagramRegistry.diagrams) {
    const source = sources.get(entry.id)
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(source.replace(/\r?\n/g, '\r\n')), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(source + '\n\n追加の対象外参考情報。\n'), entry), entry.sourceDigest)
  }
})

test('same-shape prose, formula, table and Mermaid edits fail closed', () => {
  const registry = reviewed()
  const changes = [
    ['self-attention', '重みの合計が 1', '重みの合計が 2'],
    ['self-attention', 'Q = X W^Q', 'Q = X W^K'],
    ['agent-loop', '次の 5 段階', '次の 6 段階'],
    ['workflow-comparison', '高い(実行経路が固定)', '低い(実行経路が固定)'],
    ['workflow-comparison', 'Q1 -- "できない"', 'Q1 -- "できる"']
  ]
  for (const [id, from, to] of changes) {
    assert.ok(sources.get(id).includes(from))
    const changed = parser.parse(sources.get(id).replace(from, to))
    const entry = registry.diagrams.find(item => item.id === id)
    assert.throws(() => wrapRegisteredDiagrams(changed, entry.route, registry), /本文版とレビュー版/)
  }
})

test('missing or duplicate source headings and changed order are rejected', () => {
  const registry = reviewed(), entry = registry.diagrams.find(item => item.id === 'workflow-comparison')
  const source = sources.get(entry.id)
  for (const changed of [
    source.replace('### 詳細: 判断フロー', '### 別の見出し'),
    source.replace('### 詳細: 判断フロー', '### 詳細: 判断フロー\n\n重複。\n\n### 詳細: 判断フロー')
  ]) assert.throws(() => wrapRegisteredDiagrams(parser.parse(changed), entry.route, registry), /動的図/)
  const reordered = structuredClone(entry)
  ;[reordered.sourceHeadings[1], reordered.sourceHeadings[2]] = [reordered.sourceHeadings[2], reordered.sourceHeadings[1]]
  assert.throws(() => diagramSourceDigest(parser.parse(source), reordered), /順序・連続性/)
})

test('enabled diagrams require the exact reviewed digest and reviewed state', () => {
  for (const entry of diagramRegistry.diagrams) {
    const tree = parser.parse(sources.get(entry.id))
    const pending = { ...entry, reviewedDigest: null, status: 'implemented' }
    assert.throws(() => assertDiagramSource(tree, pending), /レビュー版/)
    assert.throws(() => assertDiagramSource(tree, { ...pending, reviewedDigest: entry.sourceDigest }), /レビュー版/)
    assert.throws(() => assertDiagramSource(tree, { ...pending, status: 'reviewed', reviewedDigest: 'sha256:' + '0'.repeat(64) }), /レビュー版/)
  }
})

test('disabled diagrams preserve original source even when stale; other routes are untouched', () => {
  const registry = reviewed()
  for (const entry of registry.diagrams) entry.enabled = false
  for (const entry of registry.diagrams) {
    const tree = parser.parse(sources.get(entry.id).replace(entry.headings[0], '更新された見出し'))
    const original = structuredClone(tree)
    wrapRegisteredDiagrams(tree, entry.route, registry)
    assert.deepEqual(tree, original)
    assert.equal(walk(tree, node => /Walkthrough|Step/.test(node.name ?? '')).length, 0)
  }
  const tree = parser.parse(sources.get('agent-loop')), original = structuredClone(tree)
  wrapRegisteredDiagrams(tree, '/docs/concepts/agent-loop-extra', reviewed())
  assert.deepEqual(tree, original)
})

test('reference definitions outside the source section are included in its digest', () => {
  const entry = reviewed().diagrams.find(item => item.id === 'agent-loop')
  const source = sources.get(entry.id).replace('次の 5 段階', '[次の 5 段階][stages]') + '\n[stages]: https://example.test/one\n'
  const digest = diagramSourceDigest(parser.parse(source), entry)
  assert.notEqual(diagramSourceDigest(parser.parse(source.replace('https://example.test/one', 'https://example.test/two')), entry), digest)
})

test('semantic dependencies outside the wrapped loop list invalidate its diagram without extending the layout', () => {
  const registry = reviewed(), entry = registry.diagrams.find(item => item.id === 'agent-loop')
  assert.equal(entry.headings.length, 1)
  assert.equal(entry.sourceHeadings.length, 4)
  for (const [from, to] of [
    ['不完全なツール要求は実行しない', '不完全なツール要求も実行する'],
    ['エラーメッセージは**モデルへの観測データ**', 'エラーメッセージは**モデルに返さないデータ**'],
    ['履歴にはモデルの応答とツール結果が追記され続けます', '履歴にはモデルの応答だけが追記され続けます']
  ]) {
    const source = sources.get(entry.id)
    assert.ok(source.includes(from))
    assert.throws(() => wrapRegisteredDiagrams(parser.parse(source.replace(from, to)), entry.route, registry), /本文版とレビュー版/)
  }
  const tree = parser.parse(sources.get(entry.id))
  wrapRegisteredDiagrams(tree, entry.route, registry)
  const figure = walk(tree, node => node.name === 'ReadingWalkthrough')[0]
  assert.equal(walk(figure, node => node.type === 'table').length, 0)
  assert.equal(walk(figure, node => node.type === 'heading').length, 0)
})

test('nonconsecutive semantic sections can be hashed, but must remain unique and ordered', () => {
  const entry = reviewed().diagrams.find(item => item.id === 'agent-loop')
  const source = sources.get(entry.id).replace('### ' + entry.sourceHeadings[2], '### 対象外の補足\n\n補足。\n\n### ' + entry.sourceHeadings[2])
  // Inserting a separate, unrelated H3 leaves the original selected nodes intact.
  assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
  const duplicate = source.replace('### ' + entry.sourceHeadings[2], '### ' + entry.sourceHeadings[2] + '\n\n重複。\n\n### ' + entry.sourceHeadings[2])
  assert.throws(() => diagramSourceDigest(parser.parse(duplicate), entry), /一意/)
})

test('registered IDs, bindings and keys reject module paths and false completion claims', () => {
  for (const edit of [
    entry => { entry.module = './arbitrary.mjs' },
    entry => { entry.binding = '../binding' },
    entry => { entry.id = 'constructor' },
    entry => { entry.article = '../outside.md' },
    entry => { entry.route += '-other' },
    entry => { entry.stageCount = 500 },
    entry => { entry.status = 'published' },
    entry => { entry.articleCoverage = 'complete' },
    entry => { entry.sourceHeadings = [] }
  ]) {
    const registry = reviewed(); edit(registry.diagrams[0])
    assert.throws(() => validateDiagramRegistry(registry), /registry/)
  }
  const duplicate = reviewed(); duplicate.diagrams.push(duplicate.diagrams[0])
  assert.throws(() => validateDiagramRegistry(duplicate), /registry/)
})

test('decoration before route rewriting preserves working links inside reading sections', () => {
  const registry = reviewed(), entry = registry.diagrams.find(item => item.id === 'workflow-comparison')
  const tree = parser.parse(sources.get(entry.id))
  applyDecorations(tree, { route: entry.route, registry, glossary: [{ name: '予測可能性', href: '/docs/other', summary: '性質' }] })
  const routeMap = new Map(walk(tree, node => node.type === 'link' && node.url.endsWith('.md')).map(node => {
    const resolved = new URL(node.url, 'https://example.test/' + entry.article).pathname.slice(1)
    return [resolved, '/docs/target']
  }))
  assert.deepEqual(rewriteMarkdownRoutes(tree, entry.article, routeMap), [])
  const mdx = writer.stringify(tree)
  assert.match(mdx, /GlossaryTerm/)
  assert.match(mdx, /\]\(\/docs\/target\)/)
  assert.deepEqual(findUnsafeMdx(mdx), [])
})

test('coverage counts the current docs collection and distinguishes section work from article completion', () => {
  const registry = reviewed()
  const report = getDiagramCoverage({ registry })
  assert.equal(report.summary.publishedArticles, report.articles.filter(article => article.status === 'published').length)
  assert.equal(report.summary.registeredArticles, new Set(registry.diagrams.map(entry => entry.article)).size)
  assert.equal(report.summary.reviewedBindings, registry.diagrams.filter(entry => entry.enabled).length)
  assert.equal(report.summary.completeArticles, report.articles.filter(article => article.status === 'published' && article.complete).length)
  assert.ok(report.summary.unregisteredArticles > 0)
  assert.ok(report.articles.filter(article => !article.acceptance.tracked).every(article => !article.complete))
  assert.equal(new Set(report.articles.map(article => article.article)).size, report.articles.length)
  assert.equal(report.summary.publication, 'not-verified-by-this-report')
})
