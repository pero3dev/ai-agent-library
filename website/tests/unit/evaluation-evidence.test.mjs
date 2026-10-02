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
import { EVALUATION_EVIDENCE_STAGES, evaluationEvidenceFrame, judgeConfusion, judgeSwapResult, judgeAcceptance, trajectoryInvariantResult, evaluationDatasetAcceptance } from '../../lib/evaluation-evidence-model.mjs'
import { EVALUATION_EVIDENCE_BINDINGS } from '../../lib/evaluation-evidence-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['EvaluationEvidenceWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(EVALUATION_EVIDENCE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, EVALUATION_EVIDENCE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(EVALUATION_EVIDENCE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=evaluationEvidenceFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>evaluationEvidenceFrame(id,NaN),TypeError);
 }
 assert.throws(()=>evaluationEvidenceFrame('unknown',0),TypeError);
});
test('confusion metrics preserve separate human pass and fail denominators including empty samples',()=>{
 for(let a=0;a<=4;a++)for(let b=0;b<=4;b++)for(let c=0;c<=4;c++)for(let d=0;d<=4;d++){const total=a+b+c+d;assert.deepEqual(judgeConfusion({truePass:a,trueFail:b,falsePass:c,falseFail:d}),{total,humanFail:b+c,humanPass:a+d,agreement:total?(a+b)/total:null,falseAcceptance:b+c?c/(b+c):null,overRejection:a+d?d/(a+d):null,qualityGuaranteed:false})}
 assert.deepEqual(judgeConfusion({truePass:7,trueFail:0,falsePass:1,falseFail:0}),{total:8,humanFail:1,humanPass:7,agreement:7/8,falseAcceptance:1,overRejection:0,qualityGuaranteed:false});
 for(const truePass of [-1,9,NaN,1.5])assert.throws(()=>judgeConfusion({truePass,trueFail:0,falsePass:0,falseFail:0}),TypeError)
});
test('swapping display positions compares semantic winners without proving overall quality',()=>{
 for(const firstWinner of ['a','b'])for(const reversedWinner of ['a','b'])assert.deepEqual(judgeSwapResult({firstWinner,reversedWinner}),{orderConsistent:firstWinner===reversedWinner,winner:firstWinner===reversedWinner?firstWinner:null,qualityGuaranteed:false});
 assert.throws(()=>judgeSwapResult({firstWinner:'a',reversedWinner:'left'}),TypeError)
});
test('judge candidate retains criteria labels unseen data thresholds sample report and frozen composition',()=>{
 for(let mask=0;mask<64;mask++)assert.deepEqual(judgeAcceptance(Object.fromEntries(['criteriaFixed','labelsChecked','unseenSet','thresholdsMet','sampleReported','compositionFrozen'].map((k,i)=>[k,Boolean(mask&(1<<i))]))),{reviewCandidate:mask===63,gradingExecuted:false});
 assert.throws(()=>judgeAcceptance({criteriaFixed:true}),TypeError)
});
test('trajectory invariants neither verify final outcome nor prevent real effects',()=>{
 for(let m=0;m<16;m++)assert.deepEqual(trajectoryInvariantResult({requiredInformation:Boolean(m&1),forbiddenAbsent:Boolean(m&2),approvalBeforeEffect:Boolean(m&4),withinBudget:Boolean(m&8)}),{invariantsMet:m===15,finalOutcomeVerified:false,effectsPrevented:false});
 assert.throws(()=>trajectoryInvariantResult({requiredInformation:true}),TypeError)
});
test('dataset masking cannot replace usage agreement labels strata or set and source lineage separation',()=>{
 for(let mask=0;mask<64;mask++)assert.deepEqual(evaluationDatasetAcceptance(Object.fromEntries(['masked','usageAgreed','labelsReviewed','strataChecked','setsSeparated','lineageSeparated'].map((k,i)=>[k,Boolean(mask&(1<<i))]))),{reviewCandidate:mask===63,datasetCollected:false,qualityGuaranteed:false});
 assert.throws(()=>evaluationDatasetAcceptance({masked:true}),TypeError)
});
