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
import { RELEASE_RESPONSE_STAGES, releaseResponseFrame, configurationTrace, releaseAllocation, rollbackPath, migrationGate, containmentChoice, recoveryChoice, feedbackCollection, feedbackLoop } from '../../lib/release-response-model.mjs'
import { RELEASE_RESPONSE_BINDINGS } from '../../lib/release-response-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['ReleaseResponseWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(RELEASE_RESPONSE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, RELEASE_RESPONSE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(RELEASE_RESPONSE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=releaseResponseFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>releaseResponseFrame(id,NaN),TypeError);
 }
 assert.throws(()=>releaseResponseFrame('unknown',0),TypeError);
});
test('configuration identification requires all six recorded constituents without deterministic restoration',()=>{
 for(let m=0;m<64;m++)assert.deepEqual(configurationTrace(Object.fromEntries(['code','prompt','tool','model','settings','evaluation'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{identifiedCandidate:m===63,deterministic:false,restored:false});assert.throws(()=>configurationTrace({code:true}),TypeError)
});
test('shadow keeps all user replies old while new processing never performs side effects or deploys',()=>{
 for(const [mode,old,newUser,newProcessed] of [['old',100,0,0],['shadow',100,0,100],['canary',90,10,10],['full',0,100,100]]){const r=releaseAllocation(mode);assert.deepEqual(r,{oldUserPercent:old,newUserPercent:newUser,newProcessedPercent:newProcessed,shadowSideEffects:false,deployed:false});assert.equal(r.oldUserPercent+r.newUserPercent,100)}assert.throws(()=>releaseAllocation('unknown'),TypeError)
});
test('a prepared flag cannot replace exercise or resurrect a retired old model and cannot undo effects',()=>{
 for(let m=0;m<8;m++)assert.deepEqual(rollbackPath(Object.fromEntries(['flagPrepared','flagExercised','oldAvailable'].map((k,i)=>[k,Boolean(m&(1<<i))]))),{reviewCandidate:m===7,switched:false,effectsUndone:false});assert.throws(()=>rollbackPath({flagPrepared:true}),TypeError)
});
test('changed judges require human validation before the entire suite and new failures and prompt checks support a staged plan',()=>{
 for(let m=0;m<64;m++){const v=Object.fromEntries(['judgeChanged','judgeHumanValidated','suiteChecked','newFailuresRead','promptChecked','stagedPlan'].map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(migrationGate(v),{reviewCandidate:(!v.judgeChanged||v.judgeHumanValidated)&&v.suiteChecked&&v.newFailuresRead&&v.promptChecked&&v.stagedPlan,migrated:false})}assert.throws(()=>migrationGate({judgeChanged:true}),TypeError)
});
test('containment scope preserves read functionality only for write-only and read-only designs without actual activation',()=>{
 for(const scope of ['auto','write','readOnly','tenant','all'])for(const prepared of [false,true])for(const exercised of [false,true])assert.deepEqual(containmentChoice({scope,prepared,exercised}),{scope,readMaintained:scope==='write'||scope==='readOnly',reviewCandidate:prepared&&exercised,activated:false,effectsUndone:false});assert.throws(()=>containmentChoice({scope:'unknown',prepared:true,exercised:true}),TypeError)
});
test('sent notifications are irreversible and compensation still needs scope logs and authority',()=>{
 for(const effect of ['write','sent'])for(let m=0;m<8;m++){const v=Object.fromEntries(['identified','logged','authorized'].map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(recoveryChoice({effect,...v}),{reviewCandidate:m===7,route:effect==='sent'?'correction':'rollback-or-correction',reversible:effect!=='sent',performed:false})}assert.throws(()=>recoveryChoice({effect:'unknown',identified:true,logged:true,authorized:true}),TypeError)
});
test('implicit signals need UI events and both signal kinds need scope outcome validation and collection controls',()=>{
 for(const kind of ['explicit','implicit'])for(let m=0;m<128;m++){const v=Object.fromEntries(['traceLinked','eventsRecorded','outcomeCompared','purposeExplained','minimized','retentionSet','accessControlled'].map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(feedbackCollection({kind,...v}),{reviewCandidate:v.traceLinked&&(kind==='explicit'||v.eventsRecorded)&&v.outcomeCompared&&v.purposeExplained&&v.minimized&&v.retentionSet&&v.accessControlled,intentInferred:false,collected:false})}assert.throws(()=>feedbackCollection({kind:'implicit',traceLinked:true}),TypeError)
});
test('loop readiness cannot replace measured improvement while masks cannot replace case permission',()=>{
 for(let m=0;m<64;m++){const v=Object.fromEntries(['caseAllowed','masked','regressionChecked','comparisonChecked','ownerAssigned','signalImproved'].map((k,i)=>[k,Boolean(m&(1<<i))])),ready=v.caseAllowed&&v.masked&&v.regressionChecked&&v.comparisonChecked&&v.ownerAssigned;assert.deepEqual(feedbackLoop(v),{reviewCandidate:ready,closedInToy:ready&&v.signalImproved,qualityMeasured:false,released:false})}assert.throws(()=>feedbackLoop({caseAllowed:true}),TypeError)
});
