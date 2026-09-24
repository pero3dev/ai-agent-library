/** Symbolic shapes and identities from the Transformer article, not a model trace.
 * No embedding values, hidden states, logits or probabilities are evaluated. */
export const IO_STAGES = Object.freeze([
  { label: '全体', title: '入力の表から、次トークンの分布へ。', formula: 'ID → E → ブロック × L → 最終Norm → W_U → softmax', detail: '埋め込みをTransformerに通し、最後の表現から語彙上の分布を作ります。位置tの出力は次のトークンの分布です。' },
  { label: '埋込', title: 'IDで、埋め込み表の1行を引く。', formula: 'x_t = E[id_t] ∈ ℝᵈ', detail: '位置tのトークンIDを添字として、Eの対応する行を取り出します。IDの大小は意味の近さを表しません。' },
  { label: '出力', title: '最後の表現を、語彙のスコアへ射影する。', formula: 'z_t = h_t W_U ∈ ℝⱽ\np(次トークン | 文脈) = softmax(z_t)', detail: 'h_tはブロックと最終正規化を通った表現です。語彙数Vのロジットを作り、softmaxで分布にします。ここでは予測値を計算しません。' },
  { label: '共有', title: '入力と出力で、同じ重みを使う。', formula: 'W_U = Eᵀ', detail: '重みを共有すると、Eの行がW_Uの列に対応します。同じパラメータの向きを変えて使う関係で、入力トークンを復元する逆演算ではありません。' }
].map(Object.freeze))

const SHAPES = Object.freeze(Object.fromEntries(Object.entries({
  embedding: ['V', 'd'], input: ['d'], hidden: ['d'],
  outputWeight: ['d', 'V'], logits: ['V'], probabilities: ['V']
}).map(([name, shape]) => [name, Object.freeze(shape)])))
const PATH = Object.freeze(['embedding', 'input', 'position', 'blocks', 'final-norm', 'hidden', 'output-weight', 'logits', 'softmax', 'probabilities'])
const EDGES = Object.freeze(['lookup', 'position', 'blocks', 'norm', 'hidden', 'unembedding', 'logits', 'softmax', 'probabilities'])

function validateTying(tying) {
  if (!['tied', 'untied'].includes(tying)) throw new RangeError('Unknown embedding weight-sharing mode')
}

function indexSymbol(value) {
  if (Number.isSafeInteger(value) && value > 0) return String(value)
  if (typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/.test(value)) return value
  throw new TypeError('A symbolic index or positive integer is required')
}

export function embeddingCell(row, column) {
  return `E[${indexSymbol(row)},${indexSymbol(column)}]`
}

export function outputWeightCell(row, column, tying = 'tied') {
  validateTying(tying)
  return tying === 'tied' ? embeddingCell(column, row) : `W_U[${indexSymbol(row)},${indexSymbol(column)}]`
}

export function ioFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= IO_STAGES.length) throw new RangeError('Unknown input/output stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { tying = 'tied' } = options
  validateTying(tying)
  const shared = tying === 'tied'
  const activeNodes = stage === 0 ? [...PATH]
    : stage === 1 ? ['embedding', 'input']
      : stage === 2 ? ['hidden', 'output-weight', 'logits', 'softmax', 'probabilities']
        : ['embedding', 'output-weight', 'sharing']
  const activeEdges = stage === 0 ? [...EDGES]
    : stage === 1 ? ['lookup']
      : stage === 2 ? ['unembedding', 'logits', 'softmax', 'probabilities'] : []
  return {
    ...IO_STAGES[stage], stage, kind: 'symbolic', shapes: SHAPES, path: PATH,
    activeNodes, activeEdges,
    symbols: { tokenId: 'id_t', input: 'x_t', hidden: 'h_t', logits: 'z_t' },
    weights: { tying, headSymbol: shared ? 'Eᵀ' : 'W_U', sharedWithEmbedding: shared },
    ...(stage === 3 && !shared ? {
      title: '共有しないと、重みは2つの独立した表。',
      formula: 'E ∈ ℝⱽˣᵈ / W_U ∈ ℝᵈˣⱽ',
      detail: '重み共有なしではEとW_Uを独立に持ちます。形状の向きは対応していても、同じ値・同じパラメータではありません。'
    } : {})
  }
}
