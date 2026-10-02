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
import { SECURITY_AUTHORITY_STAGES, securityAuthorityFrame, intersectPermissions, tokenAudienceReview, credentialRoute, revocationReview, imageFetchReview, retrievalAuthorization, actionGuard, toyGuardQuality, incidentGuard } from '../../lib/security-authority-model.mjs'
import { SECURITY_AUTHORITY_BINDINGS } from '../../lib/security-authority-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SecurityAuthorityWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SECURITY_AUTHORITY_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('agent-identity-and-auth.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SECURITY_AUTHORITY_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SECURITY_AUTHORITY_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=securityAuthorityFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>securityAuthorityFrame(id,NaN),TypeError);
 }
 assert.throws(()=>securityAuthorityFrame('unknown',0),TypeError);
});
test('effective permissions are intersection and cannot gain operations from the other principal',()=>{const known=['read','write','delete','send'];for(let a=0;a<16;a++)for(let b=0;b<16;b++){const user=known.filter((_,i)=>a&(1<<i)),agent=known.filter((_,i)=>b&(1<<i));assert.deepEqual(intersectPermissions(user,agent),{effective:known.filter((_,i)=>(a&b)&(1<<i)),granted:false})}assert.throws(()=>intersectPermissions(['admin'],[]),TypeError)});
test('same user cannot bypass wrong audience expiry or operation scope',()=>{const keys=['correctAudience','unexpired','scopeAllowed'];for(let m=0;m<8;m++)assert.deepEqual(tokenAudienceReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,tokenIssued:false});assert.throws(()=>tokenAudienceReview({correctAudience:true}),TypeError)});
test('runtime or egress injection keeps the model view separate and values are never real secrets',()=>{for(const mode of ['prompt','runtime','egress'])assert.deepEqual(credentialRoute(mode),{modelVisible:mode==='prompt',executionInjected:mode!=='prompt',realSecret:false});assert.throws(()=>credentialRoute('delete-history'),TypeError)});
test('revocation needs token credential and tool controls and cannot undo previous external effects',()=>{const keys=['tokenRevoked','credentialsDisabled','toolsBlocked'];for(let m=0;m<8;m++)assert.deepEqual(revocationReview(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{futureControlCandidate:m===7,pastEffectsCancelled:false});assert.throws(()=>revocationReview({tokenRevoked:true}),TypeError)});
test('image fetch needs destination content and redirect control and proxy alone does not protect data',()=>{const keys=['automaticFetch','destinationAllowed','urlContentChecked','redirectControlled'];for(let m=0;m<16;m++){const data=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(imageFetchReview(data),{reviewCandidate:m===15,automaticPathBlocked:!data.automaticFetch,proxyAloneProtects:false,fetched:false})}assert.throws(()=>imageFetchReview({automaticFetch:true}),TypeError)});
test('user tenant and resource authorization all must pass before a datum may enter the model',()=>{const keys=['userAllowed','tenantMatched','resourceAllowed'];for(let m=0;m<8;m++)assert.deepEqual(retrievalAuthorization(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{mayEnterModel:m===7,retrieved:false});assert.throws(()=>retrievalAuthorization({userAllowed:true}),TypeError)});
test('LLM says safe cannot override missing tool argument limit or human approval constraints',()=>{const keys=['toolAllowed','argsValid','withinLimit','humanApproved','llmSaysSafe'];for(let m=0;m<32;m++)assert.deepEqual(actionGuard(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:(m&15)===15,executed:false});assert.throws(()=>actionGuard({llmSaysSafe:true}),TypeError)});
test('toy guard quality uses each class denominator and does not report empirical optimum or perfect detection',()=>{for(const [mode,fp,fn] of [['light',2,12],['balanced',8,5],['strict',20,2]]){assert.deepEqual(toyGuardQuality(mode),{falsePositives:fp,falseNegatives:fn,legitimate:100,violating:100,falsePositiveRate:fp/100,falseNegativeRate:fn/100,empirical:false});const r=toyGuardQuality(mode);r.falseNegatives=0;assert.equal(toyGuardQuality(mode).falseNegatives,fn)}assert.throws(()=>toyGuardQuality('perfect'),TypeError)});
test('incident response can require approval or stop tools without increasing rights or changing real configuration',()=>{for(const mode of ['normal','approval','stop'])assert.deepEqual(incidentGuard(mode),{toolsEnabled:mode!=='stop',approvalRequired:mode!=='normal',rightsIncreased:false,changed:false});assert.throws(()=>incidentGuard('admin'),TypeError)});
