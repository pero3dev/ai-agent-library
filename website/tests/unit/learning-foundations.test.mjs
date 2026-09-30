import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import { LEARNING_STAGES, learningFrame, causalMask, prefixComparison, demonstrationOrder, sparseReconstruction } from '../../lib/learning-foundations-model.mjs'
import { wrapRegisteredDiagrams } from '../../lib/diagram-decoration.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'

test('causal attention excludes every future key and includes self at both lengths', () => {
  for (const n of [4, 6]) {
    const matrix = causalMask(n)
    assert.equal(matrix.flat().filter(Boolean).length, n * (n + 1) / 2)
    for (let query = 0; query < n; query++) for (let key = 0; key < n; key++) assert.equal(matrix[query][key], key <= query)
  }
  assert.throws(() => causalMask(5), RangeError)
})
test('prefix invalidation starts at the first changed position, while append retains all previous positions', () => {
  assert.deepEqual(prefixComparison('front').reused, [])
  assert.deepEqual(prefixComparison('suffix').reused, [0, 1, 2, 3])
  assert.deepEqual(prefixComparison('suffix').recomputed, [4, 5])
  assert.deepEqual(prefixComparison('append').recomputed, [])
  assert.deepEqual(prefixComparison('append').added, [6])
  assert.equal(prefixComparison('append').prefix, 6)
})
test('changing demonstration order preserves the set and changing count preserves relative order', () => {
  for (const order of ['original', 'reverse', 'rotate']) assert.deepEqual([...demonstrationOrder('order', order)].sort(), ['A', 'B', 'C', 'D'])
  for (const count of [2, 3, 4]) assert.deepEqual(demonstrationOrder('count', count), ['A', 'B', 'C', 'D'].slice(0, count))
  assert.throws(() => demonstrationOrder('count', 8), RangeError)
})
test('sparse illustrative coefficients remain nonnegative with a residual, and all 47 stages are seekable', () => {
  for (const strength of [0, 1, 2]) {
    const model = sparseReconstruction(strength)
    assert.ok(model.coefficients.every(value => value >= 0))
    assert.ok(model.coefficients.filter(value => value === 0).length >= 5)
    assert.ok(model.residual.some(value => value !== 0))
    assert.equal(model.actualModelMeasurement, false)
  }
  assert.equal(Object.values(LEARNING_STAGES).reduce((sum, stages) => sum + stages.length, 0), 47)
  for (const [id, stages] of Object.entries(LEARNING_STAGES)) {
    for (let stage = stages.length - 1; stage >= 0; stage--) assert.equal(learningFrame(id, stage).stage, stage)
    assert.equal(learningFrame(id, -10).stage, 0)
    assert.equal(learningFrame(id, 100).stage, stages.length - 1)
    assert.equal(learningFrame(id, .5).stage, 1)
  }
})

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const components = new Set(['ContextWalkthrough', 'IclWalkthrough', 'InterpretabilityWalkthrough', 'CapabilitiesWalkthrough', 'MultimodalWalkthrough', 'ReadingStep'])
const unwrap = node => components.has(node.name) ? node.children.flatMap(unwrap) : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
const entries = diagramRegistry.diagrams.filter(entry => Object.hasOwn(LEARNING_STAGES, entry.id))
for (const article of [...new Set(entries.map(entry => entry.article))]) test(`${article}: all original prose, formulas and tables survive the reading wrappers`, () => {
  const selected = entries.filter(entry => entry.article === article)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  assert.deepEqual(unwrap(tree), [original])
  for (const entry of selected) assert.equal(entry.stageCount, LEARNING_STAGES[entry.id].length)
})
