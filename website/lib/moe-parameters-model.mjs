import { stageForPhase } from './reading-clock.mjs'
import { EXPERT_COUNT, DEFAULT_K, PRIMARY_EXPERTS, TOKEN_IDS, routingBatch } from './moe-routing-model.mjs'

const PRIMARY_TOKEN = TOKEN_IDS[0]

export const PARAMETER_STAGES = Object.freeze([
  { label: '保持', title: '使わない専門家の重みも、保持する。', formula: '総 ≈ 共有部分 + 8専門家', detail: '8専門家の重みをすべて保持します。共有部分は専門家以外も含む部分であり、共有専門家という別の設計を表していません。' },
  { label: '使用', title: '1トークンで使うのは、共有部分と選択した専門家。', formula: '使用 ≈ 共有部分 + 2専門家', detail: 'トークンAは専門家2と6を使います。非選択の6専門家も重みを保持します。2/8は専門家部分の比であり、モデル全体の使用率や実測の速度比ではありません。' },
  { label: '配置', title: '重みの配置と、計算する経路を分ける。', formula: '同じ8専門家を、単一または2デバイスに配置', detail: '境界は配置を表します。2デバイスでは専門家1〜4と5〜8を分け、全専門家を各デバイスへ複製しません。図の中で重みを移動させる操作ではありません。' },
  { label: '送出', title: '選択先へ送るのは、トークンの表現。', formula: 'Aの表現 x → E2・E6', detail: '選択した専門家2と6へ入力表現だけを送ります。2デバイスでは専門家2は元のデバイス内、専門家6は別デバイスです。非選択の専門家には送りません。' },
  { label: '返送', title: '専門家の結果を、元のトークンへ戻す。', formula: 'y = g₂E₂(x) + g₆E₆(x)', detail: '専門家の出力を元のトークンAへ戻し、元のゲート重みで一度だけ合算します。往復するのは入力表現と結果であり、専門家の重み行列ではありません。' },
  { label: '確認', title: '保持・使用・通信・負荷を、別々に確認する。', formula: 'モデルカードの総数・使用量と、運用条件', detail: '確認する対象だけを強調します。総重み、使用する重み、通信、バッチの偏りを区別し、速度・費用・メモリの測定値や合否は作りません。' }
].map(Object.freeze))

export const PARAMETER_LAYOUTS = Object.freeze([
  { id: 'distributed', label: '2デバイスに分散' },
  { id: 'single', label: '単一デバイス' }
].map(Object.freeze))

export const PARAMETER_CHECKS = Object.freeze([
  { id: 'resident', label: '保持する総重み', caption: '保持する全重みを、メモリ見積りの出発点に' },
  { id: 'active', label: '1トークンで使う重み', caption: '共有部分と選択2専門家を、計算量の出発点に' },
  { id: 'communication', label: '表現と結果の通信', caption: '配置と選択先から、デバイス間の通信を確認' },
  { id: 'load', label: 'バッチの偏り・遊休', caption: '同じ4トークンの割当てを確認' }
].map(Object.freeze))

export const PARAMETER_GEOMETRY = Object.freeze({
  shared: Object.freeze({ x: 24, y: 51, width: 228, height: 50 }),
  source: Object.freeze({ x: 44, y: 264, width: 116, height: 52 }),
  sum: Object.freeze({ x: 155, y: 320, width: 153, height: 59 }),
  experts: Object.freeze(Array.from({ length: EXPERT_COUNT }, (_, index) => Object.freeze({
    index, x: 28 + index * 74, y: 153, width: 60, height: 64
  })))
})

const pathFor = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join('')

function pointOnPath(points, progress) {
  const lengths = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]))
  let distance = lengths.reduce((sum, length) => sum + length, 0) * progress
  for (let index = 0; index < lengths.length; index++) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const ratio = distance / lengths[index]
      return { x: points[index][0] + (points[index + 1][0] - points[index][0]) * ratio,
        y: points[index][1] + (points[index + 1][1] - points[index][1]) * ratio }
    }
    distance -= lengths[index]
  }
}

