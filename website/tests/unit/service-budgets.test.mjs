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
import { SERVICE_BUDGETS_STAGES, serviceBudgetsFrame, toyHistoryInput, toyCacheAccounting, budgetLayers, toyLatency, latencyAdoption, sloMeasurement, toyErrorBudget, sloRelease } from '../../lib/service-budgets-model.mjs'
import { SERVICE_BUDGETS_BINDINGS } from '../../lib/service-budgets-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['ServiceBudgetsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SERVICE_BUDGETS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('cost-management.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SERVICE_BUDGETS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SERVICE_BUDGETS_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=serviceBudgetsFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>serviceBudgetsFrame(id,NaN),TypeError);
 }
 assert.throws(()=>serviceBudgetsFrame('unknown',0),TypeError);
});
test('toy history sums the repeated fixed prefix and each bounded increment without claiming real token or quality measurement',()=>{
 for(let steps=1;steps<=8;steps++)for(let fixed=0;fixed<=8;fixed++)for(let increment=0;increment<=4;increment++)for(const historyCap of [0,1,3,8]){const r=toyHistoryInput({steps,fixed,increment,historyCap});assert.equal(r.total,Array.from({length:steps},(_,i)=>fixed+increment*Math.min(i,historyCap)).reduce((a,b)=>a+b,0));assert.equal(r.tokensMeasured,false);assert.equal(r.qualityVerified,false);if(historyCap===8)assert.equal(r.total,fixed*steps+increment*steps*(steps-1)/2)}assert.throws(()=>toyHistoryInput({steps:9,fixed:4,increment:2,historyCap:8}),TypeError)
});
test('disjoint cache categories cannot double count ordinary input and repeated writing may exceed all ordinary toy weight',()=>{
 for(let read=0;read<=100;read+=10)for(let write=0;write<=100-read;write+=10){const r=toyCacheAccounting({input:100,read,write});assert.equal(r.ordinary,100-read-write);assert.equal(r.weighted,100-read-write+read/5+write*1.5);assert.equal(r.priced,false);assert.equal(r.billed,false)}assert.equal(toyCacheAccounting({input:100,read:60,write:20}).weighted,62);assert.equal(toyCacheAccounting({input:100,read:0,write:80}).weighted,140);assert.throws(()=>toyCacheAccounting({input:100,read:80,write:40}),TypeError)
});
test('each task tenant and system limit independently blocks further toy work without stopping a real task or undoing effects',()=>{
 for(let m=0;m<8;m++){const r=budgetLayers(Object.fromEntries(['taskRemaining','tenantRemaining','systemRemaining'].map((k,i)=>[k,m&(1<<i)?0:10])));assert.equal(r.mayContinue,m===0);assert.equal(r.blocked.length,[0,1,2].filter(i=>m&(1<<i)).length);assert.equal(r.stopped,false);assert.equal(r.effectsUndone,false)}assert.throws(()=>budgetLayers({taskRemaining:-1,tenantRemaining:10,systemRemaining:10}),TypeError)
});
test('parallel tool latency uses the longest independent branch and preserves dependent serial sums',()=>{
 for(const independent of [false,true])for(const parallel of [false,true])for(let toolA=0;toolA<=20;toolA++)for(let toolB=0;toolB<=20;toolB++){const r=toyLatency({ttft:2,output:3,perToken:1,toolA,toolB,overhead:1,independent,parallel});assert.equal(r.llm,5);assert.equal(r.tools,independent&&parallel?Math.max(toolA,toolB):toolA+toolB);assert.equal(r.total,6+r.tools);assert.equal(r.measured,false);assert.equal(r.toolsExecuted,false)}assert.throws(()=>toyLatency({ttft:NaN}),TypeError)
});
test('latency adoption retains quality total cost real duration and task priorities without deployment claims',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(latencyAdoption(Object.fromEntries(['qualityChecked','costChecked','latencyChecked','priorityDefined'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,deployed:false,improvementGuaranteed:false});assert.throws(()=>latencyAdoption({qualityChecked:true}),TypeError)
});
test('SLI measurement keeps success definitions judge validation sampling and time window without actual measurement or contracts',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(sloMeasurement(Object.fromEntries(['definitionKnown','judgeValidated','samplingKnown','measurementWindowKnown'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,qualityMeasured:false,contractCreated:false});assert.throws(()=>sloMeasurement({definitionKnown:true}),TypeError)
});
test('error budgets use the declared denominator and correctly distinguish positive zero and exceeded allowance',()=>{
 for(const total of [1,10,100,1000])for(const targetPercent of [50,90,95,99])for(const failed of [0,Math.floor(total/10),total]){const r=toyErrorBudget({total,failed,targetPercent});assert.equal(r.allowed,total*(100-targetPercent)/100);assert.equal(r.remaining,r.allowed-failed);assert.equal(r.exhausted,r.remaining<=0);assert.equal(r.observed,(total-failed)/total);assert.equal(r.qualityMeasured,false)}for(const failed of [6,10,12])assert.equal(toyErrorBudget({total:1000,failed,targetPercent:99}).remaining,10-failed);for(const input of [{total:0,failed:0,targetPercent:99},{total:100,failed:101,targetPercent:99},{total:100,failed:0,targetPercent:100}])assert.throws(()=>toyErrorBudget(input),TypeError)
});
test('budget remainder alone cannot bypass trusted measurement and release guards or create a contract',()=>{
 for(const budgetRemaining of [-2,0,4])for(const measurementTrusted of [false,true])for(const guardPassed of [false,true])assert.deepEqual(sloRelease({budgetRemaining,measurementTrusted,guardPassed}),{reviewCandidate:budgetRemaining>0&&measurementTrusted&&guardPassed,deployed:false,contractCreated:false});assert.throws(()=>sloRelease({budgetRemaining:4,measurementTrusted:true}),TypeError)
});
