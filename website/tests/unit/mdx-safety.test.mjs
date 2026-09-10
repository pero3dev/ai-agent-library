import assert from 'node:assert/strict'
import test from 'node:test'
import remarkMdx from 'remark-mdx'
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

test('actual decorations and literal escaped text remain accepted', () => {
  const tree = parser.parse('Agent を学びます。\n\n> **TODO(要確認):** 仕様を確認します\n\n### アンチパターン\n\n- 失敗例\n\n### チェックリスト\n\n- 確認事項')
  applyDecorations(tree, {
    route: '/docs/probe',
    glossary: [{ name: 'Agent', href: '/docs/concepts/agent-loop', summary: '引用 " と { 文字列 }' }]
  })
  const mdx = writer.stringify(tree)
  assert.match(mdx, /TodoCallout/)
  assert.match(mdx, /PracticeSection/)
  assert.match(mdx, /GlossaryTerm/)
  assert.deepEqual(findUnsafeMdx(mdx), [])
  assert.deepEqual(findUnsafeMdx(roundTrip('本文の { 式ではない文字列 } と a < b。\n\n```jsx\n<script>{1+1}</script>\n```')), [])
})
