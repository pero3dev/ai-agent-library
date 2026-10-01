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
import { CODING_OPTIONS_STAGES, copilotApproval, copilotExclusion, candidateConstraint } from '../../lib/coding-options-model.mjs'
import { CODING_OPTIONS_BINDINGS } from '../../lib/coding-options-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingOptionsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CODING_OPTIONS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.endsWith('/github-copilot.md') ? 3 : 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CODING_OPTIONS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})






test('assessment never counts and new commits invalidate enabled approval',()=>{
 for(const enabled of [false,true])for(const newCommit of [false,true])assert.deepEqual(copilotApproval({enabled,newCommit}),{assessmentCounts:false,approvalCanCount:enabled&&!newCommit,approvalInvalidated:newCommit,mergesAutomatically:false});
 assert.throws(()=>copilotApproval({enabled:true}),TypeError);
});
test('content exclusion keeps the original dated supported unsupported and unknown states',()=>{
 for(const [surface,status]of [['app-cli','supported'],['ide-agent','unsupported'],['cloud','unconfirmed']])assert.deepEqual(copilotExclusion(surface),{status,allSurfacesProtected:false});
 assert.throws(()=>copilotExclusion('all'),RangeError);
});
test('unknown requirements never pass and no state ranks quality',()=>{
 for(const state of ['met','violated','unknown'])assert.deepEqual(candidateConstraint(state),{canProceedToTrial:state==='met',qualityRanked:false,needsConfirmation:state==='unknown'});
 assert.throws(()=>candidateConstraint('yes'),RangeError);
});
