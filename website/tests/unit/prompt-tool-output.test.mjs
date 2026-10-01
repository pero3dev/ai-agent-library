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
import { PROMPT_TOOL_OUTPUT_STAGES, promptStop, structuredNext } from '../../lib/prompt-tool-output-model.mjs'
import { PROMPT_TOOL_OUTPUT_BINDINGS } from '../../lib/prompt-tool-output-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['PromptToolOutputWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(PROMPT_TOOL_OUTPUT_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 2)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, PROMPT_TOOL_OUTPUT_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})

test('original error example stops at three and missing information separately returns to questions',()=>{
 for(const sameErrors of [0,1,2,3,4])for(const informationMissing of [false,true])assert.deepEqual(promptStop({sameErrors,informationMissing}),{stopAndReport:sameErrors>=3,askForInformation:informationMissing,actionExecuted:false});
 assert.throws(()=>promptStop({sameErrors:1,informationMissing:'unknown'}),TypeError);
});
test('structured output needs schema and business validation and retries twice after the initial attempt',()=>{
 for(const schemaValid of [false,true])for(const businessValid of [false,true])for(const attempt of [0,1,2])assert.deepEqual(structuredNext({schemaValid,businessValid,attempt}),{next:schemaValid&&businessValid?'use':attempt<2?'retry':'fail',guaranteesAllContent:false});
 for(const attempt of [-1,3,NaN])assert.throws(()=>structuredNext({schemaValid:true,businessValid:true,attempt}),TypeError);
 assert.throws(()=>structuredNext({schemaValid:true,attempt:0}),TypeError);
});