/** Fixed toy routing and placement; no measured performance or memory model. */
export function parametersFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= PARAMETER_STAGES.length) throw new RangeError('Unknown parameters stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { phase = stage, layout = 'distributed', check = 'resident' } = options
  if (!Number.isFinite(phase) || phase < 0 || phase > PARAMETER_STAGES.length - 1) throw new RangeError('Unknown parameters phase')
  if (!PARAMETER_LAYOUTS.some(item => item.id === layout)) throw new RangeError('Unknown device layout')
  if (!PARAMETER_CHECKS.some(item => item.id === check)) throw new RangeError('Unknown parameters check')
  const current = stageForPhase(phase, PARAMETER_STAGES.length)
  // A device selector has no meaning before the placement stage.
  const placement = current >= 2 ? layout : 'distributed'
  const selectedCheck = current === 5 ? check : null
  const batch = routingBatch()
  const experts = PARAMETER_GEOMETRY.experts.map(expert => ({ ...expert,
    resident: true, selected: PRIMARY_EXPERTS.includes(expert.index),
    device: placement === 'single' ? 0 : Math.floor(expert.index / (EXPERT_COUNT / 2)),
    load: batch.loads[expert.index]
  }))
  const routes = PRIMARY_EXPERTS.map(index => {
    const expert = experts[index], x = expert.x + expert.width / 2
    const first = index === PRIMARY_EXPERTS[0]
    const dispatchPoints = first ? [[102, 264], [102, 240], [x, 240], [x, 220]] : [[160, 290], [x, 290], [x, 220]]
    // Keep the return path clear of the original input card. Both results
    // enter the same token's combine node, rather than its input display.
    const returnPoints = first ? [[x, 220], [x, 232], [190, 232], [190, 320]] : [[x, 220], [x, 349], [308, 349]]
    return { tokenId: PRIMARY_TOKEN, expertIndex: index, weight: batch.weights[0][index],
      sourceDevice: 0, expertDevice: expert.device, remote: expert.device !== 0,
      dispatchPoints, returnPoints, dispatchPath: pathFor(dispatchPoints), returnPath: pathFor(returnPoints) }
  })
  const direction = current === 3 ? 'dispatch' : current === 4 ? 'return' : null
  // Integer stages show a packet halfway along its path. At every midpoint,
  // the heading, payload type and active paths change together.
  const progress = direction ? Math.max(0, Math.min(1, phase - current + .5)) : 0
  const transfers = direction ? routes.map(route => ({
    tokenId: route.tokenId, expertIndex: route.expertIndex, remote: route.remote,
    sourceDevice: direction === 'dispatch' ? route.sourceDevice : route.expertDevice,
    targetDevice: direction === 'dispatch' ? route.expertDevice : route.sourceDevice,
    direction, payload: direction === 'dispatch' ? 'representation' : 'expert-output',
    path: direction === 'dispatch' ? route.dispatchPath : route.returnPath,
    point: pointOnPath(direction === 'dispatch' ? route.dispatchPoints : route.returnPoints, progress)
  })) : []
  return {
    ...PARAMETER_STAGES[current], stage: current, phase, layout: placement,
    showDevices: current >= 2, check: selectedCheck,
    checkCaption: PARAMETER_CHECKS.find(item => item.id === check).caption,
    expertCount: EXPERT_COUNT, activeExpertCount: DEFAULT_K,
    shared: { ...PARAMETER_GEOMETRY.shared, resident: true, active: true, kind: 'shared-part' },
    source: { ...PARAMETER_GEOMETRY.source, tokenId: PRIMARY_TOKEN, device: 0 },
    sum: { ...PARAMETER_GEOMETRY.sum, tokenId: PRIMARY_TOKEN, device: 0, gateApplications: 1 },
    experts, routes, transfers, direction, progress, loads: [...batch.loads],
    crossDeviceTransfers: transfers.filter(transfer => transfer.remote).length,
    transferredWeightCount: 0, performanceMeasurement: null, qualityJudgment: null
  }
}
