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
import { DATA_RESILIENCE_STAGES, dataResilienceFrame, conversationPurpose, conversationAccess, deletionCoverage, knowledgeOwnership, knowledgeUse, toySourceQuality, chaosPlan, chaosOutcome } from '../../lib/data-resilience-model.mjs'
import { DATA_RESILIENCE_BINDINGS } from '../../lib/data-resilience-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['DataResilienceWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(DATA_RESILIENCE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('conversation-data-management.md')?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, DATA_RESILIENCE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(DATA_RESILIENCE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=dataResilienceFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>dataResilienceFrame(id,NaN),TypeError);
 }
 assert.throws(()=>dataResilienceFrame('unknown',0),TypeError);
});
test('operation collection never implies training permission and every shared collection control stays required',()=>{
 const keys=['traceLinked','notified','minimized','retentionSet','accessControlled','trainingCondition'];for(const purpose of ['operation','training'])for(let m=0;m<64;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(conversationPurpose({purpose,...v}),{reviewCandidate:keys.slice(0,5).every(k=>v[k])&&(purpose==='operation'||v.trainingCondition),collected:false,legalComplianceDetermined:false})}assert.throws(()=>conversationPurpose({purpose:'unknown'}),TypeError);assert.throws(()=>conversationPurpose({purpose:'operation',traceLinked:true}),TypeError)
});
test('masked internal access still needs purpose role and audit while raw and external add independent conditions',()=>{
 const keys=['purposeKnown','roleAllowed','auditRecorded','rawExceptionApproved','destinationChecked'];for(const raw of [false,true])for(const external of [false,true])for(let m=0;m<32;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(conversationAccess({raw,external,...v}),{reviewCandidate:v.purposeKnown&&v.roleAllowed&&v.auditRecorded&&(!raw||v.rawExceptionApproved)&&(!external||v.destinationChecked),accessGranted:false,sent:false})}assert.throws(()=>conversationAccess({raw:false}),TypeError)
});
test('all six storage descendants must be checked and raw-only deletion is incomplete without actual deletion',()=>{
 const keys=['raw','pseudonym','embedding','cache','evaluation','memory'];for(let m=0;m<64;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(deletionCoverage(v),{unchecked:keys.filter(k=>!v[k]),designChecked:m===63,deleted:false})}assert.throws(()=>deletionCoverage({raw:true}),TypeError)
});
test('owner naming cannot replace update duty catalogue and measured quality or become source correction',()=>{
 const keys=['ownerKnown','updateDuty','catalogueKnown','qualityMeasured'];for(let m=0;m<16;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(knowledgeOwnership(v),{reviewCandidate:m===15,dataCorrected:false})}assert.throws(()=>knowledgeOwnership({ownerKnown:true}),TypeError)
});
test('search and training classifications are independent and unknown does not become indexed or legally cleared',()=>{
 for(const search of ['unknown','allow','deny'])for(const training of ['unknown','allow','deny'])for(const purpose of ['search','training']){const selected=purpose==='search'?search:training;assert.deepEqual(knowledgeUse({search,training,purpose}),{tagAllowsCandidate:selected==='allow',unclassified:selected==='unknown',indexed:false,trained:false,legalComplianceDetermined:false})}assert.throws(()=>knowledgeUse({search:'yes',training:'allow',purpose:'search'}),TypeError)
});
test('quality denominators are bounded empty remains null and independent categories may overlap',()=>{
 assert.deepEqual(toySourceQuality({total:0,expired:0,incorrect:0,duplicate:0}),{expiryRate:null,incorrectRate:null,duplicateRate:null,measured:false});assert.deepEqual(toySourceQuality({total:10,expired:10,incorrect:10,duplicate:10}),{expiryRate:1,incorrectRate:1,duplicateRate:1,measured:false});assert.deepEqual(toySourceQuality({total:20,expired:2,incorrect:1,duplicate:2}),{expiryRate:.1,incorrectRate:.05,duplicateRate:.1,measured:false});for(const total of [-1,21,1.5,NaN])assert.throws(()=>toySourceQuality({total,expired:0,incorrect:0,duplicate:0}),TypeError);assert.throws(()=>toySourceQuality({total:0,expired:1,incorrect:0,duplicate:0}),TypeError)
});
test('exercise planning requires hypothesis steady criteria small scope no effects and production-only irreproducible dependency',()=>{
 const keys=['hypothesisKnown','steadyDefined','criteriaDefined','smallScope','sideEffectsAbsent','realDependencyNeeded'];for(const environment of ['evaluation','staging','production'])for(let m=0;m<64;m++){const v=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(chaosPlan({environment,...v}),{reviewCandidate:keys.slice(0,5).every(k=>v[k])&&(environment!=='production'||v.realDependencyNeeded),injected:false,authorized:false})}assert.throws(()=>chaosPlan({environment:'unknown'}),TypeError)
});
test('unobserved stays undecided and fallback alone cannot meet the predeclared SLI criterion',()=>{
 for(let m=0;m<8;m++){const observed=Boolean(m&1),fallbackActivated=Boolean(m&2),withinCriteria=Boolean(m&4);assert.deepEqual(chaosOutcome({observed,fallbackActivated,withinCriteria}),{supportedInToy:observed&&fallbackActivated&&withinCriteria,weaknessInToy:observed&&(!fallbackActivated||!withinCriteria),resilienceMeasured:false})}assert.throws(()=>chaosOutcome({observed:true}),TypeError)
});
