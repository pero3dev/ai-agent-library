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
import { OVERVIEW_STAGES, learningRoute, skillRole, claimQuestions } from '../../lib/overview-reading-model.mjs'
import { diagramRegistry } from '../../lib/diagram-registry.mjs'
import { wrapRegisteredDiagrams, assertDiagramPageMetadata } from '../../lib/diagram-decoration.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

test('role goals and reader routes preserve the source categories without scoring people', () => {
  assert.deepEqual(learningRoute('F'), ['Agentの定義', 'Agentループ', '使う側の章'])
  assert.deepEqual(skillRole('engineer').map(row => row.target), ['実務','実務','専門','専門','実務','実務','入門','実務'])
  assert.deepEqual(skillRole('operations').map(row => row.target), ['実務','入門','入門','専門','専門','実務','入門','入門'])
  const source = readFileSync(new URL('../../../docs/00-overview/skill-map.md', import.meta.url), 'utf8')
  for (const [column, role] of ['engineer', 'architect', 'operations', 'lead'].entries()) {
    const marks = source.split('\n').filter(line => /^\| S[1-8] /.test(line) && line.includes('○'))
      .map(row => row.split('|')[column + 2].trim())
    assert.equal(marks.length, 8)
    assert.deepEqual(skillRole(role).map(item => item.target), marks.map(mark => ({ '△': '入門', '○': '実務', '◎': '専門' })[mark]))
  }
  assert.throws(() => skillRole('__proto__'), RangeError)
})
test('claim controls expose evidence conditions rather than a trust or adoption score', () => {
  assert.ok(claimQuestions('number').includes('独立検証'))
  assert.ok(claimQuestions('demo').includes('本番の条件'))
  assert.ok(claimQuestions('forecast').includes('前提・確率'))
  assert.throws(() => claimQuestions('adopt'), RangeError)
})

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const writer = unified().use(remarkStringify).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml']).use(remarkMdx)
const unwrap = node => ['OverviewReadingWalkthrough', 'ReadingStep'].includes(node.name) ? node.children.flatMap(unwrap)
  : [{ ...node, ...(node.children ? { children: node.children.flatMap(unwrap) } : {}) }]
const entries = diagramRegistry.diagrams.filter(entry => Object.hasOwn(OVERVIEW_STAGES, entry.id))
for (const article of [...new Set(entries.map(entry => entry.article))]) test(`${article}: diagrams preserve every original source node and registered MDX boundaries`, () => {
  const selected = entries.filter(entry => entry.article === article)
  const tree = parser.parse(readFileSync(new URL(`../../../${article}`, import.meta.url), 'utf8'))
  const original = structuredClone(tree)
  const metadata = wrapRegisteredDiagrams(tree, selected[0].route)
  assert.deepEqual(unwrap(tree), [original])
  assert.deepEqual(metadata.diagramIds, selected.map(entry => entry.id))
  for (const entry of selected) assert.equal(entry.stageCount, OVERVIEW_STAGES[entry.id].length)
  const mdx = writer.stringify(tree)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(assertDiagramPageMetadata(mdxParser.parse(mdx), metadata), metadata)
  assert.ok(findUnsafeMdx(mdx.replace(`diagramId="${selected[0].id}"`, 'diagramId="unregistered"')).length > 0)
})
