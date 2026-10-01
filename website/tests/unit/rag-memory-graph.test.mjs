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
import { RAG_MEMORY_GRAPH_STAGES, ragMemoryGraphFrame, ragEvidence, memoryExtraction, memoryDeletion, graphInvestment } from '../../lib/rag-memory-graph-model.mjs'
import { RAG_MEMORY_GRAPH_BINDINGS } from '../../lib/rag-memory-graph-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['RagMemoryGraphWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(RAG_MEMORY_GRAPH_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, RAG_MEMORY_GRAPH_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(RAG_MEMORY_GRAPH_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=ragMemoryGraphFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>ragMemoryGraphFrame(id,NaN),TypeError);
 }
 assert.throws(()=>ragMemoryGraphFrame('unknown',0),TypeError);
});
test('no hit no authority or unsupported citation cannot become an executed answer',()=>{
 for(const hit of [false,true])for(const authorized of [false,true])for(const supports of [false,true])assert.deepEqual(ragEvidence({hit,authorized,supports}),{next:!authorized?'block':!hit?'not-found':!supports?'verify-support':'candidate',answerExecuted:false});
 assert.throws(()=>ragEvidence({hit:true,authorized:true}),TypeError);
});
test('a sensitive memory requires explicit consent and source before becoming a save candidate',()=>{
 for(const stable of [false,true])for(const sourceRecorded of [false,true])for(const sensitive of [false,true])for(const explicitConsent of [false,true])assert.deepEqual(memoryExtraction({stable,sourceRecorded,sensitive,explicitConsent}),{saveCandidate:stable&&sourceRecorded&&(!sensitive||explicitConsent),memoryWritten:false});
 assert.throws(()=>memoryExtraction({stable:true,sourceRecorded:true,sensitive:true}),TypeError);
});
test('deleting an item does not complete the vector backup and derivative deletion paths',()=>{
 for(const itemRemoved of [false,true])for(const indexRemoved of [false,true])for(const backupHandled of [false,true])for(const derivativesRemoved of [false,true])assert.deepEqual(memoryDeletion({itemRemoved,indexRemoved,backupHandled,derivativesRemoved}),{completeCandidate:itemRemoved&&indexRemoved&&backupHandled&&derivativesRemoved,deletionExecuted:false});
 assert.throws(()=>memoryDeletion({itemRemoved:true,indexRemoved:true,backupHandled:'unknown',derivativesRemoved:true}),TypeError);
});
test('graph evaluation needs observed baseline failure relation need and accepted maintenance without quality guarantees',()=>{
 for(const baselineFails of [false,true])for(const relationNeeded of [false,true])for(const maintenanceAccepted of [false,true])assert.deepEqual(graphInvestment({baselineFails,relationNeeded,maintenanceAccepted}),{evaluationCandidate:baselineFails&&relationNeeded&&maintenanceAccepted,deploymentExecuted:false,qualityGuaranteed:false});
 assert.throws(()=>graphInvestment({baselineFails:true,relationNeeded:true}),TypeError);
});
