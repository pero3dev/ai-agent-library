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

const article = 'docs/11-llm-internals/mixture-of-experts-internals.md'
const route = '/docs/llm-internals/mixture-of-experts-internals'
const source = readFileSync(new URL('../../../' + article, import.meta.url), 'utf8')
const ids = ['moe-routing-load', 'moe-parameters-communication']
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = parser().use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const entryFor = (registry, id) => registry.diagrams.find(entry => entry.id === id)
const candidate = () => {
  const registry = structuredClone(diagramRegistry)
  for (const id of ids) Object.assign(entryFor(registry, id), { enabled: true, status: 'reviewed', reviewedDigest: entryFor(registry, id).sourceDigest })
  return registry
}
const walk = (node, match, output = []) => {
  if (match(node)) output.push(node)
  for (const child of node.children ?? []) walk(child, match, output)
  return output
}
const figures = tree => walk(tree, node => node.name === 'MoEWalkthrough')
const idOf = figure => figure.attributes.find(attribute => attribute.name === 'diagramId').value
const unwrap = node => {
  const children = node.children?.flatMap(unwrap)
  return ['MoEWalkthrough', 'ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? { children } : {}) }]
}
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'align', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('MoE preserves all original AST fields, 19 bound body nodes, whole lists and Mermaid', () => {
  const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
  assert.equal(tree.children.length, 49)
  const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
  assert.equal(headings.length, 9)
  const allBodies = headings.flatMap(heading => {
    const start = tree.children.indexOf(heading) + 1
    let end = start
    while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
    return tree.children.slice(start, end)
  })
  assert.equal(allBodies.length, 23)
  assert.deepEqual(Object.fromEntries(['paragraph', 'list', 'math', 'code'].map(type => [type, allBodies.filter(node => node.type === type).length])),
    { paragraph: 11, list: 7, math: 4, code: 1 })
  const originalSections = new Map(ids.map(id => [id, selectDiagramSections(tree, entryFor(registry, id))]))
  const specialization = headings.find(node => node.children[0]?.value === '専門化の実態')
  const specializationBody = tree.children[tree.children.indexOf(specialization) + 1]
  registry.diagrams.reverse()
  assert.deepEqual(planRegisteredDiagrams(tree, route, registry).map(({ id, start, end }) => ({ id, start, end })),
    [{ id: ids[0], start: 10, end: 26 }, { id: ids[1], start: 28, end: 36 }])
  assert.deepEqual(tree, original)
  const metadata = wrapRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(metadata, { firstDiagramId: ids[0], diagramIds: ids })
  for (const [index, figure] of figures(tree).entries()) {
    const expected = originalSections.get(idOf(figure)).flatMap(section => [section.heading, ...section.body])
    const actual = figure.children.flatMap(step => step.children)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), index === 0 ? [0, 1, 2, 3, 4, 5, 7] : [0, 1, 2, 5])
    assert.equal(actual.length, expected.length)
    actual.forEach((node, nodeIndex) => assert.equal(node, expected[nodeIndex]))
    assert.equal(new Set(actual).size, expected.length)
    assert.ok(figure.children.every(step => step.name === 'ReadingStep' && step.children.length))
    assert.equal(originalSections.get(idOf(figure)).reduce((sum, section) => sum + section.body.length, 0), index === 0 ? 13 : 6)
  }
  const firstIndex = tree.children.indexOf(figures(tree)[0]), secondIndex = tree.children.indexOf(figures(tree)[1])
  assert.deepEqual(tree.children.slice(firstIndex + 1, secondIndex), [specialization, specializationBody])
  assert.deepEqual(unwrap(tree), [original]) // includes every original field, not only prose text
  assert.equal(walk(tree, node => node.type === 'code' && node.lang === 'mermaid').length, 1)
  const mdx = writer.stringify(tree), roundTrip = mdxParser.parse(mdx)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(facts(roundTrip), facts(original))
  assert.deepEqual(assertDiagramPageMetadata(roundTrip, metadata), metadata)
  assert.throws(() => assertDiagramPageMetadata(roundTrip, { firstDiagramId: ids[1], diagramIds: ids }), /最終 MDX/)
})

