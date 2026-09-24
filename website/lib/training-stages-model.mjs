import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const TRAINING_STAGES = Object.freeze([
  { label: '工程', title: '異なる入力で、同じモデルの重みを更新する。', detail: 'テキスト、指示と模範応答、候補の比較という入力を分けます。事前学習からSFT、選好調整へ進む代表的な構成で、順序や反復はすべてのモデルで一律ではありません。' },
  { label: '予測', title: '次の正解を手がかりに、予測から学ぶ。', detail: '直前までのトークン列を条件に次を予測し、正解との誤差を使って重みを更新します。この課題から言語・知識のパターンを学びます。実行時に入力するだけで重みが更新される図ではありません。' },
  { label: '知識', title: '収録範囲・正確さ・指示追従を分ける。', detail: '学習データの期限や未収録情報、出現頻度と正確性の違い、ベースモデルの課題能力と安定した指示追従の違いを同時に確認します。追加学習は重みを更新し、検索で与える情報は利用時の文脈へ入ります。' },
  { label: '模範例', title: '指示と模範応答で、形式や振る舞いを調整する。', detail: 'SFTは入出力の模範例で追加学習する方法です。新しい事実も学びえますが、学習効率と誤答への影響はデータと手法に依存します。形式の調整を事実の正確さの保証と扱いません。' },
  { label: '使い分け', title: '重みの更新と、文脈への情報供給を比べる。', detail: '形式・振る舞いと事実再現性を別々に評価します。最新性・出典・削除・権限管理の要件も確認します。新知識の学習と幻覚に関する報告は対象のclosed-book QAでの結果で、全ファインチューニングの不可能性を示すものではありません。' },
  { label: '選好', title: '候補の比較から、好まれる応答へ調整する。', detail: '人間またはAIによる候補比較から選好データを集め、モデルを更新します。RLHFとDPOは異なる手法です。有用さ・無害さ・トーン・拒否を調整しますが、安全性や正確さを保証する点数は示しません。' }
].map(Object.freeze))

export const KNOWLEDGE_FOCI = Object.freeze(['coverage', 'accuracy', 'instruction'])
export const EVALUATION_FOCI = Object.freeze(['behavior', 'facts'])
export const TRAINING_WEIGHT_BOX = Object.freeze({ id: 'weights', x: 240, y: 186, width: 160, height: 98 })
const knowledge = [
  { id: 'coverage', title: '収録範囲', lines: ['期限・未収録情報', '自動保証なし'] },
  { id: 'accuracy', title: '頻度 ≠ 正確さ', lines: ['矛盾・誤りもある', '情報源と照合'] },
  { id: 'instruction', title: 'ベースの課題能力', lines: ['≠ 安定した', '指示追従'] }
]
const evaluation = [
  { id: 'behavior', label: '形式・振る舞い' },
  { id: 'facts', label: '事実の再現性' }
]

/** Structural teaching model: no fabricated weights, scores, or learning simulation. */
export function trainingStagesFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { knowledgeFocus = 'coverage', evaluationFocus = 'behavior' } = options
  if (!KNOWLEDGE_FOCI.includes(knowledgeFocus) || !EVALUATION_FOCI.includes(evaluationFocus)) throw new RangeError('Unknown training focus')
  const normalized = clampPhase(phase, TRAINING_STAGES.length), stage = stageForPhase(normalized, TRAINING_STAGES.length)
  const learningKinds = stage === 0 ? ['text', 'demonstration', 'preference'] : stage === 1 ? ['text'] : stage === 3 ? ['demonstration'] : stage === 5 ? ['preference:RLHF', 'preference:DPO'] : ['additional-training']
  const routes = learningKinds.map(kind => ({ id: `learn:${kind}`, source: kind, target: 'weights', effect: 'parameter-update' }))
  if (stage === 2 || stage === 4) routes.push({ id: 'retrieve:context', source: 'retrieval', target: 'runtime-context', effect: 'context-input' })
  return {
    phase: normalized, stage, ...TRAINING_STAGES[stage], modelId: 'training-model', weights: { ...TRAINING_WEIGHT_BOX },
    trainingTarget: 'weights', retrievalTarget: 'runtime-context', routes,
    dataKinds: ['text', 'demonstration', 'preference'], representativeOrder: ['pretraining', 'sft', 'preference'], universalOrder: false,
    knowledgeFocus: stage === 2 ? knowledgeFocus : null, evaluationFocus: stage === 4 ? evaluationFocus : null,
    knowledgeCards: knowledge.map(card => ({ ...card, lines: [...card.lines], emphasized: stage === 2 && card.id === knowledgeFocus })),
    evaluationRows: evaluation.map(row => ({ ...row, emphasized: stage === 4 && row.id === evaluationFocus })),
    preferenceMethods: ['RLHF', 'DPO'], samePreferenceMethod: false,
    numericPerformance: null, parameterValues: null, guaranteedAccuracy: false
  }
}
