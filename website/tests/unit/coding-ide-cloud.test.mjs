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
import { IDE_CLOUD_STAGES, cursorDataBoundary, cursorRunBoundary, desktopContract, devinGuardrail } from '../../lib/coding-ide-cloud-model.mjs'
import { IDE_CLOUD_BINDINGS } from '../../lib/coding-ide-cloud-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingIdeCloudWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(IDE_CLOUD_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, IDE_CLOUD_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})




test('privacy and BYOK keep backend inference and retention exceptions distinct from training',()=>{
 for(const privacy of [false,true])for(const byok of [false,true])assert.deepEqual(cursorDataBoundary({privacy,byok}),{backendUsed:true,inferenceSent:true,trainingMayOccur:!privacy,retentionExceptions:true});
 assert.throws(()=>cursorDataBoundary({privacy:true}),TypeError);
});
test('local Run Modes never imply per command approval for Cloud Agents or hard guarantees',()=>{
 for(const surface of ['local','cloud'])for(const mode of ['review','allowlist','everything'])assert.deepEqual(cursorRunBoundary(surface,mode),{localModeApplies:surface==='local',approvalCanBeRequested:surface==='local'&&mode!=='everything',hardBoundaryGuaranteed:false});
 assert.throws(()=>cursorRunBoundary('unknown','review'),RangeError);
});
test('ACP third party agents do not inherit Devin billing or privacy terms',()=>{
 for(const agent of ['local','cloud','external'])assert.deepEqual(desktopContract(agent),{devinTermsApply:agent!=='external',thirdPartyBilling:agent==='external',cloudExecution:agent==='cloud'});
 assert.throws(()=>desktopContract('__proto__'),RangeError);
});
test('current message blocking continues the session; historical termination is no longer configurable',()=>{
 assert.deepEqual(devinGuardrail('block'),{recorded:true,warns:false,messageBlocked:true,sessionEnded:false,currentlyConfigurable:true,perCommandApproval:false});
 assert.deepEqual(devinGuardrail('kill_session'),{recorded:true,warns:false,messageBlocked:false,sessionEnded:true,currentlyConfigurable:false,perCommandApproval:false});
 assert.equal(devinGuardrail('log').sessionEnded,false);assert.equal(devinGuardrail('warn').warns,true);
 assert.throws(()=>devinGuardrail('off'),RangeError);
});
