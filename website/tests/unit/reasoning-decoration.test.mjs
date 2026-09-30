import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { assertDiagramPageMetadata, planRegisteredDiagrams, wrapRegisteredDiagrams } from '../../lib/diagram-decoration.mjs'
import { diagramRegistry, diagramSourceDigest, selectDiagramSections, validateDiagramRegistry } from '../../lib/diagram-registry.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const article = 'docs/10-llm-foundations/reasoning-models.md'
const route = '/docs/llm-foundations/reasoning-models'
const source = readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8')
// Independently fixed from the approved source AST, never derived from bindings.
const cases = [
  { id: 'reasoning-sequence', range: [12, 16], stages: 4, readNodes: [[0, [12, 13]], [2, [14]], [3, [15]]] },
  { id: 'reasoning-evaluation', range: [16, 32], stages: 5, readNodes: [[0, [16, 17, 18, 19]], [1, [20, 21, 22]], [2, [23, 24, 25]], [3, [26, 27, 28]], [4, [29, 30, 31]]] }
]
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = parser().use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const entryFor = (registry, id) => registry.diagrams.find(item => item.id === id)
const walk = (node, match) => [ ...(match(node) ? [node] : []), ...(node.children ?? []).flatMap(child => walk(child, match)) ]
const unwrap = node => {
  const children = node.children?.flatMap(unwrap)
  return ['ReasoningWalkthrough', 'ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? { children } : {}) }]
}
const text = node => node.value ?? (node.children ?? []).map(text).join('')
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('reasoning keeps all source AST nodes and binds eight READ stops without requiring manual stage one', () => {
  assert.equal(createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex'), '71246ca014e171936139af9083df301f16dcb7dade8f7aeb3a0b14516a19ef44')
  const tree = parser.parse(source), original = structuredClone(tree), originalNodes = [...tree.children]
  assert.equal(tree.children.length, 43)
  const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
  assert.equal(headings.length, 9)
  assert.equal(tree.children.filter(node => node.type === 'table').length, 2)
  assert.equal(tree.children.filter(node => node.type === 'list').length, 11)
  assert.equal(tree.children.filter(node => node.type === 'blockquote').length, 1)
  assert.equal(walk(tree, node => ['math', 'inlineMath', 'code'].includes(node.type)).length, 0)
  assert.deepEqual(planRegisteredDiagrams(tree, route).map(({ id, start, end }) => [id, start, end]), cases.map(item => [item.id, ...item.range]))
  const metadata = wrapRegisteredDiagrams(tree, route)
  const figures = walk(tree, node => node.name === 'ReasoningWalkthrough')
  assert.equal(figures.length, 2)
  let wrappedHeadings = 0, wrappedBodies = 0
  figures.forEach((figure, i) => {
    assert.equal(figure.attributes[0].value, cases[i].id)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), cases[i].readNodes.map(([step]) => step))
    figure.children.forEach((step, j) => {
      assert.equal(step.name, 'ReadingStep')
      const expected = cases[i].readNodes[j][1].map(index => originalNodes[index])
      assert.equal(step.children.length, expected.length)
      step.children.forEach((node, k) => {
        assert.equal(node, expected[k])
        if (node.type === 'heading') { wrappedHeadings++; assert.equal(k, 0) } else wrappedBodies++
      })
    })
    const actual = figure.children.flatMap(step => step.children)
    assert.equal(new Set(actual).size, actual.length)
  })
  assert.equal(wrappedHeadings, 6); assert.equal(wrappedBodies, 14)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(tree.children.filter(node => node.type === 'heading' && node.depth === 3).map(text), headings.filter(node => !originalNodes.slice(12, 32).includes(node)).map(text))
  const mdx = writer.stringify(tree), restored = mdxParser.parse(mdx)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(facts(restored), facts(original))
  assert.deepEqual(assertDiagramPageMetadata(restored, metadata), metadata)
  for (const ids of [[], [...metadata.diagramIds].reverse(), [...metadata.diagramIds, cases[0].id], metadata.diagramIds.slice(1)]) {
    assert.throws(() => assertDiagramPageMetadata(restored, { firstDiagramId: ids[0] ?? null, diagramIds: ids }), /最終 MDX/)
  }
})

