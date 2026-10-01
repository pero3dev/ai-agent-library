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
import { RETRIEVAL_DATA_STAGES, retrievalDataFrame, embeddingInput, derivedSearch } from '../../lib/retrieval-data-model.mjs'
import { RETRIEVAL_DATA_BINDINGS } from '../../lib/retrieval-data-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['RetrievalDataWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(RETRIEVAL_DATA_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, RETRIEVAL_DATA_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(RETRIEVAL_DATA_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=retrievalDataFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>retrievalDataFrame(id,NaN),TypeError);
 }
 assert.throws(()=>retrievalDataFrame('unknown',0),TypeError);
});
test('input requires counted length and explicit recorded truncation without an API call',()=>{
 for(const counted of [false,true])for(const overLimit of [false,true])for(const truncateExplicit of [false,true])for(const omissionRecorded of [false,true])assert.deepEqual(embeddingInput({counted,overLimit,truncateExplicit,omissionRecorded}),{next:!counted?'count':!overLimit?'candidate':truncateExplicit&&omissionRecorded?'evaluate-truncation':'split',apiExecuted:false});
 assert.throws(()=>embeddingInput({counted:true,overLimit:true,truncateExplicit:true}),TypeError);
});
test('lineage needs tenant ACL applicable version and no deleted source; deletion needs all derivatives',()=>{
 for(const sameTenant of [false,true])for(const aclInherited of [false,true])for(const versionApplies of [false,true])for(const deletedSource of [false,true])for(const derivativesDeleted of [false,true])assert.deepEqual(derivedSearch({sameTenant,aclInherited,versionApplies,deletedSource,derivativesDeleted}),{searchCandidate:!deletedSource&&sameTenant&&aclInherited&&versionApplies,deletionComplete:deletedSource&&derivativesDeleted,authorizationExecuted:false});
 assert.throws(()=>derivedSearch({sameTenant:true,aclInherited:true,versionApplies:'unknown',deletedSource:false,derivativesDeleted:false}),TypeError);
});
