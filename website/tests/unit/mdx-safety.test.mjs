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

test('MoE wrappers require fixed IDs, literal properties and diagram-specific stage bounds', () => {
  for (const [id, count] of [['moe-routing-load', 8], ['moe-parameters-communication', 6]]) {
    for (let stage = 0; stage < count; stage++) {
      assert.deepEqual(findUnsafeMdx(`<MoEWalkthrough diagramId="${id}"><ReadingStep step="${stage}">本文</ReadingStep></MoEWalkthrough>`), [])
    }
    assert.ok(findUnsafeMdx(`<MoEWalkthrough diagramId="${id}"><ReadingStep step="${count}">本文</ReadingStep></MoEWalkthrough>`).length)
  }
  for (const source of [
    '<MoEWalkthrough>本文</MoEWalkthrough>',
    '<MoEWalkthrough diagramId="transformer-io">本文</MoEWalkthrough>',
    '<MoEWalkthrough diagramId="../scene">本文</MoEWalkthrough>',
    '<MoEWalkthrough diagramId={"moe-routing-load"}>本文</MoEWalkthrough>',
    '<MoEWalkthrough diagramId="moe-routing-load" module="./scene">本文</MoEWalkthrough>',
    '<MoEWalkthrough {...{diagramId: "moe-routing-load"}}>本文</MoEWalkthrough>',
    '<MoEWalkthrough diagramId="moe-routing-load"><AttentionStep step="0">本文</AttentionStep></MoEWalkthrough>',
    '<MoEWalkthrough diagramId="moe-routing-load"><ReadingStep step={1}>本文</ReadingStep></MoEWalkthrough>',
    '<MoEWalkthrough diagramId="moe-routing-load"><ReadingStep step="07">本文</ReadingStep></MoEWalkthrough>',
    '<MoEWalkthrough diagramId="moe-routing-load"><MoEWalkthrough diagramId="moe-parameters-communication">本文</MoEWalkthrough></MoEWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><MoEWalkthrough diagramId="moe-routing-load">本文</MoEWalkthrough></TransformerWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="attention-kv-sharing"><MoEWalkthrough diagramId="moe-routing-load">本文</MoEWalkthrough></AttentionVariantsWalkthrough>'
  ]) assert.ok(findUnsafeMdx(source).length, source)
})

test('foundations wrappers allow only literal fixed IDs and their own stage ranges', () => {
  for (const [id, count] of [['generation-token-loop', 8], ['tokenization-counting', 7]]) {
    for (let stage = 0; stage < count; stage++) {
      assert.deepEqual(findUnsafeMdx(`<FoundationsWalkthrough diagramId="${id}"><ReadingStep step="${stage}">本文</ReadingStep></FoundationsWalkthrough>`), [])
    }
    assert.ok(findUnsafeMdx(`<FoundationsWalkthrough diagramId="${id}"><ReadingStep step="${count}">本文</ReadingStep></FoundationsWalkthrough>`).length)
  }
  for (const source of [
    '<FoundationsWalkthrough>本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="moe-routing-load">本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="../scene">本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId={"generation-token-loop"}>本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop" module="./scene">本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop" diagramId="tokenization-counting">本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough {...{diagramId: "generation-token-loop"}}>本文</FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop"><AttentionStep step="0">本文</AttentionStep></FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop"><ReadingStep step={1}>本文</ReadingStep></FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop"><ReadingStep step="07">本文</ReadingStep></FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop"><ReadingStep>本文</ReadingStep></FoundationsWalkthrough>',
    '<FoundationsWalkthrough diagramId="generation-token-loop"><FoundationsWalkthrough diagramId="tokenization-counting">本文</FoundationsWalkthrough></FoundationsWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><FoundationsWalkthrough diagramId="generation-token-loop">本文</FoundationsWalkthrough></TransformerWalkthrough>',
    '<MoEWalkthrough diagramId="generation-token-loop">本文</MoEWalkthrough>',
    '<ReadingStep step="6">本文</ReadingStep>'
  ]) assert.ok(findUnsafeMdx(source).length, source)
})

