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
import { DURABLE_CONTRACT_STAGES, tenantContext, requestIdempotency, approvalScope } from '../../lib/durable-tenant-api-model.mjs'
import { DURABLE_CONTRACT_BINDINGS } from '../../lib/durable-tenant-api-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['DurableContractWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(DURABLE_CONTRACT_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.includes("multi-tenancy")?2:3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, DURABLE_CONTRACT_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('unverified or model-generated tenant context cannot authorize scoped work',()=>{
 assert.equal(tenantContext('verified').permit,true);
 for(const mode of ['missing','generated'])assert.equal(tenantContext(mode).permit,false);
 assert.throws(()=>tenantContext('__proto__'),RangeError);
});
test('same key with changed intent is rejected, while same intent reuses the original job',()=>{
 assert.deepEqual(requestIdempotency('match'),{create:false,reject:false,reuse:true});
 assert.deepEqual(requestIdempotency('different'),{create:false,reject:true,reuse:false});
 assert.equal(requestIdempotency('new').create,true);
 assert.throws(()=>requestIdempotency('constructor'),RangeError);
});
test('approval is not carried to changed targets or blindly applied to late results',()=>{
 assert.equal(approvalScope('same').execute,true);
 for(const mode of ['changed','late'])assert.equal(approvalScope(mode).execute,false);
 assert.throws(()=>approvalScope(''),RangeError);
});
