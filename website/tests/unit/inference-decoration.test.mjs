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
import { assertDiagramPageMetadata, planRegisteredDiagrams, wrapRegisteredDiagrams } from '../../lib/diagram-decoration.mjs'
import { assertDiagramSource, diagramRegistry, diagramSourceDigest, selectDiagramSections, validateDiagramRegistry } from '../../lib/diagram-registry.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const article = 'docs/11-llm-internals/inference-internals.md'
const route = '/docs/llm-internals/inference-internals'
const source = readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8')
const cases = [
  { id: 'inference-sampling', stages: 7, range: [15, 23], bodies: 7, steps: [0, 1, 3, 6] },
  { id: 'inference-cache-batching', stages: 6, range: [23, 33], bodies: 8, steps: [1, 2, 3, 4, 5] },
  { id: 'inference-speculative', stages: 6, range: [33, 38], bodies: 4, steps: [0, 2, 4, 5] },
  { id: 'inference-quantization', stages: 4, range: [38, 42], bodies: 3, steps: [0, 2, 3] }
]
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = parser().use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const entryFor = (registry, id) => registry.diagrams.find(entry => entry.id === id)
const candidate = () => {
  const registry = structuredClone(diagramRegistry)
  for (const { id } of cases) Object.assign(entryFor(registry, id), {
    enabled: true, status: 'reviewed', reviewedDigest: entryFor(registry, id).sourceDigest
  })
  return registry
}
const walk = (node, match, output = []) => {
  if (match(node)) output.push(node)
  for (const child of node.children ?? []) walk(child, match, output)
  return output
}
const unwrap = node => {
  const children = node.children?.flatMap(unwrap)
  return ['InferenceWalkthrough', 'ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? { children } : {}) }]
}
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('inference keeps all 29 original H3 body blocks, formulas and overview Mermaid exactly once', () => {
  const tree = parser.parse(source), original = structuredClone(tree), registry = candidate()
  const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
  assert.equal(headings.length, 9)
  const bodies = headings.flatMap(heading => {
    const start = tree.children.indexOf(heading) + 1
    let end = start
    while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
    return tree.children.slice(start, end)
  })
  assert.equal(bodies.length, 29)
  for (const [type, count] of Object.entries({ paragraph: 17, list: 9, math: 2, code: 1 })) {
    assert.equal(bodies.filter(node => node.type === type).length, count, type)
  }
  assert.match(source, /累積確率が \$p\$ 以上になる最小の集合/)
  assert.deepEqual(planRegisteredDiagrams(tree, route, registry).map(({ id, start, end }) => [id, start, end]),
    cases.map(({ id, range }) => [id, ...range]))
  assert.deepEqual(tree, original)
  const sections = cases.map(item => selectDiagramSections(tree, entryFor(registry, item.id)))
  assert.equal(sections.flat().length, 5)
  assert.equal(sections.flat().reduce((sum, section) => sum + section.body.length, 0), 22)
  const metadata = wrapRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(metadata, { firstDiagramId: cases[0].id, diagramIds: cases.map(item => item.id) })
  const figures = walk(tree, node => node.name === 'InferenceWalkthrough')
  assert.equal(figures.length, 4)
  for (const [index, figure] of figures.entries()) {
    assert.equal(figure.attributes[0].value, cases[index].id)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), cases[index].steps)
    assert.ok(figure.children.every(step => step.name === 'ReadingStep' && step.children.length))
    const expected = sections[index].flatMap(section => [section.heading, ...section.body])
    const actual = figure.children.flatMap(step => step.children)
    assert.equal(actual.length, expected.length)
    actual.forEach((node, i) => assert.equal(node, expected[i]))
    assert.equal(new Set(actual).size, actual.length)
  }
  assert.deepEqual(unwrap(tree), [original])
  assert.equal(tree.children.filter(node => node.type === 'code' && node.lang === 'mermaid').length, 1)
  assert.equal(walk(tree, node => node.type === 'math').length, 2)
  const mdx = writer.stringify(tree), finalTree = mdxParser.parse(mdx)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(facts(finalTree), facts(original))
  assert.deepEqual(assertDiagramPageMetadata(finalTree, metadata), metadata)
  for (const bad of [[], [...metadata.diagramIds].reverse(), [...metadata.diagramIds, cases[0].id], metadata.diagramIds.slice(1)]) {
    assert.throws(() => assertDiagramPageMetadata(finalTree, { firstDiagramId: bad[0] ?? null, diagramIds: bad }), /最終 MDX/)
  }
})

