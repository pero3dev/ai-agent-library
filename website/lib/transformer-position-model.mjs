/** A single projected Q/K two-dimensional pair illustrates rotation geometry.
 * The constants below are drawing coordinates, not trained vectors, model
 * frequencies, attention scores, or the existing self-attention toy model. */
export const POSITION_STAGES = Object.freeze([
  { label: '絶対', title: '位置のベクトルを、埋め込みへ足す。', formula: '作用先：各位置の埋め込み', detail: '絶対位置方式では、位置ごとに固定または学習したベクトルを埋め込みへ加算します。3方式は、すべてを順に通る工程ではありません。' },
  { label: '相対', title: '2つの位置の距離を、スコアへ反映する。', formula: '作用先：位置 i と j の注意スコア', detail: '相対位置方式では位置間の距離を注意スコアに反映します。ここでは個別方式のバイアス値や注意の重みを作りません。' },
  { label: 'RoPE', title: 'QとKのペアを、位置に応じて回転する。', formula: '作用先：射影後のQ / Kの2次元ペア', detail: 'RoPEはQとKを2次元ずつのペアに分け、位置に比例した角度で回転します。この図は1つのペアだけを示します。Vは回転させません。' },
  { label: '位置差', title: '同じ内容なら、位置の差が回転の関係を決める。', formula: '⟨q̃_m, k̃_n⟩ = g(q, k, m − n)', detail: 'qとkの内容を保って位置だけを比較します。内積は位置差だけで決まるのではなく、元のqとkの内容にも依存します。' }
].map(Object.freeze))

export const POSITION_COMPARISONS = Object.freeze([
  { id: 'base', label: '基準の位置' },
  { id: 'shift-together', label: '同じ位置差で移動' },
  { id: 'change-gap', label: '位置差を変える' }
].map(Object.freeze))

const QUERY = Object.freeze([0.82, 0.24])
const KEY = Object.freeze([0.34, 0.75])
const GEOMETRY = Object.freeze({ queryPosition: 3, keyPosition: 1, anglePerPosition: Math.PI / 12 })
const SHIFT = 2

function checkPair(vector) {
  if (!Array.isArray(vector) || vector.length !== 2 || !Number.isFinite(vector[0]) || !Number.isFinite(vector[1])) {
    throw new TypeError('A finite two-dimensional pair is required')
  }
}

export function rotatePair(vector, angle) {
  checkPair(vector)
  if (!Number.isFinite(angle)) throw new TypeError('Rotation angle must be finite')
  const c = Math.cos(angle), s = Math.sin(angle)
  const rotated = [vector[0] * c - vector[1] * s, vector[0] * s + vector[1] * c]
  if (!rotated.every(Number.isFinite)) throw new RangeError('Rotation exceeds finite coordinates')
  return rotated
}

export function ropePair({ query, key, queryPosition, keyPosition, anglePerPosition } = {}) {
  checkPair(query); checkPair(key)
  if (![queryPosition, keyPosition, anglePerPosition].every(value => Number.isFinite(value) && value >= 0)) {
    throw new TypeError('Positions and the fixed rotation rate must be non-negative and finite')
  }
  const queryAngle = queryPosition * anglePerPosition, keyAngle = keyPosition * anglePerPosition
  if (!Number.isFinite(queryAngle) || !Number.isFinite(keyAngle)) throw new RangeError('Position rotation exceeds finite coordinates')
  return {
    kind: 'geometry-only', queryBase: [...query], keyBase: [...key], queryPosition, keyPosition,
    queryAngle, keyAngle,
    queryRotated: rotatePair(query, queryAngle), keyRotated: rotatePair(key, keyAngle)
  }
}

export function positionFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= POSITION_STAGES.length) throw new RangeError('Unknown position stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { comparison = 'base' } = options
  if (!POSITION_COMPARISONS.some(item => item.id === comparison)) throw new RangeError('Unknown position comparison')
  const selected = stage === 3 ? comparison : 'base'
  const shiftedQuery = selected !== 'base', shiftedKey = selected === 'shift-together'
  const reference = ropePair({ query: QUERY, key: KEY, ...GEOMETRY })
  const pair = ropePair({
    query: QUERY, key: KEY, ...GEOMETRY,
    queryPosition: GEOMETRY.queryPosition + (shiftedQuery ? SHIFT : 0),
    keyPosition: GEOMETRY.keyPosition + (shiftedKey ? SHIFT : 0)
  })
  return {
    ...POSITION_STAGES[stage], stage,
    mechanism: ['absolute', 'relative', 'rope', 'rope'][stage],
    application: ['embedding', 'score', 'query-key', 'query-key'][stage],
    rotatesQuery: stage >= 2, rotatesKey: stage >= 2, rotatesValue: false,
    comparison: selected, pair, reference,
    labels: {
      queryPosition: shiftedQuery ? 'm + Δ' : 'm',
      keyPosition: shiftedKey ? 'n + Δ' : 'n',
      relativePosition: selected === 'change-gap' ? '(m + Δ) − n' : 'm − n'
    },
    comparisonCaption: selected === 'shift-together'
      ? '両方を同じだけ移す：位置差と内積は変わらない'
      : selected === 'change-gap'
        ? 'Q側の位置だけを移す：位置差が変わる'
        : '元のq / kを保ち、位置に応じて回転する',
    ...(stage === 3 && selected === 'shift-together' ? {
      formula: '(m + Δ) − (n + Δ) = m − n',
      detail: '同じqとkを保ち、両位置を同じだけ移します。このペアの回転角も同じだけ変わるため、位置差と内積は変わりません。内容が違うq/kの内積まで同じになるという意味ではありません。'
    } : stage === 3 && selected === 'change-gap' ? {
      formula: '⟨q̃_(m+Δ), k̃_n⟩ = g(q, k, (m + Δ) − n)',
      detail: '元のqとkの内容・長さはそのままで、Q側の位置だけを移します。位置差が変わると回転の関係も変わります。内積は元のq/kにも依存します。'
    } : {})
  }
}
