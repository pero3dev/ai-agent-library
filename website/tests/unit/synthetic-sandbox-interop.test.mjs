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
import { SYNTHETIC_SANDBOX_INTEROP_STAGES, syntheticSandboxInteropFrame, SYNTHETIC_CONDITIONS, syntheticAdmission, syntheticEvaluationSeparation, sandboxEgress, sandboxRelease, peerDelegation } from '../../lib/synthetic-sandbox-interop-model.mjs'
import { SYNTHETIC_SANDBOX_INTEROP_BINDINGS } from '../../lib/synthetic-sandbox-interop-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SyntheticSandboxInteropWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SYNTHETIC_SANDBOX_INTEROP_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SYNTHETIC_SANDBOX_INTEROP_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SYNTHETIC_SANDBOX_INTEROP_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=syntheticSandboxInteropFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>syntheticSandboxInteropFrame(id,NaN),TypeError);
 }
 assert.throws(()=>syntheticSandboxInteropFrame('unknown',0),TypeError);
});
test('synthetic admission keeps all seven independent conditions and does not train or guarantee',()=>{
 for(let mask=0;mask<128;mask++){const conditions=Object.fromEntries(SYNTHETIC_CONDITIONS.map((key,i)=>[key,Boolean(mask&(1<<i))]));assert.deepEqual(syntheticAdmission(conditions),{reviewCandidate:mask===127,trainingExecuted:false,qualityGuaranteed:false,legalComplianceGuaranteed:false})}
 assert.throws(()=>syntheticAdmission({purpose:true}),TypeError)
});
test('paraphrases cannot replace separate seeds paths and independent evaluation',()=>{
 for(let mask=0;mask<8;mask++)assert.deepEqual(syntheticEvaluationSeparation({seedsDisjoint:Boolean(mask&1),pathsSeparated:Boolean(mask&2),independentEvaluation:Boolean(mask&4)}),{reviewCandidate:mask===7,independenceGuaranteed:false});
 assert.throws(()=>syntheticEvaluationSeparation({seedsDisjoint:true,pathsSeparated:true}),TypeError)
});
test('egress blocks internal or unapproved routes and keeps returned output review independent',()=>{
 for(let mask=0;mask<16;mask++){const networkRequired=Boolean(mask&1),destinationAllowed=Boolean(mask&2),internalTarget=Boolean(mask&4),hostOutputsChecked=Boolean(mask&8);const actual=sandboxEgress({networkRequired,destinationAllowed,internalTarget,hostOutputsChecked});assert.equal(actual.network,['3','11'].includes(String(mask))?'route-candidate':'blocked');assert.equal(actual.outputReviewPending,mask<8);assert.equal(actual.transmissionExecuted,false)}
 assert.throws(()=>sandboxEgress({networkRequired:true,destinationAllowed:true,internalTarget:false}),TypeError)
});
test('closing execution cannot omit environment resources or returned outputs',()=>{
 for(let mask=0;mask<8;mask++)assert.deepEqual(sandboxRelease({environmentDestroyed:Boolean(mask&1),resourcesReleased:Boolean(mask&2),returnedOutputsChecked:Boolean(mask&4)}),{cleanupReviewCandidate:mask===7,deletionExecuted:false});
 assert.throws(()=>sandboxRelease({environmentDestroyed:true,resourcesReleased:true}),TypeError)
});
test('delegation requires known partner identity current scope and minimized disclosure without a message',()=>{
 for(let mask=0;mask<16;mask++)assert.deepEqual(peerDelegation({knownPartner:Boolean(mask&1),identityVerified:Boolean(mask&2),scopeAllowed:Boolean(mask&4),disclosureMinimized:Boolean(mask&8)}),{reviewCandidate:mask===15,messageSent:false,peerTrustedUnconditionally:false});
 assert.throws(()=>peerDelegation({knownPartner:true,identityVerified:true,scopeAllowed:true}),TypeError)
});
