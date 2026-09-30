import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const REASONING_SEQUENCE_STAGES = Object.freeze([
  { label: '同じ生成の土台', title: '既生成の内容が、後続予測の条件になる。', detail: '推論領域と最終回答の順序を示します。既に生成した内容は後続の予測の条件になります。通常モデルも中間の考察を書けます。記号は模式表示であり、実際の思考内容やトークン数を再現しません。' },
  { label: '中間トークン', title: '条件を受けて、続きを生成する。', detail: '既生成の記号から後続予測へつながる線を追います。記号の追加は説明用の動きです。個数・長さをトークン数、時間、性能として読む図ではありません。' },
  { label: '学習と実行', title: '学習側の調整と、実行中のモデルを分ける。', detail: '学習・推論処理の調整と、推論時に重みを固定して使うモデルを別枠で示します。通常モデルも中間の考察を書けますが、推論モデルは単にCoT指示を加えただけとは限りません。問題の分解や検証の正しさは保証されません。記号は実際の思考ではありません。' },
  { label: '回答と費用', title: '推論の後に回答が続き、両方に資源を使う。', detail: '最終回答を展開しても、先行する推論の領域は残ります。推論にもトークン・時間・費用がかかります。推論の見え方や課金は提供実装により異なります。帯の長さは比率ではなく、実費や課金式を計算しません。' }
].map(Object.freeze))

/** Presentation only: no generated text, private reasoning, timing or billing data. */
export function reasoningSequenceFrame(phase, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options))) throw new TypeError('options must be a plain object')
  if (Reflect.ownKeys(options).length) throw new TypeError('reasoning sequence has no settings')
  const count = REASONING_SEQUENCE_STAGES.length, bounded = clampPhase(phase, count), stage = stageForPhase(bounded, count)
  const left = Math.max(0, stage - .5), right = Math.min(count - 1, stage + .5)
  const progress = (bounded - left) / (right - left)
  return {
    phase: bounded, stage, progress, ...REASONING_SEQUENCE_STAGES[stage],
    nodes: [
      { id: 'input', label: '入力', visible: true, emphasized: stage === 0 },
      { id: 'reasoning-region', label: '推論の模式領域', visible: true, emphasized: stage < 3 },
      { id: 'prior-symbols', label: '既生成', visible: true, emphasized: stage < 3 },
      { id: 'next-prediction', label: '後続予測', visible: true, emphasized: stage === 1 || stage === 2 },
      { id: 'final-answer', label: '最終回答', visible: true, emphasized: stage === 3, expanded: stage === 3 },
      { id: 'training-adjustment', label: '学習・推論処理の調整', visible: stage === 2, emphasized: stage === 2 },
      { id: 'runtime-model', label: '推論時の重みは固定', visible: true, emphasized: stage === 2 }
    ],
    edges: [
      { source: 'input', target: 'reasoning-region', meaning: 'input-conditions-generation', kind: 'flow', visible: true },
      { source: 'prior-symbols', target: 'next-prediction', meaning: 'conditions-following-prediction', kind: 'flow', visible: true },
      { source: 'next-prediction', target: 'final-answer', meaning: 'answer-after-reasoning', kind: 'flow', visible: true },
      { source: 'training-adjustment', target: 'runtime-model', meaning: 'training-and-inference-configuration', kind: 'association', runtimeUpdate: false, visible: stage === 2 }
    ],
    reasoning: { content: null, rawThought: null, tokenCount: null, decorativeSymbols: ['prior-mark', 'continuation-mark'], representsActualTokenCount: false,
      displayLabel: '記号は模式表示。実際の思考内容ではない', markReveal: stage === 1 ? progress : 1 },
    runtimeWeights: 'fixed', trainingAdjustmentVisible: stage === 2,
    resourceBands: stage === 3 ? [
      { id: 'reasoning', label: '推論', tokenCount: null, duration: null, price: null },
      { id: 'answer', label: '最終回答', tokenCount: null, duration: null, price: null }
    ] : [],
    claims: { reproducesPrivateThought: false, allProvidersExposeReasoning: false, runtimeWeightsUpdated: false, correctReasoningGuaranteed: false,
      cotPromptAloneExplainsReasoningModel: false, costEstimate: null, billingFormula: null }
  }
}
