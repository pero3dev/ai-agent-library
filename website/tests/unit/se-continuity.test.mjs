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
import { SE_CONTINUITY_STAGES, legacyEquivalence, enterpriseRoute } from '../../lib/se-continuity-model.mjs'
import { SE_CONTINUITY_BINDINGS } from '../../lib/se-continuity-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SeContinuityWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SE_CONTINUITY_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SE_CONTINUITY_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})







test('equivalence needs executed same-condition comparison and reviewed scope without approving desired requirements',()=>{
 for(const executed of [false,true])for(const sameConditions of [false,true])for(const scopeReviewed of [false,true])assert.deepEqual(legacyEquivalence({executed,sameConditions,scopeReviewed}),{comparisonEvidenceReady:executed&&sameConditions&&scopeReviewed,desiredRequirementsVerified:false,allBehaviorGuaranteed:false});
 assert.throws(()=>legacyEquivalence({executed:true,sameConditions:true}),TypeError);
});
test('contract classification and route all need explicit confirmation and never determine legal compliance',()=>{
 for(const contract of ['allowed','denied','unknown'])for(const classified of [false,true])for(const routeVerified of [false,true])assert.deepEqual(enterpriseRoute({contract,classified,routeVerified}),{candidateReady:contract==='allowed'&&classified&&routeVerified,legalComplianceDetermined:false,unknownPermitted:false});
 assert.throws(()=>enterpriseRoute({contract:'maybe',classified:true,routeVerified:true}),TypeError);
});
