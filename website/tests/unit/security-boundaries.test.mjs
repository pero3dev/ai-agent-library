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
import { SECURITY_BOUNDARIES_STAGES, securityBoundariesFrame, trifectaPath, scopedToolReview, approvalPlacement, iidDetectionRisk, defenseMechanism, sandboxReview, mcpReview, taskToolSet } from '../../lib/security-boundaries-model.mjs'
import { SECURITY_BOUNDARIES_BINDINGS } from '../../lib/security-boundaries-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SecurityBoundariesWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SECURITY_BOUNDARIES_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SECURITY_BOUNDARIES_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SECURITY_BOUNDARIES_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=securityBoundariesFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>securityBoundariesFrame(id,NaN),TypeError);
 }
 assert.throws(()=>securityBoundariesFrame('unknown',0),TypeError);
});
test('closing any trifecta condition closes only the specific path and does not declare general safety',()=>{const keys=['privateData','untrustedContent','externalSend'];for(let m=0;m<8;m++)assert.deepEqual(trifectaPath(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{specificPathOpen:m===7,allThreatsSafe:false,attacked:false});assert.throws(()=>trifectaPath({privateData:true}),TypeError)});
test('caller tenant resource and operation are independent authorization requirements',()=>{const keys=['callerAllowed','tenantMatched','resourceAllowed','operationAllowed'];for(let m=0;m<16;m++)assert.deepEqual(scopedToolReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,executed:false});assert.throws(()=>scopedToolReview({callerAllowed:true}),TypeError)});
test('irreversible large impact or untrusted recent context each keeps an execution review gate',()=>{const keys=['irreversible','largeImpact','untrustedRecent'];for(let m=0;m<8;m++)assert.deepEqual(approvalPlacement(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{needsReview:m!==0,approved:false});assert.throws(()=>approvalPlacement({irreversible:true}),TypeError)});
test('IID miss expectation is distinct from at least one miss and 100 trials do not guarantee a miss',()=>{for(const n of [0,1,10,100])assert.deepEqual(iidDetectionRisk(n),{expectedMisses:n*.01,atLeastOneMiss:1-.99**n,iidAssumed:true,empirical:false});assert.equal(iidDetectionRisk(100).expectedMisses,1);assert.ok(iidDetectionRisk(100).atLeastOneMiss>.63&&iidDetectionRisk(100).atLeastOneMiss<.64);for(const n of [-1,101,.5,NaN])assert.throws(()=>iidDetectionRisk(n),TypeError)});
test('input and model detection cannot substitute for enforced boundaries and output retains both mechanisms',()=>{for(const [layer,kind] of [['design','enforced-boundary'],['execution','enforced-boundary'],['input','fallible-detection'],['model','fallible-detection'],['output','mixed']])assert.deepEqual(defenseMechanism(layer),{kind,completeProtection:false});assert.throws(()=>defenseMechanism('unknown'),TypeError)});
test('environment egress resources and account all remain necessary for sandbox review rather than verified isolation',()=>{const keys=['isolatedEnvironment','restrictedEgress','boundedResources','dedicatedAccount'];for(let m=0;m<16;m++)assert.deepEqual(sandboxReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,verifiedIsolation:false});assert.throws(()=>sandboxReview({isolatedEnvironment:true}),TypeError)});
test('MCP source pin tool permission and token scope cannot trust returned content',()=>{const keys=['sourceChecked','versionPinned','toolsAllowed','tokenScoped'];for(let m=0;m<16;m++)assert.deepEqual(mcpReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===15,resultTrusted:false,connected:false});assert.throws(()=>mcpReview({sourceChecked:true}),TypeError)});
test('read tasks have no write tool and incident context removes tools without granting any rights',()=>{for(const [mode,tools,needsApproval] of [['read',['read'],false],['write',['read','scoped-write'],true],['incident',[],true]]){assert.deepEqual(taskToolSet(mode),{tools,needsApproval,rightsGranted:false});const r=taskToolSet(mode);r.tools.push('admin');assert.deepEqual(taskToolSet(mode).tools,tools)}assert.throws(()=>taskToolSet('admin'),TypeError)});
