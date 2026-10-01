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
import { CODING_PRACTICE_STAGES, claudeCacheChange, practiceScheduled, copilotBudgetMinimum } from '../../lib/coding-practice-model.mjs'
import { CODING_PRACTICE_BINDINGS } from '../../lib/coding-practice-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingPracticeWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CODING_PRACTICE_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CODING_PRACTICE_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})







test('cache changes keep dated effort exceptions and never undo external effects',()=>{
 for(const change of ['model','effort','rewind','upgrade-resume'])for(const exception of [false,true]){
  const state=claudeCacheChange(change,exception);
  assert.equal(state.prefixCanStay,change==='rewind'||change==='effort'&&exception);
  assert.equal(state.externalEffectsUndone,false);assert.equal(state.priceGuaranteed,false);
 }
 assert.throws(()=>claudeCacheChange('all',true),TypeError);
});
test('scheduled PC folders require local location and both running states while billing stays separate',()=>{
 for(const surface of ['local','worktree','web'])for(const auth of ['account','api'])for(const computer of [false,true])for(const app of [false,true]){
  assert.deepEqual(practiceScheduled({surface,auth,computer,app}),{canUsePcFolder:surface!=='web'&&computer&&app,localNeedsRunning:surface!=='web',billing:auth,unknownEligibilityResolved:false});
 }
 assert.throws(()=>practiceScheduled({surface:'cloud',auth:'api',computer:true,app:true}),TypeError);
});
test('budget hierarchy preserves minima ties user hard stop and invalid inputs',()=>{
 assert.deepEqual(copilotBudgetMinimum({user:0,cost:20,organization:130,enterprise:200}),{minimum:0,firstBudgets:['user'],userHardStop:true,realCreditsCalculated:false});
 assert.deepEqual(copilotBudgetMinimum({user:20,cost:20,organization:130,enterprise:200}),{minimum:20,firstBudgets:['user','cost'],userHardStop:false,realCreditsCalculated:false});
 for(const key of ['user','cost','organization','enterprise']){const values={user:100,cost:100,organization:100,enterprise:100};values[key]=5;assert.deepEqual(copilotBudgetMinimum(values).firstBudgets,[key]);values[key]=-1;assert.throws(()=>copilotBudgetMinimum(values),TypeError);values[key]=NaN;assert.throws(()=>copilotBudgetMinimum(values),TypeError)}
 assert.throws(()=>copilotBudgetMinimum({user:0}),TypeError);
});
