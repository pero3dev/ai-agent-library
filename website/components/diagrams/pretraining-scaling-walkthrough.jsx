'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { PRETRAINING_SCALING_STAGES, pretrainingScalingFrame } from '../../lib/pretraining-scaling-model.mjs'

const ratio = value => value === .5 ? '1/2' : String(value)
function Axes({ id, frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">一つの「大きさ」にまとめない</text>
    {[
      { x: 118, symbol: 'N', label: 'パラメータ数', tone: 'violet' },
      { x: 320, symbol: 'D', label: '学習トークン数', tone: 'teal' },
      { x: 522, symbol: 'C_train', label: '学習計算量', tone: 'amber' }
    ].map(item => <g key={item.symbol} data-scaling-axis={item.symbol}>
      <Wire id={id} d={`M${item.x - 65} 236h130`} active phase={frame.phase} tone={item.tone} />
      <text x={item.x} y="170" textAnchor="middle" className="ps-symbol">{item.symbol}</text>
      <text x={item.x} y="209" textAnchor="middle" className="ps-note">{item.label}</text>
    </g>)}
    <rect x="45" y="290" width="550" height="71" rx="11" fill="#132638" stroke="#63758a" />
    <text x="320" y="334" textAnchor="middle" className="ps-label">条件をそろえ、損失との関係を測る</text>
    <text x="320" y="411" textAnchor="middle" className="ps-note">経験則であり、能力の採点ではない</text>
  </>
}
function Residual({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">総損失と、下限からの差を分ける</text>
    <text x="320" y="91" textAnchor="middle" className="ps-formula">L = L∞ + R</text>
    <rect x="32" y="120" width="174" height="64" rx="11" fill="#1b2945" stroke={tones.violet} />
    <text x="119" y="161" textAnchor="middle" className="ps-label">N → rN</text>
    <Wire id={id} d="M218 152h43" active phase={frame.phase} />
    <rect x="274" y="120" width="334" height="64" rx="11" fill="#17373d" stroke={tones.teal} />
    <text x="441" y="160" textAnchor="middle" className="ps-label">R = (Nc/N)<tspan baselineShift="super" fontSize="17">α</tspan></text>
    <g data-residual-identity={frame.residualIdentity}>
      <text x="59" y="236" className="ps-note">残差の比</text>
      <text x="406" y="237" textAnchor="middle" className="ps-label">R(rN) / R(N) = r<tspan baselineShift="super" fontSize="17">−α</tspan></text>
    </g>
    <path d="M32 263H608" stroke="#63758a" strokeOpacity=".6" />
    <g data-total-loss-ratio={frame.totalLossRatio}>
      <text x="59" y="308" className="ps-note">総損失の比</text>
      <text x="406" y="303" textAnchor="middle" className="ps-label">L∞ + R × r<tspan baselineShift="super" fontSize="17">−α</tspan></text>
      <path d="M283 315H529" stroke={tones.amber} strokeWidth="2" />
      <text x="406" y="343" textAnchor="middle" className="ps-label">L∞ + R</text>
    </g>
    <text x="320" y="385" textAnchor="middle" className="ps-label">残差と総損失の比は、一般に異なる</text>
    <text x="320" y="418" textAnchor="middle" className="ps-note">α・Nc・L∞ は記号。係数や曲線は未設定</text>
  </>
}
function FixedBudget({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">同じ C の中で、N と D を配分</text>
    <text x="320" y="77" textAnchor="middle" className="ps-note">N/N₀ × D/D₀ = 1</text>
    <text x="137" y="123" textAnchor="middle" className="ps-note">N の基準比</text>
    <text x="356" y="123" textAnchor="middle" className="ps-note">D の基準比</text>
    <text x="549" y="123" textAnchor="middle" className="ps-note">C 比</text>
    {frame.allocations.map((item, index) => <g key={item.id} data-allocation-id={item.id} data-emphasized={item.emphasized} data-budget-kind="fixed" data-n-ratio={item.n} data-d-ratio={item.d} data-c-ratio={item.c}>
      <rect x="28" y={143 + index * 65} width="584" height="55" rx="9" fill={item.emphasized ? '#193c43' : '#122534'} stroke={item.emphasized ? tones.teal : '#63758a'} strokeWidth={item.emphasized ? 2.2 : 1} />
      <rect x="47" y={161 + index * 65} width={item.n * 68} height="19" rx="3" fill={tones.violet} opacity=".8" />
      <text x="232" y={179 + index * 65} textAnchor="end" className="ps-label">{ratio(item.n)}</text>
      <rect x="268" y={161 + index * 65} width={item.d * 68} height="19" rx="3" fill={tones.teal} opacity=".8" />
      <text x="460" y={179 + index * 65} textAnchor="end" className="ps-label">{ratio(item.d)}</text>
      <text x="549" y={179 + index * 65} textAnchor="middle" className="ps-value">1</text>
    </g>)}
    <text x="320" y="377" textAnchor="middle" className="ps-label">片方を増やすなら、もう片方を減らす</text>
    <text x="320" y="415" textAnchor="middle" className="ps-note">基準 N₀ と D₀ は別の単位。最適組は未判定</text>
  </>
}
function Lineage({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">配分を選ぶ話と、予算を増やす話</text>
    {[
      { x: 26, title: 'Kaplan', detail: '初期の N 重視', tone: 'violet' },
      { x: 245, title: 'Chinchilla', detail: '予算と配分', tone: 'teal' },
      { x: 466, title: '推論時計算', detail: '利用時の予算', tone: 'amber' }
    ].map((item, index) => <g key={item.title} data-lineage-node={item.title}>
      <rect x={item.x} y="64" width="147" height="79" rx="10" fill="#132638" stroke={tones[item.tone]} />
      <text x={item.x + 73.5} y="95" textAnchor="middle" className="ps-label">{item.title}</text>
      <text x={item.x + 73.5} y="128" textAnchor="middle" className="ps-note">{item.detail}</text>
      {index < 2 && <Wire id={id} d={`M${item.x + 154} 103h57`} active phase={frame.phase} tone={item.tone} />}
    </g>)}
    <text x="320" y="179" textAnchor="middle" className="ps-note">Chinchilla：N・D の配分と、その成長率</text>
    {[frame.fixedBudget, frame.growingBudget].map((item, index) => <g key={item.kind} data-budget-kind={item.kind} data-n-ratio={item.n} data-d-ratio={item.d} data-c-ratio={item.c}>
      <rect x={28 + index * 302} y="203" width="284" height="154" rx="12" fill={index ? '#352e29' : '#16343d'} stroke={index ? tones.amber : tones.teal} />
      <text x={170 + index * 302} y="236" textAnchor="middle" className="ps-label">{index ? '予算を増やす' : '同じ予算で配分'}</text>
      <text x={170 + index * 302} y="279" textAnchor="middle" className="ps-value">{ratio(item.n)} × {ratio(item.d)} = {item.c}</text>
      <text x={170 + index * 302} y="314" textAnchor="middle" className="ps-note">N 比 × D 比 = C 比</text>
      <text x={170 + index * 302} y="342" textAnchor="middle" className="ps-note">{index ? 'N・D を同率に拡大' : '積を一定に保つ'}</text>
    </g>)}
    <text x="320" y="391" textAnchor="middle" className="ps-note">式からの説明例。最適値の実測ではない</text>
    <text x="320" y="422" textAnchor="middle" className="ps-note">同率の成長 ≠ N と D の値が等しい</text>
  </>
}
function InferenceLane({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">学習時と推論時、別々の計算予算</text>
    {[
      { y: 77, label: '学習時 C_train', input: '学習データ', output: '重みを更新', tone: 'violet', weights: 'updated' },
      { y: 225, label: '推論時 C_infer', input: '利用時の入力', output: '重みは固定', tone: 'amber', weights: 'fixed' }
    ].map(item => <g key={item.weights} data-compute-lane={item.weights === 'fixed' ? 'inference' : 'training'} data-weights={item.weights}>
      <rect x="28" y={item.y} width="584" height="120" rx="12" fill="#132638" stroke={tones[item.tone]} />
      <text x="53" y={item.y + 32} className="ps-label">{item.label}</text>
      <text x="146" y={item.y + 83} textAnchor="middle" className="ps-label">{item.input}</text>
      <Wire id={id} d={`M260 ${item.y + 75}h95`} active phase={frame.phase} tone={item.tone} />
      <text x="479" y={item.y + 83} textAnchor="middle" className="ps-label">{item.output}</text>
    </g>)}
    <text x="320" y="383" textAnchor="middle" className="ps-label">推論時にも、計算を使う</text>
    <text x="320" y="418" textAnchor="middle" className="ps-note" data-caveat="no-guarantee">増やせば必ず改善する、とは限らない</text>
  </>
}
function Conditions({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ps-heading">係数は、測った条件に依存する</text>
    {frame.conditions.map((item, index) => <g key={item.id} data-coefficient-condition={item.id} data-emphasized={item.emphasized}>
      <rect x={28 + index * 200} y="82" width="184" height="73" rx="11" fill={item.emphasized ? '#193c43' : '#132638'} stroke={item.emphasized ? tones.teal : '#63758a'} strokeWidth={item.emphasized ? 2.2 : 1} />
      <text x={120 + index * 200} y="126" textAnchor="middle" className="ps-label">{item.label}</text>
      <path d={`M${120 + index * 200} 166v33H320`} fill="none" stroke={tones.teal} strokeWidth="1.5" />
    </g>)}
    <Wire id={id} d="M320 200v32" active phase={frame.phase} />
    <rect x="155" y="244" width="330" height="93" rx="12" fill="#1b2945" stroke={tones.violet} />
    <text x="320" y="280" textAnchor="middle" className="ps-value">α・Nc・L∞</text>
    <text x="320" y="318" textAnchor="middle" className="ps-note">経験係数：未設定</text>
    <text x="320" y="381" textAnchor="middle" className="ps-label">普遍定数ではない</text>
    <text x="320" y="417" textAnchor="middle" className="ps-note">最適な N/D も未知。損失は予測しない</text>
  </>
}
function ScalingScene({ phase, id, settings }) {
  const frame = pretrainingScalingFrame(phase, settings), Content = [Axes, Residual, FixedBudget, Lineage, InferenceLane, Conditions][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene pretraining-scaling-scene" data-pretraining-scaling-stage={frame.stage} data-fitted-coefficients="unknown" data-loss-prediction="unknown" data-optimum="unknown"><Content frame={frame} id={id} /></SceneBase>
}
export function PretrainingScaling({ children }) {
  const [fixedAllocation, setFixedAllocation] = useState('reference'), [growthScale, setGrowthScale] = useState(2), [coefficientCondition, setCoefficientCondition] = useState('data')
  const changeGrowth = value => { if (!['1', '2', '4'].includes(value)) throw new RangeError('Unknown growth factor'); setGrowthScale(Number(value)) }
  return <ReadingFigure diagramId="pretraining-scaling" title="損失のスケーリングと、2 種類の予算" eyebrow="PRETRAINING / SCALING LAWS" stages={PRETRAINING_SCALING_STAGES} className="pretraining-scaling-walkthrough"
    renderScene={state => <ScalingScene {...state} settings={{ fixedAllocation, growthScale, coefficientCondition }} />}
    renderControls={({ ready, stage }) => <div className="pretraining-scaling-controls">
      {stage === 2 && <div data-control="fixed-allocation"><Select label="同じ予算の配分" value={fixedAllocation} onChange={setFixedAllocation} ready={ready}><option value="data-heavy">N 比 1/2・D 比 2</option><option value="reference">N 比 1・D 比 1</option><option value="parameter-heavy">N 比 2・D 比 1/2</option></Select></div>}
      {stage === 3 && <div data-control="growth-scale"><Select label="予算を増やす説明例" value={growthScale} onChange={changeGrowth} ready={ready}><option value="1">N・D とも 1 倍（基準）</option><option value="2">N・D とも 2 倍</option><option value="4">N・D とも 4 倍</option></Select></div>}
      {stage === 5 && <div data-control="coefficient-condition"><Select label="係数に関わる条件" value={coefficientCondition} onChange={setCoefficientCondition} ready={ready}><option value="data">データ</option><option value="architecture">アーキテクチャ</option><option value="tokenizer">トークナイザ</option></Select></div>}
    </div>}
    footnote="係数や損失曲線は未設定です。数値の比は概算式からの代数的説明であり、実測の最適構成や性能を表しません。">{children}</ReadingFigure>
}
