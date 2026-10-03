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
import { GOVERNANCE_SAFETY_STAGES, governanceSafetyFrame, regulatoryReview, legislativeStage, deletionScope, contractScope, standardsKind, harmonizationReview, accreditationChain, managementReview, reportCoverage, frontierProcurement } from '../../lib/governance-safety-model.mjs'
import { GOVERNANCE_SAFETY_BINDINGS } from '../../lib/governance-safety-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['GovernanceSafetyWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(GOVERNANCE_SAFETY_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('compliance-and-governance.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, GOVERNANCE_SAFETY_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(GOVERNANCE_SAFETY_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=governanceSafetyFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>governanceSafetyFrame(id,NaN),TypeError);
 }
 assert.throws(()=>governanceSafetyFrame('unknown',0),TypeError);
});
test('regulatoryReview: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["jurisdictionChecked","useClassified","roleChecked","currentSourceChecked"];for(let m=0;m<16;m++)assert.deepEqual(regulatoryReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,...{"legalConclusion":false}});assert.throws(()=>regulatoryReview({}),TypeError)});
test('deletionScope: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["logs","memory","evaluation","derived"];for(let m=0;m<16;m++)assert.deepEqual(deletionScope(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{scopeReviewCandidate:m===15,...{"deleted":false}});assert.throws(()=>deletionScope({}),TypeError)});
test('contractScope: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["regionChecked","accountChecked","billingChecked","endpointChecked"];for(let m=0;m<16;m++)assert.deepEqual(contractScope(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,...{"zeroPriceDeterminesTerms":false,"contractInterpreted":false}});assert.throws(()=>contractScope({}),TypeError)});
test('harmonizationReview: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["published","commissionAssessed","ojReferenced","versionMatched","clausesMatched"];for(let m=0;m<32;m++)assert.deepEqual(harmonizationReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{presumptionReviewCandidate:m===31,...{"legalEffectEstablished":false}});assert.throws(()=>harmonizationReview({}),TypeError)});
test('accreditationChain: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["accreditorChecked","certifierScopeChecked","organizationScopeChecked"];for(let m=0;m<8;m++)assert.deepEqual(accreditationChain(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{chainReviewCandidate:m===7,...{"certificationIssued":false,"outputSafetyGuaranteed":false}});assert.throws(()=>accreditationChain({}),TypeError)});
test('managementReview: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["realOperations","requirementsMapped","gapsAddressed","recordsAvailable","sustainable"];for(let m=0;m<32;m++)assert.deepEqual(managementReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,...{"certified":false,"outputSafetyGuaranteed":false}});assert.throws(()=>managementReview({}),TypeError)});
test('frontierProcurement: every required condition and all incomplete subsets preserve the limited claim',()=>{const keys=["frameworkChecked","modelCardChecked","coverageMatched","updatesChecked","thirdPartyScopeChecked"];for(let m=0;m<32;m++)assert.deepEqual(frontierProcurement(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,...{"applicationSafe":false,"modelSelected":false}});assert.throws(()=>frontierProcurement({}),TypeError)});
test('legal discussion enactment publication and force are distinct and never decide actual applicability',()=>{for(const stage of ['discussion','enacted','promulgated','in-force'])assert.deepEqual(legislativeStage(stage),{stage,effectiveObserved:stage==='in-force',finalRuleInferred:false,actualApplicabilityDecided:false});assert.throws(()=>legislativeStage('announced'),TypeError)});
test('standard kinds do not turn a guide framework or certifier requirements into organization certification',()=>{for(const kind of ['requirements','guidance','framework','certifier','soft-law'])assert.deepEqual(standardsKind(kind),{certificationCandidate:kind==='requirements',aiSafetyGuaranteed:false,certified:false});assert.throws(()=>standardsKind('safe'),TypeError)});
test('publication never extends report coverage and invalid dates or future coverage cannot enter the illustration',()=>{for(const modelIncluded of [true,false])for(const versionMatched of [true,false])assert.deepEqual(reportCoverage({publicationDate:'2026-08-14',coverageDate:'2026-07-15',modelIncluded,versionMatched}),{reviewCandidate:modelIncluded&&versionMatched,publicationExtendsCoverage:false,allModelsAssessed:false,verified:false});for(const d of ['invalid','2026-02-30','2026-13-01'])assert.throws(()=>reportCoverage({publicationDate:d,coverageDate:'2026-07-15',modelIncluded:true,versionMatched:true}),TypeError);assert.throws(()=>reportCoverage({publicationDate:'2026-07-14',coverageDate:'2026-07-15',modelIncluded:true,versionMatched:true}),TypeError)});