test('inference wrappers constrain all four IDs, parent stage bounds and inert literal props', () => {
  for (const [id, count] of [['inference-sampling', 7], ['inference-cache-batching', 6], ['inference-speculative', 6], ['inference-quantization', 4]]) {
    for (let stage = 0; stage < count; stage++) {
      assert.deepEqual(findUnsafeMdx(`<InferenceWalkthrough diagramId="${id}">\n\n<ReadingStep step="${stage}">\n\n- 本文\n\n</ReadingStep>\n\n</InferenceWalkthrough>`), [])
    }
    assert.ok(findUnsafeMdx(`<InferenceWalkthrough diagramId="${id}"><ReadingStep step="${count}">本文</ReadingStep></InferenceWalkthrough>`).length)
    assert.ok(findUnsafeMdx(`<FoundationsWalkthrough diagramId="${id}">本文</FoundationsWalkthrough>`).length)
  }
  for (const source of [
    '<InferenceWalkthrough>本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="generation-token-loop">本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="../scene">本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId={"inference-sampling"}>本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling" module="./scene">本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling" diagramId="inference-quantization">本文</InferenceWalkthrough>',
    '<InferenceWalkthrough {...{diagramId: "inference-sampling"}}>本文</InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><AttentionStep step="0">本文</AttentionStep></InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><ReadingStep step={1}>本文</ReadingStep></InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><ReadingStep step="06">本文</ReadingStep></InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><ReadingStep>本文</ReadingStep></InferenceWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><InferenceWalkthrough diagramId="inference-quantization">本文</InferenceWalkthrough></InferenceWalkthrough>',
    '<TransformerWalkthrough diagramId="transformer-block"><InferenceWalkthrough diagramId="inference-sampling">本文</InferenceWalkthrough></TransformerWalkthrough>',
    '<InferenceWalkthrough diagramId="inference-sampling"><FoundationsWalkthrough diagramId="generation-token-loop">本文</FoundationsWalkthrough></InferenceWalkthrough>',
    'import { InferenceWalkthrough } from "untrusted"',
    '<ReadingStep step="6">本文</ReadingStep>'
  ]) assert.ok(findUnsafeMdx(source).length, source)
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

test('attention variant wrappers enforce fixed IDs, literal attributes and their own stage bounds', () => {
  for (const [id, count] of [['attention-kv-sharing', 5], ['attention-compute-memory', 6], ['attention-context-range', 4]]) {
    for (let stage = 0; stage < count; stage++) {
      assert.deepEqual(findUnsafeMdx(`<AttentionVariantsWalkthrough diagramId="${id}"><ReadingStep step="${stage}">本文</ReadingStep></AttentionVariantsWalkthrough>`), [])
    }
    assert.ok(findUnsafeMdx(`<AttentionVariantsWalkthrough diagramId="${id}"><ReadingStep step="${count}">本文</ReadingStep></AttentionVariantsWalkthrough>`).length)
  }
  for (const source of [
    '<AttentionVariantsWalkthrough>本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="transformer-io">本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="../scene">本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId={"attention-kv-sharing"}>本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="attention-kv-sharing" module="./scene">本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough {...{diagramId: "attention-kv-sharing"}}>本文</AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="attention-kv-sharing"><AttentionStep step="0">本文</AttentionStep></AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="attention-kv-sharing"><ReadingStep step={1}>本文</ReadingStep></AttentionVariantsWalkthrough>',
    '<AttentionVariantsWalkthrough diagramId="attention-kv-sharing"><TransformerWalkthrough diagramId="transformer-io">本文</TransformerWalkthrough></AttentionVariantsWalkthrough>'
  ]) assert.ok(findUnsafeMdx(source).length, source)
})
