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
import { HARDWARE_SERVING_STAGES, hardwareServingFrame, weightBytes, precisionReview, toyOwnershipCost, batchingSlots, toyKvDemand, modelUpdateReview, toyFacilityImpact, environmentalComparison } from '../../lib/hardware-serving-model.mjs'
import { HARDWARE_SERVING_BINDINGS } from '../../lib/hardware-serving-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['HardwareServingWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(HARDWARE_SERVING_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('green-ai.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, HARDWARE_SERVING_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(HARDWARE_SERVING_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=hardwareServingFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>hardwareServingFrame(id,NaN),TypeError);
 }
 assert.throws(()=>hardwareServingFrame('unknown',0),TypeError);
});
test('original 7B weight arithmetic is decimal GB and not the runtime peak',()=>{for(const [p,weightsGB] of [['fp16',14],['int8',7],['int4',3.5]])assert.deepEqual(weightBytes(p),{weightsGB,decimalGB:true,peakMeasured:false});assert.throws(()=>weightBytes('fp8'),TypeError)});
test('quantized precision still requires own quality peak and runtime support',()=>{const keys=['qualityChecked','peakChecked','runtimeSupported'];for(let m=0;m<8;m++)assert.deepEqual(precisionReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,adopted:false});assert.throws(()=>precisionReview({qualityChecked:true}),TypeError)});
test('toy fixed cost remains on zero and low utilization and the exact boundary is not purchase approval',()=>{for(const requests of [0,20,60,100,200]){const api=3*requests,self=120+requests;assert.deepEqual(toyOwnershipCost(requests),{api,self,next:self<api?'self-cost-review':self===api?'equal-cost-review':'api-cost-review',purchased:false})}for(const n of [-1,201,1.5,NaN])assert.throws(()=>toyOwnershipCost(n),TypeError)});
test('continuous slots replace only completed requests and caller cannot mutate the explanation',()=>{for(const [step,slots,completed] of [[0,['A','B'],[]],[1,['C','B'],['A']],[2,['C','D'],['A','B']]]){assert.deepEqual(batchingSlots(step),{slots,completed,measured:false});const r=batchingSlots(step);r.slots[0]='X';assert.deepEqual(batchingSlots(step).slots,slots)}for(const n of [-1,3,1.5,NaN])assert.throws(()=>batchingSlots(n),TypeError)});
test('toy KV scales with both context and concurrency in addition to weight and workspace',()=>{for(const concurrency of [1,2,4])for(const context of [1,2,4]){const kv=concurrency*context,total=16+kv;assert.deepEqual(toyKvDemand({concurrency,context}),{weights:14,kv,workspace:2,total,capacity:24,within:total<=24,loaded:false})}assert.throws(()=>toyKvDemand({concurrency:201,context:4}),TypeError)});
test('model update needs distribution rollback evaluation cache and version together',()=>{const keys=['distributed','rollbackReady','evaluationDone','cacheLinked','versionRecorded'];for(let m=0;m<32;m++)assert.deepEqual(modelUpdateReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,switched:false});assert.throws(()=>modelUpdateReview({distributed:true}),TypeError)});
test('PUE and electric carbon intensity are independent factors rather than a claim of actual emissions',()=>{for(const pue of [1,1.5,2])for(const intensity of [1,3])assert.deepEqual(toyFacilityImpact({pue,intensity}),{itEnergy:10,facilityEnergy:10*pue,carbonUnits:10*pue*intensity,measured:false});assert.ok(toyFacilityImpact({pue:1,intensity:3}).carbonUnits>toyFacilityImpact({pue:2,intensity:1}).carbonUnits);assert.throws(()=>toyFacilityImpact({pue:.9,intensity:1}),TypeError)});
test('environment comparison cannot bypass scope period method functional unit or method version',()=>{const keys=['sameScope','samePeriod','sameMethod','sameUnit','sameVersion'];for(let m=0;m<32;m++)assert.deepEqual(environmentalComparison(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,comparisonMade:false});assert.throws(()=>environmentalComparison({sameScope:true}),TypeError)});
