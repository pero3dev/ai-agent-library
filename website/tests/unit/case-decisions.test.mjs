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
import { CASE_DECISIONS_STAGES, caseDecisionsFrame, expenseMigration, expenseWrite, pilotCriteria, prospectiveDecision, helpdeskAction, helpdeskTrace } from '../../lib/case-decisions-model.mjs'
import { CASE_DECISIONS_BINDINGS } from '../../lib/case-decisions-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CaseDecisionsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CASE_DECISIONS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CASE_DECISIONS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(CASE_DECISIONS_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=caseDecisionsFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>caseDecisionsFrame(id,NaN),TypeError);
 }
 assert.throws(()=>caseDecisionsFrame('unknown',0),TypeError);
});
test('expense migration needs insufficient fixed steps evaluated need and regression without choosing a model',()=>{for(const fixedStepsSufficient of [true,false])for(const evaluatedNeed of [true,false])for(const regressionPresent of [true,false])assert.deepEqual(expenseMigration({fixedStepsSufficient,evaluatedNeed,regressionPresent}),{agentReviewCandidate:!fixedStepsSufficient&&evaluatedNeed&&regressionPresent,selected:false});assert.throws(()=>expenseMigration({}),TypeError)});
test('expenseWrite: all incomplete subsets return to the missing condition without executing or establishing completion',()=>{const keys=["approved","ownScope","targetMatched","toolEnforced"];for(let m=0;m<16;m++)assert.deepEqual(expenseWrite(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{writeReviewCandidate:m===15,...{"submitted":false}});assert.throws(()=>expenseWrite({}),TypeError)});
test('helpdeskTrace: all incomplete subsets return to the missing condition without executing or establishing completion',()=>{const keys=["inputRecorded","decisionRecorded","toolRecorded","approvalRecorded","outcomeRecorded","actorRecorded"];for(let m=0;m<64;m++)assert.deepEqual(helpdeskTrace(Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]))),{traceReviewCandidate:m===63,...{"executionEstablished":false,"approvalEstablished":false}});assert.throws(()=>helpdeskTrace({}),TypeError)});
test('relaxing fictional criterion from 95 to 80 changes its displayed attainment but cannot make future value positive',()=>{for(const threshold of [80,95])assert.deepEqual(pilotCriteria(threshold),{fictionalObservedQuality:80,displayedCriterionMet:80>=threshold,futureValuePositive:false,originalCriterionMet:false,actualMeasured:false});for(const threshold of [0,79,96,NaN])assert.throws(()=>pilotCriteria(threshold),TypeError)});
test('sunk costs never change the prospective candidate at either boundary or any incomplete future condition',()=>{for(const qualityMet of [true,false])for(const futureValuePositive of [true,false])for(const problemSolvable of [true,false])for(const sunkCost of [0,100,10000,1000000000])assert.deepEqual(prospectiveDecision({qualityMet,futureValuePositive,problemSolvable,sunkCost}),{continuationReviewCandidate:qualityMet&&futureValuePositive&&problemSolvable,pastCostDeterminesChoice:false,actualChoiceMade:false});for(const sunkCost of [-1,NaN,Infinity])assert.throws(()=>prospectiveDecision({qualityMet:true,futureValuePositive:true,problemSolvable:true,sunkCost}),TypeError)});
test('the three original operation classes require distinct identity approval and allowlist conditions plus common enforcement and attribution',()=>{const keys=['identityMatched','allowlisted','approved','toolEnforced','attributable'];for(const action of ['reset','software','rights'])for(let m=0;m<32;m++){const p=Object.fromEntries(keys.map((k,i)=>[k,Boolean(m&(1<<i))]));assert.deepEqual(helpdeskAction({action,...p}),{actionReviewCandidate:p.toolEnforced&&p.attributable&&(action==='software'?p.allowlisted:p.approved&&(action==='rights'||p.identityMatched)),approvalRequired:action!=='software',identityRequired:action==='reset',actualAction:false})}assert.throws(()=>helpdeskAction({action:'all'}),TypeError)});
