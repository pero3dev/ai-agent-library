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
import { SE_PROCESS_STAGES, seEvidenceGate, seInformationRoute } from '../../lib/se-process-model.mjs'
import { SE_PROCESS_BINDINGS } from '../../lib/se-process-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SeProcessWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SE_PROCESS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SE_PROCESS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})





test('green needs a specification oracle, execution and reviewed scope and never guarantees no defects',()=>{
 for(const green of [false,true])for(const oracle of ['implementation','specification'])for(const executed of [false,true])for(const scopeReviewed of [false,true])assert.deepEqual(seEvidenceGate({green,oracle,executed,scopeReviewed}),{supportsReviewedScope:green&&oracle==='specification'&&executed&&scopeReviewed,noDefectsGuaranteed:false,canFabricateEvidence:false});
 assert.throws(()=>seEvidenceGate({green:true,oracle:'unknown',executed:true,scopeReviewed:true}),TypeError);
});
test('masking never substitutes for approval of the information route',()=>{
 for(const approved of [false,true])for(const abstracted of [false,true])assert.deepEqual(seInformationRoute({approved,abstracted}),{canSend:approved,abstracted,approvalReplacedByMasking:false});
 assert.throws(()=>seInformationRoute({abstracted:true}),TypeError);
});
