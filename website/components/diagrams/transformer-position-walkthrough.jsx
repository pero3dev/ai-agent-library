'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { POSITION_STAGES, POSITION_COMPARISONS, positionFrame } from '../../lib/transformer-position-model.mjs'

function SymbolVector({ x, y, label, tone = 'teal', result = false }) {
  return <g>
    <text x={x + 60} y={y - 15} className="cd-label" textAnchor="middle">{label}</text>
    <rect x={x} y={y} width="120" height="54" rx="8" fill="#102333" stroke={tones[tone]} strokeOpacity=".7" />
    {[0, 1, 2, 3].map(index => <g key={index}>
      <rect x={x + 8 + index * 27} y={y + 10} width="22" height="34" rx="3" fill={tones[tone]} fillOpacity={result ? .55 : .28} />
      {result && <path d={`M${x + 12 + index * 27} ${y + 18}h14`} stroke={tones.amber} strokeWidth="3" opacity=".8" />}
    </g>)}
    <text x={x + 60} y={y + 79} className="cd-small" textAnchor="middle">d 次元</text>
  </g>
}

function AbsoluteDetail() {
  return <g className="tpos-detail" data-application="embedding">
    <SymbolVector x={43} y={275} label="埋め込み" />
    <SymbolVector x={260} y={275} label="位置ベクトル" tone="amber" />
    <SymbolVector x={477} y={275} label="位置を反映" result />
    <text x="212" y="313" className="tpos-operator" textAnchor="middle">＋</text>
    <text x="429" y="313" className="tpos-operator" textAnchor="middle">＝</text>
    <path d="M46 381H594" stroke="#31485b" />
    <text x="320" y="409" className="cd-label" textAnchor="middle">各位置の埋め込みに、同じ幅のベクトルを加える</text>
  </g>
}

function RelativeDetail() {
  return <g className="tpos-detail" data-application="score">
    <text x="355" y="218" className="cd-label" textAnchor="middle">注意スコア　n × n</text>
    <text x="345" y="246" className="cd-small" textAnchor="middle">位置 j</text>
    <text x="211" y="331" className="cd-small" textAnchor="middle">位置 i</text>
    <rect x="266" y="254" width="176" height="128" rx="7" fill="#102333" stroke="#516d80" />
    {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(column => <rect key={`${row}-${column}`}
      x={270 + column * 43} y={258 + row * 31} width="37" height="25" rx="3"
      fill={row === 2 && column === 1 ? tones.amber : '#74e3cf'}
      fillOpacity={row === 2 && column === 1 ? .85 : row === 2 || column === 1 ? .19 : .065} />))}
    <path d="M143 310H186V288H320V315" fill="none" stroke={tones.amber} strokeWidth="1.7" />
    <circle cx="320" cy="327" r="10" fill="none" stroke={tones.amber} strokeWidth="2" />
    <text x="114" y="284" className="cd-label" textAnchor="middle">距離 i − j</text>
    <text x="114" y="310" className="cd-small" textAnchor="middle">スコアへ反映</text>
    <text x="501" y="299" className="cd-small" textAnchor="middle">値ではなく</text>
    <text x="501" y="323" className="cd-small" textAnchor="middle">作用先を表示</text>
    <text x="320" y="412" className="cd-label" textAnchor="middle">位置の関係を、トークン対のスコアに入れる</text>
  </g>
}

