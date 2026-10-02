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
import { DEPLOYMENT_LIFECYCLE_STAGES, deploymentLifecycleFrame, executionRoute, effectRecovery, toyApiCapacity, fallbackPlan, shadowAllowance, successionPlan, retirementCoverage, trainingJoin } from '../../lib/deployment-lifecycle-model.mjs'
import { DEPLOYMENT_LIFECYCLE_BINDINGS } from '../../lib/deployment-lifecycle-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['DeploymentLifecycleWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(DEPLOYMENT_LIFECYCLE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, DEPLOYMENT_LIFECYCLE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(DEPLOYMENT_LIFECYCLE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=deploymentLifecycleFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>deploymentLifecycleFrame(id,NaN),TypeError);
 }
 assert.throws(()=>deploymentLifecycleFrame('unknown',0),TypeError);
});
test('tail at the boundary remains a synchronous review and never establishes completion',()=>{for(const [tail,next] of [[3,'sync-review'],[5,'sync-review'],[8,'job-progress-review']])assert.deepEqual(executionRoute({tail,syncLimit:5}),{next,completed:false});for(const tail of [-1,101,1.5,NaN])assert.throws(()=>executionRoute({tail,syncLimit:5}),TypeError)});
test('unknown external effect without receiver or atomic contract stops automatic resend',()=>{for(const outcomeKnown of [false,true])for(const receiverContract of [false,true])for(const atomicUpdate of [false,true])assert.deepEqual(effectRecovery({outcomeKnown,receiverContract,atomicUpdate}),{next:!outcomeKnown&&!receiverContract&&!atomicUpdate?'stop-and-reconcile':'recovery-contract-review',resent:false});assert.throws(()=>effectRecovery({outcomeKnown:false}),TypeError)});
test('token demand includes every bounded loop while RPM and TPM are independent',()=>{for(const loopBound of [0,1,2,3]){const r=toyApiCapacity({tasks:3,tokens:4,loopBound,rpm:10,tpm:30});assert.deepEqual(r,{calls:3*loopBound,tokenDemand:12*loopBound,rpmWithin:3*loopBound<=10,tpmWithin:12*loopBound<=30,submitted:false})}assert.throws(()=>toyApiCapacity({tasks:101,tokens:4,loopBound:3,rpm:10,tpm:30}),TypeError)});
test('fallback needs quality switching and return rules and all providers down stops or queues',()=>{for(const alternativeEvaluated of [false,true])for(const switchRule of [false,true])for(const returnRule of [false,true])for(const available of [false,true])assert.deepEqual(fallbackPlan({alternativeEvaluated,switchRule,returnRule,available}),{next:!available?'stop-or-queue':alternativeEvaluated&&switchRule&&returnRule?'fallback-review':'retain-and-evaluate',switched:false});assert.throws(()=>fallbackPlan({available:true}),TypeError)});
test('both old and new shadow demand consume allowance at and beyond the exact boundary',()=>{for(const newDemand of [2,3,4])assert.deepEqual(shadowAllowance({oldDemand:7,newDemand,limit:10}),{combined:7+newDemand,within:newDemand<=3,deployed:false});assert.throws(()=>shadowAllowance({oldDemand:-1,newDemand:4,limit:10}),TypeError)});
test('succession never substitutes side effect enabled shadow for exclusive execution and records',()=>{const keys=['noShadowEffects','exclusiveRight','processedRecords','businessKey'];for(let m=0;m<16;m++)assert.deepEqual(successionPlan(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,switched:false});assert.throws(()=>successionPlan({exclusiveRight:true}),TypeError)});
test('retirement requires stopped execution access recovery and handled state and never proves deletion',()=>{const keys=['disabled','accessRecovered','stateHandled'];for(let m=0;m<8;m++)assert.deepEqual(retirementCoverage(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,deleted:false});assert.throws(()=>retirementCoverage({disabled:true}),TypeError)});
test('training is optional for borrowed apps and planned training requires each owner version and app evaluation',()=>{const keys=['trainingPlanned','dataOwner','jobOwner','modelVersion','appEvaluation'];for(let m=0;m<32;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(trainingJoin(v),{next:!v.trainingPlanned?'borrowed-app-path':m===31?'training-integration-review':'assign-missing-owners',trained:false})}assert.throws(()=>trainingJoin({trainingPlanned:true}),TypeError)});
