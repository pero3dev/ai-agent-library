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
  '<AttentionWalkthrough onClick="callback">probe</AttentionWalkthrough>',
  '<AttentionWalkthrough {...{step: "1"}}>probe</AttentionWalkthrough>',
  '<AttentionStep step={1 + 1}>probe</AttentionStep>',
  '<AttentionStep step="6">probe</AttentionStep>',
  '<AttentionStep step="01">probe</AttentionStep>',
  '<AttentionStep step="1" step="2">probe</AttentionStep>',
  '<AttentionStep step="1" style="color:red">probe</AttentionStep>',
  '<ReadingWalkthrough diagramId="unknown">probe</ReadingWalkthrough>',
  '<ReadingWalkthrough diagramId="../scene">probe</ReadingWalkthrough>',
  '<ReadingWalkthrough diagramId={"agent-loop"}>probe</ReadingWalkthrough>',
  '<ReadingWalkthrough diagramId="agent-loop" module="./scene">probe</ReadingWalkthrough>',
  '<ReadingWalkthrough {...{diagramId: "agent-loop"}}>probe</ReadingWalkthrough>',
  '<ReadingStep step="5">probe</ReadingStep>',
  '<ReadingStep step="01">probe</ReadingStep>',
  '<ReadingStep step={1}>probe</ReadingStep>',
  '<ReadingStep step="1" step="2">probe</ReadingStep>',
  '<ReadingStep step="1" style="color:red">probe</ReadingStep>',
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

test('attention components accept only the declared literal stage values', () => {
  for (const step of ['0', '1', '2', '3', '4', '5']) {
    assert.deepEqual(findUnsafeMdx(`<AttentionWalkthrough><AttentionStep step="${step}">本文</AttentionStep></AttentionWalkthrough>`), [])
  }
})

test('reading components require a known literal diagram ID and stage', () => {
  for (const diagramId of ['agent-loop', 'workflow-comparison']) {
    for (const step of ['0', '1', '2', '3', '4']) {
      assert.deepEqual(findUnsafeMdx(`<ReadingWalkthrough diagramId="${diagramId}"><ReadingStep step="${step}">本文</ReadingStep></ReadingWalkthrough>`), [])
    }
  }
  for (const source of ['<ReadingWalkthrough>本文</ReadingWalkthrough>', '<ReadingStep>本文</ReadingStep>']) {
    assert.ok(findUnsafeMdx(source).length > 0)
  }
})

test('Transformer stages are bounded by their enclosing diagram, including ordinary nested blocks', () => {
  for (const [diagramId, count] of [['transformer-io', 4], ['transformer-position', 4], ['transformer-block', 9]]) {
    for (let stage = 0; stage < count; stage++) {
      assert.deepEqual(findUnsafeMdx(`<TransformerWalkthrough diagramId="${diagramId}">\n\n<ReadingStep step="${stage}">\n\n- 本文\n\n</ReadingStep>\n\n</TransformerWalkthrough>`), [])
    }
    assert.ok(findUnsafeMdx(`<TransformerWalkthrough diagramId="${diagramId}"><ReadingStep step="${count}">本文</ReadingStep></TransformerWalkthrough>`).length > 0)
  }
  for (const source of [
    '<TransformerWalkthrough>本文</TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="agent-loop">本文</TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="../scene">本文</TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId={"transformer-io"}>本文</TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-io" module="./scene">本文</TransformerWalkthrough>',
    '<TransformerWalkthrough {...{diagramId: "transformer-io"}}>本文</TransformerWalkthrough>',
    '<ReadingStep step="0">本文</ReadingStep>',
    '<ReadingWalkthrough diagramId="agent-loop"><ReadingStep step="5">本文</ReadingStep></ReadingWalkthrough>',
    '<AttentionWalkthrough><ReadingStep step="0">本文</ReadingStep></AttentionWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><AttentionStep step="0">本文</AttentionStep></TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><ReadingStep step="08">本文</ReadingStep></TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><ReadingStep step={8}>本文</ReadingStep></TransformerWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><ReadingWalkthrough diagramId="agent-loop">本文</ReadingWalkthrough></TransformerWalkthrough>'
  ]) assert.ok(findUnsafeMdx(source).length > 0, source)
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
