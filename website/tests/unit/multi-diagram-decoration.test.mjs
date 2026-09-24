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
import {
  assertDiagramPageMetadata, assertNonoverlappingDiagramPlans,
  planRegisteredDiagrams, wrapRegisteredDiagrams
} from '../../lib/diagram-decoration.mjs'
import {
  assertDiagramSource, diagramRegistry, diagramSourceDigest,
  selectDiagramSections, validateDiagramRegistry
} from '../../lib/diagram-registry.mjs'
import { applyDecorations } from '../../lib/doc-decorations.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const route = '/docs/llm-internals/transformer-architecture'
const source = readFileSync(new URL('../../../docs/11-llm-internals/transformer-architecture.md', import.meta.url), 'utf8')
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = parser().use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const articleIds = ['transformer-io', 'transformer-position', 'self-attention', 'transformer-block']
const groupedIds = articleIds.filter(id => id !== 'self-attention')
// Explicitly model a reviewed candidate; never update actual registry approval.
const candidate = () => {
  const registry = structuredClone(diagramRegistry)
  for (const entry of registry.diagrams) {
    entry.enabled = true
    entry.reviewedDigest = entry.sourceDigest
    entry.status = 'reviewed'
  }
  return registry
}
const entryFor = (registry, id) => registry.diagrams.find(entry => entry.id === id)
const walk = (node, match, output = []) => {
  if (match(node)) output.push(node)
  for (const child of node.children ?? []) walk(child, match, output)
  return output
}
const figureId = node => node.name === 'AttentionWalkthrough' ? 'self-attention'
  : node.attributes.find(attribute => attribute.name === 'diagramId').value
const figures = tree => walk(tree, node => ['AttentionWalkthrough', 'TransformerWalkthrough'].includes(node.name))
// The existing attention binding splits one list into two. Compare all other
// original nodes/fields globally, and every new grouped list by identity below.
const sourceFacts = tree => walk(tree, node => !node.type.startsWith('mdx') && !['root', 'list'].includes(node.type))
  .map(node => Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'start', 'checked', 'align', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('Transformer draft registrations are valid only while disabled and unreviewed', () => {
  const registry = candidate()
  for (const id of groupedIds) {
    const entry = entryFor(registry, id)
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.equal(entry.articleCoverage, 'pending')
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
  }
  assert.doesNotThrow(() => validateDiagramRegistry(registry))
})

test('all four diagrams are planned against the original AST and applied in article order', () => {
  const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
  // Deliberately oppose the source order; it is not registry order that places
  // the first figure, the shared article contents, or subsequent wrappers.
  registry.diagrams.reverse()
  const plans = planRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(plans.map(plan => plan.id), articleIds)
  assert.deepEqual(tree, original)
  const metadata = wrapRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(metadata, { firstDiagramId: articleIds[0], diagramIds: articleIds })
  assert.deepEqual(figures(tree).map(figureId), articleIds)
  assert.deepEqual(sourceFacts(tree), sourceFacts(original))
  assert.equal(figures(tree).some(figure => figures(figure).length !== 1), false)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  const reparsed = mdxParser.parse(mdx)
  assert.deepEqual(sourceFacts(reparsed), sourceFacts(original))
  assert.deepEqual(assertDiagramPageMetadata(reparsed, metadata), metadata)
})

test('grouped steps retain all 40 whole body nodes and seven headings exactly once', () => {
  const registry = candidate(), tree = parser.parse(source)
  const expected = new Map(groupedIds.map(id => [id, selectDiagramSections(tree, entryFor(registry, id))]))
  wrapRegisteredDiagrams(tree, route, registry)
  let bodyCount = 0, headingCount = 0
  const expectedStages = { 'transformer-io': [0, 1, 2, 3], 'transformer-position': [0, 2, 3], 'transformer-block': [0, 1, 2, 3, 4, 5, 6, 7, 8] }
  for (const figure of figures(tree).filter(node => node.name === 'TransformerWalkthrough')) {
    const id = figureId(figure), originalSections = expected.get(id)
    assert.deepEqual(figure.children.map(node => Number(node.attributes[0].value)), expectedStages[id])
    assert.ok(figure.children.every(node => node.name === 'ReadingStep' && node.children.length > 0))
    const originalNodes = originalSections.flatMap(section => [section.heading, ...section.body])
    const actualNodes = figure.children.flatMap(step => step.children)
    assert.equal(actualNodes.length, originalNodes.length)
    actualNodes.forEach((node, index) => assert.equal(node, originalNodes[index]))
    assert.equal(new Set(actualNodes).size, actualNodes.length)
    bodyCount += originalSections.reduce((count, section) => count + section.body.length, 0)
    headingCount += originalSections.length
    for (const section of originalSections) {
      const containing = figure.children.filter(step => step.children.includes(section.heading))
      assert.equal(containing.length, 1)
      assert.equal(containing[0].children[0], section.heading)
    }
  }
  assert.equal(bodyCount, 40)
  assert.equal(headingCount, 7)
  const position = figures(tree).find(node => figureId(node) === 'transformer-position')
  const positionList = position.children[0].children.find(node => node.type === 'list')
  assert.equal(positionList.children.length, 3)
  assert.equal(position.children.some(node => node.attributes[0].value === '1'), false)
})

test('a late source failure leaves the complete original article unmodified', () => {
  const registry = candidate()
  registry.diagrams.sort((a, b) => articleIds.indexOf(a.id) - articleIds.indexOf(b.id))
  const tree = parser.parse(source)
  const last = selectDiagramSections(tree, entryFor(registry, 'transformer-block')).at(-1)
  last.body.find(node => node.type === 'math').value += ' + 1'
  const before = structuredClone(tree)
  assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文版とレビュー版/)
  assert.deepEqual(tree, before)
})

