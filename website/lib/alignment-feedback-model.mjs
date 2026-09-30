import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const ALIGNMENT_FEEDBACK_STAGES = Object.freeze([
  { label: '検証器', title: '報酬を検証できる範囲で、検証器を使う。', detail: '数学・コードのように報酬を検証できるタスクでは、検証器からの報酬でモデルを学習できます。図の段階列は同じ解答の位置だけを示し、思考内容や正誤を作りません。報酬の出所と評価する粒度は別の分類です。' },
  { label: '結果と過程', title: '同じ解答の、どの位置を評価するか。', detail: '結果評価は最終結果に、過程評価は各中間段階に置きます。丸とひし形は評価位置の印であり、正解・不正解の判定ではありません。この粒度の違いから評価の出所は決まりません。' },
  { label: '適用範囲', title: '報酬の出所と、結果・過程の粒度を分ける。', detail: 'RLVRは報酬を検証できる範囲に限られます。一方、過程評価には人手等の段階ラベルから学習する報酬モデルもあります。結果評価にも学習したモデルを使えます。出所と粒度は別の軸ですが、全組合せが全タスクで使えるとは限りません。' },
  { label: '調整の副作用', title: '同調への偏りと、能力・安全の評価を分ける。', detail: '選好データの偏りが、出力を同調へ寄せる迎合につながることがあります。安全などの調整で特定タスクの能力が下がりうることをアラインメント税と呼びます。能力と安全は別々に評価します。どちらの副作用も全モデルの必然ではなく、低下率や改善量は置きません。' },
  { label: 'フィードバックの作り方', title: '選好ラベルを作る位置で、人手とAIを比べる。', detail: '人手とAIは、選好データを作る同じ上流位置の別の選択肢です。選択で変えるのは作り手の強調だけです。結果・過程の粒度や、下流の能力・安全を切り替える操作ではなく、無害性の保証でもありません。' }
].map(Object.freeze))

export const FEEDBACK_LABEL_SOURCE_IDS = Object.freeze(['human', 'ai'])

/** Evaluation locations are not correctness labels; source does not select granularity. */
export function alignmentFeedbackFrame(phase, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options))) throw new TypeError('options must be a plain object')
  if (Reflect.ownKeys(options).some(key => key !== 'labelSource')) throw new RangeError('unknown feedback option')
  const { labelSource = 'human' } = options
  if (typeof labelSource !== 'string') throw new TypeError('labelSource must be a string')
  if (!FEEDBACK_LABEL_SOURCE_IDS.includes(labelSource)) throw new RangeError('unknown label source')
  const count = ALIGNMENT_FEEDBACK_STAGES.length
  const bounded = clampPhase(phase, count), stage = stageForPhase(bounded, count)
  const left = Math.max(0, stage - .5), right = Math.min(count - 1, stage + .5)
  return {
    phase: bounded, stage, progress: (bounded - left) / (right - left),
    ...ALIGNMENT_FEEDBACK_STAGES[stage], stageLabel: ALIGNMENT_FEEDBACK_STAGES[stage].label,
    answerId: 'answer-0', steps: ['step-1', 'step-2', 'step-3'], finalId: 'final', stepText: null,
    marks: [
      { granularity: 'outcome', target: 'final' },
      ...['step-1', 'step-2', 'step-3'].map(target => ({ granularity: 'process', target }))
    ],
    markMeaning: 'evaluation location only, not correctness',
    rewardSources: ['verifier', 'learned-reward-model'], granularities: ['outcome', 'process'],
    axisRelation: 'orthogonal-classification-not-subtype', scope: 'RLVR requires available verifiable reward',
    processRequiresMechanicalVerification: false, outcomeExcludesLearnedModel: false,
    sideEffects: ['sycophancy', 'alignment-tax'], effectiveLabelSource: stage === 4 ? labelSource : 'human',
    scores: null, observedAccuracy: null, capabilityDelta: null,
    harmlessnessGuarantee: false, sideEffectUniversality: false, empiricalMeasurement: false
  }
}
