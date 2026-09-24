import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const TRAINING_RUNTIME_STAGES = Object.freeze([
  { label: '関係', title: '学習工程と、利用時に確かめる性質を結ぶ。', detail: '点線は事前学習・SFT・選好調整と評価観点の関連を表します。単一の工程だけを幻覚・迎合・拒否の原因とは断定しません。後段には有用さや正確さ、拒否など、異なる学習目的もあります。' },
  { label: '根拠', title: '根拠を渡し、出典と結果を確かめる。', detail: '手動で確認する補助段階です。根拠の外部供給、出典との照合、結果の検証を利用時の流れに置きます。誤答の削減率や因果効果は計算しません。' },
  { label: '評価', title: '幻覚・迎合・拒否を、別の観点で評価する。', detail: '次トークン予測は事実の検証器ではなく、調整後も誤答は残ります。幻覚には根拠・出典・結果の確認、迎合には中立な問いと明文化した基準、拒否には過剰・過小と外側の権限確認が必要です。拒否の挙動はSFT・選好調整・実行時の制御にも左右されます。対象研究の条件を越えて一律に断定しません。' },
  { label: '実行境界', title: '操作候補の先に、コード側の検査を置く。', detail: 'プロンプトは学習された傾向に働きますが、指示を強制する命令インタープリタではありません。モデルの出力は操作候補です。モデル外のコードで権限を確認し、実行した結果を検証します。モデルの拒否や禁止文を実行権限の境界と扱いません。' }
].map(Object.freeze))

export const TRAIT_FOCI = Object.freeze(['hallucination', 'sycophancy', 'refusal'])
export const BOUNDARY_FOCI = Object.freeze(['instruction', 'permission', 'verification'])
const traits = [
  { id: 'hallucination', label: '幻覚', checks: ['根拠を渡す', '出典を照合', '結果を検証'] },
  { id: 'sycophancy', label: '迎合', checks: ['中立な問い', '明文化した基準'] },
  { id: 'refusal', label: '拒否', checks: ['過剰・過小を評価', '外側の権限確認'] }
]
const nodes = [
  { id: 'model-candidate', owner: 'model', focus: 'instruction' },
  { id: 'permission-check', owner: 'outside-model', focus: 'permission' },
  { id: 'operation', owner: 'outside-model', focus: null },
  { id: 'result-verification', owner: 'outside-model', focus: 'verification' }
]

/** This graph describes checks; it cannot authorize or execute an operation. */
export function trainingRuntimeFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { traitFocus = 'hallucination', boundaryFocus = 'permission' } = options
  if (!TRAIT_FOCI.includes(traitFocus) || !BOUNDARY_FOCI.includes(boundaryFocus)) throw new RangeError('Unknown runtime focus')
  const normalized = clampPhase(phase, TRAINING_RUNTIME_STAGES.length), stage = stageForPhase(normalized, TRAINING_RUNTIME_STAGES.length)
  return {
    phase: normalized, stage, ...TRAINING_RUNTIME_STAGES[stage],
    traitFocus: stage === 2 ? traitFocus : null, boundaryFocus: stage === 3 ? boundaryFocus : null,
    traits: traits.map(trait => ({ ...trait, checks: [...trait.checks], emphasized: stage === 2 && trait.id === traitFocus })),
    associations: ['pretraining', 'sft', 'preference'].map(source => ({ source, target: 'learned-tendencies', kind: 'association', soleCause: false })),
    sameObjectiveAtEveryStage: false, nextTokenPredictionIsFactChecker: false,
    outputRoute: ['model-candidate', 'permission-check', 'operation', 'result-verification'],
    boundaryNodes: nodes.map(node => ({ ...node, emphasized: stage === 3 && node.focus === boundaryFocus })),
    outputEdges: [
      { source: 'model-candidate', target: 'permission-check', meaning: 'candidate-only' },
      { source: 'permission-check', target: 'operation', meaning: 'only-if-authorized' },
      { source: 'operation', target: 'result-verification', meaning: 'check-result' }
    ],
    permissionNode: 'outside-model', refusalIsPermissionBoundary: false, promptEnforcesExecution: false,
    judgment: null, measuredEffect: null, operationExecuted: false
  }
}
