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
import { VENDOR_PROMPT_CONTROLS_STAGES, vendorPromptControlsFrame, vendorExampleAdmission, claudeHistoryRoute, openaiConfigurationGate, geminiThinkingGate, vendorPromptAcceptance } from '../../lib/vendor-prompt-controls-model.mjs'
import { VENDOR_PROMPT_CONTROLS_BINDINGS } from '../../lib/vendor-prompt-controls-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['VendorPromptControlsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(VENDOR_PROMPT_CONTROLS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, VENDOR_PROMPT_CONTROLS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('all scene clocks render initial final midpoint and bounded stages and reject invalid states',()=>{
 for(const [id,stages] of Object.entries(VENDOR_PROMPT_CONTROLS_STAGES)){
  for(const [phase,expected] of [[0,0],[-1,0],[1.6,2],[stages.length-1,stages.length-1],[stages.length+1,stages.length-1]]){
   const frame=vendorPromptControlsFrame(id,phase);assert.equal(frame.stage,expected);assert.equal(frame.title,stages[expected].title);
  }
  assert.throws(()=>vendorPromptControlsFrame(id,NaN),TypeError);
 }
 assert.throws(()=>vendorPromptControlsFrame('unknown',0),TypeError);
});
test('conflicting unrepresentative or repetitive examples do not become quality evidence',()=>{
 for(let mask=0;mask<8;mask++)assert.deepEqual(vendorExampleAdmission({aligned:Boolean(mask&1),representative:Boolean(mask&2),repetitive:Boolean(mask&4)}),{reviewCandidate:mask===3,qualityGuaranteed:false});
 assert.throws(()=>vendorExampleAdmission({aligned:true,representative:true}),TypeError)
});
test('Claude thinking cannot survive changed premises or skip required retained system messages',()=>{
 for(let mask=0;mask<32;mask++){const changed=Boolean(mask&1),preserved=Boolean(mask&2),supported=Boolean(mask&4),expired=Boolean(mask&8),resent=Boolean(mask&16);const next=changed||!preserved?'rebuild-history':!supported?'confirm-support':expired&&!resent?'retain-and-resend':'history-candidate';assert.deepEqual(claudeHistoryRoute({protectedPrefixChanged:changed,thinkingPreserved:preserved,supportedUpdate:supported,updateExpired:expired,systemResent:resent}),{next,requestSent:false})}
 assert.throws(()=>claudeHistoryRoute({protectedPrefixChanged:false,thinkingPreserved:true,supportedUpdate:true,updateExpired:false}),TypeError)
});
test('OpenAI configuration updates do not silently accept multiple agents pro automatic compact or consecutive updates',()=>{
 for(let mask=0;mask<32;mask++)assert.deepEqual(openaiConfigurationGate({singleAgent:Boolean(mask&1),standardMode:Boolean(mask&2),automaticCompaction:Boolean(mask&4),standaloneCompact:Boolean(mask&8),consecutiveUpdate:Boolean(mask&16)}),{reviewCandidate:mask===3,requestSent:false});
 assert.throws(()=>openaiConfigurationGate({singleAgent:true,standardMode:true,automaticCompaction:false,standaloneCompact:false}),TypeError)
});
test('SDK type presence cannot establish Gemini model API or actual request acceptance',()=>{
 for(let mask=0;mask<16;mask++)assert.deepEqual(geminiThinkingGate({sdkTyped:Boolean(mask&1),modelConfirmed:Boolean(mask&2),apiConfirmed:Boolean(mask&4),requestValidated:Boolean(mask&8)}),{reviewCandidate:mask===14||mask===15,allModelsCompatible:false,requestSent:false});
 assert.throws(()=>geminiThinkingGate({sdkTyped:true,modelConfirmed:true,apiConfirmed:true}),TypeError)
});
test('migration keeps model API product contract regressions and authority separate from deployment',()=>{
 for(let mask=0;mask<16;mask++)assert.deepEqual(vendorPromptAcceptance({modelApiChecked:Boolean(mask&1),contractChecked:Boolean(mask&2),regressionPassed:Boolean(mask&4),authorityChecked:Boolean(mask&8)}),{reviewCandidate:mask===15,deploymentExecuted:false});
 assert.throws(()=>vendorPromptAcceptance({modelApiChecked:true,contractChecked:true,regressionPassed:true}),TypeError)
});
