import assert from 'node:assert/strict'
import test from 'node:test'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { applyDecorations } from '../../lib/doc-decorations.mjs'
import { findUnsafeMdx } from '../../lib/mdx-safety.mjs'

const parser = unified().use(remarkParse)
const writer = unified().use(remarkStringify).use(remarkMdx)
const roundTrip = source => writer.stringify(parser.parse(source))

for (const source of [
  '<GlossaryTerm href={1 + 1}>probe</GlossaryTerm>',
  '<GlossaryTerm {...{href: "/docs"}}>probe</GlossaryTerm>',
  '<PracticeSection kind="checklist"><GlossaryTerm summary={1 + 1}>probe</GlossaryTerm></PracticeSection>',
  '<TodoCallout onClick="callback">probe</TodoCallout>',
  '<GlossaryTerm href="javascript:alert(1)">probe</GlossaryTerm>',
  '<GlossaryTerm href="//external.example/probe">probe</GlossaryTerm>',
  '<GlossaryTerm href="/\\external.example/probe">probe</GlossaryTerm>',
  '<GlossaryTerm href="/&#9;/external.example/probe">probe</GlossaryTerm>',
  '<PracticeSection kind="unsupported">probe</PracticeSection>',
  '<script>probe</script>',
  'export const probe = 1'
]) {
  test(`Markdown → MDX round trip rejects: ${source}`, () => {
    assert.ok(findUnsafeMdx(roundTrip(source)).length > 0)
  })
}

test('MDX expressions and fragments are rejected without evaluating them', () => {
  for (const source of ['{1 + 1}', '<>{1 + 1}</>', '<GlossaryTerm href>probe</GlossaryTerm>']) {
    assert.ok(findUnsafeMdx(source).length > 0)
  }
})

test('article decorations keep literal attributes and escaping', () => {
  const tree = parser.parse('## アンチパターン\n\nTODO(要確認): 根拠を確認する。\n')
  applyDecorations(tree, { route: '/docs/concepts/test', glossary: [] })
  assert.deepEqual(findUnsafeMdx(writer.stringify(tree)), [])
})

test('removed diagram components cannot re-enter generated MDX', () => {
  for (const source of ['<AttentionWalkthrough>本文</AttentionWalkthrough>',
    '<ReadingStep step="0">本文</ReadingStep>',
    '<TransformerWalkthrough diagramId="transformer-io">本文</TransformerWalkthrough>']) {
    assert.ok(findUnsafeMdx(source).some(message => message.startsWith('JSX <')))
  }
})

test('task items preserve checked state and their full inline text for native accessible names', () => {
  const tree = unified().use(remarkParse).use(remarkGfm).parse('- [ ] **権限**を確認する\n- [x] [根拠](https://example.com)を読む\n')
  applyDecorations(tree, { route: '/docs/test' })
  const items = tree.children[0].children
  assert.equal(items[0].checked, null)
  assert.equal(items[1].checked, null)
  assert.equal(items[0].children[0].children[0].name, 'ChecklistBox')
  assert.equal(items[0].children[0].children[0].attributes[0].value, 'false')
  assert.equal(items[1].children[0].children[0].attributes[0].value, 'true')
  assert.deepEqual(findUnsafeMdx(writer.stringify(tree)), [])
  for (const source of ['<ChecklistBox defaultChecked={true}>本文</ChecklistBox>', '<ChecklistBox defaultChecked="anything">本文</ChecklistBox>']) {
    assert.ok(findUnsafeMdx(source).length > 0)
  }
})
