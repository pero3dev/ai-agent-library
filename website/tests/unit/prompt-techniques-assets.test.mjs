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
import { PROMPT_TECHNIQUES_ASSETS_STAGES, promptReleaseGate } from '../../lib/prompt-techniques-assets-model.mjs'
import { PROMPT_TECHNIQUES_ASSETS_BINDINGS } from '../../lib/prompt-techniques-assets-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['PromptTechniquesAssetsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(PROMPT_TECHNIQUES_ASSETS_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, PROMPT_TECHNIQUES_ASSETS_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('release needs explicit review regression promotion shared scope and unused judgment without changing production',()=>{
 for(const reviewed of [false,true])for(const regressionPassed of [false,true])for(const explicitPromotion of [false,true])for(const sharedScopeCovered of [false,true])for(const unusedJudgment of [false,true])assert.deepEqual(promptReleaseGate({reviewed,regressionPassed,explicitPromotion,sharedScopeCovered,unusedJudgment}),{stagedCandidateReady:reviewed&&regressionPassed&&explicitPromotion&&sharedScopeCovered&&unusedJudgment,productionChanged:false,qualityGuaranteed:false});
 assert.throws(()=>promptReleaseGate({reviewed:true,regressionPassed:true,explicitPromotion:true,sharedScopeCovered:true}),TypeError);
});
