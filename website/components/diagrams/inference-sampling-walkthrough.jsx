'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire } from './concept-scene-primitives'
import { INFERENCE_SAMPLING_STAGES, INFERENCE_SAMPLING_TEMPERATURES, INFERENCE_SAMPLING_TOP_K,
  INFERENCE_SAMPLING_TOP_P, INFERENCE_SAMPLING_DRAWS, inferenceSamplingFrame } from '../../lib/inference-sampling-model.mjs'
import './inference-sampling.css'

const columnX = id => 104 + id * 144
const number = value => value.toFixed(2)

function Cumulative({ distribution, y = 308 }) {
  const greedy = distribution.selectionKind === 'greedy'
  if (greedy) return <g data-cumulative-kind="greedy-result">
    <rect x="40" y={y} width="560" height="40" rx="8" className="is-panel" />
    <text x="320" y={y + 28} textAnchor="middle">最大の{distribution.selectedLabel}を選択 ／ 抽選なし</text>
  </g>
  return <g data-cumulative-kind="sampling" data-selection-draw={distribution.effectiveDraw}>
    {distribution.rows.filter(row => row.selectionProbability > 0).map(row => <rect key={row.tokenId}
      x={40 + row.cumulativeLow * 560} y={y} width={row.selectionProbability * 560} height="28"
      fill={row.color} stroke="#0e1d2a" data-cdf-token={row.tokenId} data-cdf-low={row.cumulativeLow} data-cdf-high={row.cumulativeHigh} />)}
    <path d={`M${40 + distribution.draw * 560} ${y - 10}v49`} stroke="#fff4d7" strokeWidth="2.5" />
    <path d={`M${34 + distribution.draw * 560} ${y - 12}h12l-6 9Z`} fill="#fff4d7" />
    <text x="40" y={y + 55} className="is-small">0</text><text x="600" y={y + 55} textAnchor="end" className="is-small">1</text>
    <text x="320" y={y + 61} textAnchor="middle" className="is-small">u = {number(distribution.draw)} → {distribution.selectedLabel}</text>
  </g>
}

function CandidateColumns({ distribution, stage }) {
  const raw = stage === 0, greedy = distribution.selectionKind === 'greedy'
  return <g data-selection-kind={distribution.selectionKind} data-retained-mass={distribution.retainedMass ?? 'none'} data-selected-token={distribution.selectedTokenId}>
    {distribution.rows.map(row => {
      const x = columnX(row.tokenId), value = raw ? -row.logit : greedy || stage === 1 ? row.probability : row.selectionProbability
      const height = raw ? value * 44 : value * 108
      return <g key={row.tokenId} data-candidate-id={row.tokenId} data-candidate-label={row.label} data-rank={row.rank}
        data-probability={row.probability} data-selection-probability={row.selectionProbability} data-kept={row.kept} data-selected={row.selected}>
        <text x={x} y="104" textAnchor="middle" className="is-token" style={{ fill: row.color }}>{row.label}</text>
        {raw ? <>
          <path d={`M${x - 43} 127h86`} className="is-axis" />
          <rect x={x - 27} y="127" width="54" height={height} fill={row.color} opacity=".8" />
          <text x={x} y="268" textAnchor="middle" className="is-number">{row.logit.toFixed(3)}</text>
        </> : <>
          <text x={x} y="139" textAnchor="middle" className="is-number">{stage === 1 ? `z ${row.logit.toFixed(2)}` : `p ${number(row.probability)}`}</text>
          <rect x={x - 33} y="153" width="66" height="108" className="is-bar-track" />
          <rect x={x - 33} y={261 - height} width="66" height={height} fill={row.color} opacity={stage >= 2 && !greedy && !row.kept ? .25 : .9} />
          {stage >= 2 && !greedy && !row.kept && <path d={`M${x - 35} 164l70 84`} className="is-excluded" />}
          <text x={x} y="289" textAnchor="middle" className="is-number">{number(value)}</text>
        </>}
      </g>
    })}
  </g>
}

