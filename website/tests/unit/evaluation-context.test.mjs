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
import { EVALUATION_CONTEXT_STAGES, evaluationContextFrame, evaluationEnvironmentLayer, evaluationReproducibility, simulatorUtterance, simulatorAcceptance, calibrationBins, selectivePrediction } from '../../lib/evaluation-context-model.mjs'
import { EVALUATION_CONTEXT_BINDINGS } from '../../lib/evaluation-context-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['EvaluationContextWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(EVALUATION_CONTEXT_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, EVALUATION_CONTEXT_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(EVALUATION_CONTEXT_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=evaluationContextFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>evaluationContextFrame(id,NaN),TypeError);
 }
 assert.throws(()=>evaluationContextFrame('unknown',0),TypeError);
});
test('environment layers differ in target and read-only scope without creating isolation',()=>{
 for(const [layer,target,readOnly] of [['mock','calls',false],['state','final-state',false],['limited','drift',true]])assert.deepEqual(evaluationEnvironmentLayer(layer),{target,readOnly,environmentCreated:false,securityIsolationGuaranteed:false});assert.throws(()=>evaluationEnvironmentLayer('production-write'),TypeError)
});
test('reproducible environment conditions cannot guarantee Agent determinism',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(evaluationReproducibility(Object.fromEntries(['stateReset','timeFixed','seedFixed','externalFixed'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{conditionsMatched:m===15,agentDeterministic:false,environmentCreated:false});assert.throws(()=>evaluationReproducibility({stateReset:true}),TypeError)
});
test('simulator facts speech goals and end conditions fail separately from Agent outcome',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(simulatorUtterance(Object.fromEntries(['factsMatch','allowedSpeech','goalBounded','endBounded'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{simulatorFailure:m!==15,agentOutcomeVerified:false,conversationExecuted:false});assert.throws(()=>simulatorUtterance({factsMatch:true}),TypeError)
});
test('simulator validation cannot bypass humans known quality or separate failures and shared blindspots',()=>{
 for(let m=0;m<64;m++)assert.deepEqual(simulatorAcceptance(Object.fromEntries(['humanCompared','knownQualitySeparated','factsChecked','failuresSeparated','repeated','blindspotsChecked'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===63,qualityGuaranteed:false,conversationExecuted:false});assert.throws(()=>simulatorAcceptance({humanCompared:true}),TypeError)
});
test('toy calibration uses each bin denominator and empty bins cannot invent a rate',()=>{
 for(let total=0;total<=20;total++)for(let correct=0;correct<=total;correct++)for(const confidence of [0,.5,.8,1])assert.deepEqual(calibrationBins([{confidence,total,correct}]),[{confidence,total,correct,accuracy:total?correct/total:null,gap:total?confidence-correct/total:null,modelMeasured:false}]);
 for(const bin of [{confidence:1.1,total:10,correct:8},{confidence:.8,total:10,correct:11},{confidence:.8,total:21,correct:8},{confidence:.8,total:1.5,correct:1}])assert.throws(()=>calibrationBins([bin]),TypeError)
});
test('selective coverage and answered accuracy use different denominators without monotonic precision assumptions',()=>{
 const bins=[{confidence:.5,total:10,correct:4},{confidence:.7,total:10,correct:8},{confidence:.8,total:10,correct:6},{confidence:.9,total:10,correct:5}];
 for(const [threshold,answered,correct] of [[0,40,23],[.7,30,19],[.8,20,11],[.9,10,5],[1,0,0]])assert.deepEqual(selectivePrediction(bins,threshold),{total:40,answered,correct,coverage:answered/40,accuracy:answered?correct/answered:null,escalationSent:false,qualityGuaranteed:false});
 assert.deepEqual(selectivePrediction([],1),{total:0,answered:0,correct:0,coverage:null,accuracy:null,escalationSent:false,qualityGuaranteed:false});assert.throws(()=>selectivePrediction(bins,NaN),TypeError)
});
