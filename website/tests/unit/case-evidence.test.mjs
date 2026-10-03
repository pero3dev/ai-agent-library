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
import { CASE_EVIDENCE_STAGES, caseEvidenceFrame, supportGate, supportRelease, analysisValidation, mailCapabilities, mailEgress, mailContainment } from '../../lib/case-evidence-model.mjs'
import { CASE_EVIDENCE_BINDINGS } from '../../lib/case-evidence-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CaseEvidenceWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CASE_EVIDENCE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CASE_EVIDENCE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(CASE_EVIDENCE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=caseEvidenceFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>caseEvidenceFrame(id,NaN),TypeError);
 }
 assert.throws(()=>caseEvidenceFrame('unknown',0),TypeError);
});
test('supportGate: each missing condition blocks only its stated review candidate without executing or verifying an action',()=>{const keys=["identity","authorizedRetrieval","capacity","dataAgreement"];for(let m=0;m<16;m++)assert.deepEqual(supportGate(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,...{"deployed":false}});assert.throws(()=>supportGate({}),TypeError)});
test('analysisValidation: each missing condition blocks only its stated review candidate without executing or verifying an action',()=>{const keys=["knownValueMatched","independentMeaningChecked","conditionsShown","assumptionsClear","regressionCovered"];for(let m=0;m<32;m++)assert.deepEqual(analysisValidation(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,...{"queryVerified":false,"allErrorsPrevented":false}});assert.throws(()=>analysisValidation({}),TypeError)});
test('mailContainment: each missing condition blocks only its stated review candidate without executing or verifying an action',()=>{const keys=["imageFetchBlocked","egressBlocked","sessionsStopped","controlsVerified","freshHistory"];for(let m=0;m<32;m++)assert.deepEqual(mailContainment(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{limitedRestartCandidate:m===31,...{"priorSendsUndone":false,"restarted":false}});assert.throws(()=>mailContainment({}),TypeError)});
test('shadow canary and expanded categories keep human send judgment and do not cover all inquiries',()=>{for(const mode of ['shadow','canary','expanded'])assert.deepEqual(supportRelease(mode),{draftVisible:mode!=='shadow',humanSendDecision:true,allInquiriesCovered:false,actualRelease:false});assert.throws(()=>supportRelease('autonomous'),TypeError)});
test('original feature additions accumulate three capabilities without declaring an earlier stage safe',()=>{for(let month=0;month<=2;month++)assert.deepEqual(mailCapabilities(month),{untrustedContent:true,privateData:month>=1,externalChannel:month>=2,trifecta:month>=2,safe:false});for(const month of [-1,3,1.5,NaN])assert.throws(()=>mailCapabilities(month),TypeError)});
test('proxy never hides the sensitive URL from its upstream and no illustration sends a request',()=>{for(const externalFetchAllowed of [true,false])for(const sensitiveUrl of [true,false])for(const proxy of [true,false])assert.deepEqual(mailEgress({externalFetchAllowed,sensitiveUrl,proxy}),{illustratedLeakPath:externalFetchAllowed&&sensitiveUrl,proxyHidesData:false,requestSent:false});assert.throws(()=>mailEgress({proxy:true}),TypeError)});
