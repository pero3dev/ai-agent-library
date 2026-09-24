import { softmaxProbabilities, nucleusFilter, selectToken } from './generation-model.mjs'
import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const INFERENCE_SAMPLING_STAGES = Object.freeze([
  { label: 'ロジット', title: '候補ごとのスコアを、確率へ変える。', formula: 'z → softmax(z / T)', detail: 'A〜Dは説明用の4候補です。ロジットは確率ではなく、負の値も取ります。繰り返しペナルティなどはロジットへの調整ですが、方式別の効果値はここでは計算しません。' },
  { label: '温度', title: '温度を変えて、確率の形を比べる。', formula: 'pᵢ = exp(zᵢ / T) / Σ exp(zⱼ / T)', detail: '正の温度ではsoftmaxで確率へ変換します。貪欲は最大スコアを直接選ぶ別の分岐です。T=0をsoftmax式へ代入せず、選択が一つになることを確信100%とは読みません。' },
  { label: 'top-k', title: '上位から、残す候補数を決める。', formula: '上位 k 個 → 残した質量で再正規化', detail: 'top-kは個数を決める方法です。説明用の同点は候補ID順に扱います。残した候補から選ぶ前に、確率の和を1へ戻します。' },
  { label: 'top-p', title: '個数と累積確率の、二つの制限を比べる。', formula: '累積 ≥ p の最小集合 → 再正規化 → 選択', detail: 'top-kは個数、top-pは確率上位の累積が閾値以上になる最小集合を決めます。この図では二つを重ねず、片方だけ使います。残した質量で割り直した分布と固定uによる結果まで同じ画面で確認できます。' },
  { label: '正規化', title: '残した確率の和で割り直す。', formula: 'p′ᵢ = pᵢ / Z（残す候補）、除外は0', detail: 'Zは残した候補の元の確率の合計です。各確率をZで割ると、選択に使う確率の和が1になります。表示を丸めた値では集合や抽選を決めません。' },
  { label: '選択', title: '固定したuを、累積帯へ置く。', formula: '0 ≤ u < 1 ／ 区間の境界は次の候補へ', detail: '色ごとの幅は再正規化後の選択確率です。固定uが入る区間から1トークンを選びます。同じ条件へ戻ると同じ結果になり、描画のたびに乱数を引き直しません。' },
  { label: '再現性', title: '抽選の違いと、スコアの違いを分ける。', detail: '同じ分布でuを変える例と、貪欲を固定して拮抗したスコアだけ変える例を分けます。モデル版・演算・バッチ条件は別の確認対象です。説明用の微小差は実機の誤差量ではありません。' }
].map(Object.freeze))

export const INFERENCE_SAMPLING_TOKENS = Object.freeze([
  { tokenId: 0, label: 'A', color: '#74e3cf' }, { tokenId: 1, label: 'B', color: '#baa7f3' },
  { tokenId: 2, label: 'C', color: '#f1c27e' }, { tokenId: 3, label: 'D', color: '#f5a697' }
].map(Object.freeze))
export const INFERENCE_SAMPLING_LOGITS = Object.freeze([.4, .3, .2, .1].map(Math.log))
export const INFERENCE_SAMPLING_TEMPERATURES = Object.freeze([0, .5, 1, 2])
export const INFERENCE_SAMPLING_TOP_K = Object.freeze([1, 2, 4])
export const INFERENCE_SAMPLING_TOP_P = Object.freeze([.6, .8, 1])
export const INFERENCE_SAMPLING_DRAWS = Object.freeze([.22, .62, .92])
const sum = values => values.reduce((total, value) => total + value, 0)
const clamp01 = value => Math.max(0, Math.min(1, value))
const isDenseFiniteArray = values => Array.isArray(values) && Array.from(values).every(Number.isFinite)

/** Same return contract as nucleusFilter; ties keep token-ID order. */
export function topKFilter(probabilities, k) {
  if (!isDenseFiniteArray(probabilities)) throw new TypeError('Probabilities must be a dense array of finite numbers')
  const { order } = nucleusFilter(probabilities, 1) // Shared input validation.
  if (!Number.isInteger(k) || k < 1 || k > probabilities.length) throw new RangeError('top-k must be an integer in [1, vocabulary size]')
  const kept = probabilities.map((_, id) => order.slice(0, k).includes(id))
  const retainedMass = sum(probabilities.filter((_, id) => kept[id]))
  return { order, kept, retainedMass, probabilities: probabilities.map((value, id) => kept[id] ? value / retainedMass : 0) }
}

