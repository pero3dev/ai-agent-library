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

const cases = [
  { id: 'generation-token-loop', slug: 'how-llms-generate-text', stageCount: 8, bodyCount: 18,
    boundCount: 15, range: [9, 29], steps: [0, 3, 4, 5, 6, 7],
    types: { paragraph: 10, list: 6, code: 1, table: 1 }, mermaid: 1, tables: 1 },
  { id: 'tokenization-counting', slug: 'tokenization', stageCount: 7, bodyCount: 13,
    boundCount: 10, range: [9, 24], steps: [0, 1, 2, 3, 4, 5],
    types: { paragraph: 6, list: 7, code: 0, table: 0 }, mermaid: 0, tables: 0 }
].map(item => ({ ...item, route: `/docs/llm-foundations/${item.slug}`,
  source: readFileSync(new URL(`../../../docs/10-llm-foundations/${item.slug}.md`, import.meta.url), 'utf8') }))
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
  return ['FoundationsWalkthrough', 'ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? { children } : {}) }]
}
const facts = tree => walk(tree, node => !node.type.startsWith('mdx') && node.type !== 'root').map(node =>
  Object.fromEntries(['type', 'value', 'depth', 'url', 'title', 'lang', 'meta', 'ordered', 'start', 'checked', 'align', 'identifier', 'label']
    .filter(key => node[key] !== undefined).map(key => [key, node[key]])))

for (const item of cases) {
  test(`${item.id} preserves every original node, heading, list, table and Mermaid`, () => {
    const registry = candidate(), entry = entryFor(registry, item.id), tree = parser.parse(item.source)
    const original = structuredClone(tree)
    const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3)
    assert.equal(headings.length, 8)
    const bodies = headings.flatMap(heading => {
      const start = tree.children.indexOf(heading) + 1
      let end = start
      while (end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= 3)) end++
      return tree.children.slice(start, end)
    })
    assert.equal(bodies.length, item.bodyCount)
    for (const [type, count] of Object.entries(item.types)) assert.equal(bodies.filter(node => node.type === type).length, count, type)
    const sections = selectDiagramSections(tree, entry)
    assert.equal(sections.length, 5)
    assert.equal(sections.reduce((sum, section) => sum + section.body.length, 0), item.boundCount)
    const nodes = sections.flatMap(section => [section.heading, ...section.body])
    assert.deepEqual(planRegisteredDiagrams(tree, item.route, registry).map(({ id, start, end }) => [id, start, end]), [[item.id, ...item.range]])
    assert.deepEqual(tree, original)
    const metadata = wrapRegisteredDiagrams(tree, item.route, registry)
    assert.deepEqual(metadata, { firstDiagramId: item.id, diagramIds: [item.id] })
    const figures = walk(tree, node => node.name === 'FoundationsWalkthrough')
    assert.equal(figures.length, 1)
    const [figure] = figures
    assert.equal(figure.attributes[0].value, item.id)
    assert.deepEqual(figure.children.map(step => Number(step.attributes[0].value)), item.steps)
    assert.ok(figure.children.every(step => step.name === 'ReadingStep' && step.children.length))
    const actual = figure.children.flatMap(step => step.children)
    assert.equal(actual.length, nodes.length)
    actual.forEach((node, index) => assert.equal(node, nodes[index]))
    assert.equal(new Set(actual).size, nodes.length)
    assert.deepEqual(unwrap(tree), [original])
    assert.equal(walk(tree, node => node.type === 'code' && node.lang === 'mermaid').length, item.mermaid)
    assert.equal(walk(tree, node => node.type === 'table').length, item.tables)
    if (item.tables) assert.equal(walk(tree, node => node.type === 'table')[0].children.length, 4)
    const mdx = writer.stringify(tree), roundTrip = mdxParser.parse(mdx)
    assert.deepEqual(findUnsafeMdx(mdx), [])
    assert.deepEqual(facts(roundTrip), facts(original))
    assert.deepEqual(assertDiagramPageMetadata(roundTrip, metadata), metadata)
    assert.throws(() => assertDiagramPageMetadata(roundTrip, { firstDiagramId: null, diagramIds: [] }), /最終 MDX/)
  })
}

