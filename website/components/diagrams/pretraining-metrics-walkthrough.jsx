'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { PRETRAINING_METRICS_STAGES, pretrainingMetricsFrame } from '../../lib/pretraining-metrics-model.mjs'

function Debate({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pm-heading">急に見える変化を、どう読むか</text>
    <rect x="188" y="62" width="264" height="50" rx="9" fill="#1b2c40" stroke={tones.violet} />
    <text x="320" y="94" textAnchor="middle" className="pm-label">観測された見え方</text>
    <Wire id={id} d="M320 120v21H174v28" active phase={frame.phase} tone="violet" />
    <Wire id={id} d="M320 120v21h146v28" active phase={frame.phase} />
    <g data-debate-position="emergence-report">
      <rect x="28" y="177" width="284" height="153" rx="11" fill="#21283e" stroke={tones.violet} />
      <text x="170" y="211" textAnchor="middle" className="pm-label">創発の報告</text>
      <path d="M65 260h59m25 0h53m25 0h49" fill="none" stroke={tones.violet} strokeWidth="3" />
      {[83, 170, 257].map((x, i) => <rect key={x} x={x - 17} y={246 - i * 5} width="34" height={28 + i * 5} rx="5" fill={tones.violet} fillOpacity={.15 + i * .17} stroke={tones.violet} />)}
      <text x="170" y="308" textAnchor="middle" className="pm-note">能力が急に現れるのか</text>
    </g>
    <g data-debate-position="metric-dependence">
      <rect x="328" y="177" width="284" height="153" rx="11" fill="#123039" stroke={tones.teal} />
      <text x="470" y="211" textAnchor="middle" className="pm-label">指標依存の反論</text>
      <path d="M365 272l35-9 35-9 35-9 35-9 35-9m-175 29h91v-28h84" fill="none" stroke={tones.teal} strokeWidth="2.6" />
      <text x="470" y="308" textAnchor="middle" className="pm-note">測り方が作る変化か</text>
    </g>
    <text x="320" y="373" textAnchor="middle" className="pm-label" data-caveat="unsettled">論争は決着していない</text>
    <text x="320" y="416" textAnchor="middle" className="pm-note">次の図は、測り方を比べる説明例</text>
  </>
}
function ThresholdGuide({ frame }) {
  // Leave gaps under numeric labels; the threshold never obscures the fixed source values.
  const exclusions = frame.points.filter(point => frame.thresholdY >= point.continuousY - 38 && frame.thresholdY <= point.continuousY - 10).map(point => [point.x - 26, point.x + 26])
  const segments = []
  let start = 117
  for (const [left, right] of exclusions) { if (left > start) segments.push([start, left]); start = right }
  if (start < 592) segments.push([start, 592])
  return <g data-threshold-guide={frame.threshold}>
    {segments.map(([x1, x2]) => <line key={x1} x1={x1} x2={x2} y1={frame.thresholdY} y2={frame.thresholdY} stroke={tones.amber} strokeWidth="1.4" strokeDasharray="5 5" />)}
    <path d={`M104 ${frame.thresholdY - 5}l8 5-8 5`} fill="none" stroke={tones.amber} strokeWidth="2" />
  </g>
}
function BothViews({ frame }) {
  const line = frame.points.map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.continuousY}`).join(' ')
  const steps = frame.points.map((point, i) => i === 0 ? `M${point.x} ${point.binaryY}` : `H${point.x - 40}V${point.binaryY}H${point.x}`).join(' ')
  return <>
    <text x="320" y="31" textAnchor="middle" className="pm-heading">同じ6入力、2つの見え方</text>
    <g data-metric-view="continuous">
      <rect x="28" y="53" width="584" height="141" rx="10" fill="#15273a" stroke="#648292" strokeOpacity=".75" />
      <text x="42" y="77" className="pm-axis-label">連続値</text>
      {[80, 160].map(y => <line key={y} x1="117" x2="592" y1={y} y2={y} stroke="#678496" strokeOpacity=".25" />)}
      <text x="112" y="84" textAnchor="end" className="pm-axis-value">1</text>
      <text x="112" y="164" textAnchor="end" className="pm-axis-value">0</text>
      <ThresholdGuide frame={frame} />
      <path d={line} fill="none" stroke={tones.teal} strokeWidth="2.6" />
      {frame.points.map(point => <g key={point.id} data-metric-point={point.id} data-score-numerator={point.numerator} data-point-index={point.index} data-point-x={point.x} data-binary-value={point.binary}>
        <circle cx={point.x} cy={point.continuousY} r="5.5" fill={tones.teal} stroke="#e3fff9" strokeWidth="1.3" />
        <text x={point.x} y={point.continuousY - 15} textAnchor="middle" className="pm-value" data-metric-value={point.display}>{point.display}</text>
        <text x={point.x} y="183" textAnchor="middle" className="pm-point-id">{point.id}</text>
      </g>)}
    </g>
    <g data-metric-view="binary">
      <rect x="28" y="203" width="584" height="140" rx="10" fill="#102d35" stroke={tones.teal} strokeOpacity=".6" />
      <text x="48" y="227" className="pm-axis-label" data-threshold-label={frame.thresholdDisplay}>閾値 {frame.thresholdDisplay} 以上 = 1</text>
      {[256, 304].map(y => <line key={y} x1="117" x2="592" y1={y} y2={y} stroke="#678496" strokeOpacity=".25" />)}
      <text x="101" y="262" textAnchor="end" className="pm-axis-value">1</text>
      <text x="101" y="310" textAnchor="end" className="pm-axis-value">0</text>
      <path d={steps} fill="none" stroke={tones.amber} strokeWidth="2.5" />
      {frame.points.map(point => <g key={point.id} data-metric-point={point.id} data-score-numerator={point.numerator} data-point-index={point.index} data-point-x={point.x} data-binary-value={point.binary}>
        <circle cx={point.x} cy={point.binaryY} r="6" fill={point.binary ? tones.amber : '#102d35'} stroke={tones.amber} strokeWidth="2" />
        <text x={point.x} y={point.binaryY - 16} textAnchor="middle" className="pm-value" data-metric-value={point.binary}>{point.binary}</text>
        <text x={point.x} y="334" textAnchor="middle" className="pm-point-id">{point.id}</text>
      </g>)}
    </g>
    {frame.stage === 1 ? <>
      <text x="320" y="377" textAnchor="middle" className="pm-label">同じ入力・同じ横位置を固定</text>
      <text x="320" y="416" textAnchor="middle" className="pm-note" data-caveat="toy-data">説明用スコア。実モデル・規模の実測ではない</text>
    </> : frame.stage === 2 ? <>
      <text x="320" y="377" textAnchor="middle" className="pm-label" data-caveat="metric-dependent-example">測り方だけで、見え方が変わる例</text>
      <text x="320" y="416" textAnchor="middle" className="pm-note" data-caveat="not-em-brier">完全一致やBrierの実装ではない</text>
    </> : <>
      <text x="320" y="366" textAnchor="middle" className="pm-label">連続指標と閾値指標を併用</text>
      <text x="320" y="393" textAnchor="middle" className="pm-note" data-caveat="single-metric-limit">能力を一つの値で断じない。論争は未決着</text>
      <text x="320" y="419" textAnchor="middle" className="pm-fine" data-caveat="emergence-limit">すべての創発が偽物、という証明ではない</text>
    </>}
  </>
}
function MetricsScene({ phase, id, scoreThreshold }) {
  const frame = pretrainingMetricsFrame(phase, { scoreThreshold })
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene pretraining-metrics-scene" data-pretraining-metrics-stage={frame.stage} data-score-threshold={frame.threshold} data-score-denominator="100" data-comparison-operator=">=" data-empirical-measurement="false" data-emergence-judgment="none" data-ability-judgment="none">
    {frame.stage === 0 ? <Debate frame={frame} id={id} /> : <BothViews frame={frame} />}
  </SceneBase>
}
export function PretrainingMetrics({ children }) {
  const [scoreThreshold, setScoreThreshold] = useState(60)
  function chooseThreshold(value) {
    if (!['50', '60', '70'].includes(value)) throw new RangeError('Unknown score threshold')
    setScoreThreshold(Number(value))
  }
  return <ReadingFigure diagramId="pretraining-metrics" title="同じ出力と、測り方による見え方の違い。" eyebrow="PRETRAINING / METRICS" stages={PRETRAINING_METRICS_STAGES} className="pretraining-metrics-walkthrough"
    renderScene={state => <MetricsScene {...state} scoreThreshold={scoreThreshold} />}
    renderControls={({ ready, stage }) => stage === 2 && <div className="pretraining-metrics-controls" data-control="score-threshold"><Select label="二値化の閾値" value={scoreThreshold} onChange={chooseThreshold} ready={ready}><option value="50">0.50</option><option value="60">0.60</option><option value="70">0.70</option></Select></div>}
    footnote="A〜Fは固定した説明用条件です。横軸は実モデルの規模ではなく、値は能力の実測ではありません。閾値判定は整数で行い、表示だけ100で割ります。">{children}</ReadingFigure>
}