test('all four reasoning subsets preserve source order and completely restore the source AST', () => {
  for (let mask = 0; mask < 4; mask++) {
    const registry = structuredClone(diagramRegistry), tree = parser.parse(source), original = structuredClone(tree)
    cases.forEach((item, i) => { entryFor(registry, item.id).enabled = Boolean(mask & (1 << i)) })
    registry.diagrams.reverse()
    const ids = cases.filter((_, i) => mask & (1 << i)).map(item => item.id)
    const metadata = { firstDiagramId: ids[0] ?? null, diagramIds: ids }
    assert.deepEqual(wrapRegisteredDiagrams(tree, route, registry), metadata)
    assert.deepEqual(unwrap(tree), [original])
    assert.deepEqual(walk(tree, node => node.name === 'ReasoningWalkthrough').map(node => node.attributes[0].value), ids)
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), metadata), metadata)
    const other = parser.parse(source), before = structuredClone(other)
    assert.deepEqual(wrapRegisteredDiagrams(other, route + '-other', registry), { firstDiagramId: null, diagramIds: [] })
    assert.deepEqual(other, before)
  }
})

test('reasoning bindings fail closed on stale reviews, structural changes and missing or duplicated headings', () => {
  for (const { id } of cases) {
    const registry = structuredClone(diagramRegistry), entry = entryFor(registry, id)
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
    for (const mutate of [e => e.stageCount++, e => e.headings.push('チェックリスト'), e => e.sourceHeadings[0] += ' 変更', e => e.blockGroups[0][0].stage++, e => e.blockGroups[0][0].count++, e => e.module = './untrusted']) {
      const candidate = structuredClone(registry); mutate(entryFor(candidate, id))
      assert.throws(() => validateDiagramRegistry(candidate), /registry/)
    }
    entry.reviewedDigest = 'sha256:' + '0'.repeat(64)
    assert.throws(() => wrapRegisteredDiagrams(parser.parse(source), route, registry), /registry/)
    const tree = parser.parse(source)
    selectDiagramSections(tree, entry)[0].body[0].type = 'blockquote'
    for (const item of cases) {
      const peer = entryFor(registry, item.id)
      peer.reviewedDigest = peer.sourceDigest = diagramSourceDigest(tree, peer)
    }
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文ブロック構成/)
    assert.deepEqual(tree, before)
  }
  for (const mutate of [(tree, s) => tree.children.splice(s.start, 1), (tree, s) => tree.children.splice(s.start, 0, structuredClone(s.heading)), (_tree, s) => s.heading.children[0].value += ' 変更']) {
    const tree = parser.parse(source), registry = structuredClone(diagramRegistry)
    mutate(tree, selectDiagramSections(tree, entryFor(registry, cases[1].id))[0])
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /見出し|本文版とレビュー版/)
    assert.deepEqual(tree, before)
  }
})

test('reasoning digests follow semantic dependencies beyond the wrapped section', () => {
  const influences = [
    ['概要: 分担と「考える時間」の正体', []],
    ['仕組みの直感: 答える前に考えを書く', [0, 1]],
    ['効くタスクと効かないタスク', [1]],
    ['思考量の制御とコスト・レイテンシ設計', [0, 1]],
    ['考えすぎ(overthinking)', [1]],
    ['プロンプトの変化: 必須手順と探索の余地を分ける', [0, 1]],
    ['評価の注意: 思考は見えず、揺れる', [0, 1]],
    ['アンチパターン', []], ['チェックリスト', []]
  ]
  for (const [heading, affected] of influences) {
    const tree = parser.parse(source), registry = structuredClone(diagramRegistry)
    const at = tree.children.findIndex(node => node.type === 'heading' && text(node) === heading)
    assert.ok(at >= 0)
    const node = walk(tree.children[at + 1], item => item.type === 'text')[0]
    assert.ok(node); node.value += ' 変更の検出'
    for (const [i, item] of cases.entries()) {
      const entry = entryFor(registry, item.id)
      assert.equal(diagramSourceDigest(tree, entry) !== entry.sourceDigest, affected.includes(i), `${heading}: ${item.id}`)
    }
    if (affected.length) {
      const before = structuredClone(tree)
      assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文版とレビュー版/)
      assert.deepEqual(tree, before)
    }
  }
})
