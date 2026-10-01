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
import { CODING_OUTCOME_STAGES, evaluationComparison, costReductionVerdict, delegatedConsumption } from '../../lib/coding-outcomes-model.mjs'
import { CODING_OUTCOME_BINDINGS } from '../../lib/coding-outcomes-bindings.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['CodingOutcomesWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
for (const article of [...new Set(Object.values(CODING_OUTCOME_BINDINGS).map(entry => entry.article))]) test(`${article}: preserve all original paragraphs, tables, Mermaid and control boundaries`, () => {
  const selected = diagramRegistry.diagrams.filter(entry => entry.article === article)
  assert.equal(selected.length, article.includes("evaluation")?2:3)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, CODING_OUTCOME_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})


test('prompt information and attempt differences prevent treating results as a controlled tool comparison',()=>{
 for(const condition of ['same','prompt','information','attempts'])assert.equal(evaluationComparison(condition).comparable,condition==='same');
 assert.throws(()=>evaluationComparison('__proto__'),RangeError);
});
test('less consumption with lower quality never passes the optimization decision',()=>{
 assert.equal(costReductionVerdict({consumptionLower:true,qualityPreserved:true}).accepted,true);
 for(const criteria of [{consumptionLower:true,qualityPreserved:false},{consumptionLower:false,qualityPreserved:true},{}])assert.equal(costReductionVerdict(criteria).accepted,false);
});
test('delegation adds child consumption and never guarantees a lower total',()=>{
 for(const delegated of [false,true])assert.deepEqual(delegatedConsumption(delegated),{parentContextReduced:delegated,childConsumptionAdded:delegated,totalReductionGuaranteed:false});
 assert.throws(()=>delegatedConsumption('true'),TypeError);
});
