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
import { MODEL_MCP_EVALUATION_STAGES, modelMcpEvaluationFrame, modelVariantGate, mcpConnectionGate, mcpReplicaGate, evaluationGraderRoute, evaluationRepeatResult } from '../../lib/model-mcp-evaluation-model.mjs'
import { MODEL_MCP_EVALUATION_BINDINGS } from '../../lib/model-mcp-evaluation-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['ModelMcpEvaluationWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(MODEL_MCP_EVALUATION_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, MODEL_MCP_EVALUATION_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(MODEL_MCP_EVALUATION_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=modelMcpEvaluationFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>modelMcpEvaluationFrame(id,NaN),TypeError);
 }
 assert.throws(()=>modelMcpEvaluationFrame('unknown',0),TypeError);
});
test('model migration retains every API setting contract budget and regression condition',()=>{
 for(let m=0;m<32;m++)assert.deepEqual(modelVariantGate({apiCompatible:Boolean(m&1),parametersPinned:Boolean(m&2),outputContractChecked:Boolean(m&4),tokenBudgetMeasured:Boolean(m&8),regressionPassed:Boolean(m&16)}),{reviewCandidate:m===31,deploymentExecuted:false});
 assert.throws(()=>modelVariantGate({apiCompatible:true}),TypeError)
});
test('MCP compatibility cannot skip transport features user authorization or host approval',()=>{
 for(let m=0;m<32;m++)assert.deepEqual(mcpConnectionGate({versionCompatible:Boolean(m&1),transportCompatible:Boolean(m&2),featureSupported:Boolean(m&4),userAuthorized:Boolean(m&8),hostApproved:Boolean(m&16)}),{reviewCandidate:m===31,networkConnected:false});
 assert.throws(()=>mcpConnectionGate({versionCompatible:true}),TypeError)
});
test('replica management retains required legacy sessions signed state keys and notifications',()=>{
 for(let m=0;m<64;m++){const values=Array.from({length:6},(_,i)=>Boolean(m&(1<<i)));assert.deepEqual(mcpReplicaGate(Object.fromEntries(['legacySessionRequired','sessionManaged','signedStateRequired','keyShared','notificationsRequired','notificationsShared'].map((k,i)=>[k,values[i]]))),{reviewCandidate:(!values[0]||values[1])&&(!values[2]||values[3])&&(!values[4]||values[5]),deploymentExecuted:false})}
 assert.throws(()=>mcpReplicaGate({legacySessionRequired:false}),TypeError)
});
test('grading keeps deterministic code validated judge human availability and missing criteria distinct',()=>{
 for(let m=0;m<16;m++){const d=Boolean(m&1),o=Boolean(m&2),j=Boolean(m&4),h=Boolean(m&8);assert.deepEqual(evaluationGraderRoute({deterministicCriterion:d,openOutput:o,judgeValidated:j,humanAvailable:h}),{next:d?'code':o&&j?'judge-candidate':h?'human-review':'criterion-needed',gradingExecuted:false})}
 assert.throws(()=>evaluationGraderRoute({deterministicCriterion:true}),TypeError)
});
test('repeated observed inputs depend on any or all policy without becoming measured quality',()=>{
 for(let runs=1;runs<=8;runs++)for(let passed=0;passed<=runs;passed++)for(const policy of ['any','all'])assert.deepEqual(evaluationRepeatResult({runs,passed,policy}),{observedAccepted:policy==='any'?passed>0:passed===runs,passRate:passed/runs,qualityGuaranteed:false});
 for(const input of [{runs:0,passed:0,policy:'all'},{runs:9,passed:0,policy:'any'},{runs:3,passed:4,policy:'all'},{runs:3,passed:-1,policy:'any'},{runs:3,passed:1.5,policy:'all'},{runs:3,passed:1,policy:'unknown'}])assert.throws(()=>evaluationRepeatResult(input),TypeError)
});
