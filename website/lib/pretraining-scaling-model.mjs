import { clampPhase, stageForPhase } from './reading-clock.mjs'
import { COMPUTE_ALLOCATION_IDS, computeRatios, fixedComputeAllocations } from './pretraining-compute-model.mjs'

export const PRETRAINING_SCALING_STAGES = Object.freeze([
  { label: '軸', title: 'モデル・データ・学習計算量を、別の軸で考える。', detail: 'N はパラメータ数、D は処理する学習トークン数、C_train は学習計算量です。スケーリング則は条件をそろえた測定から得る経験則であり、能力を一つの尺度で採点するものではありません。' },
  { label: '残差', title: '倍率で小さくなるのは、下限からの差。', detail: '記事の一変数式を L = L∞ + R と分けます。N を r 倍すると残差 R の比は r^(−α) になりますが、下限を含む総損失 L の比とは異なります。α・Nc・L∞ は未設定の記号であり、測定曲線や係数を仮造しません。' },
  { label: '固定予算', title: '同じ計算予算の中で、N と D を配分する。', detail: '手動で確認する補助段階です。C ≈ 6ND という同じ概算なら、固定予算の N 比 × D 比は一定です。説明用の 3 組に損失の最適判定は付けません。' },
  { label: '系譜', title: '固定予算の配分と、予算増加時の拡大を分ける。', detail: '初期則のパラメータ重視、Chinchilla の計算最適、推論時計算という論点の流れを並べます。初期の N 重視を、すべての条件での推奨にはしません。Chinchilla は固定予算内の配分を調べ、予算が増えるときの N と D の近い成長率を示しました。下段の比は 6ND からの代数的説明で、測定された最適値ではありません。N と D の値や単位が等しいという意味でもありません。' },
  { label: '推論時', title: '学習時計算と、利用時に使う計算は別の予算。', detail: '学習では重みを更新します。通常の推論では重みを固定したまま計算を使います。推論時の計算量を増やせば必ず改善するとは限りません。ここでは最新手法や能力の数値を追加しません。' },
  { label: '条件依存', title: '経験係数は、測った条件に依存する。', detail: 'データ、アーキテクチャ、トークナイザの条件をそろえて解釈します。係数は普遍定数ではありません。この図では経験係数も最適な N/D も未設定で、損失の予測や最適構成を算出しません。' }
].map(Object.freeze))
export const COEFFICIENT_CONDITIONS = Object.freeze(['data', 'architecture', 'tokenizer'])

export function pretrainingScalingFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { fixedAllocation = 'reference', growthScale = 2, coefficientCondition = 'data' } = options
  if (!COMPUTE_ALLOCATION_IDS.includes(fixedAllocation) || ![1, 2, 4].includes(growthScale) || !COEFFICIENT_CONDITIONS.includes(coefficientCondition)) throw new RangeError('Unknown scaling choice')
  const normalized = clampPhase(phase, PRETRAINING_SCALING_STAGES.length), stage = stageForPhase(normalized, PRETRAINING_SCALING_STAGES.length)
  return {
    phase: normalized, stage, ...PRETRAINING_SCALING_STAGES[stage],
    residualIdentity: 'R(rN)/R(N) = r^(-alpha)', totalLossRatio: '(Linf + R*r^(-alpha))/(Linf + R)',
    coefficients: { alpha: null, Nc: null, Linf: null }, fittedCoefficients: null, lossPrediction: null, optimum: null,
    allocations: fixedComputeAllocations().map(item => ({ ...item, emphasized: stage === 2 && item.id === fixedAllocation })),
    fixedAllocation: stage === 2 ? fixedAllocation : null,
    fixedBudget: { kind: 'fixed', ...computeRatios(2, .5) },
    growingBudget: { kind: 'growing', ...computeRatios(stage === 3 ? growthScale : 2, stage === 3 ? growthScale : 2) },
    growthScale: stage === 3 ? growthScale : null,
    coefficientCondition: stage === 5 ? coefficientCondition : null,
    conditions: [{ id: 'data', label: 'データ' }, { id: 'architecture', label: 'アーキテクチャ' }, { id: 'tokenizer', label: 'トークナイザ' }].map(item => ({ ...item, emphasized: stage === 5 && item.id === coefficientCondition })),
    inferenceWeights: 'fixed', guaranteedImprovement: false, equalNAndDRecommended: false, empiricalMeasurement: false
  }
}
