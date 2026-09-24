import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const INFERENCE_CACHE_STAGES = Object.freeze([
  { label: '再利用', title: '過去のK・Vを保存し、次の計算で再利用する。', detail: '要求ごとのKVキャッシュと、学習済みの共通重みを別の領域に描きます。過去のQを保存する図ではありません。' },
  { label: 'サイズ', title: '保存するトークンが増えると、KVも増える。', detail: 'KとV、トークン数、層、KVヘッド、次元、要素のバイト数を掛けます。説明用の小さな設定です。' },
  { label: '2つの相', title: '入力をまとめて読み、その後は1位置ずつ進める。', detail: 'プリフィルは計算、デコードは重み・KVの読み出しが重くなる代表的傾向を、最初の出力までと以降の間隔へ対応させます。単価差の一因ですが、実料金や速度は構成次第です。最初の候補はプリフィルの末尾出力から選び、次回入力してからKVへ加えます。' },
  { label: 'まとめる', title: '同じ重みを、複数の要求で使う。', detail: '2つの処理枠にAとBを載せる説明用の予定です。各要求のKVと生成の進み具合は別々に保持します。' },
  { label: '入れ替える', title: '終了した枠へ、待っている要求を入れる。', detail: '素朴なバッチでは組全体の終了まで枠を空けたままにし、連続バッチでは次の要求を入れます。各コマは時間の等しい区間ではありません。' },
  { label: '条件', title: '同時に載せる要求には、それぞれのKVが要る。', detail: '要求数と保持する長さでKVの使用量が変わります。スループットと個々の待ち時間を同じ改善として扱わず、実環境で確かめます。' }
].map(Object.freeze))

export const CACHE_LENGTHS = Object.freeze([4, 8])
export const CACHE_MODES = Object.freeze(['ordinary', 'continuous'])
export const CACHE_PHASES = Object.freeze(['prefill', 'decode'])
export const CACHE_FACTORS = Object.freeze({ layers: 2, kvHeads: 2, headDimension: 4, bytesPerElement: 2 })
const REQUESTS = Object.freeze([{ id: 'A', required: 2 }, { id: 'B', required: 4 }, { id: 'C', required: 3 }].map(Object.freeze))
const positiveInteger = (value, label) => {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${label} must be a positive integer`)
  return value
}
export function kvBytes(length, factors = CACHE_FACTORS) {
  const { layers, kvHeads, headDimension, bytesPerElement } = factors
  const bytes = 2 * positiveInteger(length, 'length') * positiveInteger(layers, 'layers') * positiveInteger(kvHeads, 'kvHeads') * positiveInteger(headDimension, 'headDimension') * positiveInteger(bytesPerElement, 'bytesPerElement')
  if (!Number.isSafeInteger(bytes)) throw new RangeError('KV byte count exceeds safe integer range')
  return bytes
}

/** Snapshots are after the named logical iteration and any refill, not elapsed time. */
export function batchingSnapshot(mode = 'continuous', iteration = 2, length = 4) {
  if (!CACHE_MODES.includes(mode)) throw new RangeError('Unknown batching mode')
  if (!Number.isInteger(iteration) || iteration < 0 || iteration > 7) throw new RangeError('iteration must be 0..7')
  if (!CACHE_LENGTHS.includes(length)) throw new RangeError('Unknown prompt length')
  const requests = REQUESTS.map(request => ({ ...request, completed: 0, status: 'waiting', slot: null, enteredAt: null, finishedAt: null }))
  const slots = [null, null]
  const fill = at => {
    for (let slot = 0; slot < slots.length; slot++) {
      if (slots[slot] !== null) continue
      const next = requests.find(request => request.status === 'waiting')
      if (!next) break
      next.status = 'active'; next.slot = slot; next.enteredAt = at; slots[slot] = next.id
    }
  }
  fill(0)
  for (let at = 1; at <= iteration; at++) {
    for (const request of requests.filter(request => request.status === 'active')) {
      request.completed++
      if (request.completed === request.required) {
        request.status = 'finished'; request.finishedAt = at
        if (mode === 'continuous') { slots[request.slot] = null; request.slot = null }
      }
    }
    if (mode === 'ordinary' && !requests.some(request => request.status === 'active')) {
      slots.fill(null)
      for (const request of requests) request.slot = null
    }
    fill(at)
  }
  const withMemory = requests.map(request => ({ ...request,
    remaining: request.required - request.completed,
    cacheLength: request.status === 'active' ? length + request.completed : 0,
    cacheBytes: request.status === 'active' ? kvBytes(length + request.completed) : 0
  }))
  return { mode, iteration, promptLength: length, slots: slots.map((id, index) => ({ index, id, reserved: id !== null && withMemory.find(request => request.id === id).status === 'finished' })),
    requests: withMemory, active: withMemory.filter(request => request.status === 'active').map(request => request.id),
    waiting: withMemory.filter(request => request.status === 'waiting').map(request => request.id),
    finished: withMemory.filter(request => request.status === 'finished').map(request => request.id),
    cacheBytes: withMemory.reduce((sum, request) => sum + request.cacheBytes, 0),
    elapsedMs: null, throughput: null, latency: null, weightsChanged: false }
}

export function inferenceCacheFrame(phase, options = {}) {
  const normalized = clampPhase(phase, INFERENCE_CACHE_STAGES.length), stage = stageForPhase(normalized, INFERENCE_CACHE_STAGES.length)
  const { length = 4, operation = 'prefill', mode = 'continuous', iteration = 2 } = options
  if (!CACHE_LENGTHS.includes(length) || !CACHE_PHASES.includes(operation) || !CACHE_MODES.includes(mode) || !Number.isInteger(iteration) || iteration < 0 || iteration > 7) throw new RangeError('Invalid cache settings')
  const shownLength = stage === 1 || stage === 5 ? length : 4
  const shownOperation = stage === 2 ? operation : 'prefill'
  const cacheLength = 4 + (shownOperation === 'decode' ? 1 : 0)
  const snapshot = batchingSnapshot(stage === 3 ? 'ordinary' : mode, stage === 3 ? 0 : iteration, shownLength)
  return { phase: normalized, stage, ...INFERENCE_CACHE_STAGES[stage], factors: { ...CACHE_FACTORS },
    length: shownLength, bytes: kvBytes(shownLength), bytesPerToken: kvBytes(1),
    operation: shownOperation, processedPositions: shownOperation === 'prefill' ? [0, 1, 2, 3] : [4], cacheLength,
    sampledToken: shownOperation === 'prefill' ? 'x₁' : 'x₂', sampledPosition: cacheLength,
    sampledTokenInCache: false, weightsChanged: false, snapshot }
}