test('all four enabled combinations retain exact source and first enabled diagram; unrelated routes are no-ops', () => {
  for (let mask = 0; mask < 4; mask++) {
    const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
    const expected = ids.filter((_id, index) => mask & (1 << index))
    for (const id of ids) entryFor(registry, id).enabled = expected.includes(id)
    const metadata = wrapRegisteredDiagrams(tree, route, registry)
    assert.deepEqual(metadata, { firstDiagramId: expected[0] ?? null, diagramIds: expected })
    assert.deepEqual(figures(tree).map(idOf), expected)
    assert.deepEqual(unwrap(tree), [original])
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), metadata), metadata)
    if (!mask) assert.deepEqual(tree, original)
  }
  const tree = parser.parse(source), original = structuredClone(tree)
  wrapRegisteredDiagrams(tree, route + '-other', candidate())
  assert.deepEqual(tree, original)
})

test('MoE semantic dependencies include outside-wrapper specialization and M1 N8/k2 source', () => {
  const registry = candidate(), m1 = entryFor(registry, ids[0]), m2 = entryFor(registry, ids[1])
  assert.equal(m1.headings.length, 3)
  assert.equal(m1.sourceHeadings.length, 5)
  assert.equal(m2.sourceHeadings.length, 6)
  for (const [before, after] of [['人間的な分業', '固定的な分業'], ['k=2/N=8', 'k=2/N=16']]) {
    assert.ok(source.includes(before))
    const changed = parser.parse(source.replace(before, after))
    for (const entry of [m1, m2]) assert.throws(() => assertDiagramSource(changed, entry), /本文版とレビュー版/)
  }
  // Only M2 uses this final operations section; failure must leave M1 unwrapped.
  const changed = parser.parse(source.replace('通信・ルーティングのオーバーヘッドは別途乗る', '通信・ルーティングのオーバーヘッドは不要'))
  assert.notDeepEqual(changed, parser.parse(source))
  assert.doesNotThrow(() => assertDiagramSource(changed, m1))
  assert.throws(() => assertDiagramSource(changed, m2), /本文版とレビュー版/)
  const before = structuredClone(changed)
  assert.throws(() => wrapRegisteredDiagrams(changed, route, registry), /本文版とレビュー版/)
  assert.deepEqual(changed, before)
})

test('MoE registry pins original source and rejects arbitrary bindings or enabled draft fixtures', () => {
  const registry = candidate()
  for (const id of ids) {
    const entry = entryFor(registry, id)
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(source.replace(/\r?\n/g, '\r\n')), entry), entry.sourceDigest)
  }
  assert.doesNotThrow(() => validateDiagramRegistry(registry))
  for (const mutate of [
    entry => entry.enabled = true,
    entry => entry.stageCount = 9,
    entry => entry.blockGroups[2][1].stage = 6,
    entry => entry.blockGroups[0][0].count = 2,
    entry => entry.sourceHeadings.pop(),
    entry => entry.module = './scene'
  ]) {
    const changed = structuredClone(registry)
    mutate(entryFor(changed, ids[0]))
    assert.throws(() => validateDiagramRegistry(changed), /registry/)
  }
  const unreviewed = candidate()
  Object.assign(entryFor(unreviewed, ids[0]), { status: 'implemented', reviewedDigest: null })
  assert.throws(() => wrapRegisteredDiagrams(parser.parse(source), route, unreviewed), /本文版とレビュー版/)
})

test('MoE changed block structure is rejected atomically even with matching fixture digests', () => {
  const registry = candidate(), tree = parser.parse(source)
  selectDiagramSections(tree, entryFor(registry, ids[1]))[0].body[4].type = 'paragraph'
  for (const id of ids) {
    const entry = entryFor(registry, id)
    entry.sourceDigest = diagramSourceDigest(tree, entry)
    entry.reviewedDigest = entry.sourceDigest
  }
  const before = structuredClone(tree)
  assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文ブロック構成/)
  assert.deepEqual(tree, before)
})