test('all enabled combinations retain each route source and derive only its own first diagram', () => {
  for (let mask = 0; mask < 4; mask++) {
    const registry = candidate()
    cases.forEach((item, index) => { entryFor(registry, item.id).enabled = Boolean(mask & (1 << index)) })
    for (const item of cases) {
      const tree = parser.parse(item.source), original = structuredClone(tree)
      const enabled = entryFor(registry, item.id).enabled
      const expected = { firstDiagramId: enabled ? item.id : null, diagramIds: enabled ? [item.id] : [] }
      assert.deepEqual(wrapRegisteredDiagrams(tree, item.route, registry), expected)
      assert.deepEqual(unwrap(tree), [original])
      assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(writer.stringify(tree)), expected), expected)
      if (!enabled) assert.deepEqual(tree, original)
      const other = parser.parse(item.source), otherOriginal = structuredClone(other)
      assert.deepEqual(wrapRegisteredDiagrams(other, item.route + '-other', registry), { firstDiagramId: null, diagramIds: [] })
      assert.deepEqual(other, otherOriginal)
    }
  }
})

test('same-shape changes in every source section reject wrapping without partial mutation', () => {
  for (const item of cases) {
    const registry = candidate(), entry = entryFor(registry, item.id)
    for (let sectionIndex = 0; sectionIndex < 5; sectionIndex++) {
      const tree = parser.parse(item.source), sections = selectDiagramSections(tree, entry)
      const textNode = walk(sections[sectionIndex].body[0], node => node.type === 'text')[0]
      textNode.value += ' 意味の変更'
      const before = structuredClone(tree)
      assert.throws(() => assertDiagramSource(tree, entry), /本文版とレビュー版/)
      assert.throws(() => wrapRegisteredDiagrams(tree, item.route, registry), /本文版とレビュー版/)
      assert.deepEqual(tree, before)
    }
    const tree = parser.parse(item.source)
    selectDiagramSections(tree, entry)[0].body[0].type = 'blockquote'
    entry.sourceDigest = diagramSourceDigest(tree, entry)
    entry.reviewedDigest = entry.sourceDigest
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, item.route, registry), /本文ブロック構成/)
    assert.deepEqual(tree, before)
  }
})

test('draft fixtures, source pins and code-owned foundations bindings fail closed', () => {
  for (const item of cases) {
    const registry = candidate(), entry = entryFor(registry, item.id)
    Object.assign(entry, { enabled: false, status: 'draft', reviewedDigest: null })
    assert.doesNotThrow(() => validateDiagramRegistry(registry))
    assert.equal(diagramSourceDigest(parser.parse(item.source), entry), entry.sourceDigest)
    assert.equal(diagramSourceDigest(parser.parse(item.source.replace(/\r?\n/g, '\r\n')), entry), entry.sourceDigest)
    const movedPositions = parser.parse(item.source)
    walk(movedPositions, () => true).forEach(node => { delete node.position })
    assert.equal(diagramSourceDigest(movedPositions, entry), entry.sourceDigest)
    for (const mutate of [
      value => value.enabled = true,
      value => value.stageCount++,
      value => value.blockGroups[0][0].stage++,
      value => value.blockGroups[0][0].count++,
      value => value.sourceHeadings.pop(),
      value => value.headings.reverse(),
      value => value.module = './scene'
    ]) {
      const changed = structuredClone(registry)
      mutate(entryFor(changed, item.id))
      assert.throws(() => validateDiagramRegistry(changed), /registry/)
    }
    Object.assign(entry, { enabled: true, status: 'implemented' })
    assert.throws(() => wrapRegisteredDiagrams(parser.parse(item.source), item.route, registry), /本文版とレビュー版/)
  }
})

test('missing, duplicate, reordered and renamed source headings are rejected', () => {
  for (const item of cases) for (const mutation of ['missing', 'duplicate', 'reordered', 'renamed']) {
    const registry = candidate(), entry = entryFor(registry, item.id), tree = parser.parse(item.source)
    const sections = selectDiagramSections(tree, entry)
    if (mutation === 'missing') tree.children.splice(sections[1].start, 1)
    if (mutation === 'duplicate') tree.children.push(structuredClone(sections[1].heading))
    if (mutation === 'reordered') [tree.children[sections[1].start], tree.children[sections[2].start]] = [sections[2].heading, sections[1].heading]
    if (mutation === 'renamed') sections[1].heading.children[0].value += ' 変更'
    // Place the duplicate inside 本文, rather than a later unrelated H2.
    if (mutation === 'duplicate') tree.children.splice(sections[1].start, 0, tree.children.pop())
    const before = structuredClone(tree)
    assert.throws(() => wrapRegisteredDiagrams(tree, item.route, registry), /見出し|本文版とレビュー版/)
    assert.deepEqual(tree, before)
  }
})
