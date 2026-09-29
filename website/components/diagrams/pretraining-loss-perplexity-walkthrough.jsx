'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { PRETRAINING_LOSS_STAGES, pretrainingLossFrame } from '../../lib/pretraining-loss-perplexity-model.mjs'

const number = value => Number.isInteger(value) ? String(value) : value.toFixed(3)
const probability = value => ({ .5: '1/2', .25: '1/4', .125: '1/8', .375: '3/8' }[value] || number(value))
function Occurrence({ item, children }) {
  return <g data-eval-id={item.id} data-prefix={item.prefix.join(',')} data-target={item.token} data-probability={item.probability} data-loss={item.loss}>
    <rect x={item.x - 88} y="62" width="176" height="91" rx="12" fill="#132638" stroke={tones.violet} strokeOpacity=".65" />
    <text x={item.x} y="91" textAnchor="middle" className="pl-note">prefix: {item.prefix.join(' ') || '∅'}</text>
    <text x={item.x} y="130" textAnchor="middle" className="pl-token">次は {item.token}</text>
    {children}
  </g>
}
function Prediction({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pl-heading">同じ列 A B C を、1 位置ずつ予測</text>
    {frame.occurrences.map(item => <Occurrence key={item.id} item={item} />)}
    <path d="M120 162v28H520v-28M320 190v22" fill="none" stroke={tones.violet} strokeWidth="2" />
    <rect x="173" y="219" width="294" height="57" rx="10" fill="#1b2945" stroke={tones.violet} />
    <text x="320" y="254" textAnchor="middle" className="pl-label">次トークンの予測誤差</text>
    <Wire id={id} d="M166 249H83v49" active phase={frame.phase} tone="violet" />
    <text x="173" y="332" textAnchor="middle" className="pl-label" data-training-weights="updated">学習：重みを更新</text>
    <text x="472" y="332" textAnchor="middle" className="pl-label" data-inference-weights="fixed">推論：重みは固定</text>
    <text x="320" y="383" textAnchor="middle" className="pl-note">予測誤差を下げる学習課題</text>
    <text x="320" y="415" textAnchor="middle" className="pl-note" data-caveat="ability">下流能力の総合得点ではない</text>
  </>
}
function Probabilities({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pl-heading">正解の列に与えた確率を見る</text>
    {frame.occurrences.map((item, i) => <Occurrence key={item.id} item={item}>
      {frame.activeExample.rows[i].map((p, column) => <g key={column} data-vocabulary-token={frame.vocabulary[column]} data-row-probability={p} data-correct={column === item.correctColumn}>
        <rect x={item.x - 80 + column * 41} y={280 - p * 180} width="34" height={p * 180} rx="3" fill={column === item.correctColumn ? tones.teal : '#53687f'} />
        <text x={item.x - 63 + column * 41} y="310" textAnchor="middle" className={column === item.correctColumn ? 'pl-label pl-correct' : 'pl-note'}>{frame.vocabulary[column]}</text>
      </g>)}
      <text x={item.x} y="351" textAnchor="middle" className="pl-value">p = {probability(item.probability)}</text>
    </Occurrence>)}
    <text x="320" y="390" textAnchor="middle" className="pl-note">各行の和 = 1　／　色付きが正解</text>
    <text x="320" y="419" textAnchor="middle" className="pl-note">同じ prefix・トークナイザ・評価列</text>
  </>
}
function Loss({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pl-heading">−ln p を、3 位置で平均する</text>
    {frame.occurrences.map(item => <Occurrence key={item.id} item={item}>
      <text x={item.x} y="191" textAnchor="middle" className="pl-note">p = {probability(item.probability)}</text>
      <Wire id={id} d={`M${item.x} 204v16`} active phase={frame.phase} />
      <text x={item.x} y="263" textAnchor="middle" className="pl-value">ln {Math.round(1 / item.probability)}</text>
      <text x={item.x} y="292" textAnchor="middle" className="pl-note">{number(item.loss)} nats</text>
    </Occurrence>)}
    <path d="M120 302v17H520v-17M320 319v17" fill="none" stroke={tones.teal} strokeWidth="2" />
    <text x="320" y="365" textAnchor="middle" className="pl-value" data-aggregate-loss={frame.activeExample.loss}>L = {number(frame.activeExample.loss)} nats</text>
    <text x="320" y="412" textAnchor="middle" className="pl-note">自然対数・位置ごとの平均（説明用の値）</text>
  </>
}
function Perplexity({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pl-heading">平均損失から、PPL へ</text>
    {frame.occurrences.map(item => <Occurrence key={item.id} item={item}>
      <text x={item.x} y="185" textAnchor="middle" className="pl-note">p = {probability(item.probability)}</text>
    </Occurrence>)}
    <rect x="32" y="233" width="215" height="99" rx="12" fill="#183341" stroke={tones.teal} />
    <text x="140" y="263" textAnchor="middle" className="pl-note">平均損失 L</text>
    <text x="140" y="304" textAnchor="middle" className="pl-value" data-aggregate-loss={frame.activeExample.loss}>{number(frame.activeExample.loss)}</text>
    <Wire id={id} d="M258 283h122" active phase={frame.phase} tone="amber" />
    <text x="320" y="250" textAnchor="middle" className="pl-label">exp</text>
    <rect x="394" y="233" width="214" height="99" rx="12" fill="#3a3027" stroke={tones.amber} />
    <text x="501" y="263" textAnchor="middle" className="pl-note">PPL = exp(L)</text>
    <text x="501" y="304" textAnchor="middle" className="pl-value" data-aggregate-ppl={frame.activeExample.ppl}>{number(frame.activeExample.ppl)}</text>
    <text x="320" y="378" textAnchor="middle" className="pl-label">正解確率の「幾何平均」の逆数</text>
    <text x="320" y="412" textAnchor="middle" className="pl-note" data-caveat="not-arithmetic">確率の算術平均の逆数とは異なる</text>
  </>
}
function Compare({ frame }) {
  const condition = frame.comparisonCondition === 'same' ? '同じトークナイザ・評価データ' : frame.comparisonCondition === 'different-tokenizer' ? 'トークナイザが異なる' : '評価データが異なる'
  return <>
    <text x="320" y="31" textAnchor="middle" className="pl-heading">値を見る前に、比較条件をそろえる</text>
    {frame.examples.map((item, i) => <g key={item.id} data-comparison-example={item.id} data-loss={item.loss} data-ppl={item.ppl}>
      <rect x={32 + i * 308} y="66" width="276" height="178" rx="12" fill="#132638" stroke={i ? tones.amber : tones.teal} />
      <text x={170 + i * 308} y="103" textAnchor="middle" className="pl-label">説明例 {item.id}</text>
      <text x={170 + i * 308} y="151" textAnchor="middle" className="pl-value">PPL {number(item.ppl)}</text>
      <text x={170 + i * 308} y="190" textAnchor="middle" className="pl-note">L = {number(item.loss)}</text>
      <text x={170 + i * 308} y="222" textAnchor="middle" className="pl-note">元の説明例の値</text>
    </g>)}
    <rect x="32" y="270" width="584" height="87" rx="10" fill={frame.comparisonAllowed ? '#173a3b' : '#3a3027'} stroke={frame.comparisonAllowed ? tones.teal : tones.amber} />
    <text x="320" y="302" textAnchor="middle" className="pl-note" data-comparison-condition={frame.comparisonCondition}>{condition}</text>
    <text x="320" y="339" textAnchor="middle" className="pl-label" data-comparison-allowed={frame.comparisonAllowed}>{frame.comparisonAllowed ? 'この条件なら、PPL を比較できる' : '異条件の PPL は単純比較しない'}</text>
    <text x="320" y="386" textAnchor="middle" className="pl-note">異条件での値や順位は作らない</text>
    <text x="320" y="416" textAnchor="middle" className="pl-note" data-caveat="ability">PPL は下流能力の判定ではない</text>
  </>
}
function LossScene({ phase, id, settings }) {
  const frame = pretrainingLossFrame(phase, settings), Content = [Prediction, Probabilities, Loss, Perplexity, Compare][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene pretraining-loss-scene" data-pretraining-loss-stage={frame.stage} data-probability-example={frame.probabilityExample || 'none'} data-comparison-allowed={frame.comparisonAllowed === null ? 'none' : frame.comparisonAllowed} data-tokenizer-id={frame.tokenizerId} data-evaluation-id={frame.evaluationId} data-empirical-measurement="false" data-ranking="none"><Content frame={frame} id={id} /></SceneBase>
}
export function PretrainingLoss({ children }) {
  const [probabilityExample, setProbabilityExample] = useState('A'), [comparisonCondition, setComparisonCondition] = useState('same')
  return <ReadingFigure diagramId="pretraining-loss-perplexity" title="次トークンの確率から、損失と PPL へ" eyebrow="PRETRAINING / LOSS & PERPLEXITY" stages={PRETRAINING_LOSS_STAGES} className="pretraining-loss-walkthrough"
    renderScene={state => <LossScene {...state} settings={{ probabilityExample, comparisonCondition }} />}
    renderControls={({ ready, stage }) => <div className="pretraining-loss-controls">
      {stage >= 1 && stage <= 3 && <div data-control="probability-example"><Select label="説明用の確率" value={probabilityExample} onChange={setProbabilityExample} ready={ready}><option value="A">説明例 A</option><option value="B">説明例 B</option></Select></div>}
      {stage === 4 && <div data-control="comparison-condition"><Select label="比較する条件" value={comparisonCondition} onChange={setComparisonCondition} ready={ready}><option value="same">同じ条件</option><option value="different-tokenizer">トークナイザが異なる</option><option value="different-data">評価データが異なる</option></Select></div>}
    </div>}
    footnote="固定した説明用の確率です。実モデルの測定、学習途中の変化、下流能力の採点を表すものではありません。">{children}</ReadingFigure>
}
