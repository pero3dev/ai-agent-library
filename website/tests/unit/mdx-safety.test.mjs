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
