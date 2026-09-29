'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { PRETRAINING_COMPUTE_STAGES, pretrainingComputeFrame } from '../../lib/pretraining-compute-model.mjs'

const ratio = value => value === .5 ? '1/2' : String(value)
function Concept({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pc-heading">密な Transformer の学習 FLOPs 概算</text>
    <text x="320" y="113" textAnchor="middle" className="pc-formula">C ≈ 6 × N × D</text>
    {[
      { x: 116, symbol: '6', label: '順伝播・逆伝播', note: '学習演算の近似', tone: 'amber' },
      { x: 320, symbol: 'N', label: 'パラメータ数', note: 'モデルの規模', tone: 'violet' },
      { x: 524, symbol: 'D', label: '学習トークン数', note: '処理する出現数', tone: 'teal' }
    ].map(item => <g key={item.symbol} data-formula-term={item.symbol}>
      <Wire id={id} d={`M${item.x} 147v27`} active phase={frame.phase} tone={item.tone} />
      <rect x={item.x - 89} y="185" width="178" height="123" rx="12" fill="#132638" stroke={tones[item.tone]} />
      <text x={item.x} y="222" textAnchor="middle" className="pc-value">{item.symbol}</text>
      <text x={item.x} y="260" textAnchor="middle" className="pc-note">{item.label}</text>
      <text x={item.x} y="291" textAnchor="middle" className="pc-note">{item.note}</text>
    </g>)}
    <text x="320" y="365" textAnchor="middle" className="pc-label">数えているのは、浮動小数点の演算回数</text>
    <text x="320" y="408" textAnchor="middle" className="pc-note" data-caveat="units">課金・時間・電力の正確な式ではない</text>
  </>
}
function Product({ frame }) {
  const { n, d, c } = frame.ratios
  return <g data-ratio-product="true" data-n-ratio={n} data-d-ratio={d} data-c-ratio={c}>
    <text x="320" y="31" textAnchor="middle" className="pc-heading">N 比 × D 比 = 計算量の比</text>
    <text x="320" y="74" textAnchor="middle" className="pc-note">基準 C₀ = 6N₀D₀ との比較</text>
    <rect x="83" y="116" width="228" height="228" fill="none" stroke="#63758a" strokeDasharray="5 6" />
    {Array.from({ length: n * d }, (_, index) => {
      const column = index % n, row = Math.floor(index / n)
      return <rect key={index} x={83 + column * 114} y={344 - (row + 1) * 114} width="114" height="114" fill="#1b4b50" stroke={tones.teal} strokeWidth="1.5" data-compute-cell={index} />
    })}
    <path d={`M83 351v9h${n * 114}v-9`} fill="none" stroke={tones.violet} strokeWidth="2" />
    <text x={83 + n * 57} y="391" textAnchor="middle" className="pc-label">N/N₀ = {n}</text>
    <text transform={`translate(51 ${344 - d * 57}) rotate(-90)`} textAnchor="middle" className="pc-label">D/D₀ = {d}</text>
    <text x="477" y="160" textAnchor="middle" className="pc-note">1 マスが基準 C₀</text>
    <text x="477" y="215" textAnchor="middle" className="pc-formula">{n} × {d}</text>
    <text x="477" y="273" textAnchor="middle" className="pc-value" data-compute-ratio-label="true">C/C₀ = {c}</text>
    <text x="477" y="323" textAnchor="middle" className="pc-note">両方 2 倍なら 4 倍</text>
    <text x="320" y="424" textAnchor="middle" className="pc-note">面積は式の積。学習効果の測定ではない</text>
  </g>
}
function Allocation({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pc-heading">形が変わっても、面積は同じ</text>
    <text x="320" y="74" textAnchor="middle" className="pc-note">固定予算：N/N₀ × D/D₀ = 1</text>
    {frame.allocations.map((item, i) => <g key={item.id} data-allocation-id={item.id} data-emphasized={item.emphasized} data-budget-kind="fixed" data-n-ratio={item.n} data-d-ratio={item.d} data-c-ratio={item.c}>
      <rect x={25 + i * 207} y="103" width="176" height="242" rx="12" fill={item.emphasized ? '#193c43' : '#122534'} stroke={item.emphasized ? tones.teal : '#63758a'} strokeWidth={item.emphasized ? 2.5 : 1} />
      <rect x={113 + i * 207 - item.n * 30} y={210 - item.d * 30} width={item.n * 60} height={item.d * 60} fill="#286869" stroke={tones.teal} />
      <text x={113 + i * 207} y="294" textAnchor="middle" className="pc-label">{ratio(item.n)} × {ratio(item.d)} = 1</text>
      <text x={113 + i * 207} y="328" textAnchor="middle" className="pc-note">N 比 × D 比</text>
    </g>)}
    <text x="320" y="381" textAnchor="middle" className="pc-label">N を増やせば、D を減らす</text>
    <text x="320" y="416" textAnchor="middle" className="pc-note">同じ FLOPs でも、最適な損失は未判定</text>
  </>
}
function CostBoundary({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pc-heading">FLOPs と、実際のコストを分ける</text>
    {[frame.fixedBudget, frame.growingBudget].map((item, index) => <g key={item.kind} data-budget-kind={item.kind} data-n-ratio={item.n} data-d-ratio={item.d} data-c-ratio={item.c}>
      <rect x={28 + index * 302} y="61" width="284" height="137" rx="12" fill="#132638" stroke={index ? tones.amber : tones.teal} />
      <text x={170 + index * 302} y="93" textAnchor="middle" className="pc-label">{index ? '予算自体を増やす' : '同じ予算で配分'}</text>
      <text x={170 + index * 302} y="134" textAnchor="middle" className="pc-value">{ratio(item.n)} × {ratio(item.d)} = {item.c}</text>
      <text x={170 + index * 302} y="175" textAnchor="middle" className="pc-note">N 比 × D 比 = C 比</text>
    </g>)}
    <text x="320" y="234" textAnchor="middle" className="pc-label">↓ 実測・提供条件で確認 ↓</text>
    {frame.realCosts.map((item, index) => <g key={item.id} data-real-cost={item.id} data-value="unknown" data-emphasized={item.emphasized}>
      <rect x={28 + index * 200} y="262" width="184" height="99" rx="10" fill={item.emphasized ? '#3a3027' : '#132638'} stroke={item.emphasized ? tones.amber : '#63758a'} strokeWidth={item.emphasized ? 2.2 : 1} />
      <text x={120 + index * 200} y="296" textAnchor="middle" className="pc-label">{item.label}</text>
      <text x={120 + index * 200} y="335" textAnchor="middle" className="pc-note">未知・未入力</text>
    </g>)}
    <text x="320" y="392" textAnchor="middle" className="pc-note">ハードウェア・並列化効率・提供条件が関わる</text>
    <text x="320" y="423" textAnchor="middle" className="pc-note">6ND だけでは、実時間や費用は決まらない</text>
  </>
}
function ComputeScene({ phase, id, settings }) {
  const frame = pretrainingComputeFrame(phase, settings), Content = [Concept, Product, Allocation, CostBoundary][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene pretraining-compute-scene" data-pretraining-compute-stage={frame.stage} data-compute-unit="FLOPs" data-optimum="unknown"><Content frame={frame} id={id} /></SceneBase>
}
export function PretrainingCompute({ children }) {
  const [parameterFactor, setParameterFactor] = useState(1), [dataFactor, setDataFactor] = useState(1), [allocation, setAllocation] = useState('reference'), [realCostFactor, setRealCostFactor] = useState('duration')
  const setFactor = setter => value => { if (!['1', '2'].includes(value)) throw new RangeError('Unknown factor'); setter(Number(value)) }
  return <ReadingFigure diagramId="pretraining-compute" title="6ND と、計算予算の使い方" eyebrow="PRETRAINING / COMPUTE BUDGET" stages={PRETRAINING_COMPUTE_STAGES} className="pretraining-compute-walkthrough"
    renderScene={state => <ComputeScene {...state} settings={{ parameterFactor, dataFactor, allocation, realCostFactor }} />}
    renderControls={({ ready, stage }) => <div className="pretraining-compute-controls">
      {stage === 1 && <><div data-control="parameter-factor"><Select label="Nの基準比" value={parameterFactor} onChange={setFactor(setParameterFactor)} ready={ready}><option value="1">1 倍</option><option value="2">2 倍</option></Select></div><div data-control="data-factor"><Select label="Dの基準比" value={dataFactor} onChange={setFactor(setDataFactor)} ready={ready}><option value="1">1 倍</option><option value="2">2 倍</option></Select></div></>}
      {stage === 2 && <div data-control="compute-allocation"><Select label="同じ予算の配分" value={allocation} onChange={setAllocation} ready={ready}><option value="data-heavy">N 比 1/2・D 比 2</option><option value="reference">N 比 1・D 比 1</option><option value="parameter-heavy">N 比 2・D 比 1/2</option></Select></div>}
      {stage === 3 && <div data-control="real-cost-factor"><Select label="実測が必要な項目" value={realCostFactor} onChange={setRealCostFactor} ready={ready}><option value="duration">実時間</option><option value="price">費用</option><option value="energy">消費エネルギー</option></Select></div>}
    </div>}
    footnote="密な Transformer の概算式から作った比の図です。損失の最適値や料金・経過時間・消費エネルギーは算出しません。">{children}</ReadingFigure>
}
