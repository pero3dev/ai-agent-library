import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const EXPERT_COUNT = 8
export const DEFAULT_K = 2
export const PRIMARY_EXPERTS = Object.freeze([1, 5])
export const TOKEN_IDS = Object.freeze(['A', 'B', 'C', 'D'])
// Explanatory gate scores only, not a trained router or a domain assignment.
export const BATCH_LOGITS = Object.freeze([
  [-1, 3, 0, -.5, -1, 2, -1.5, -2],
  [.2, 2.8, 2.2, .4, -.8, .5, -1.2, -1],
  [-.5, 3.5, -1, -1.5, .2, 3, -.8, -1.2],
  [.1, 3.2, -.2, -.8, .4, 1.8, -1, -1.4]
].map(row => Object.freeze(row)))

export const ROUTING_STAGES = [
  { label: '全体', title: '少数のFFNへ送り、合算する。', formula: 'N = 8　／　k = 2', detail: '番号付きの専門家はFFNです。選ばれた経路だけを通り、MoE枝の出力を残差へ渡します。人間的な担当分野は割り当てません。' },
  { label: 'ゲート', title: '全専門家へのスコアを、重みにする。', formula: 'g = softmax(xWᵣ)', detail: '全8成分でsoftmaxを計算した説明用の重みです。表示値は丸めています。ルータの学習や実モデルの専門性を再現する図ではありません。' },
  { label: 'top-k', title: '上位2経路だけを、計算へ通す。', formula: 'TopK(g)　／　選択後の再正規化なし', detail: '選択したgをそのまま保持します。選択後の重みの合計は1未満です。選ばれなかったFFNを実行してから捨てる流れではありません。' },
  { label: '合算', title: '選択した結果を、元の重みで足す。', formula: 'y = Σᵢ∈TopK(g) gᵢ Eᵢ(x)', detail: '各FFNの出力に対応するゲート重みを掛け、MoE枝の出力yへ合算します。このyと、その後に残差を足した結果を区別します。' },
  { label: '選ぶ向き', title: 'バッチの行から選ぶか、列から選ぶか。', formula: 'token-choice　↔　expert-choice', detail: '同じスコア表で選択方向を比較します。各専門家が1トークンを選ぶ方式では、トークンごとの選択数が変わります。データはどちらもトークンからFFNへ流れます。' },
  { label: '集中', title: '同じ専門家に、割当てが集中する。', formula: '通常top-k：4トークン × 2経路', detail: '通常のトークン選択に戻した同じバッチです。専門家ごとの割当て数を比べ、使われない領域も確認します。品質や速度の測定値ではありません。' },
  { label: '容量', title: 'あふれた経路だけを、スキップする。', formula: '容量を使う方式の模式図　／　各専門家1経路まで', detail: '同じバッチをAから順に受理する説明用規則です。片経路だけあふれた場合は受理側の寄与が残り、両方あふれた場合は残差だけを通します。全MoE共通の規則ではありません。' },
  { label: '学習', title: '割当てを見て、学習の目的を加える。', formula: 'L = L主目的 + α L負荷分散', detail: '補助項を学習へ加える関係を示します。表示を切り替えただけで現在のバッチの割当てを均等に並べ替えることはありません。' }
]

export function gateWeights(logits) {
  if (!Array.isArray(logits) || logits.length < 1 || !logits.every(Number.isFinite)) throw new TypeError('Finite gate logits required')
  const maximum = Math.max(...logits), exponentials = logits.map(value => Math.exp(value - maximum))
  const sum = exponentials.reduce((total, value) => total + value, 0)
  return exponentials.map(value => value / sum)
}

export function topIndices(values, count) {
  if (!Array.isArray(values) || !values.every(Number.isFinite) || !Number.isInteger(count) || count < 1 || count > values.length) throw new RangeError('Invalid selection')
  return values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value || a.index - b.index).slice(0, count).map(item => item.index)
}

/** Same score matrix; only the selection axis changes. No post-top-k renormalization. */
export function routingBatch(choice = 'token') {
  if (!['token', 'expert'].includes(choice)) throw new RangeError('Invalid selection direction')
  const weights = BATCH_LOGITS.map(gateWeights)
  const mask = weights.map(() => Array(EXPERT_COUNT).fill(false))
  if (choice === 'token') weights.forEach((row, token) => topIndices(row, DEFAULT_K).forEach(expert => { mask[token][expert] = true }))
  else for (let expert = 0; expert < EXPERT_COUNT; expert++) mask[topIndices(weights.map(row => row[expert]), 1)[0]][expert] = true
  return { weights, mask, loads: Array.from({ length: EXPERT_COUNT }, (_, expert) => mask.reduce((sum, row) => sum + Number(row[expert]), 0)), counts: mask.map(row => row.filter(Boolean).length) }
}

/** Capacity variant: retain accepted routes in token order, never drop a whole token merely because one route overflows. */
export function capacityBatch(capacity = 1) {
  if (!Number.isInteger(capacity) || capacity < 0) throw new RangeError('Invalid capacity')
  const batch = routingBatch(), acceptedLoads = Array(EXPERT_COUNT).fill(0)
  const accepted = batch.mask.map(row => row.map((selected, expert) => {
    if (!selected || acceptedLoads[expert] >= capacity) return false
    acceptedLoads[expert]++; return true
  }))
  return { ...batch, accepted, acceptedLoads, dropped: batch.mask.map((row, token) => row.map((selected, expert) => selected && !accepted[token][expert])) }
}

/** Symbolic terms, used directly by the SVG. The residual is represented once. */
export function routeExpression(weights, selected, tokenId, residual = false) {
  const terms = selected.flatMap((enabled, expert) => enabled ? [{ kind: 'expert', expert, weight: weights[expert], tokenId }] : [])
  return residual ? [{ kind: 'residual', tokenId }, ...terms] : terms
}

export function routingFrame(phase, { choice = 'token', token = 0 } = {}) {
  phase = clampPhase(phase, ROUTING_STAGES.length)
  const stage = stageForPhase(phase, ROUTING_STAGES.length)
  if (!Number.isInteger(token) || token < 0 || token >= TOKEN_IDS.length) throw new RangeError('Invalid token')
  if (!['token', 'expert'].includes(choice)) throw new RangeError('Invalid choice')
  const batch = routingBatch(stage === 4 ? choice : 'token'), capacity = capacityBatch()
  const selectedToken = stage === 6 ? token : 0
  const active = stage === 6 ? capacity.accepted[selectedToken] : batch.mask[selectedToken]
  return { ...ROUTING_STAGES[stage], stage, phase, choice: stage === 4 ? choice : 'token', batch, capacity,
    selectedToken, tokenId: TOKEN_IDS[selectedToken], active,
    weights: batch.weights[selectedToken], terms: routeExpression(batch.weights[selectedToken], active, TOKEN_IDS[selectedToken], stage === 6),
    selectedWeightSum: batch.weights[selectedToken].reduce((sum, weight, expert) => sum + (active[expert] ? weight : 0), 0) }
}
