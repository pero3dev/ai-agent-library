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
import { wrapAttentionSection } from '../../lib/attention-decoration.mjs'
import { applyDecorations } from '../../lib/doc-decorations.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'

const reviewedRegistry = structuredClone(diagramRegistry)
for (const entry of reviewedRegistry.diagrams) {
  entry.reviewedDigest = entry.sourceDigest
  entry.status = 'reviewed'
}

const route = '/docs/llm-internals/transformer-architecture'
const source = readFileSync(new URL('../../../docs/11-llm-internals/transformer-architecture.md', import.meta.url), 'utf8')
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)

// Compare content rather than container nodes: the one unordered list is split
// to associate the mask explanation with its own animation stage.
function contentFacts(node, facts = []) {
  if (node.value !== undefined) facts.push({ type: node.type, value: node.value })
  if (node.type === 'heading') facts.push({ type: node.type, depth: node.depth })
  if (node.type === 'link') facts.push({ type: node.type, url: node.url, title: node.title })
  for (const child of node.children ?? []) contentFacts(child, facts)
  return facts
}

test('the existing article prose, links, headings, and formulas survive attention wrapping and MDX serialization', () => {
  const tree = parser.parse(source)
  const original = contentFacts(tree)
  wrapAttentionSection(tree, route, reviewedRegistry)
  assert.deepEqual(contentFacts(tree), original)

  const index = tree.children.findIndex(node => node.name === 'AttentionWalkthrough')
  assert.ok(index > 0)
  assert.equal(tree.children[index - 1].type, 'heading')
  assert.equal(tree.children[index - 1].children[0].value, '自己注意の数式')
  assert.equal(tree.children[index + 1].type, 'heading')
  assert.equal(tree.children[index + 1].children[0].value, '多頭注意')
  const steps = tree.children[index].children
  assert.deepEqual(steps.map(node => node.attributes[0].value), ['0', '1', '2', '3', '4'])
  assert.ok(steps.every(node => node.name === 'AttentionStep' && node.children.length > 0))
  assert.match(contentFacts(steps[3]).map(fact => fact.value ?? '').join(''), /因果マスク/)

  const mdx = String(writer.stringify(tree))
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(contentFacts(mdxParser.parse(mdx)), original)
})

test('attention decoration is a no-op outside the exact article route', () => {
  for (const otherRoute of ['/docs/concepts/agent-loop', `${route}-extra`, undefined]) {
    const tree = parser.parse(source)
    const original = structuredClone(tree)
    wrapAttentionSection(tree, otherRoute, reviewedRegistry)
    assert.deepEqual(tree, original)
  }
})

test('a changed source section stops sync before a misleading diagram can be paired with it', () => {
  for (const changed of [
    source.replace('### 自己注意の数式', '### 自己注意の計算'),
    source.replace('### 多頭注意', '追加の説明です。\n\n### 多頭注意'),
    source.replace('**因果マスク(causal mask)**', '**別の機構**')
  ]) {
    assert.throws(() => wrapAttentionSection(parser.parse(changed), route, reviewedRegistry), /動的図/)
  }
})

test('the shared decoration pipeline retains glossary links within the attention steps', () => {
  const tree = parser.parse(source)
  applyDecorations(tree, {
    route,
    registry: reviewedRegistry,
    glossary: [{ name: '縮小付き内積注意', href: '/docs/llm-foundations/attention-and-context', summary: '自己注意の計算' }]
  })
  const walkthrough = tree.children.find(node => node.name === 'AttentionWalkthrough')
  assert.ok(walkthrough)
  const mdx = String(writer.stringify(walkthrough))
  assert.match(mdx, /GlossaryTerm/)
  assert.deepEqual(findUnsafeMdx(mdx), [])
})
