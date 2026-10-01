import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import { CONTEXT_DESIGN_STAGES, budgetResponse, contextTransfer, compactionRetention, preprocessingShape } from '../../lib/context-design-model.mjs'
import { CONTEXT_DESIGN_BINDINGS } from '../../lib/context-design-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

test('valid child data cannot open the parent execution path while approval is pending', () => {
  assert.deepEqual(contextTransfer('waiting'), { validData: true, parentApproved: false, execute: false })
  assert.equal(contextTransfer('invalid').execute, false)
  assert.equal(contextTransfer('permitted').execute, true)
  assert.throws(() => contextTransfer('__proto__'), RangeError)
})
test('missing decisions or constraints prevent retention matching; unresolved overflow stops', () => {
  for (const missing of ['decisions', 'constraints']) {
    const frame = compactionRetention(missing)
    assert.equal(frame.matched, false)
    assert.ok(!frame.retained.includes(frame.missing))
  }
  assert.equal(compactionRetention('none').retained.length, 5)
  assert.equal(budgetResponse('overflow').stop, true)
  assert.equal(budgetResponse('summarized').stop, false)
  assert.equal(budgetResponse('reduced').stop, false)
  assert.ok(preprocessingShape('summary').includes('細部は原資料へ戻る'))
})

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['ContextDesignWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CONTEXT_DESIGN_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and dated specifications`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CONTEXT_DESIGN_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})
