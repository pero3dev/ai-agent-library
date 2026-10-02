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
import { SECURITY_ADVERSITY_STAGES, securityAdversityFrame, exerciseReview, actionEvidence, repairReview, assetReview, assetPromotion, updateReview, memoryDataReview, peerBoundary, conditionalObservation } from '../../lib/security-adversity-model.mjs'
import { SECURITY_ADVERSITY_BINDINGS } from '../../lib/security-adversity-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SecurityAdversityWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SECURITY_ADVERSITY_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SECURITY_ADVERSITY_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SECURITY_ADVERSITY_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=securityAdversityFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>securityAdversityFrame(id,NaN),TypeError);
 }
 assert.throws(()=>securityAdversityFrame('unknown',0),TypeError);
});
test('an exercise needs all five explicit design conditions and does not launch an attack',()=>{const keys=['scopeDefined','goalDefined','capabilityDefined','evidenceDefined','isolatedEnvironment'];for(let m=0;m<32;m++)assert.deepEqual(exerciseReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,attackExecuted:false});assert.throws(()=>exerciseReview({scopeDefined:true}),TypeError)});
test('output request execution and state evidence remain distinct and incomplete observation cannot establish safety',()=>{const keys=['unsafeText','toolRequested','toolExecuted','stateChanged','observationComplete'];for(let m=0;m<32;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));const expected=!v.observationComplete?'unknown':v.toolExecuted&&v.stateChanged?'external-effect-observed':v.toolExecuted?'execution-observed':v.toolRequested?'request-observed':v.unsafeText?'output-observed':'not-observed';assert.deepEqual(actionEvidence(v),{finding:expected,safetyEstablished:false})}assert.throws(()=>actionEvidence({observationComplete:false}),TypeError)});
test('a prompt-only repair or missing variants regression or original case never satisfies structural repair review',()=>{const keys=['structuralControl','sameCasePassed','variantsPassed','regressionAdded'];for(let m=0;m<16;m++)assert.deepEqual(repairReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,allThreatsSafe:false});assert.throws(()=>repairReview({structuralControl:true}),TypeError)});
test('matching integrity alone cannot establish source license registry review or harmless behavior',()=>{const keys=['sourceChecked','integrityMatched','licenseChecked','registryChecked'];for(let m=0;m<16;m++)assert.deepEqual(assetReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,behaviorGuaranteed:false});assert.throws(()=>assetReview({integrityMatched:true}),TypeError)});
test('a passed isolated trial cannot omit scope approval original review or same version or grant rights',()=>{const keys=['reviewed','isolatedTrialPassed','rightsLimited','explicitApproval','sameVersion'];for(let m=0;m<32;m++)assert.deepEqual(assetPromotion(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,rightsGranted:false});assert.throws(()=>assetPromotion({isolatedTrialPassed:true}),TypeError)});
test('a changed version invalidates transfer of prior approval and needs both delta review and new trial',()=>{for(const sameVersion of [false,true])for(const oldReviewValid of [false,true])for(const deltaReviewed of [false,true])for(const newTrialPassed of [false,true])assert.deepEqual(updateReview({sameVersion,oldReviewValid,deltaReviewed,newTrialPassed}),{reviewCandidate:sameVersion?oldReviewValid:deltaReviewed&&newTrialPassed,oldApprovalTransferred:sameVersion&&oldReviewValid,updated:false});assert.throws(()=>updateReview({sameVersion:false}),TypeError)});
test('stored memory requires source write and tenant review and never turns into trusted instruction or ground truth',()=>{const keys=['writeChecked','sourceRecorded','tenantMatched'];for(let m=0;m<8;m++)assert.deepEqual(memoryDataReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,instructionTrusted:false,groundTruth:false});assert.throws(()=>memoryDataReview({sourceRecorded:true}),TypeError)});
test('peer delegation preserves source minimal rights and parent gates rather than raising authority from its output',()=>{const keys=['sourceRecorded','rightsLimited','parentGatePreserved'];for(let m=0;m<8;m++)assert.deepEqual(peerBoundary(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,instructionTrusted:false,rightsIncreased:false});assert.throws(()=>peerBoundary({rightsLimited:true}),TypeError)});
test('absence of a trigger condition only means it was not observed and cannot establish safety or execute an attack',()=>{for(const condition of [false,true])assert.deepEqual(conditionalObservation(condition),{path:condition?'trigger-condition-present':'trigger-not-observed',safetyEstablished:false,attackExecuted:false});assert.throws(()=>conditionalObservation('absent'),TypeError)});
