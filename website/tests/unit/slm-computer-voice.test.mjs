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
import { SLM_COMPUTER_VOICE_STAGES, slmComputerVoiceFrame, slmRoute, slmAdoption, computerAction, voiceHeardHistory, voiceRiskGate } from '../../lib/slm-computer-voice-model.mjs'
import { SLM_COMPUTER_VOICE_BINDINGS } from '../../lib/slm-computer-voice-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['SlmComputerVoiceWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(SLM_COMPUTER_VOICE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('/voice-agents.md') ? 3 : 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, SLM_COMPUTER_VOICE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(SLM_COMPUTER_VOICE_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=slmComputerVoiceFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>slmComputerVoiceFrame(id,NaN),TypeError);
 }
 assert.throws(()=>slmComputerVoiceFrame('unknown',0),TypeError);
});
test('difficult input and output quality verification select different routes without a model call',()=>{
 for(const difficultInput of [false,true])for(const qualityAccepted of [false,true])for(const verifierPassed of [false,true])assert.deepEqual(slmRoute({difficultInput,qualityAccepted,verifierPassed}),{next:difficultInput?'upper-direct':qualityAccepted&&verifierPassed?'slm-candidate':'confirm-escalation',modelCalled:false,qualityGuaranteed:false});
 assert.throws(()=>slmRoute({difficultInput:false,qualityAccepted:true}),TypeError);
});
test('SLM adoption cannot skip input groups total cost tail latency or required guardrail safety',()=>{
 for(const groupQualityCompared of [false,true])for(const totalCostCompared of [false,true])for(const tailLatencyCompared of [false,true])for(const guardrailTask of [false,true])for(const safetyCompared of [false,true])assert.deepEqual(slmAdoption({groupQualityCompared,totalCostCompared,tailLatencyCompared,guardrailTask,safetyCompared}),{reviewCandidate:groupQualityCompared&&totalCostCompared&&tailLatencyCompared&&(!guardrailTask||safetyCompared),deploymentExecuted:false});
 assert.throws(()=>slmAdoption({groupQualityCompared:true,totalCostCompared:true,tailLatencyCompared:true,guardrailTask:true}),TypeError);
});
test('computer action preserves stop scope budget changed target and required approval before a candidate',()=>{
 for(const scopeAllowed of [false,true])for(const budgetAvailable of [false,true])for(const targetChanged of [false,true])for(const approvalRequired of [false,true])for(const approved of [false,true])for(const stopped of [false,true])assert.deepEqual(computerAction({scopeAllowed,budgetAvailable,targetChanged,approvalRequired,approved,stopped}),{next:stopped||!scopeAllowed||!budgetAvailable?'stop':targetChanged?'reobserve':approvalRequired&&!approved?'wait-approval':'action-candidate',operationExecuted:false});
 assert.throws(()=>computerAction({scopeAllowed:true,budgetAvailable:true,targetChanged:false,approvalRequired:true,approved:true}),TypeError);
});
test('heard history removes unplayed ranges without claiming an aligned transcript',()=>{
 for(let generatedSegments=0;generatedSegments<=6;generatedSegments++)for(let playedSegments=0;playedSegments<=generatedSegments;playedSegments++)assert.deepEqual(voiceHeardHistory({generatedSegments,playedSegments}),{retainedSegments:playedSegments,unplayedSegments:generatedSegments-playedSegments,exactTranscriptGuaranteed:false});
 for(const [generatedSegments,playedSegments] of [[3,4],[3,-1],[3,1.5],[NaN,0]])assert.throws(()=>voiceHeardHistory({generatedSegments,playedSegments}),TypeError);
});
test('high risk voice confirmation needs repeat another channel and the current target without executing',()=>{
 for(const repeatConfirmed of [false,true])for(const otherChannelApproved of [false,true])for(const currentTarget of [false,true])assert.deepEqual(voiceRiskGate({repeatConfirmed,otherChannelApproved,currentTarget}),{reviewCandidate:repeatConfirmed&&otherChannelApproved&&currentTarget,operationExecuted:false});
 assert.throws(()=>voiceRiskGate({repeatConfirmed:true,currentTarget:true}),TypeError);
});
