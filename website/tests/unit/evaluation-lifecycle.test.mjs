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
import { EVALUATION_LIFECYCLE_STAGES, evaluationLifecycleFrame, regressionScope, regressionGate, onlineRelease, benchmarkComparable, benchmarkToyPareto } from '../../lib/evaluation-lifecycle-model.mjs'
import { EVALUATION_LIFECYCLE_BINDINGS } from '../../lib/evaluation-lifecycle-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['EvaluationLifecycleWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(EVALUATION_LIFECYCLE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, EVALUATION_LIFECYCLE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(EVALUATION_LIFECYCLE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=evaluationLifecycleFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>evaluationLifecycleFrame(id,NaN),TypeError);
 }
 assert.throws(()=>evaluationLifecycleFrame('unknown',0),TypeError);
});
test('change scope preserves unchanged implementation and model-specific judge validation',()=>{
 assert.deepEqual(regressionScope('internal'),{layers:['L1'],fullSuite:false,judgeRevalidation:false,testsExecuted:false});
 assert.deepEqual(regressionScope('prompt'),{layers:['L1','L2','L3'],fullSuite:true,judgeRevalidation:false,testsExecuted:false});
 assert.deepEqual(regressionScope('model'),{layers:['L1','L2','L3'],fullSuite:true,judgeRevalidation:true,testsExecuted:false});
 assert.throws(()=>regressionScope('unknown'),TypeError)
});
test('regression gate requires baseline and budget even when absolute quality passes',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(regressionGate(Object.fromEntries(['absoluteMet','baselineMet','budgetMet','failuresReviewed'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,ciExecuted:false,qualityGuaranteed:false});
 assert.throws(()=>regressionGate({absoluteMet:true}),TypeError)
});
test('online release candidates require every prior condition and rollback cannot undo effects',()=>{
 for(let m=0;m<128;m++)assert.deepEqual(onlineRelease(Object.fromEntries(['offlineMet','assignmentStable','criteriaFixed','sampleSufficient','periodObserved','guardrailsMet','rollbackReady'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===127,rollbackCandidate:!Boolean(m&32),deployed:false,effectsUndone:false});
 assert.throws(()=>onlineRelease({offlineMet:true}),TypeError)
});
test('benchmark comparability includes effort resources trials grader and task version',()=>{
 for(let m=0;m<128;m++)assert.deepEqual(benchmarkComparable(Object.fromEntries(['sameVersion','sameTasks','sameHarness','sameEffort','sameResources','sameTrials','sameGrader'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{comparable:m===127,qualityGuaranteed:false});
 assert.throws(()=>benchmarkComparable({sameVersion:true}),TypeError)
});
test('toy Pareto handles strict domination ties missing cost and invalid data without zero imputation',()=>{
 const base=[{id:'A',cost:1,score:3},{id:'B',cost:2,score:4}];
 for(const [c,frontier,comparable] of [[{id:'C',cost:4,score:5},true,true],[{id:'C',cost:4,score:3},false,true],[{id:'C',cost:null,score:5},false,false],[{id:'C',cost:2,score:4},true,true]])assert.deepEqual(benchmarkToyPareto([...base,c])[2],{id:'C',frontier,comparable,qualityGuaranteed:false});
 assert.deepEqual(benchmarkToyPareto([]),[]);
 for(const p of [[{id:'x',cost:-1,score:2}],[{id:'x',cost:NaN,score:2}],[{id:'x',cost:1,score:6}],[...base,{id:'A',cost:2,score:4}]])assert.throws(()=>benchmarkToyPareto(p),TypeError);
});