function optionsFor(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('options must be an object')
  const { temperature = 1, method = 'top-p', topK = 2, topP = .8, draw = .62 } = options
  if (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0) throw new RangeError('temperature must be finite and nonnegative')
  if (!['none', 'top-k', 'top-p'].includes(method)) throw new RangeError('Unknown sampling method')
  if (!Number.isInteger(topK) || topK < 1 || topK > 4) throw new RangeError('top-k must be in [1,4]')
  if (typeof topP !== 'number' || !Number.isFinite(topP) || topP <= 0 || topP > 1) throw new RangeError('top-p must be in (0,1]')
  if (typeof draw !== 'number' || !Number.isFinite(draw) || draw < 0 || draw >= 1) throw new RangeError('draw must be in [0,1)')
  return { temperature, method, topK, topP, draw }
}

export function samplingDistribution(logits = INFERENCE_SAMPLING_LOGITS, options = {}) {
  if (!isDenseFiniteArray(logits) || logits.length !== 4) throw new TypeError('This fixture has exactly four finite candidate logits without holes')
  const config = optionsFor(options), greedy = config.temperature === 0
  // Never divide by zero. Greedy shows a T=1 reference distribution separately.
  const probabilities = softmaxProbabilities(logits, greedy ? 1 : config.temperature)
  const order = logits.map((_, id) => id).sort((a, b) => logits[b] - logits[a] || a - b)
  const filtered = greedy ? null : config.method === 'top-k' ? topKFilter(probabilities, config.topK)
    : nucleusFilter(probabilities, config.method === 'top-p' ? config.topP : 1)
  const selection = greedy ? probabilities.map((_, id) => id === order[0] ? 1 : 0) : filtered.probabilities
  const selectedTokenId = greedy ? order[0] : selectToken(selection, config.draw)
  let cumulative = 0
  const rows = probabilities.map((probability, id) => {
    const low = cumulative; cumulative += selection[id]
    return { ...INFERENCE_SAMPLING_TOKENS[id], occurrenceId: `candidate:${id}`, logit: logits[id], rank: order.indexOf(id) + 1,
      probability, kept: greedy ? id === selectedTokenId : filtered.kept[id], selectionProbability: selection[id],
      cumulativeLow: low, cumulativeHigh: cumulative, selected: id === selectedTokenId }
  })
  return { ...config, rows, order, selectionKind: greedy ? 'greedy' : 'sampling', probabilityKind: greedy ? 'reference-t1' : 'temperature',
    effectiveMethod: greedy ? null : config.method, effectiveDraw: greedy ? null : config.draw,
    retainedMass: greedy ? null : filtered.retainedMass, selectedTokenId, selectedLabel: rows[selectedTokenId].label,
    retainedCount: rows.filter(row => row.kept).length, qualityJudgment: null }
}

export function samplingComparison(kind = 'draw') {
  if (!['draw', 'logit'].includes(kind)) throw new RangeError('Unknown comparison kind')
  const left = kind === 'draw' ? samplingDistribution(INFERENCE_SAMPLING_LOGITS, { method: 'none', draw: .22 })
    : samplingDistribution([1.000001, 1, 0, -1], { temperature: 0 })
  const right = kind === 'draw' ? samplingDistribution(INFERENCE_SAMPLING_LOGITS, { method: 'none', draw: .62 })
    : samplingDistribution([.999999, 1, 0, -1], { temperature: 0 })
  return { kind, changedField: kind === 'draw' ? 'draw' : 'logit-A', left, right }
}

export function inferenceSamplingFrame(phase, options = {}) {
  const config = optionsFor(options), variation = options.variation ?? 'draw'
  const bounded = clampPhase(phase, INFERENCE_SAMPLING_STAGES.length), stage = stageForPhase(bounded, INFERENCE_SAMPLING_STAGES.length)
  const effective = stage === 0 ? { ...config, temperature: 1, method: 'none' }
    : stage === 1 ? { ...config, method: 'none' } : stage === 2 ? { ...config, method: 'top-k' } : config
  return { ...INFERENCE_SAMPLING_STAGES[stage], phase: bounded, stage, dataKind: 'illustrative', distribution: samplingDistribution(INFERENCE_SAMPLING_LOGITS, effective),
    ...(stage > 0 && stage < 6 && config.temperature === 0 ? { formula: '貪欲: argmax(z) ／ T=0をsoftmaxへ代入しない' } : {}),
    controls: config, comparison: samplingComparison(variation), selectionProgress: clamp01(bounded - 4.5),
    rules: { topK: config.topK, topP: config.topP, exclusive: true }, modelWeightsChanged: false }
}