function DistributionScene({ frame, id }) {
  const { stage, distribution: d, rules } = frame, greedy = d.selectionKind === 'greedy'
  return <g data-effective-method={d.effectiveMethod ?? 'greedy'}>
    {stage >= 2 ? <>
      <text x="28" y="33" className={d.effectiveMethod === 'top-k' ? 'is-rule-active' : 'is-small'}>top-k {rules.topK}：上位の個数で残す</text>
      <text x="28" y="65" className={d.effectiveMethod === 'top-p' ? 'is-rule-active' : 'is-small'}>top-p {rules.topP}：上位の累積 ≥ 閾値</text>
    </> : <text x="320" y="40" textAnchor="middle" className="is-heading">{stage === 0 ? '負のスコアも、確率ではない' : greedy ? '貪欲は最大スコアを直接選ぶ' : `温度 T = ${d.temperature} → softmax`}</text>}
    <CandidateColumns distribution={d} stage={stage} />
    {stage === 0 ? <>
      <text x="44" y="121" className="is-small">0</text>
      <Wire id={id} d="M320 291v43" active phase={frame.phase} />
      <text x="320" y="370" textAnchor="middle">ロジット → 確率 → 1つを選択</text>
      <text x="320" y="405" textAnchor="middle" className="is-small">ペナルティ等の調整は、ロジットの段階</text>
    </> : stage === 1 ? <>
      <text x="320" y="336" textAnchor="middle">{greedy ? `選択 ${d.selectedLabel} ／ 棒はT=1の参照確率` : '候補の確率の和は 1'}</text>
      <Wire id={id} d="M320 352v24" active phase={frame.phase} />
      <text x="320" y="410" textAnchor="middle" className="is-small">{greedy ? '1つを選ぶことは、確信100%ではない' : '低温度では集中、高温度では平坦になる'}</text>
    </> : <>
      <Cumulative distribution={d} />
      {stage === 5 && !greedy && <Wire id={id} d={`M${40 + d.draw * 560} 309v24`} active phase={frame.selectionProgress} tone="amber" />}
      <text x="320" y="409" textAnchor="middle" className="is-small">{greedy ? '参照確率と選択結果を分ける。確信値ではない' : `残す質量 Z = ${number(d.retainedMass)} で割る → 和1`}</text>
    </>}
  </g>
}

function ReproducibilityScene({ frame }) {
  const comparison = frame.comparison, drawing = comparison.kind === 'draw'
  return <g data-comparison-kind={comparison.kind} data-changed-field={comparison.changedField}>
    <text x="320" y="36" textAnchor="middle" className="is-heading">{drawing ? '同じ分布、uだけを変える' : '同じ貪欲、Aのスコアだけを変える'}</text>
    {[comparison.left, comparison.right].map((side, index) => {
      const y = 68 + index * 148
      return <g key={index} data-comparison-side={index} data-comparison-selected={side.selectedLabel} data-comparison-draw={side.effectiveDraw ?? 'none'}>
        <rect x="24" y={y} width="592" height="132" rx="10" className="is-panel" />
        <text x="42" y={y + 43} className="is-small" data-comparison-bar-label>{drawing ? `u ${number(side.draw)}` : '棒: T=1の確率'}</text>
        <text x="42" y={y + 88}>選択 {side.selectedLabel}</text>
        <text x="42" y={y + 117} className="is-small" data-comparison-value-label>{drawing ? '値: 確率' : '値: ロジット'}</text>
        {side.rows.map(row => {
          const x = 222 + row.tokenId * 106
          return <g key={row.tokenId} data-compare-token={row.tokenId} data-compare-logit={row.logit} data-compare-probability={row.probability} data-compare-rank={row.rank}>
            <text x={x} y={y + 29} textAnchor="middle" style={{ fill: row.color }}>{row.label}</text>
            <rect x={x - 31} y={y + 88 - row.probability * 105} width="62" height={row.probability * 105} fill={row.color} opacity={row.selected ? 1 : .55} />
            <text x={x} y={y + 117} textAnchor="middle" className="is-score">{drawing ? number(row.probability) : row.logit.toFixed(6)}</text>
          </g>
        })}
      </g>
    })}
    <text x="320" y="400" textAnchor="middle" className="is-small">{drawing ? '版・演算・バッチの条件は、別に確認する' : '差の大きさは説明用。実機の誤差量ではない'}</text>
  </g>
}

