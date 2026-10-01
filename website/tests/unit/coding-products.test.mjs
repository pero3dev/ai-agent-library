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
import { CODING_PRODUCT_STAGES, claudeRuntimeBoundary, codexCommandNetwork, geminiApiDataClass } from '../../lib/coding-products-model.mjs'
import { CODING_PRODUCT_BINDINGS } from '../../lib/coding-products-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingProductsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CODING_PRODUCT_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, 3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CODING_PRODUCT_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})



test('own runner and remote control do not make Claude inference on premise',()=>{
 for(const location of ['local','managed','self'])assert.deepEqual(claudeRuntimeBoundary(location),{executionOnOwnHost:location!=='managed',inferenceOnOwnHost:false,remoteControlMovesExecution:false});
 assert.throws(()=>claudeRuntimeBoundary('__proto__'),RangeError);
});
test('domain rules require both command network and proxy and never govern other surfaces',()=>{
 for(const network of [false,true])for(const proxy of [false,true])assert.deepEqual(codexCommandNetwork({network,proxy}),{commandsCanConnect:network,domainRulesEnforced:network&&proxy,controlsOtherSurfaces:false});
});
test('Paid API data conditions include regional exceptions but never guarantee no retention',()=>{
 for(const paidService of [false,true])for(const europeanException of [false,true])assert.deepEqual(geminiApiDataClass({paidService,europeanException}),{paidDataConditions:paidService||europeanException,productImprovementUse:!paidService&&!europeanException,noRetentionGuaranteed:false});
 for(const value of [{},{paidService:true},{paidService:false,europeanException:'unknown'}])assert.throws(()=>geminiApiDataClass(value),TypeError);
});