test('shared semantic dependencies invalidate every affected figure without overlapping wrappers', () => {
  const registry = candidate(), original = parser.parse(source)
  const changed = parser.parse(source.replace('重みの合計が 1', '重みの合計が 2'))
  assert.notDeepEqual(changed, original)
  assert.doesNotThrow(() => assertDiagramSource(changed, entryFor(registry, 'transformer-io')))
  for (const id of ['self-attention', 'transformer-position', 'transformer-block']) {
    assert.throws(() => assertDiagramSource(changed, entryFor(registry, id)), /本文版とレビュー版/)
  }
  const block = entryFor(registry, 'transformer-block')
  assert.notEqual(block.headings[0], block.sourceHeadings[0])
  assert.doesNotThrow(() => validateDiagramRegistry(registry))
  assert.doesNotThrow(() => planRegisteredDiagrams(original, route, registry))
})

test('even a newly pinned digest cannot bypass the reviewed block shapes', () => {
  for (const change of [
    section => { section.body[1].type = 'paragraph' },
    (section, tree) => { tree.children.splice(section.end, 0, { type: 'paragraph', children: [{ type: 'text', value: '追加' }] }) }
  ]) {
    const registry = candidate(), tree = parser.parse(source)
    change(selectDiagramSections(tree, entryFor(registry, 'transformer-io'))[0], tree)
    for (const entry of registry.diagrams.filter(entry => entry.route === route)) {
      entry.sourceDigest = diagramSourceDigest(tree, entry)
      entry.reviewedDigest = entry.sourceDigest
    }
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文ブロック構成/)
    assert.deepEqual(tree, before)
  }
})

test('fixed grouped bindings reject changed stages, counts, keys and draft activation', () => {
  for (const edit of [
    entry => { entry.blockGroups[0][0].count = 0 },
    entry => { entry.blockGroups[0][0].count = 5 },
    entry => { entry.blockGroups[0][0].stage = -1 },
    entry => { entry.blockGroups[0][0].stage = 4 },
    entry => { entry.blockGroups[0][0].stage = '0' },
    entry => { entry.blockGroups[0][0].module = './scene' },
    entry => { entry.blockGroups[0] = [] },
    entry => { entry.blockGroups.push([{ stage: 3, count: 1 }]) },
    entry => { entry.headings.reverse() },
    entry => { entry.sourceHeadings.reverse() }
  ]) {
    const registry = candidate()
    edit(entryFor(registry, 'transformer-io'))
    assert.throws(() => validateDiagramRegistry(registry), /registry/)
  }
  const registry = candidate()
  Object.assign(entryFor(registry, 'transformer-io'), { enabled: true, status: 'draft', reviewedDigest: null })
  assert.throws(() => validateDiagramRegistry(registry), /registry/)
})

test('only wrapping ranges must be disjoint, increasing and nonempty', () => {
  assert.doesNotThrow(() => assertNonoverlappingDiagramPlans([{ id: 'a', start: 2, end: 4 }, { id: 'b', start: 4, end: 6 }]))
  for (const plans of [
    [{ id: 'a', start: 2, end: 5 }, { id: 'b', start: 4, end: 6 }],
    [{ id: 'a', start: 4, end: 6 }, { id: 'b', start: 2, end: 4 }],
    [{ id: 'a', start: 2, end: 2 }],
    [{ id: 'a', start: -1, end: 2 }]
  ]) assert.throws(() => assertNonoverlappingDiagramPlans(plans), /包装範囲/)
})

test('disabled figures are omitted and the first enabled source figure owns navigation', () => {
  for (let mask = 0; mask < 16; mask++) {
    const registry = candidate(), tree = parser.parse(source)
    const expected = articleIds.filter((_id, index) => mask & (1 << index))
    for (const id of articleIds) entryFor(registry, id).enabled = expected.includes(id)
    const metadata = applyDecorations(tree, { route, registry })
    assert.deepEqual(metadata, { firstDiagramId: expected[0] ?? null, diagramIds: expected })
    assert.deepEqual(figures(tree).map(figureId), expected)
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), metadata), metadata)
  }
})

test('the final MDX must agree with generated placement after any content-src override', () => {
  const tree = parser.parse(source)
  const metadata = wrapRegisteredDiagrams(tree, route, candidate())
  const rendered = writer.stringify(tree)
  assert.throws(() => assertDiagramPageMetadata(mdxParser.parse('本文だけの上書き。'), metadata), /最終 MDX/)
  assert.throws(() => assertDiagramPageMetadata(mdxParser.parse(rendered.replace('diagramId="transformer-io"', 'diagramId="transformer-position"')), metadata), /最終 MDX/)
  assert.throws(() => assertDiagramPageMetadata(mdxParser.parse(rendered), { ...metadata, firstDiagramId: 'self-attention' }), /最終 MDX/)
  assert.deepEqual(assertDiagramPageMetadata(parser.parse('静的な本文。'), { firstDiagramId: null, diagramIds: [] }), { firstDiagramId: null, diagramIds: [] })
})
