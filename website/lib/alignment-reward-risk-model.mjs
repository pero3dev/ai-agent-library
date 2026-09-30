import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const ALIGNMENT_REWARD_RISK_STAGES = Object.freeze([
  { label: '代理と目的', title: '同じ出力でも、代理報酬と品質の評価は別。', detail: '方策が出した同じ出力を、学習した報酬モデルと別の品質評価へ渡します。後者も真の良さそのものを直接測れるわけではありません。図はどちらの評価値も置きません。' },
  { label: '過剰最適化', title: '代理への最適化が、品質からずれうる。', detail: '代理報酬を強く追うと、冗長さや体裁を好む穴を突くことがあります。同じ出力を別の品質評価で見る経路も保ちます。ここで示すのは関係であり、実測曲線や品質が下がり始める点ではありません。' },
  { label: '正則化と再評価', title: '元からの逸脱を抑え、報酬モデルを見直す。', detail: '参照方策からのKLで方策の逸脱を抑え、報酬モデルも再評価します。二つの評価経路は引き続き必要です。正則化と再評価は問題を抑える手段であり、品質や安全の保証ではありません。' }
].map(Object.freeze))

/** Qualitative relationships only: no empirical values or hidden quality oracle. */
export function alignmentRewardRiskFrame(phase, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options))) throw new TypeError('options must be a plain object')
  if (Reflect.ownKeys(options).length) throw new RangeError('reward risk has no options')
  const count = ALIGNMENT_REWARD_RISK_STAGES.length
  const bounded = clampPhase(phase, count), stage = stageForPhase(bounded, count)
  const left = Math.max(0, stage - .5), right = Math.min(count - 1, stage + .5)
  return {
    phase: bounded, stage, progress: (bounded - left) / (right - left),
    ...ALIGNMENT_REWARD_RISK_STAGES[stage], stageLabel: ALIGNMENT_REWARD_RISK_STAGES[stage].label,
    outputId: 'answer-0', policyId: 'pi-theta', referencePolicyId: 'pi-ref',
    lanes: [
      { id: 'proxy', kind: 'learned-reward-model', label: '代理報酬', value: null },
      { id: 'quality', kind: 'separate-assessment', label: '別の品質評価（真の良さそのものではない）', value: null, groundTruthAccess: false }
    ],
    proxyEmphasis: stage === 1, symptoms: ['verbosity', 'appearance'],
    constraint: stage === 2 ? 'KL' : null, reassessment: stage === 2,
    curve: null, turningPoint: null, optimum: null,
    empiricalMeasurement: false, safetyGuarantee: false
  }
}
