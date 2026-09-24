'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { INFERENCE_CACHE_STAGES, inferenceCacheFrame, batchingSnapshot } from '../../lib/inference-cache-batching-model.mjs'

const modeLabel = mode => mode === 'ordinary' ? '素朴なバッチ' : '連続バッチ'
const requestTone = id => id === 'A' ? tones.teal : id === 'B' ? tones.violet : tones.amber
function Box({ x, y, width, height, title, subtitle, tone = tones.teal }) {
  return <g><rect x={x} y={y} width={width} height={height} rx="10" fill="#142638" stroke={tone} strokeOpacity=".6" />
    <text x={x + width / 2} y={y + 30} textAnchor="middle">{title}</text>
    {subtitle && <text x={x + width / 2} y={y + 58} textAnchor="middle" className="ic-small">{subtitle}</text>}
  </g>
}
function CacheCells({ x, y, length, width = 248, row }) {
  const cellWidth = width / length
  return <g data-cache-row={row} data-cache-positions={length}>
    {Array.from({ length }, (_, index) => <g key={index} data-cache-position={index}>
      <rect x={x + index * cellWidth} y={y} width={cellWidth - 4} height="29" rx="4" fill={row === 'K' ? '#276260' : '#504170'} stroke={row === 'K' ? tones.teal : tones.violet} strokeOpacity=".6" />
      <text x={x + index * cellWidth + (cellWidth - 4) / 2} y={y + 21} textAnchor="middle" className="ic-small">{index + 1}</text>
    </g>)}
  </g>
}
function Reuse({ frame, id }) {
  const operationView = frame.stage === 2, length = operationView ? frame.cacheLength : 4
  return <g data-operation={frame.operation} data-kv-length={length} data-sampled-in-cache="false" data-model-weights="fixed">
    <text x="28" y="34" className="ic-heading">{operationView ? frame.operation === 'prefill' ? 'プリフィル：入力の4位置を処理' : 'デコード：選んだ1位置を処理' : 'KVは要求ごと、重みは共通'}</text>
    <Box x={28} y={64} width={176} height={87} title="学習済みの重み" subtitle="この図では固定" tone={tones.violet} />
    <Box x={28} y={204} width={176} height={87} title={operationView ? frame.operation === 'prefill' ? '入力4位置' : '選択済み x₁' : '次の入力位置'} subtitle={operationView ? frame.operation === 'prefill' ? 'まとめて処理' : '入力してKVを追加' : '1位置ずつ進める'} />
    <Wire id={id} d="M209 108h7v70h79v7" active phase={frame.phase} tone="violet" />
    <Wire id={id} d="M209 247h38" active phase={frame.phase} />
    <Box x={254} y={190} width={154} height={87} title="モデルの計算" subtitle="過去のKVを参照" />
    <text x="329" y="86" textAnchor="middle" className="ic-small">要求ごとの保存領域</text>
    <text x="229" y="120" className="ic-small">K</text><CacheCells x={254} y={99} length={length} row="K" />
    <text x="229" y="160" className="ic-small">V</text><CacheCells x={254} y={139} length={length} row="V" />
    <Wire id={id} d="M381 174v10" active phase={frame.phase} tone="violet" />
    <Wire id={id} d="M414 234h26" active phase={frame.phase} />
    <Box x={447} y={195} width={165} height={80} title={operationView ? `選択 ${frame.sampledToken}` : '次の候補'} subtitle="まだKVに入れない" tone={tones.amber} />
    <text x="320" y="316" textAnchor="middle">{operationView ? `KV ${length}位置 ／ 選択 ${frame.sampledToken} は次回入力` : '重みを書き換えず、過去のK・Vを使う'}</text>
    {operationView ? <>
      <text x="320" y="348" textAnchor="middle" className="ic-small">代表的な傾向</text>
      <text x="320" y="377" textAnchor="middle">{frame.operation === 'prefill' ? '最初まで（TTFT）：計算が中心' : '以降の間隔：重み・KVの読出しが中心'}</text>
      <text x="320" y="412" textAnchor="middle" className="ic-small">入力/出力の単価差の一因。実料金・速度は構成次第</text>
    </> : <text x="320" y="377" textAnchor="middle" className="ic-small">KVキャッシュは、モデル重みとは別の状態</text>}
  </g>
}
function Size({ frame }) {
  const factors = [['KとV', 2], ['位置 n', frame.length], ['層 L', 2], ['KVヘッド', 2], ['次元', 4], ['byte/要素', 2]]
  return <g data-kv-bytes={frame.bytes} data-kv-length={frame.length} data-bytes-per-token={frame.bytesPerToken}>
    <text x="28" y="34" className="ic-heading">1要素から、保存領域の全体へ</text>
    {factors.map(([label, value], index) => <g key={label}>
      <rect x={28 + index * 99} y="69" width="85" height="88" rx="9" fill={index === 1 ? '#214a49' : '#182b3e'} stroke={index === 1 ? tones.teal : '#455a72'} />
      <text x={70 + index * 99} y="99" textAnchor="middle" className="ic-small">{label}</text>
      <text x={70 + index * 99} y="136" textAnchor="middle" className="ic-number">{value}</text>
      {index < 5 && <text x={120 + index * 99} y="124" textAnchor="middle" className="ic-small">×</text>}
    </g>)}
    <text x="320" y="210" textAnchor="middle" className="ic-number">{frame.bytes} bytes</text>
    <text x="43" y="266">K</text><CacheCells x={83} y={244} length={frame.length} width={502} row="K" />
    <text x="43" y="308">V</text><CacheCells x={83} y={286} length={frame.length} width={502} row="V" />
    <text x="320" y="357" textAnchor="middle">この設定では、1位置増えると64 bytes</text>
    <text x="320" y="400" textAnchor="middle" className="ic-small">実モデルの総メモリではない ／ 重み・管理領域は別</text>
  </g>
}
function Batch({ frame, id }) {
  const { snapshot } = frame
  return <g data-batch-mode={snapshot.mode} data-batch-iteration={snapshot.iteration} data-active-requests={snapshot.active.join(',')} data-waiting-requests={snapshot.waiting.join(',')} data-total-kv-bytes={snapshot.cacheBytes} data-weights-changed="false">
    <text x="28" y="32" className="ic-heading">{frame.stage === 5 ? '載せる要求ごとに、KVが必要' : frame.stage === 3 ? '共通の重みで、2つの要求を処理' : `${modeLabel(snapshot.mode)}：論理反復 ${snapshot.iteration} の後`}</text>
    <Box x={28} y={85} width={148} height={87} title="共通の重み" subtitle="変更しない" tone={tones.violet} />
    {snapshot.slots.map((slot, index) => {
      const request = snapshot.requests.find(request => request.id === slot.id), y = 66 + index * 102
      const active = request?.status === 'active'
      return <g key={slot.index} data-slot={slot.index} data-request={slot.id || ''} data-reserved={slot.reserved}>
        <Wire id={id} d={`M182 128h23v${y + 35 - 128}h20`} active={active} phase={frame.phase} tone="violet" />
        <Box x={232} y={y} width={161} height={82} title={active ? `要求 ${request.id}` : slot.reserved ? `${request.id} 完了` : '空き枠'} subtitle={active ? `残り ${request.remaining} 反復` : slot.reserved ? '組全体の終了待ち' : '計算しない'} tone={request ? requestTone(request.id) : '#7d90a6'} />
        <Wire id={id} d={`M399 ${y + 42}h32`} active={active} phase={frame.phase} />
        <Box x={438} y={y} width={174} height={82} title={active ? `KV ${request.cacheLength}位置` : 'KV解放済み'} subtitle={active ? `${request.cacheBytes} bytes` : '保存対象なし'} tone={request ? requestTone(request.id) : '#7d90a6'} />
      </g>
    })}
    <text x="29" y="279" className="ic-small">待ち：{snapshot.waiting.join('・') || 'なし'}</text>
    <text x="612" y="279" textAnchor="end" className="ic-small">完了：{snapshot.finished.join('・') || 'なし'}</text>
    {frame.stage === 5 ? <>
      <text x="320" y="331" textAnchor="middle" className="ic-number">KV 合計 {snapshot.cacheBytes} bytes</text>
      <text x="320" y="368" textAnchor="middle" className="ic-small">同時実行数と長さで増える ／ 共通重みは別枠</text>
      <text x="320" y="403" textAnchor="middle" className="ic-small">処理量と個々の待ち時間は、別々に評価する</text>
    </> : <g>
      {snapshot.requests.map((request, row) => <g key={request.id}>
        <text x="31" y={317 + row * 30} className="ic-small">{request.id}</text>
        {Array.from({ length: 7 }, (_, index) => {
          const prior = batchingSnapshot(snapshot.mode, index, snapshot.promptLength).requests.find(item => item.id === request.id)
          const ran = prior.status === 'active'
          return <rect key={index} x={65 + index * 74} y={298 + row * 30} width="65" height="23" rx="4" fill={ran ? requestTone(request.id) : '#223449'} opacity={index < snapshot.iteration ? 1 : .25} stroke={index === snapshot.iteration - 1 ? '#fff' : 'none'} />
        })}
      </g>)}
      <text x="320" y="416" textAnchor="middle" className="ic-small">7コマの予定 ／ 1コマは論理反復・同じ時間ではない</text>
    </g>}
  </g>
}
function CacheScene({ phase, id, settings }) {
  const frame = inferenceCacheFrame(phase, settings)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene inference-cache-scene" data-inference-cache-stage={frame.stage}>
    {frame.stage === 1 ? <Size frame={frame} /> : frame.stage < 3 ? <Reuse frame={frame} id={id} /> : <Batch frame={frame} id={id} />}
  </SceneBase>
}
export function InferenceCacheBatching({ children }) {
  const [length, setLength] = useState(4), [operation, setOperation] = useState('prefill')
  const [mode, setMode] = useState('continuous'), [iteration, setIteration] = useState(2)
  return <ReadingFigure diagramId="inference-cache-batching" title="保存したKVと、入れ替わる処理枠" eyebrow="INFERENCE / CACHE & BATCHING" stages={INFERENCE_CACHE_STAGES} className="inference-cache-walkthrough"
    renderScene={state => <CacheScene {...state} settings={{ length, operation, mode, iteration }} />}
    renderControls={({ ready, stage }) => <div className="inference-cache-controls">
      {(stage === 1 || stage === 5) && <Select label="入力の長さ" value={String(length)} onChange={value => setLength(Number(value))} ready={ready}><option value="4">4トークン</option><option value="8">8トークン</option></Select>}
      {stage === 2 && <Select label="処理する相" value={operation} onChange={setOperation} ready={ready}><option value="prefill">プリフィル</option><option value="decode">次のデコード</option></Select>}
      {stage >= 4 && <Select label="処理枠の使い方" value={mode} onChange={setMode} ready={ready}><option value="ordinary">素朴なバッチ</option><option value="continuous">連続バッチ</option></Select>}
      {stage === 4 && <Select label="論理反復" value={String(iteration)} onChange={value => setIteration(Number(value))} ready={ready}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index}>{index === 0 ? '開始時' : `${index}回の後`}</option>)}</Select>}
    </div>}
    footnote="2処理枠・3要求の説明用予定です。KVは小さな固定設定で、実GPUの時間・速度倍率・API料金は表しません。">{children}</ReadingFigure>
}
