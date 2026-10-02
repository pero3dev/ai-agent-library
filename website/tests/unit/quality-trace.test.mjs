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
import { QUALITY_TRACE_STAGES, qualityTraceFrame, counterfactualComparison, stratifiedCounts, fairnessRemediation, japaneseCheckRoute, japaneseJudgeAcceptance, traceScope, toyTraceTail, traceDataGate } from '../../lib/quality-trace-model.mjs'
import { QUALITY_TRACE_BINDINGS } from '../../lib/quality-trace-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['QualityTraceWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(QUALITY_TRACE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, QUALITY_TRACE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(QUALITY_TRACE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=qualityTraceFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>qualityTraceFrame(id,NaN),TypeError);
 }
 assert.throws(()=>qualityTraceFrame('unknown',0),TypeError);
});
test('counterfactual pairs require fixed request and other conditions and never decide legal unfairness',()=>{
 for(let m=0;m<16;m++){const result=counterfactualComparison(Object.fromEntries(['attributeOnly','requestFixed','otherFixed','different'].map((k,i)=>[k,Boolean(m&(1<<i))])));assert.deepEqual(result,{pairReady:(m&7)===7,differenceToReview:m===15,legalUnfairnessDetermined:false,modelExecuted:false})}assert.throws(()=>counterfactualComparison({attributeOnly:true}),TypeError)
});
test('stratified rates retain small denominators and weighted overall counts rather than averaging rates',()=>{
 const result=stratifiedCounts([{total:10,correct:9},{total:2,correct:1}]);assert.equal(result.rate,10/12);assert.equal(result.groups[1].rate,.5);assert.notEqual(result.rate,(.9+.5)/2);assert.equal(result.fairnessGuaranteed,false);
 for(let total=0;total<=20;total++)for(let correct=0;correct<=total;correct++)assert.equal(stratifiedCounts([{total,correct}]).groups[0].rate,total?correct/total:null);assert.equal(stratifiedCounts([]).rate,null);assert.throws(()=>stratifiedCounts([{total:2,correct:3}]),TypeError)
});
test('fairness remediation retains measured limits Japanese criteria and stakeholder responsibility',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(fairnessRemediation(Object.fromEntries(['limitsMeasured','japaneseIncluded','criteriaDefined','stakeholdersIncluded'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,fairnessGuaranteed:false,remediationExecuted:false});assert.throws(()=>fairnessRemediation({limitsMeasured:true}),TypeError)
});
test('Japanese context and ambiguous style cannot be reduced to code checks and scope exceptions remain required',()=>{
 for(const kind of ['notation','style','context'])for(const scopeDefined of [false,true])for(const exceptionsDefined of [false,true])assert.deepEqual(japaneseCheckRoute({kind,scopeDefined,exceptionsDefined}),{route:kind==='notation'&&scopeDefined&&exceptionsDefined?'code':'human-or-validated-judge',naturalnessGuaranteed:false,graded:false});assert.throws(()=>japaneseCheckRoute({kind:'ban-all-honorifics',scopeDefined:true,exceptionsDefined:true}),TypeError)
});
test('Japanese judge adoption requires human labels and both false acceptance and false rejection with blindspot checks',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(japaneseJudgeAcceptance(Object.fromEntries(['humanJapanese','wrongAcceptedChecked','rightRejectedChecked','blindspotsChecked'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,gradingAbilityGuaranteed:false,modelExecuted:false});assert.throws(()=>japaneseJudgeAcceptance({humanJapanese:true}),TypeError)
});
test('trace span fields preserve parent relationships task versions and tool result or error without collection claims',()=>{
 for(const span of ['common','task','llm','tool']){const r=traceScope(span);assert.equal(r.traceCollected,false);assert.equal(r.qualityVerified,false)}assert.ok(traceScope('common').fields.includes('parent'));assert.ok(traceScope('task').fields.includes('versions'));assert.ok(traceScope('tool').fields.includes('result-or-error'));assert.throws(()=>traceScope('unknown'),TypeError)
});
test('equal means can hide different tails and empty samples cannot establish production percentiles or causes',()=>{
 const equal=toyTraceTail([4,4,4,4]),tail=toyTraceTail([1,1,1,13]);assert.equal(equal.mean,tail.mean);assert.equal(equal.max,4);assert.equal(tail.max,13);assert.deepEqual(toyTraceTail([]),{count:0,mean:null,max:null,productionPercentileMeasured:false,causeDetermined:false});assert.equal(tail.productionPercentileMeasured,false);assert.equal(tail.causeDetermined,false);for(const sample of [[0],[21],[1.5],Array(9).fill(1)])assert.throws(()=>toyTraceTail(sample),TypeError)
});
test('trace masking never bypasses retention access and allowed storage location or implies actual transmission',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(traceDataGate(Object.fromEntries(['maskDesigned','retentionDesigned','accessDesigned','locationAllowed'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{designCandidate:m===15,dataStored:false,externalSent:false,leakagePrevented:false});assert.throws(()=>traceDataGate({maskDesigned:true}),TypeError)
});
