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
import { diagramRegistry, diagramSourceDigest, selectDiagramSections, validateDiagramRegistry } from '../../lib/diagram-registry.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const article = 'docs/10-llm-foundations/llm-training-pipeline.md'
const route = '/docs/llm-foundations/llm-training-pipeline'
const source = readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8')
const cases = [
  { id: 'training-stages', stages: 6, range: [9, 20], steps: [0, 1, 2, 3, 4, 5] },
  { id: 'training-runtime-boundary', stages: 4, range: [20, 24], steps: [0, 2, 3] }
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
  return ['TrainingWalkthrough', 'ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? { children } : {}) }]
}
const text = node => node.value ?? (node.children ?? []).map(text).join('')
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('training wraps 10 whole body nodes and five headings, preserving the original article and overview Mermaid', () => {
  const tree = parser.parse(source), original = structuredClone(tree), registry = candidate()
  const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
  assert.equal(headings.length, 8)
  const bodies = headings.flatMap(heading => {
    const start = tree.children.indexOf(heading) + 1
    let end = start
    while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
    return tree.children.slice(start, end)
  })
  assert.equal(bodies.length, 13)
  for (const [type, count] of Object.entries({ paragraph: 7, list: 5, math: 0, code: 1 })) {
    assert.equal(bodies.filter(node => node.type === type).length, count, type)
  }
  assert.deepEqual(planRegisteredDiagrams(tree, route, registry).map(({ id, start, end }) => [id, start, end]),
    cases.map(({ id, range }) => [id, ...range]))
  assert.deepEqual(tree, original)
  const sections = cases.map(item => selectDiagramSections(tree, entryFor(registry, item.id)))
  assert.equal(sections.flat().length, 5)
  assert.equal(sections.flat().reduce((sum, section) => sum + section.body.length, 0), 10)
  const metadata = wrapRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(metadata, { firstDiagramId: cases[0].id, diagramIds: cases.map(item => item.id) })
  const figures = walk(tree, node => node.name === 'TrainingWalkthrough')
  assert.equal(figures.length, 2)
  for (const [index, figure] of figures.entries()) {
    assert.equal(figure.attributes[0].value, cases[index].id)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), cases[index].steps)
    assert.ok(figure.children.every(step => step.name === 'ReadingStep' && step.children.length))
    const expected = sections[index].flatMap(section => [section.heading, ...section.body])
    const actual = figure.children.flatMap(step => step.children)
    assert.equal(actual.length, expected.length)
    actual.forEach((node, i) => assert.equal(node, expected[i]))
    assert.equal(new Set(actual).size, actual.length)
    for (const section of sections[index]) {
      const containing = figure.children.filter(step => step.children.includes(section.heading))
      assert.equal(containing.length, 1)
      assert.equal(containing[0].children[0], section.heading)
    }
  }
  assert.deepEqual(unwrap(tree), [original])
  assert.equal(walk(figures[0].children[0], node => node.type === 'code' && node.lang === 'mermaid').length, 1)
  assert.equal(tree.children.filter(node => node.type === 'code' && node.lang === 'mermaid').length, 0)
  assert.equal(walk(tree, node => node.type === 'math').length, 0)
  const retained = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
  assert.deepEqual(retained.map(text), ['この理解が効く場面', 'アンチパターン', 'チェックリスト'])
  assert.deepEqual(retained.map(heading => tree.children[tree.children.indexOf(heading) + 1].children.length), [4, 4, 5])
  const mdx = writer.stringify(tree), finalTree = mdxParser.parse(mdx)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(facts(finalTree), facts(original))
  assert.deepEqual(assertDiagramPageMetadata(finalTree, metadata), metadata)
  for (const bad of [[], [...metadata.diagramIds].reverse(), [...metadata.diagramIds, cases[0].id], metadata.diagramIds.slice(1)]) {
    assert.throws(() => assertDiagramPageMetadata(finalTree, { firstDiagramId: bad[0] ?? null, diagramIds: bad }), /最終 MDX/)
  }
})

test('all four training enabled subsets keep source order and restore the whole original AST', () => {
  for (let mask = 0; mask < 4; mask++) {
    const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
    cases.forEach((item, index) => { entryFor(registry, item.id).enabled = Boolean(mask & (1 << index)) })
    registry.diagrams.reverse()
    const ids = cases.filter((_, index) => mask & (1 << index)).map(item => item.id)
    const expected = { firstDiagramId: ids[0] ?? null, diagramIds: ids }
    assert.deepEqual(wrapRegisteredDiagrams(tree, route, registry), expected)
    assert.deepEqual(unwrap(tree), [original])
    assert.deepEqual(walk(tree, node => node.name === 'TrainingWalkthrough').map(node => node.attributes[0].value), ids)
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), expected), expected)
    if (!mask) assert.deepEqual(tree, original)
    const other = parser.parse(source), before = structuredClone(other)
    assert.deepEqual(wrapRegisteredDiagrams(other, route + '-other', registry), { firstDiagramId: null, diagramIds: [] })
    assert.deepEqual(other, before)
  }
})

test('training semantic dependencies include the later practical section without wrapping it', () => {
  const influences = [
    ['概要: 3 つの工程と、それぞれが残す「癖」', [0, 1]],
    ['事前学習: 次トークン予測で知識を得る', [0, 1]],
    ['指示チューニング(SFT): 指示に従う形式を学ぶ', [0, 1]],
    ['選好調整: 「良い応答」の基準を最適化する', [0, 1]],
    ['この工程から生まれる性質: 幻覚・迎合・拒否', [1]],
    ['この理解が効く場面', [1]], ['アンチパターン', []], ['チェックリスト', []]
  ]
  for (const [heading, affected] of influences) {
    const registry = candidate(), tree = parser.parse(source)
    const index = tree.children.findIndex(node => node.type === 'heading' && text(node) === heading)
    walk(tree.children[index + 1], node => node.type === 'text')[0].value += ' 意味の同形変更'
    for (const [i, item] of cases.entries()) {
      const entry = entryFor(registry, item.id)
      assert.equal(diagramSourceDigest(tree, entry) !== entry.sourceDigest, affected.includes(i), heading + ': ' + item.id)
    }
    const before = structuredClone(tree)
    if (affected.length) {
      assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文版とレビュー版/)
      assert.deepEqual(tree, before, 'a later figure failure must not partially wrap the earlier figure')
    } else {
      wrapRegisteredDiagrams(tree, route, registry)
      assert.deepEqual(unwrap(tree), [before])
    }
  }
})

test('training fixed bindings reject stale reviews, changed block types and renamed or missing headings', () => {
  for (const item of cases) {
    const registry = candidate(), entry = entryFor(registry, item.id)
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(source.replace(/\r?\n/g, '\r\n')), entry), entry.sourceDigest)
    for (const mutate of [
      e => e.stageCount++, e => e.headings.push('チェックリスト'), e => e.sourceHeadings.reverse(),
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
    mutate(tree, selectDiagramSections(tree, entryFor(registry, cases[1].id))[0])
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /見出し|本文版とレビュー版/)
    assert.deepEqual(tree, before)
  }
})