test('all 16 enabled subsets derive source-ordered metadata and disabled figures leave no wrapper or static residue', () => {
  for (let mask = 0; mask < 16; mask++) {
    const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
    cases.forEach((item, index) => { entryFor(registry, item.id).enabled = Boolean(mask & (1 << index)) })
    registry.diagrams.reverse() // Registry order cannot determine SSR firstID.
    const ids = cases.filter((_, i) => mask & (1 << i)).map(item => item.id)
    const expected = { firstDiagramId: ids[0] ?? null, diagramIds: ids }
    assert.deepEqual(wrapRegisteredDiagrams(tree, route, registry), expected)
    assert.deepEqual(unwrap(tree), [original])
    assert.deepEqual(walk(tree, node => node.name === 'InferenceWalkthrough').map(node => node.attributes[0].value), ids)
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), expected), expected)
    if (!mask) assert.deepEqual(tree, original)
    const other = parser.parse(source), before = structuredClone(other)
    assert.deepEqual(wrapRegisteredDiagrams(other, route + '-other', registry), { firstDiagramId: null, diagramIds: [] })
    assert.deepEqual(other, before)
  }
})

test('semantic dependencies include unwrapped overview and cross-figure sampling and KV sections', () => {
  const influences = [
    ['概要: プリフィルとデコードの 2 相', [0, 1, 2]],
    ['ロジット → 確率 → 選択の数理', [0, 2]],
    ['プリフィルとデコードの計算量・メモリ', [1, 2, 3]],
    ['バッチングと連続バッチング', [1]],
    ['投機的デコーディング', [2]],
    ['量子化', [3]]
  ]
  const text = node => node.value ?? (node.children ?? []).map(text).join('')
  for (const [heading, affected] of influences) {
    const registry = candidate(), tree = parser.parse(source)
    const index = tree.children.findIndex(node => node.type === 'heading' && text(node) === heading)
    walk(tree.children[index + 1], node => node.type === 'text')[0].value += ' 意味の同形変更'
    for (const [i, item] of cases.entries()) {
      const entry = entryFor(registry, item.id)
      assert.equal(diagramSourceDigest(tree, entry) !== entry.sourceDigest, affected.includes(i), heading + ': ' + item.id)
    }
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文版とレビュー版/)
    assert.deepEqual(tree, before, 'even a last-figure failure must not partially wrap earlier sections')
  }
  const oldBoundary = parser.parse(source.replace('累積確率が $p$ 以上になる最小の集合', '累積確率が $p$ を超える最小の集合'))
  for (const [index, item] of cases.entries()) {
    const entry = entryFor(candidate(), item.id)
    assert.equal(diagramSourceDigest(oldBoundary, entry) !== entry.sourceDigest, [0, 2].includes(index))
  }
})

test('inference bindings are fixed; stale reviews, reordered headings and changed whole-block structure fail closed', () => {
  for (const item of cases) {
    const registry = candidate(), entry = entryFor(registry, item.id)
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(source.replace(/\r?\n/g, '\r\n')), entry), entry.sourceDigest)
    for (const mutate of [
      e => e.stageCount++, e => e.headings.push('量子化'), e => e.sourceHeadings.reverse(),
      e => e.blockGroups[0][0].stage++, e => e.blockGroups[0][0].count++, e => e.module = './untrusted'
    ]) {
      const changed = structuredClone(registry)
      mutate(entryFor(changed, item.id))
      assert.throws(() => validateDiagramRegistry(changed), /registry/)
    }
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.doesNotThrow(() => validateDiagramRegistry(registry))
    entry.enabled = true
    assert.throws(() => validateDiagramRegistry(registry), /registry/)
    entry.status = 'implemented'
    assert.throws(() => wrapRegisteredDiagrams(parser.parse(source), route, registry), /本文版とレビュー版/)
    const tree = parser.parse(source), section = selectDiagramSections(tree, entry)[0]
    section.body[0].type = 'blockquote'
    Object.assign(entry, { status: 'reviewed', sourceDigest: diagramSourceDigest(tree, entry) })
    entry.reviewedDigest = entry.sourceDigest
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文ブロック構成/)
    assert.deepEqual(tree, before)
  }
  for (const mutate of [
    (tree, section) => tree.children.splice(section.start, 1),
    (tree, section) => tree.children.splice(section.start, 0, structuredClone(section.heading)),
    (_tree, section) => section.heading.children[0].value += ' 変更'
  ]) {
    const registry = candidate(), tree = parser.parse(source)
    mutate(tree, selectDiagramSections(tree, entryFor(registry, cases[3].id))[0])
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /見出し|本文版とレビュー版/)
    assert.deepEqual(tree, before)
  }
})