function RotationPlane({ id, x, label, position, base, angle, startAngle, referenceAngle, tone, stage, comparison }) {
  const radius = 67, originY = 313
  const endX = (base[0] * Math.cos(angle) - base[1] * Math.sin(angle)) * radius
  const endY = -(base[0] * Math.sin(angle) + base[1] * Math.cos(angle)) * radius
  const originalX = base[0] * radius, originalY = -base[1] * radius
  const referenceX = (base[0] * Math.cos(referenceAngle) - base[1] * Math.sin(referenceAngle)) * radius
  const referenceY = -(base[0] * Math.sin(referenceAngle) + base[1] * Math.cos(referenceAngle)) * radius
  const baseAngle = Math.atan2(base[1], base[0])
  const arcRadius = 32
  const arcStart = { x: Math.cos(baseAngle + startAngle) * arcRadius, y: -Math.sin(baseAngle + startAngle) * arcRadius }
  const arcEnd = { x: Math.cos(baseAngle + angle) * arcRadius, y: -Math.sin(baseAngle + angle) * arcRadius }
  return <g className="tpos-plane" data-pair={label} data-position={position}>
    <text x={x} y="209" className="cd-label" textAnchor="middle">{label.toUpperCase()} の1ペア</text>
    <text x={x} y="231" className="cd-small" textAnchor="middle">位置 {position}</text>
    <g transform={`translate(${x} ${originY})`}>
      <circle r="68" fill={tones[tone]} fillOpacity=".025" stroke={tones[tone]} strokeOpacity=".18" />
      <circle r="42" fill="none" stroke="#31485b" strokeDasharray="2 5" />
      <path d="M-79 0H79M0-76V76" fill="none" stroke="#40576a" strokeWidth="1" />
      <path d={`M0 0L${originalX} ${originalY}`} stroke="#a9bfcb" strokeWidth="1.5" strokeDasharray="4 4" opacity=".7" />
      {stage === 3 && comparison !== 'base' && <path d={`M0 0L${referenceX} ${referenceY}`} fill="none" stroke={tones[tone]} strokeWidth="1.6" strokeDasharray="3 4" opacity=".5" />}
      <path d={`M0 0L${endX} ${endY}`} stroke={tones[tone]} strokeWidth="1.5" opacity=".3" />
      {Math.abs(angle - startAngle) > 1e-8 && <path d={`M${arcStart.x} ${arcStart.y}A${arcRadius} ${arcRadius} 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
        fill="none" stroke={tones[tone]} strokeWidth="1.5" strokeDasharray="2 3" opacity=".8" />}
      {/* Each comparison starts from its labelled baseline. Both lines use the
          same one-shot easing, so a common shift stays common during motion.
          phase never enters the angles, and pausing does not leave a free spin. */}
      <g key={`${stage}-${comparison}`} className="tpos-rotor" style={{ '--tpos-start': `${-startAngle * 180 / Math.PI}deg`, '--tpos-end': `${-angle * 180 / Math.PI}deg` }}>
        <path d={`M0 0L${originalX} ${originalY}`} fill="none" stroke={tones[tone]} strokeWidth="3" markerEnd={`url(#${id}-${tone}-arrow)`} />
        <circle cx={originalX} cy={originalY} r="3.5" fill={tones[tone]} />
      </g>
      <circle r="3" fill="#e3f0f6" />
      <text x={originalX + 12} y={originalY + 7} className="cd-small">{label}</text>
      <text x={endX + (endX < 0 ? -14 : 12)} y={endY - 9} fill={tones[tone]} fontSize="19" textAnchor={endX < 0 ? 'end' : 'start'}>{label}̃</text>
    </g>
  </g>
}

function RopeDetail({ id, stage, frame }) {
  const { pair, reference, comparison } = frame
  return <g className="tpos-detail" data-application="query-key">
    <RotationPlane id={id} x={184} label="q" position={frame.labels.queryPosition} base={pair.queryBase}
      angle={pair.queryAngle} startAngle={stage === 2 ? 0 : reference.queryAngle} referenceAngle={reference.queryAngle}
      tone="teal" stage={stage} comparison={comparison} />
    <RotationPlane id={id} x={456} label="k" position={frame.labels.keyPosition} base={pair.keyBase}
      angle={pair.keyAngle} startAngle={stage === 2 ? 0 : reference.keyAngle} referenceAngle={reference.keyAngle}
      tone="violet" stage={stage} comparison={comparison} />
    <text x="320" y="396" className="cd-label" textAnchor="middle">{stage === 3 ? `位置差：${frame.labels.relativePosition}` : '破線：元の q / k　　色の線：位置による回転'}</text>
    <text x="320" y="422" className="cd-small" textAnchor="middle">{frame.comparisonCaption}</text>
  </g>
}

function PositionScene({ id, phase, stage, comparison }) {
  const frame = positionFrame(stage, { comparison })
  const absolute = frame.mechanism === 'absolute', relative = frame.mechanism === 'relative', rope = frame.mechanism === 'rope'
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene tf-scene tf-position-scene"
    data-position-mechanism={frame.mechanism} data-position-comparison={frame.comparison} data-value-rotated="false">
    <rect x="20" y="20" width="600" height="166" rx="15" fill="#101f31" fillOpacity=".6" stroke="#334a5c" />
    <Wire id={id} d="M137 76H213" active={absolute} phase={phase} />
    <Wire id={id} d="M213 76V46H246" active={rope} phase={phase} />
    <Wire id={id} d="M213 76V102H246" active={rope} phase={phase} tone="violet" />
    <Wire id={id} d="M213 76V160H246" active={false} />
    <Wire id={id} d="M323 46H375Q397 46 407 80H431" active={rope || relative} phase={phase} />
    <Wire id={id} d="M323 102H377Q399 102 411 90H431" active={rope || relative} phase={phase} tone="violet" />
    <Wire id={id} d="M323 160H456" active={false} tone="amber" />

    <rect x="32" y="49" width="105" height="54" rx="8" fill="#142a37" stroke={tones.teal} strokeOpacity={absolute ? .9 : .3} />
    <text x="84" y="71" className="cd-label" textAnchor="middle">埋め込み</text>
    <text x="84" y="93" className="cd-small" textAnchor="middle">X</text>
    {[['Q', 29, 'teal'], ['K', 85, 'violet'], ['V', 143, 'amber']].map(([label, y, tone]) => <g key={label}>
      <rect x="250" y={y} width="72" height="34" rx="7" fill="#122534" stroke={tones[tone]} strokeOpacity={rope && label !== 'V' ? .9 : .35} />
      <text x="286" y={y + 24} className="cd-label" textAnchor="middle">{label}</text>
    </g>)}
    <g className="tpos-absolute" data-active={absolute}>
      <circle cx="173" cy="76" r="13" fill="#172c3b" stroke={tones.amber} />
      <text x="173" y="82" fill={tones.amber} fontSize="19" textAnchor="middle">＋</text>
      <path d="M133 140H173V92" fill="none" stroke={tones.amber} strokeWidth="1.7" />
      <text x="85" y="145" className="cd-small" textAnchor="middle">位置</text>
    </g>
    <g className="tpos-rotation-nodes" data-active={rope}>
      {[46, 102].map((y, index) => <g key={y}>
        <circle cx="358" cy={y} r="15" fill="#142635" stroke={index ? tones.violet : tones.teal} />
        <path d={`M365 ${y - 6}a9 9 0 1 0 1 11m-1-11v6h-6`} fill="none" stroke={index ? tones.violet : tones.teal} strokeWidth="1.5" />
      </g>)}
      <text x="365" y="139" className="cd-small" textAnchor="middle">RoPE</text>
    </g>
    <rect x="434" y="61" width="157" height="54" rx="8" fill="#142a37" stroke={relative ? tones.amber : '#587284'} />
    <text x="512" y="84" className="cd-label" textAnchor="middle">注意スコア</text>
    <text x="512" y="107" className="cd-small" textAnchor="middle">{relative ? '内容と位置の関係' : rope ? 'Q̃K̃ᵀ' : 'QKᵀ'}</text>
    <g className="tpos-relative" data-active={relative}>
      <text x="513" y="42" className="cd-small" textAnchor="middle">距離 i − j</text>
      <path d="M513 47V58" stroke={tones.amber} strokeWidth="2" />
    </g>
    <rect x="459" y="144" width="133" height="32" rx="7" fill="#152638" stroke={tones.amber} strokeOpacity=".4" />
    <text x="526" y="166" className="cd-label" textAnchor="middle">V：回転なし</text>
    <path d="M30 193H610" stroke="#2d4254" />
    {stage === 0 ? <AbsoluteDetail /> : stage === 1 ? <RelativeDetail /> : <RopeDetail id={id} stage={stage} frame={frame} />}
  </SceneBase>
}

export function TransformerPosition({ children }) {
  const [comparison, setComparison] = useState('base')
  const stages = POSITION_STAGES.map((_, stage) => positionFrame(stage, { comparison }))
  return <ReadingFigure diagramId="transformer-position" title="位置情報は、どこに入るか" eyebrow="TRANSFORMER / POSITION"
    stages={stages} className="transformer-walkthrough"
    renderScene={state => <PositionScene {...state} comparison={comparison} />}
    renderControls={({ ready, stage }) => stage === 3 ? <div className="tf-controls">
      <Select label="位置の比較" value={comparison} onChange={setComparison} ready={ready}>
        {POSITION_COMPARISONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : null}
    footnote="作用箇所と、射影後のQ/Kの1つの2次元ペアを示す模式図。図形の数・回転角は実モデルの設定値ではありません。Vは回転させません。">{children}</ReadingFigure>
}