export function InferenceSamplingScene({ phase, id, settings }) {
  const frame = inferenceSamplingFrame(phase, settings)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene is-scene"
    data-inference-sampling-stage={frame.stage} data-sampling-kind={frame.distribution.selectionKind} data-quality-judgment="none">
    {frame.stage === 6 ? <ReproducibilityScene frame={frame} /> : <DistributionScene frame={frame} id={id} />}
  </SceneBase>
}

export function InferenceSampling({ children }) {
  const [temperature, setTemperature] = useState(1), [method, setMethod] = useState('top-p')
  const [topK, setTopK] = useState(2), [topP, setTopP] = useState(.8), [draw, setDraw] = useState(.62)
  const [variation, setVariation] = useState('draw')
  const settings = { temperature, method, topK, topP, draw, variation }
  const stages = INFERENCE_SAMPLING_STAGES.map((_, stage) => inferenceSamplingFrame(stage, settings))
  return <ReadingFigure diagramId="inference-sampling" title="ロジットから、選択する1つへ" eyebrow="INFERENCE / SAMPLING" stages={stages}
    className="inference-sampling-walkthrough" renderScene={state => <InferenceSamplingScene {...state} settings={settings} />}
    renderControls={({ ready, stage }) => <div className="is-controls">
      {stage >= 1 && stage <= 5 && <Select label="温度・選択" value={String(temperature)} onChange={value => setTemperature(Number(value))} ready={ready}>
        {INFERENCE_SAMPLING_TEMPERATURES.map(value => <option key={value} value={value}>{value === 0 ? '貪欲（式とは別）' : `温度 ${value}`}</option>)}
      </Select>}
      {stage >= 3 && stage <= 5 && <Select label="候補制限の方式" value={method} onChange={setMethod} ready={ready && temperature !== 0}><option value="top-k">top-k：個数</option><option value="top-p">top-p：累積</option></Select>}
      {stage >= 2 && stage <= 5 && (stage === 2 || method === 'top-k') && <Select label="残す候補数" value={String(topK)} onChange={value => setTopK(Number(value))} ready={ready && temperature !== 0}>
        {INFERENCE_SAMPLING_TOP_K.map(value => <option key={value} value={value}>{value} 個</option>)}
      </Select>}
      {stage >= 3 && stage <= 5 && method === 'top-p' && <Select label="累積確率の閾値" value={String(topP)} onChange={value => setTopP(Number(value))} ready={ready && temperature !== 0}>
        {INFERENCE_SAMPLING_TOP_P.map(value => <option key={value} value={value}>{value}</option>)}
      </Select>}
      {stage === 5 && <Select label="固定したu" value={String(draw)} onChange={value => setDraw(Number(value))} ready={ready && temperature !== 0}>
        {INFERENCE_SAMPLING_DRAWS.map(value => <option key={value} value={value}>{value}</option>)}
      </Select>}
      {stage === 6 && <Select label="比較する揺らぎ" value={variation} onChange={setVariation} ready={ready}><option value="draw">uだけを変更</option><option value="logit">スコアだけを変更</option></Select>}
    </div>}
    footnote="説明用の固定スコアです。実LLMの出力・品質・速度は測っていません。色と候補IDは共通、top-kとtop-pは片方だけ適用します。">{children}</ReadingFigure>
}
