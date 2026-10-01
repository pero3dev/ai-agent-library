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
import { ACTION_BOUNDARY_STAGES, actionBoundaryFrame, approvalOutcome, retryBoundary } from '../../lib/action-boundaries-model.mjs'
import { ACTION_BOUNDARY_BINDINGS } from '../../lib/action-boundaries-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

test('waiting, denial and timeout close execution; human approval cannot make an unknown effect safe to resend', () => {
  for (const status of ['waiting','denied','timeout']) assert.equal(approvalOutcome(status).execute, false)
  assert.equal(approvalOutcome('approved').execute, true)
  assert.ok(approvalOutcome('timeout').observation)
  assert.equal(retryBoundary('unknown').automaticRetry, false)
  assert.throws(() => approvalOutcome('__proto__'), RangeError)
  assert.throws(() => retryBoundary('__proto__'), RangeError)
})
test('both safe contracts still stop at exhaustion, repeated failures or a non-retryable error', () => {
  for (const contract of ['idempotent','atomic']) {
    assert.equal(retryBoundary(contract).automaticRetry, true)
    for (const options of [{remaining:0},{repeated:true},{retryable:false}]) assert.equal(retryBoundary(contract,options).automaticRetry, false)
  }
  for (const [id,stages] of Object.entries(ACTION_BOUNDARY_STAGES)) {
    assert.equal(actionBoundaryFrame(id,-1).stage,0)
    assert.equal(actionBoundaryFrame(id,100).stage,stages.length-1)
  }
})
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['ActionBoundariesWalkthrough','ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? {children:node.children.flatMap(unwrap)} : {}) }]
for (const article of [...new Set(Object.values(ACTION_BOUNDARY_BINDINGS).map(b => b.article))]) test(`${article}: preserve the complete original, including all tables, code and TODOs`, () => {
  const entries = diagramRegistry.diagrams.filter(e => e.article === article)
  assert.equal(entries.length,2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`,import.meta.url),'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree,entries[0].route)
  assert.deepEqual(unwrap(tree),[original])
  assert.deepEqual(metadata.diagramIds,entries.map(e => e.id))
  for (const e of entries) assert.equal(e.stageCount,ACTION_BOUNDARY_STAGES[e.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx),[])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx),metadata),metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${entries[0].id}"`,'diagramId="unregistered"')).length > 0)
})
