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
import { GATEWAY_REUSE_STAGES, gatewayReuseFrame, gatewayControl, gatewayAvailability, responseCacheTarget, cacheReuse, cacheInvalidation, batchRoute, batchItemNext, batchCapacity } from '../../lib/gateway-reuse-model.mjs'
import { GATEWAY_REUSE_BINDINGS } from '../../lib/gateway-reuse-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['GatewayReuseWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(GATEWAY_REUSE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, GATEWAY_REUSE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(GATEWAY_REUSE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=gatewayReuseFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>gatewayReuseFrame(id,NaN),TypeError);
 }
 assert.throws(()=>gatewayReuseFrame('unknown',0),TypeError);
});
test('virtual key naming needs tenant scope quota budget and audit and is never actual isolation',()=>{const keys=['tenantKnown','keyScoped','quotaSet','budgetSet','auditSet'];for(let m=0;m<32;m++)assert.deepEqual(gatewayControl(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===31,isolated:false,keyIssued:false});assert.throws(()=>gatewayControl({tenantKnown:true}),TypeError)});
test('provider redundancy does not remove the gateway single point and neither construction measures availability',()=>{for(const gatewayRedundant of [false,true])for(const providerRedundant of [false,true])assert.deepEqual(gatewayAvailability({gatewayRedundant,providerRedundant}),{gatewaySinglePoint:!gatewayRedundant,providerSinglePoint:!providerRedundant,availabilityMeasured:false});assert.throws(()=>gatewayAvailability({gatewayRedundant:true}),TypeError)});
test('shared response requires deterministic nonpersonalized and freshness independent conditions together',()=>{const keys=['deterministic','nonPersonalized','freshnessIndependent'];for(let m=0;m<8;m++)assert.deepEqual(responseCacheTarget(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,stored:false});assert.throws(()=>responseCacheTarget({deterministic:true}),TypeError)});
test('a match cannot bypass tenant scope context versions expiry or target conditions and never guarantees a correct answer',()=>{const keys=['matchCandidate','sameTenant','sameScope','sameContext','versionsCurrent','notExpired','sharedTarget'];for(let m=0;m<128;m++)assert.deepEqual(cacheReuse(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===127,returned:false,correctnessGuaranteed:false});assert.throws(()=>cacheReuse({matchCandidate:true}),TypeError)});
test('any knowledge prompt model change or expiry marks a discard candidate without actually invalidating cache',()=>{const keys=['knowledgeChanged','promptChanged','modelChanged','ttlExpired'];for(let m=0;m<16;m++)assert.deepEqual(cacheInvalidation(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{discardCandidate:m!==0,invalidated:false});assert.throws(()=>cacheInvalidation({ttlExpired:false}),TypeError)});
test('batch only fits large loose deadline noninstant use and cannot promise completion',()=>{for(const large of [false,true])for(const deadlineLoose of [false,true])for(const immediateRequired of [false,true])assert.deepEqual(batchRoute({large,deadlineLoose,immediateRequired}),{next:large&&deadlineLoose&&!immediateRequired?'batch-candidate':'realtime-review',submitted:false,deadlineGuaranteed:false});assert.throws(()=>batchRoute({large:true}),TypeError)});
test('success is retained unknown is reconciled and failed or expired item is individually reviewed without call deduplication',()=>{for(const [status,next] of [['succeeded','keep-result'],['failed','retry-item-review'],['expired','retry-item-review'],['unknown','reconcile-job']])assert.deepEqual(batchItemNext(status),{next,resubmitted:false,callDeduplicated:false});assert.throws(()=>batchItemNext('running'),TypeError)});
test('toy deadline includes retry and recovery at the exact boundary and available realtime only starts capacity review',()=>{for(const deadlineTime of [5,8,10])for(const realtimeAvailable of [false,true])assert.deepEqual(batchCapacity({queueTime:5,retryTime:2,recoveryTime:1,deadlineTime,realtimeAvailable}),{needed:8,margin:deadlineTime-8,next:deadlineTime>=8?'batch-plan-review':realtimeAvailable?'realtime-capacity-review':'deadline-replan',completed:false});for(const queueTime of [-1,21,NaN,1.5])assert.throws(()=>batchCapacity({queueTime,retryTime:2,recoveryTime:1,deadlineTime:8,realtimeAvailable:false}),TypeError)});
