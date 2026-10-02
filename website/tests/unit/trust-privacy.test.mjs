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
import { TRUST_PRIVACY_STAGES, trustPrivacyFrame, provenanceClaim, detectorSignal, callbackReview, reportRoute, petCandidate, privacyUnit, dpIllustration, sequentialBudget, federatedLayers, privacyBasics } from '../../lib/trust-privacy-model.mjs'
import { TRUST_PRIVACY_BINDINGS } from '../../lib/trust-privacy-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['TrustPrivacyWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(TRUST_PRIVACY_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('privacy-enhancing-technologies.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, TRUST_PRIVACY_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(TRUST_PRIVACY_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=trustPrivacyFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>trustPrivacyFrame(id,NaN),TypeError);
 }
 assert.throws(()=>trustPrivacyFrame('unknown',0),TypeError);
});
test('present absent or invalid history never establishes truth AI origin or real verification',()=>{for(const status of ['present','absent','invalid'])assert.deepEqual(provenanceClaim(status),{historyClue:status==='present',truthEstablished:false,aiOriginEstablished:false,verified:false});assert.throws(()=>provenanceClaim('true'),TypeError)});
test('each detector signal remains a signal rather than identity evidence or a verdict',()=>{for(const signal of ['ai','human','uncertain'])assert.deepEqual(detectorSignal(signal),{signal,identityEstablished:false,verdict:false});assert.throws(()=>detectorSignal('authentic'),TypeError)});
test('urgency cannot override missing independent known contact identity approval or operation limits',()=>{const keys=['knownContact','independentChannel','identityMatched','dualApproval','withinLimit','urgent'];for(let m=0;m<64;m++)assert.deepEqual(callbackReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:(m&31)===31,paymentExecuted:false});assert.throws(()=>callbackReview({urgent:true}),TypeError)});
test('a claimed official received link does not establish a known official route or submit a report',()=>{for(const known of [false,true])assert.deepEqual(reportRoute(known),{reviewCandidate:known,navigated:false,reported:false});assert.throws(()=>reportRoute('official-name'),TypeError)});
test('PET application candidates do not establish optimality or privacy across all stages',()=>{for(const [scene,candidate] of [['aggregation','differential-privacy'],['training','federated-learning'],['processing','cryptography-or-tee']])assert.deepEqual(petCandidate(scene),{candidate,optimal:false,privacyGuaranteed:false});assert.throws(()=>petCandidate('strongest'),TypeError)});
test('row event and person units do not transfer a single event guarantee to all person records or all inference',()=>{for(const unit of ['row','event','person'])assert.deepEqual(privacyUnit(unit),{unit,protectsAllPersonRecords:unit==='person',allAttributeInferencePrevented:false,mechanismVerified:false});assert.throws(()=>privacyUnit('anonymous'),TypeError)});
test('DP illustration distinguishes the exponential coefficient additive delta and probability ceiling without claiming a proof',()=>{for(const epsilon of [0,0.1,0.5,1,2])for(const delta of [0,0.001,0.01,0.1]){const r=dpIllustration(epsilon,delta);assert.equal(r.referenceProbability,0.1);assert.equal(r.factor,Math.exp(epsilon));assert.equal(r.rightBound,Math.exp(epsilon)*0.1+delta);assert.equal(r.probabilityUpperBound,Math.min(1,r.rightBound));assert.equal(r.guaranteeVerified,false)}for(const e of [NaN,Infinity,-1,2.1])assert.throws(()=>dpIllustration(e,0),TypeError);for(const d of [NaN,Infinity,-1,0.11])assert.throws(()=>dpIllustration(0,d),TypeError);assert.ok(dpIllustration(1,0).rightBound>dpIllustration(0.1,0).rightBound);assert.ok(dpIllustration(0.1,0.01).rightBound>dpIllustration(0.1,0).rightBound)});
test('sequential composition sums both fixed parameters at zero and the upper release boundary without verifying a mechanism',()=>{for(let n=0;n<=20;n++)assert.deepEqual(sequentialBudget(n),{releases:n,epsilon:n*0.1,delta:n*0.000001,mechanismVerified:false});for(const n of [-1,21,1.1,NaN,Infinity])assert.throws(()=>sequentialBudget(n),TypeError)});
test('federated input protection and output privacy remain independent candidates and never guarantee privacy from raw data placement',()=>{for(const mode of ['none','aggregation','dp','both'])assert.deepEqual(federatedLayers(mode),{rawDataCentralized:false,aggregationCandidate:['aggregation','both'].includes(mode),outputPrivacyCandidate:['dp','both'].includes(mode),privacyGuaranteed:false});assert.throws(()=>federatedLayers('no-leak'),TypeError)});
test('privacy basics require minimization access mask evaluation and residual requirements without proving no reidentification or legal compliance',()=>{const keys=['minimized','accessLimited','maskEvaluated','residualRequirementChecked'];for(let m=0;m<16;m++)assert.deepEqual(privacyBasics(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,reidentificationPrevented:false,compliant:false});assert.throws(()=>privacyBasics({minimized:true}),TypeError)});
