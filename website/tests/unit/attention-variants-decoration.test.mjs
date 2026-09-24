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

const article = 'docs/11-llm-internals/attention-variants-and-long-context.md'
const route = '/docs/llm-internals/attention-variants-and-long-context'
const source = readFileSync(new URL('../../../' + article, import.meta.url), 'utf8')
const ids = ['attention-kv-sharing', 'attention-compute-memory', 'attention-context-range']
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
const figures = tree => walk(tree, node => node.name === 'AttentionVariantsWalkthrough')
const idOf = figure => figure.attributes.find(attribute => attribute.name === 'diagramId').value
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'align', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

test('attention variants preserve 21 whole body nodes, six headings and all original list contents', () => {
  const registry = candidate(), tree = parser.parse(source), before = facts(tree)
  const originalSections = new Map(ids.map(id => [id, selectDiagramSections(tree, entryFor(registry, id))]))
  const expectedSteps = [[0, 1, 4], [0, 1, 2, 3, 4, 5], [0, 2]]
  const ssm = tree.children.find(node => node.type === 'heading' && node.children[0]?.value === 'Transformer を離れる: 状態空間モデル')
  const ssmBody = tree.children[tree.children.indexOf(ssm) + 1]
  registry.diagrams.reverse()
  const plans = planRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(plans.map(plan => plan.id), ids)
  assert.deepEqual(facts(tree), before)
  const metadata = wrapRegisteredDiagrams(tree, route, registry)
  assert.deepEqual(metadata, { firstDiagramId: ids[0], diagramIds: ids })
  let bodyCount = 0, headingCount = 0
  for (const [index, figure] of figures(tree).entries()) {
    const sections = originalSections.get(idOf(figure))
    const expected = sections.flatMap(section => [section.heading, ...section.body])
    const actual = figure.children.flatMap(step => step.children)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), expectedSteps[index])
    assert.equal(actual.length, expected.length)
    actual.forEach((node, nodeIndex) => assert.equal(node, expected[nodeIndex]))
    assert.equal(new Set(actual).size, expected.length)
    assert.ok(figure.children.every(step => step.name === 'ReadingStep' && step.children.length))
    bodyCount += sections.reduce((sum, section) => sum + section.body.length, 0)
    headingCount += sections.length
  }
  assert.equal(bodyCount, 21)
  assert.equal(headingCount, 6)
  assert.ok(tree.children.includes(ssm) && tree.children.includes(ssmBody))
  const kvComparison = figures(tree)[0].children.at(-1)
  assert.equal(kvComparison.attributes[0].value, '4')
  assert.equal(kvComparison.children.length, 5) // heading + all four sharing blocks
  assert.deepEqual(facts(tree), before)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(facts(mdxParser.parse(mdx)), before)
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
})

test('all eight disabled subsets preserve prose and first enabled placement; all-disabled is an exact no-op', () => {
  for (let mask = 0; mask < 8; mask++) {
    const registry = candidate(), tree = parser.parse(source), original = structuredClone(tree)
    const expected = ids.filter((_id, index) => mask & (1 << index))
    for (const id of ids) entryFor(registry, id).enabled = expected.includes(id)
    const metadata = wrapRegisteredDiagrams(tree, route, registry)
    assert.deepEqual(metadata, { firstDiagramId: expected[0] ?? null, diagramIds: expected })
    assert.deepEqual(figures(tree).map(idOf), expected)
    assert.deepEqual(facts(tree), facts(original))
    assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), metadata), metadata)
    if (!mask) assert.deepEqual(tree, original)
  }
  const tree = parser.parse(source), original = structuredClone(tree)
  wrapRegisteredDiagrams(tree, route + '-other', candidate())
  assert.deepEqual(tree, original)
})

test('outside-wrapper context guidance is a semantic dependency and a late failure is atomic', () => {
  const registry = candidate(), entry = entryFor(registry, ids[2])
  assert.equal(entry.headings.length, 1)
  assert.equal(entry.sourceHeadings.length, 3)
  const changed = parser.parse(source.replace('「対応長」は上限であって保証ではありません。', '「対応長」は品質を保証します。'))
  assert.notDeepEqual(changed, parser.parse(source))
  assert.throws(() => assertDiagramSource(changed, entry), /本文版とレビュー版/)
  for (const id of ids.slice(0, 2)) assert.doesNotThrow(() => assertDiagramSource(changed, entryFor(registry, id)))
  const before = structuredClone(changed)
  assert.throws(() => wrapRegisteredDiagrams(changed, route, registry), /本文版とレビュー版/)
  assert.deepEqual(changed, before)
  const ssmOnly = parser.parse(source.replace('状態に畳み込みながら処理し', '状態にまとめながら処理し'))
  assert.notDeepEqual(ssmOnly, parser.parse(source))
  assert.equal(diagramSourceDigest(ssmOnly, entry), entry.sourceDigest)
})

test('new bindings stay fixed and draft fixtures require disabled unreviewed state', () => {
  const registry = candidate()
  for (const id of ids) {
    const entry = entryFor(registry, id)
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.equal(diagramSourceDigest(parser.parse(source), entry), entry.sourceDigest)
  }
  assert.doesNotThrow(() => validateDiagramRegistry(registry))
  for (const mutate of [
    entry => entry.enabled = true,
    entry => entry.blockGroups[0][0].stage = 5,
    entry => entry.blockGroups[0][0].count = 1,
    entry => entry.sourceHeadings.pop(),
    entry => entry.module = './scene'
  ]) {
    const changed = structuredClone(registry)
    mutate(entryFor(changed, ids[0]))
    assert.throws(() => validateDiagramRegistry(changed), /registry/)
  }
})

test('changed block shapes fail even after a fixture pins their new semantic digest', () => {
  const registry = candidate(), tree = parser.parse(source)
  selectDiagramSections(tree, entryFor(registry, ids[2]))[0].body[1].type = 'paragraph'
  for (const id of ids) {
    const entry = entryFor(registry, id)
    entry.sourceDigest = diagramSourceDigest(tree, entry)
    entry.reviewedDigest = entry.sourceDigest
  }
  const before = structuredClone(tree)
  assert.throws(() => wrapRegisteredDiagrams(tree, route, registry), /本文ブロック構成/)
  assert.deepEqual(tree, before)
})
