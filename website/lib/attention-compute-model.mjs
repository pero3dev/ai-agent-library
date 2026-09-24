import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const COMPUTE_STAGES = [
  { label: '疎', title: '計算するトークン対を、選ぶ。', formula: '局所窓：O(n · w)', detail: '色のセルが直接の接続。層を重ねた到達可能性は別の印で示します。すべての情報が届く保証ではありません。' },
  { label: '特徴写像', title: '特徴写像を使った、積の形を見る。', formula: '(φ(Q)φ(K)ᵀ)V', detail: 'ここで示すのは本文の積です。標準のsoftmax注意そのものや、因果デコードの完成出力ではありません。' },
  { label: '結合則', title: '先に、小さな中間領域を作る。', formula: 'φ(Q)(φ(K)ᵀV)', detail: '積の順序を変えると、系列長×系列長の中間行列を作らずに計算できます。特徴幅とV幅は固定して比較します。' },
  { label: 'タイル', title: '同じ計算対象を、タイルで処理する。', formula: 'FlashAttention：標準注意の厳密な計算', detail: '因果マスク内の対象は保ちます。タイルを高速メモリへ読み込み、巨大な中間行列を低速メモリへ保存しません。' },
  { label: '引継ぎ', title: '同じ行の状態を、次のタイルへ。', formula: 'オンラインsoftmax', detail: '既処理タイルから行ごとの状態を引き継ぎ、更新します。各タイルを独立にsoftmaxして足す計算ではありません。' },
  { label: 'IO', title: '入力と出力は残し、中間の転送を減らす。', formula: '計算対象は同じ／保存と移動が変わる', detail: 'Q/K/Vの読込みと出力の書戻しは必要です。全注意行列の保存を省くことを示し、IOゼロや実測の速度倍率は示しません。' }
]

export const SPARSE_PATTERNS = ['local', 'fixed', 'sink']
const boundedInteger = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${label}`)
  return value
}

/** Schematic causal connections: the window includes the query itself. */
export function sparseConnections({ length = 8, window = 3, pattern = 'local' } = {}) {
  boundedInteger(length, 2, 32, 'length'); boundedInteger(window, 1, length, 'window')
  if (!SPARSE_PATTERNS.includes(pattern)) throw new Error('Invalid sparse pattern')
  return Array.from({ length }, (_, query) => Array.from({ length }, (_, key) => key <= query
    && (query - key < window || (pattern === 'fixed' && key % 3 === 0) || (pattern === 'sink' && key === 0))))
}

export function reachableKeys(connections, query, layers = 1) {
  const n = connections.length
  boundedInteger(query, 0, n - 1, 'query'); boundedInteger(layers, 1, 8, 'layers')
  if (!n || connections.some(row => !Array.isArray(row) || row.length !== n || row.some(value => typeof value !== 'boolean'))) throw new Error('Invalid adjacency')
  let reached = new Set([query])
  for (let layer = 0; layer < layers; layer++) {
    const next = new Set()
    for (const index of reached) connections[index].forEach((connected, key) => { if (connected) next.add(key) })
    reached = next
  }
  return [...reached].sort((a, b) => a - b)
}

function shape(matrix) {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0]) || !matrix[0].length) throw new Error('Invalid matrix')
  const width = matrix[0].length
  if (matrix.some(row => !Array.isArray(row) || row.length !== width || row.some(value => !Number.isFinite(value)))) throw new Error('Invalid matrix')
  return [matrix.length, width]
}
const transpose = matrix => matrix[0].map((_, column) => matrix.map(row => row[column]))
export function multiply(a, b) {
  const [rows, width] = shape(a), [inner, columns] = shape(b)
  if (width !== inner) throw new Error('Incompatible product')
  return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => a[row].reduce((sum, value, k) => sum + value * b[k][column], 0)))
}

/** The numerator product only. No normalization or causal decoding is implied. */
export function featureProducts(qFeatures, kFeatures, values) {
  const [queries, featureWidth] = shape(qFeatures), [keys, keyWidth] = shape(kFeatures), [valueRows, valueWidth] = shape(values)
  if (featureWidth !== keyWidth || keys !== valueRows) throw new Error('Incompatible feature product')
  const kt = transpose(kFeatures), intermediate = multiply(kt, values)
  return { direct: multiply(multiply(qFeatures, kt), values), factored: multiply(qFeatures, intermediate), intermediate,
    shape: { queries, keys, featureWidth, valueWidth }, normalized: false, causal: false }
}

/** Each causal pair is covered once; row state survives across key tiles. */
export function flashTiles(length = 8, tileWidth = 2) {
  boundedInteger(length, 2, 32, 'length'); boundedInteger(tileWidth, 1, length, 'tile width')
  const tiles = []
  for (let queryStart = 0; queryStart < length; queryStart += tileWidth) {
    for (let keyStart = 0; keyStart <= queryStart; keyStart += tileWidth) {
      const cells = []
      for (let query = queryStart; query < Math.min(queryStart + tileWidth, length); query++) {
        for (let key = keyStart; key < Math.min(keyStart + tileWidth, length); key++) if (key <= query) cells.push({ query, key })
      }
      tiles.push({ queryStart, keyStart, cells })
    }
  }
  return tiles
}

export function flashTileState(index, length = 8, tileWidth = 2) {
  const tiles = flashTiles(length, tileWidth)
  boundedInteger(index, 0, tiles.length - 1, 'tile index')
  const current = tiles[index], processed = tiles.slice(0, index).flatMap(tile => tile.cells)
  const rows = [...new Set(current.cells.map(cell => cell.query))].map(query => ({ query,
    previousKeys: processed.filter(cell => cell.query === query).map(cell => cell.key),
    currentKeys: current.cells.filter(cell => cell.query === query).map(cell => cell.key)
  }))
  return { current, processed, rows, index, count: tiles.length }
}

export function computeFrame(phase, { pattern = 'local', layers = 1 } = {}) {
  if (!Number.isFinite(phase)) throw new Error('Invalid phase')
  const value = clampPhase(phase, COMPUTE_STAGES.length), stage = stageForPhase(value, COMPUTE_STAGES.length)
  const start = Math.max(0, stage - .5), end = Math.min(COMPUTE_STAGES.length - 1, stage + .5)
  const progress = (value - start) / (end - start)
  const connections = sparseConnections({ pattern }), reached = reachableKeys(connections, 7, layers)
  const tileIndex = stage === 4 ? Math.min(9, 7 + Math.floor(progress * 3)) : stage >= 5 ? 9 : Math.min(9, Math.floor(progress * 10))
  return { ...COMPUTE_STAGES[stage], phase: value, stage, progress, pattern, layers, connections, reached,
    flash: flashTileState(tileIndex), linear: stage === 1 || stage === 2 }
}
