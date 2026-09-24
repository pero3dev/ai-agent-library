/** Geometry illustrates the article's formula; no runtime or GPU measurements. */
export const KV_STAGES = Object.freeze([
  { label: '長さ', title: '長さが増えると、対の数と保存量は別々に増える。', formula: 'n → 2n：全対行列は4倍、KV部分は2倍', detail: '左は因果マスクをかける前の全トークン対の行列です。長さを2倍にすると縦横が2倍になります。右のK/V保存量は、他の因子を固定すれば長さに比例します。' },
  { label: 'KV式', title: 'KV保存量を、式の因子に分ける。', formula: 'KV bytes ≈ 2 · n · L · h_kv · d_h · b', detail: 'KとVの2つ分に、長さ・層数・KVヘッド数・ヘッド幅・要素サイズを掛けます。以下ではn・L・d_h・bを保ち、KVの組数だけを比較します。' },
  { label: 'MHA', title: 'MHAは、QヘッドごとにK/Vを持つ。', formula: 'h_kv = h　｜　KV部分のMHA比：1', detail: '図示した4本のQに、それぞれ1組のK/Vが対応します。上段は各組が保存する同じ長さのK/Vです。' },
  { label: 'GQA', title: 'GQAは、グループごとにK/Vを共有する。', formula: 'h_kv = g　｜　KV部分のMHA比：g / h', detail: '図では4本のQを2グループに分け、各グループが1組のK/Vを使います。Qの本数と、各Qが見るトークン対は保ちます。' },
  { label: '比較', title: 'Qを保ち、K/Vの共有範囲を比べる。', formula: 'n・L・d_h・bを固定して h_kv を比較', detail: 'MQAはすべてのQで1組のK/Vを共有します。選択でMHA・GQAと比較できます。KV部分の比率は、実測速度や総GPUメモリ、品質の比率ではありません。' }
].map(Object.freeze))

export const KV_SHARING = Object.freeze([
  { id: 'mha', label: 'MHA：Qごとに1組', heads: 4, ratio: '1' },
  { id: 'gqa', label: 'GQA：2グループで共有', heads: 2, ratio: '1/2' },
  { id: 'mqa', label: 'MQA：全Qで1組を共有', heads: 1, ratio: '1/4' }
].map(Object.freeze))

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be a positive safe integer`)
}

export function kvBytes({ tokens, layers, kvHeads, headDimension, bytesPerElement } = {}) {
  const factors = { tokens, layers, kvHeads, headDimension, bytesPerElement }
  for (const [name, value] of Object.entries(factors)) positiveInteger(value, name)
  const bytes = 2 * tokens * layers * kvHeads * headDimension * bytesPerElement
  if (!Number.isSafeInteger(bytes)) throw new RangeError('KV byte count exceeds safe integer range')
  return bytes
}

export function attentionPairs(tokens, { causal = false } = {}) {
  positiveInteger(tokens, 'tokens')
  if (typeof causal !== 'boolean') throw new TypeError('causal must be boolean')
  const pairs = causal ? tokens * (tokens + 1) / 2 : tokens * tokens
  if (!Number.isSafeInteger(pairs)) throw new RangeError('Pair count exceeds safe integer range')
  return pairs
}

/** Contiguous groups; drawing slots remain fixed when K/V groups are shared. */
export function kvHeadMap(queryHeads, kvHeads) {
  positiveInteger(queryHeads, 'queryHeads'); positiveInteger(kvHeads, 'kvHeads')
  if (queryHeads > 1024 || kvHeads > queryHeads || queryHeads % kvHeads !== 0) throw new RangeError('KV heads must divide at most 1024 query heads')
  const groupSize = queryHeads / kvHeads
  return Array.from({ length: queryHeads }, (_, query) => ({
    query, group: Math.floor(query / groupSize), slot: Math.floor(query / groupSize) * groupSize
  }))
}

export function kvFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= KV_STAGES.length) throw new RangeError('Unknown KV stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { sharing = 'mqa' } = options
  if (!KV_SHARING.some(item => item.id === sharing)) throw new RangeError('Unknown KV sharing')
  const mode = stage === 4 ? sharing : stage === 3 ? 'gqa' : 'mha'
  const selected = KV_SHARING.find(item => item.id === mode)
  const connections = kvHeadMap(4, selected.heads)
  return {
    ...KV_STAGES[stage], stage, mode, queryHeads: 4, kvHeads: selected.heads,
    connections, activeSlots: [...new Set(connections.map(item => item.slot))],
    cacheRatio: selected.heads / 4, ratioLabel: selected.ratio,
    fixedFactors: ['n', 'L', 'd_h', 'b'], attentionShape: ['n', 'n'],
    lengthComparison: { multiplier: 2, fullPairRatio: attentionPairs(8) / attentionPairs(4), kvRatio: 2, causal: false },
    ...(stage === 4 ? { formula: `${mode.toUpperCase()}：h_kv = ${selected.heads}　｜　図のKV部分のMHA比：${selected.ratio}` } : {})
  }
}
