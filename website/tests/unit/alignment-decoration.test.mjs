import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { planRegisteredDiagrams, wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { diagramRegistry, assertDiagramSource, diagramSourceDigest } from '../../lib/diagram-registry.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const article = 'docs/11-llm-internals/alignment-theory.md'
const route = '/docs/llm-internals/alignment-theory'
const source = readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8')
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const cases = [
  { id: 'alignment-preference', range: [10,27], stages: 7, steps: [0,1,2,3,4,5,6] },
  { id: 'alignment-reward-risk', range: [27,31], stages: 3, steps: [0,1,2] },
  { id: 'alignment-feedback', range: [31,39], stages: 5, steps: [0,1,2,3,4] }
]
const walk = (node, predicate, found = []) => {
  if (predicate(node)) found.push(node)
  for (const child of node.children ?? []) walk(child, predicate, found)
  return found
}
const normalize = value => Array.isArray(value) ? value.map(normalize) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'position').map(([key,v]) => [key,normalize(v)])) : value
const unwrap = node => {
  const children = node.children?.flatMap(unwrap)
  return ['AlignmentWalkthrough','ReadingStep'].includes(node.name) ? children : [{ ...node, ...(children ? {children} : {}) }]
}

test('alignment covers exactly six source headings and all fifteen READ stages, retaining four equations and Mermaid', () => {
  const tree = parser.parse(source), plans = planRegisteredDiagrams(tree, route)
  assert.deepEqual(plans.map(p => [p.id,p.start,p.end]), cases.map(c => [c.id,...c.range]))
  assert.equal(tree.children.filter(n => n.type === 'heading' && n.depth === 3).length, 9)
  assert.equal(walk(tree, n => n.type === 'math').length, 4)
  assert.equal(walk(tree, n => n.type === 'code' && n.lang === 'mermaid').length, 1)
  const original = structuredClone(tree)
  wrapRegisteredDiagrams(tree, route)
  assert.deepEqual(normalize(unwrap(tree)[0]), normalize(original))
  const figures = walk(tree, n => n.name === 'AlignmentWalkthrough')
  for (const [i,c] of cases.entries()) {
    assert.deepEqual(walk(figures[i], n => n.name === 'ReadingStep').map(n => Number(n.attributes.find(a => a.name === 'step').value)), c.steps)
    const entry = diagramRegistry.diagrams.find(d => d.id === c.id)
    assert.equal(entry.stageCount, c.stages)
  }
  assert.equal(walk(tree, n => n.name === 'ReadingStep').length, 15)
})

test('every enabled subset restores the entire source AST and preserves article order', () => {
  for (let mask=0; mask<8; mask++) {
    const registry = structuredClone(diagramRegistry)
    cases.forEach((c,i) => registry.diagrams.find(d => d.id === c.id).enabled = Boolean(mask & (1<<i)))
    const tree = parser.parse(source), original = structuredClone(tree)
    wrapRegisteredDiagrams(tree, route, registry)
    assert.deepEqual(normalize(unwrap(tree)[0]), normalize(original), `subset ${mask}`)
    const ids = cases.filter((_,i) => mask & (1<<i)).map(c => c.id)
    assertDiagramPageMetadata(tree, { diagramIds: ids, firstDiagramId: ids[0] ?? null })
  }
})

test('alignment rejects stale semantic sources and changed whole-block boundaries', () => {
  for (const c of cases) {
    const entry = diagramRegistry.diagrams.find(d => d.id === c.id)
    assert.doesNotThrow(() => assertDiagramSource(parser.parse(source), entry))
    assert.throws(() => assertDiagramSource(parser.parse(source), { ...entry, reviewedDigest: 'sha256:'+'0'.repeat(64) }))
    assert.throws(() => assertDiagramSource(parser.parse(source.replace(`### ${entry.headings[0]}\n`, `### ${entry.headings[0]}変更\n`)), entry))
    const changed = parser.parse(source)
    changed.children[c.range[0] + 1].type = 'code'
    const digest = diagramSourceDigest(changed, entry)
    assert.throws(() => assertDiagramSource(changed, { ...entry, sourceDigest: digest, reviewedDigest: digest }), /本文ブロック/)
  }
})

test('alignment MDX accepts only its fixed IDs and literal reading steps', () => {
  for (const c of cases) assert.deepEqual(findUnsafeMdx(`<AlignmentWalkthrough diagramId="${c.id}"><ReadingStep step="0">本文</ReadingStep></AlignmentWalkthrough>`), [])
  for (const mdx of [
    '<AlignmentWalkthrough />',
    '<AlignmentWalkthrough diagramId="unknown" />',
    '<AlignmentWalkthrough diagramId={"alignment-preference"} />',
    '<AlignmentWalkthrough {...props} />',
    '<AlignmentWalkthrough diagramId="alignment-feedback" onClick="handler" />',
    '<AlignmentWalkthrough diagramId="alignment-feedback"><ReadingStep step="5">本文</ReadingStep></AlignmentWalkthrough>'
  ]) assert.ok(findUnsafeMdx(mdx).length > 0)
})
