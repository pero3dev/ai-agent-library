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
import { CODING_CONTROL_STAGES, ruleDiscovery, automationReadiness, codingPermissionPath } from '../../lib/coding-controls-model.mjs'
import { CODING_CONTROL_BINDINGS } from '../../lib/coding-controls-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingControlsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CODING_CONTROL_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.includes("security")?3:2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CODING_CONTROL_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})


test('rule discovery stops at the starting cwd and a path reference does not inject a detail file',()=>{
 for(const cwd of ['root','web','ml'])assert.deepEqual(ruleDiscovery(cwd),{root:true,web:cwd==='web',ml:cwd==='ml',referenceInjectsDetail:false});
 assert.throws(()=>ruleDiscovery('__proto__'),RangeError);
});
test('all three unattended conditions must be established, rather than merely starting on a schedule',()=>{
 const conditions={patterned:true,verifiable:true,safeFailure:true};
 assert.equal(automationReadiness(conditions).unattendedCandidate,true);
 for(const key of Object.keys(conditions))assert.equal(automationReadiness({...conditions,[key]:false}).unattendedCandidate,false);
 assert.equal(automationReadiness({}).unattendedCandidate,false);
});
test('unapproved secrets are denied and boundary operations are not automatically executed',()=>{
 for(const mode of ['ask','allowlist','isolated']){
  assert.deepEqual(codingPermissionPath(mode,'secret'),{deny:true,autoExecute:false,needsApproval:false});
  assert.deepEqual(codingPermissionPath(mode,'external'),{deny:false,autoExecute:false,needsApproval:true});
  assert.equal(codingPermissionPath(mode,'bounded').autoExecute,mode!=='ask');
 }
 assert.throws(()=>codingPermissionPath('unknown','bounded'),RangeError);
 assert.throws(()=>codingPermissionPath('ask','unknown'),RangeError);
});
