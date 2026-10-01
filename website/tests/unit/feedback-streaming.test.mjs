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
import { FEEDBACK_STREAMING_STAGES, feedbackStreamingFrame, optimizationCandidate, feedbackRetry, streamStop } from '../../lib/feedback-streaming-model.mjs'
import { FEEDBACK_STREAMING_BINDINGS } from '../../lib/feedback-streaming-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['FeedbackStreamingWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(FEEDBACK_STREAMING_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, FEEDBACK_STREAMING_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(FEEDBACK_STREAMING_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=feedbackStreamingFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>feedbackStreamingFrame(id,NaN),TypeError);
 }
 assert.throws(()=>feedbackStreamingFrame('unknown',0),TypeError);
});
test('candidate evaluation requires improvement non-degradation and an unused judgment',()=>{
 for(const improved of [false,true])for(const nonDegraded of [false,true])for(const unusedJudgment of [false,true])assert.deepEqual(optimizationCandidate({improved,nonDegraded,unusedJudgment}),{candidateReady:improved&&nonDegraded&&unusedJudgment,productionChanged:false});
 assert.throws(()=>optimizationCandidate({improved:true,nonDegraded:true}),TypeError);
});
test('loop feedback stops unrecoverable failures and escalates exhausted or repeated corrections',()=>{
 for(const recoverable of [false,true])for(const budgetRemaining of [false,true])for(const repeated of [false,true])assert.deepEqual(feedbackRetry({recoverable,budgetRemaining,repeated}),{next:!recoverable?'stop':!budgetRemaining||repeated?'escalate':'retry',actionExecuted:false});
 assert.throws(()=>feedbackRetry({recoverable:true,budgetRemaining:true,repeated:'unknown'}),TypeError);
});
test('stopping a loop never undoes a completed external effect and resume requires a saved checkpoint',()=>{
 for(const loopStopped of [false,true])for(const externalCompleted of [false,true])for(const checkpointSaved of [false,true])assert.deepEqual(streamStop({loopStopped,externalCompleted,checkpointSaved}),{loopStopped,externalEffectRemains:externalCompleted,resumeCandidate:loopStopped&&checkpointSaved,externalUndone:false});
 assert.throws(()=>streamStop({loopStopped:true,externalCompleted:true}),TypeError);
});
