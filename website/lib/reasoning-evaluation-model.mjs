import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const REASONING_EVALUATION_STAGES = Object.freeze([
  { label: '同じタスクで比較', title: '候補を見て、同じ実入力で比べる。', detail: '元の表の各行は、改善を評価する候補と少ない思考量との比較が特に必要な候補です。左右は異なるタスク例であり、同一入力ではありません。表だけで採否を決めず、各タスク内で同じ実入力・モデル・指示・評価基準を保ち、思考量を比べます。' },
  { label: '思考量', title: '両方の設定を保ち、注目する側を切り替える。', detail: '低め・高めは比較する設定の模式ラベルで、APIの指定値ではありません。名称・仕様はモデル別です。品質・費用・待ち時間を同時に測り、タスクに見合う水準を評価します。ここでは数値も最適設定もまだありません。' },
  { label: '追加便益', title: '追加の作業と、得られる便益を分ける。', detail: '高め側に追加の作業帯を示しますが、便益が小さい場合もあり、品質の向上を保証しません。すべての簡単な問いやモデルで必ず悪化するという意味ではありません。曖昧な要件・停止条件・権限制御は別に見直します。帯の長さは実時間や費用の比率ではありません。' },
  { label: '必須条件', title: '必須手順を保ち、探索は境界内で。', detail: '目標・制約・承認・根拠確認・業務規程を固定し、探索の余地と分けます。安全条件はモデル外の実行側でも強制します。この図は実際の許可や操作を実行しません。追加の思考指示が必要かはモデルの公式ガイドと自社評価で比較します。' },
  { label: '複数回の測定', title: '同条件で複数回、品質・費用・待ち時間を記録する。', detail: '同じ設定内では条件を固定して反復し、設定間では思考量だけを変えます。A/Bは未実行の空欄の見本で、推奨する試行回数ではありません。生の思考が非公開・要約だけの場合もあり、見える思考から原因を断定しません。12個の指標欄はすべて未計測です。' }
].map(Object.freeze))

export const REASONING_TASK_FOCI = Object.freeze(['multi-step', 'verifiable', 'constraints'])
export const REASONING_EFFORT_FOCI = Object.freeze(['lower', 'higher'])

const metrics = () => [
  { id: 'quality', label: '品質', value: null, unit: null, status: 'unmeasured' },
  { id: 'cost', label: '費用', value: null, unit: null, status: 'unmeasured' },
  { id: 'latency', label: '待ち時間', value: null, unit: null, status: 'unmeasured' }
]

/** Evaluation preparation only. No trial, recommendation or measured result is invented. */
export function reasoningEvaluationFrame(phase, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options))) throw new TypeError('options must be a plain object')
  if (Reflect.ownKeys(options).some(key => !['taskFocus', 'effortFocus'].includes(key))) throw new TypeError('unknown reasoning evaluation option')
  const { taskFocus = 'multi-step', effortFocus = 'lower' } = options
  if (!REASONING_TASK_FOCI.includes(taskFocus)) throw new RangeError('unknown task focus')
  if (!REASONING_EFFORT_FOCI.includes(effortFocus)) throw new RangeError('unknown effort focus')
  const count = REASONING_EVALUATION_STAGES.length, bounded = clampPhase(phase, count), stage = stageForPhase(bounded, count)
  const left = Math.max(0, stage - .5), right = Math.min(count - 1, stage + .5), progress = (bounded - left) / (right - left)
  const effectiveTask = stage === 0 ? taskFocus : null, effectiveEffort = stage === 1 || stage === 2 ? effortFocus : null
  return {
    phase: bounded, stage, progress, ...REASONING_EVALUATION_STAGES[stage], taskFocus: effectiveTask, effortFocus: effectiveEffort,
    taskRows: [
      { id: 'multi-step', label: '多段推論と定型処理', sourceTopic: 'd2-s2-b1.row0', candidates: ['多段の推論が要る問題(数学・計画・複雑なデバッグ)', '単純な事実検索・定型の抽出・分類'] },
      { id: 'verifiable', label: '検証可能性と待ち時間', sourceTopic: 'd2-s2-b1.row1', candidates: ['検証可能な問題(答えの正しさを確かめられる)', '低レイテンシが要る対話・大量処理'] },
      { id: 'constraints', label: '制約と定型手順', sourceTopic: 'd2-s2-b1.row2', candidates: ['制約が多く、慎重な検討が要る判断', '参照先や処理手順が定型化された問い'] }
    ].map(row => ({ ...row, emphasized: row.id === effectiveTask })),
    comparison: { inputId: 'same-input', inputText: null, modelId: 'same-model', modelName: null, promptId: 'same-instructions', criteriaId: 'same-criteria', isExecuted: false },
    variants: REASONING_EFFORT_FOCI.map(id => ({ id, label: id === 'lower' ? '低めの思考量' : '高めの思考量', providerValue: null, budget: null, emphasized: id === effectiveEffort, measurements: metrics() })),
    metrics: metrics(),
    extraWork: { visible: stage === 2, effort: 'higher', quantitative: false, value: null, unit: null, measuredBenefit: null },
    requiredConditions: [
      { id: 'goal', label: '目標' }, { id: 'constraints', label: '制約' }, { id: 'approval', label: '承認' },
      { id: 'evidence-check', label: '根拠確認' }, { id: 'business-rules', label: '業務規程' }
    ],
    executionBoundary: { owner: 'outside-model', enforcedBy: 'execution-code', approvalDecision: null, operationExecuted: false },
    exploration: { visible: stage === 3, withinBoundary: true, presentationOffset: stage === 3 ? progress * 240 : 0 },
    trials: ['lower-a', 'lower-b', 'higher-a', 'higher-b'].map(id => ({ id, effort: id.split('-')[0], inputId: 'same-input', conditionId: id.startsWith('lower') ? 'lower-settings' : 'higher-settings', status: 'not-run', measurements: metrics() })),
    claims: { automaticTaskDecision: null, qualityMonotonic: false, allSimpleTasksWorsen: false, extraEffortFixesUnclearRequirements: false,
      extraEffortReplacesPermissionChecks: false, visibleThoughtProvesCause: false, allModelsNeedStepByStepPrompt: false, measuredBenefit: null, recommendedEffort: null }
  }
}
