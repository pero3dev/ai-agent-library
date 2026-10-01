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
import { AGENT_CONCEPT_STAGES, agentConceptFrame, toolExchange, memoryPlacement } from '../../lib/agent-concepts-model.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

test('verification rejection prevents tool execution and reaches the model as a refusal observation', () => {
  for (let stage = 0; stage < 7; stage++) for (const success of [true, false]) for (const next of [true, false]) {
    const denied = toolExchange(stage, { permitted: false, success, next })
    assert.equal(denied.execute, false)
    assert.equal(denied.observation, stage >= 5 ? '検証拒否' : null)
    assert.equal(denied.nextRequest, stage === 6 && next)
    const allowed = toolExchange(stage, { permitted: true, success, next })
    assert.equal(allowed.execute, stage >= 3)
    assert.equal(allowed.observation, stage >= 5 ? (success ? '成功' : '実行失敗') : null)
  }
  assert.throws(() => toolExchange(7), RangeError)
})
test('memory placement distinguishes current input, optional retrieval, restart state and cross-session storage', () => {
  assert.deepEqual(memoryPlacement('current'), ['短期記憶', '毎ターンの指示'])
  assert.equal(memoryPlacement('reference')[0], '外部＋読み出し')
  assert.equal(memoryPlacement('progress')[0], '永続化した作業状態')
  assert.equal(memoryPlacement('preference')[0], '長期記憶＋保存基準')
  assert.throws(() => memoryPlacement('__proto__'), RangeError)
})
test('all concept stages have readable paused descriptions and support forward, reverse and bounded seeking', () => {
  assert.equal(Object.values(AGENT_CONCEPT_STAGES).reduce((sum, rows) => sum + rows.length, 0), 69)
  for (const [id, stages] of Object.entries(AGENT_CONCEPT_STAGES)) {
    for (let i = stages.length - 1; i >= 0; i--) {
      assert.equal(agentConceptFrame(id, i).stage, i)
      assert.ok(stages[i].title && stages[i].detail)
    }
    assert.equal(agentConceptFrame(id, -1).stage, 0)
    assert.equal(agentConceptFrame(id, 100).stage, stages.length - 1)
  }
})

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['AgentConceptsWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
const entries = diagramRegistry.diagrams.filter(entry => Object.hasOwn(AGENT_CONCEPT_STAGES, entry.id))
for (const article of [...new Set(entries.map(entry => entry.article))]) test(`${article}: preserve the entire original AST and only allow registered MDX IDs`, () => {
  const selected = entries.filter(entry => entry.article === article)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, AGENT_CONCEPT_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})
