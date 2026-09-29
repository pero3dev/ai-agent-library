import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const PRETRAINING_COMPUTE_STAGES = Object.freeze([
  { label: '概算', title: '6ND は、学習に必要な演算回数の概算。', detail: '密な Transformer の学習計算量を C ≈ 6ND と近似します。N はパラメータ数、D は処理する学習トークン数です。係数 6 は順伝播・逆伝播の概算に由来し、構造による条件があります。料金・経過時間・電力の正確な式ではありません。' },
  { label: '積', title: '片方を 2 倍にすると 2 倍、両方なら 4 倍。', detail: '同じ概算モデルの基準 C₀ = 6N₀D₀ と比べると、C/C₀ = (N/N₀)(D/D₀) です。図の面積はこの積を表します。実測の学習効果や費用の倍率ではありません。' },
  { label: '配分', title: '予算を固定すると、N と D の配分が変わる。', detail: '手動で確認する補助段階です。同じ C では N の増加に合わせて D を減らします。3 組は積が等しい説明例であり、どれが最適な損失を与えるかは判定しません。' },
  { label: '実コスト', title: 'FLOPs の先は、実測と提供条件で確かめる。', detail: '固定予算での配分と、予算自体を増やす話を分けます。ハードウェアや並列化効率は実時間と消費エネルギーに、提供条件は費用にも関わります。6ND だけでは実コストは決まらず、未入力の値は未知のままです。' }
].map(Object.freeze))

export const COMPUTE_ALLOCATION_IDS = Object.freeze(['data-heavy', 'reference', 'parameter-heavy'])
export const REAL_COST_FACTORS = Object.freeze(['duration', 'price', 'energy'])

/** Ratios under the same 6ND approximation, not money or elapsed time. */
export function computeRatios(n, d) {
  for (const value of [n, d]) if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new RangeError('ratios must be positive finite numbers')
  const c = n * d
  if (!Number.isFinite(c) || c <= 0) throw new RangeError('compute ratio overflow or underflow')
  return { n, d, c }
}

export function fixedComputeAllocations() {
  return [[.5, 2], [1, 1], [2, .5]].map(([n, d], index) => ({ id: COMPUTE_ALLOCATION_IDS[index], ...computeRatios(n, d) }))
}

export function pretrainingComputeFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { parameterFactor = 1, dataFactor = 1, allocation = 'reference', realCostFactor = 'duration' } = options
  if (![1, 2].includes(parameterFactor) || ![1, 2].includes(dataFactor) || !COMPUTE_ALLOCATION_IDS.includes(allocation) || !REAL_COST_FACTORS.includes(realCostFactor)) throw new RangeError('Unknown compute choice')
  const normalized = clampPhase(phase, PRETRAINING_COMPUTE_STAGES.length), stage = stageForPhase(normalized, PRETRAINING_COMPUTE_STAGES.length)
  return {
    phase: normalized, stage, ...PRETRAINING_COMPUTE_STAGES[stage],
    ratios: computeRatios(stage === 1 ? parameterFactor : 1, stage === 1 ? dataFactor : 1),
    allocations: fixedComputeAllocations().map(item => ({ ...item, emphasized: stage === 2 && item.id === allocation })),
    selectedAllocation: stage === 2 ? allocation : null,
    fixedBudget: { kind: 'fixed', ...computeRatios(2, .5) },
    growingBudget: { kind: 'growing', ...computeRatios(2, 2) },
    realCostFactor: stage === 3 ? realCostFactor : null,
    actualCost: { duration: null, price: null, energy: null },
    realCosts: [
      { id: 'duration', label: '実時間', condition: 'ハードウェア・並列化' },
      { id: 'price', label: '費用', condition: '提供条件・利用量' },
      { id: 'energy', label: '消費エネルギー', condition: '電力と稼働時間' }
    ].map(item => ({ ...item, value: null, emphasized: stage === 3 && item.id === realCostFactor })),
    computeUnit: 'FLOPs', actualCostDeterminedByFlops: false, optimum: null, measuredPerformance: null
  }
}
