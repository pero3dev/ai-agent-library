import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const INFERENCE_QUANTIZATION_STAGES = Object.freeze([
  { label: '対象', title: '重み・活性・KVの、どこを変えるか。', detail: '量子化の対象は重み、演算途中の活性、過去のK/Vです。三つの場所を分け、選んだ対象の表現だけを比較します。図の値の大小は模式例です。' },
  { label: 'bit', title: '1要素に使う表現bit数を比べる。', formula: '16 bit ／ 8 bit ／ 4 bit', detail: '示すのはメタデータ等を除く1要素の表現サイズです。丸めや復元値は計算していません。bit数からモデル全体の実圧縮率、速度、料金、品質を求めることはできません。' },
  { label: '混合精度', title: '重要な部分を、高精度側へ残す。', detail: '説明用の外れ値の位置を動かさず、その部分を16bitの枠に残します。混合精度の概念であり、全対象・全方式で同じ手順や品質維持を保証しません。PTQは学習後に導入する量子化です。具体的な方式の手順は本文を参照します。' },
  { label: '検証', title: '量子化後の出力を、自社タスクで確かめる。', detail: '同じ入力と成功条件で、量子化前後の出力を評価します。図は比較の必要性を示すだけで、合格、品質の同等性、速度向上を判定しません。' }
].map(Object.freeze))
export const INFERENCE_QUANTIZATION_TARGETS = Object.freeze([
  { id: 'weights', label: '重み', detail: '学習済みの値', x: 28 },
  { id: 'activations', label: '活性', detail: '演算途中の値', x: 232 },
  { id: 'kv', label: 'KV', detail: '過去のK/V', x: 436 }
].map(Object.freeze))
export const INFERENCE_QUANTIZATION_BITS = Object.freeze([16, 8, 4])
// Pixel heights distinguish a qualitative large value; these are not data values.
const SAMPLE_HEIGHTS = Object.freeze([22, 32, 76, 27])

export function inferenceQuantizationFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('options must be an object')
  const { target = 'weights', bits = 8 } = options
  if (!INFERENCE_QUANTIZATION_TARGETS.some(item => item.id === target)) throw new RangeError('Unknown quantization target')
  if (!INFERENCE_QUANTIZATION_BITS.includes(bits)) throw new RangeError('Unsupported illustrative bit width')
  const bounded = clampPhase(phase, INFERENCE_QUANTIZATION_STAGES.length), stage = stageForPhase(bounded, INFERENCE_QUANTIZATION_STAGES.length)
  const effectiveBits = stage === 0 ? 16 : bits, mixed = stage >= 2 && effectiveBits < 16
  const regions = INFERENCE_QUANTIZATION_TARGETS.map(region => ({ ...region, selected: region.id === target,
    samples: SAMPLE_HEIGHTS.map((height, slot) => ({ occurrenceId: `${region.id}:value:${slot}`, slot,
      x: region.x + 25 + slot * 36, y: 218 - height, width: 23, height, outlier: slot === 2,
      bits: region.id !== target || (mixed && slot === 2) ? 16 : effectiveBits,
      highPrecisionRetained: region.id === target && mixed && slot === 2 }))
  }))
  return { ...INFERENCE_QUANTIZATION_STAGES[stage], phase: bounded, stage, dataKind: 'conceptual', target, requestedBits: bits,
    effectiveBits, mixed, regions, representation: { unit: 'one-element', regularBits: effectiveBits, outlierBits: mixed ? 16 : effectiveBits,
      metadataIncluded: false, quantizerSpecified: false }, validation: { required: true, executed: false, outcome: null },
    actualCompressionRatio: null, measuredSpeed: null, measuredQuality: null,
    revealProgress: Math.max(0, Math.min(1, bounded - .5)) }
}
