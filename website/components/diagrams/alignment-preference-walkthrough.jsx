'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { ALIGNMENT_PREFERENCE_STAGES, PREFERENCE_BETA_VALUES, alignmentPreferenceFrame } from '../../lib/alignment-preference-model.mjs'

const approximate = value => `≈ ${value.toFixed(3)}`
const fraction = value => ({ .5: '1/2', .25: '1/4', .125: '1/8', 2: '2' }[value])
const rowTop = index => 98 + index * 96

function Response({ row, index }) {
  return <g data-response-id={row.responseId} data-input-id={row.inputId}>
    <rect x="24" y={rowTop(index)} width="111" height="64" rx="11" className="ap-panel" stroke={index ? tones.coral : tones.teal} />
    <text x="79" y={rowTop(index) + 26} textAnchor="middle" className="ap-note">{index ? '負け' : '勝ち'}</text>
    <text x="79" y={rowTop(index) + 53} textAnchor="middle" className={index ? 'ap-response ap-coral' : 'ap-response ap-teal'}>{index ? 'y_l' : 'y_w'}</text>
  </g>
}

function FixedReference({ unknown = false }) {
  return <g data-reference-policy="pi-ref" data-fixed="true">
    <text x="516" y={unknown ? 55 : 64} textAnchor="middle" className="ap-note ap-violet">固定参照 πref</text>
    {unknown && <text x="516" y="79" textAnchor="middle" className="ap-small" data-full-response-kl="unknown">全 KL 未計算</text>}
  </g>
}

function InputHeader({ frame, reference = false, unknown = false }) {
  return <>
    <text x={reference ? 79 : 320} y="64" textAnchor="middle" className="ap-note">同じ入力 x</text>
    {frame.stage >= 4 && <g data-preference-beta="true" data-value={frame.effectiveBeta}>
      <rect x="212" y="43" width="123" height="29" rx="7" fill="#3a3027" stroke={tones.amber} />
      <text x="274" y="64" textAnchor="middle" className="ap-beta">β = {frame.effectiveBeta}</text>
    </g>}
    {reference && <FixedReference unknown={unknown} />}
  </>
}

function Overview({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ap-heading">同じ選好から、二つの学習経路へ</text>
    <rect x="24" y="108" width="151" height="165" rx="14" className="ap-panel" stroke={tones.teal} />
    <text x="100" y="145" textAnchor="middle" className="ap-label">選好データ</text>
    <text x="100" y="183" textAnchor="middle" className="ap-note">同じ入力 x</text>
    <text x="100" y="225" textAnchor="middle" className="ap-response">y_w ≻ y_l</text>
    <g data-preference-route="rlhf">
      <text x="407" y="77" textAnchor="middle" className="ap-label ap-violet">RLHF：報酬を学び、方策を学ぶ</text>
      <Wire id={id} d="M182 147h38" active phase={frame.phase} tone="violet" />
      <rect x="233" y="108" width="175" height="85" rx="11" className="ap-panel" stroke={tones.violet} />
      <text x="320" y="144" textAnchor="middle" className="ap-label">報酬モデル</text>
      <text x="320" y="177" textAnchor="middle" className="ap-note">rφ</text>
      <Wire id={id} d="M417 147h29" active phase={frame.phase} tone="violet" />
      <rect x="459" y="108" width="157" height="85" rx="11" className="ap-panel" stroke={tones.violet} />
      <text x="538" y="144" textAnchor="middle" className="ap-label">方策 πθ</text>
      <text x="538" y="177" textAnchor="middle" className="ap-note">最適化</text>
    </g>
    <g data-preference-route="dpo">
      <text x="407" y="244" textAnchor="middle" className="ap-label ap-teal">DPO：方策を直接学ぶ</text>
      <Wire id={id} d="M182 252v41h264" active phase={frame.phase} />
      <rect x="459" y="263" width="157" height="66" rx="11" className="ap-panel" stroke={tones.teal} />
      <text x="538" y="304" textAnchor="middle" className="ap-label">方策 πθ</text>
      <text x="315" y="320" textAnchor="middle" className="ap-note">報酬モデルの学習を挟まない</text>
    </g>
    <g data-rlvr-entry="separate">
      <rect x="24" y="367" width="592" height="49" rx="10" className="ap-panel" stroke={tones.amber} />
      <text x="320" y="398" textAnchor="middle" className="ap-note">RLVR：検証可能な報酬は、別の入口</text>
    </g>
  </>
}

function PreferencePair({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ap-heading">比較する入力 x と応答 ID を固定</text>
    <InputHeader frame={frame} />
    {frame.rows.map((row, index) => <g key={row.responseId}>
      <Response row={row} index={index} />
      <rect x="151" y={rowTop(index)} width="465" height="64" rx="11" className="ap-panel" stroke={index ? tones.coral : tones.teal} />
      <text x="384" y={rowTop(index) + 40} textAnchor="middle" className="ap-label">{index ? '比較で選ばれなかった応答' : '比較で好まれた応答'}</text>
    </g>)}
    <Wire id={id} d="M385 269v22" active phase={frame.phase} />
    <text x="385" y="329" textAnchor="middle" className="ap-value">y_w ≻ y_l</text>
    <text x="320" y="373" textAnchor="middle" className="ap-note">人手などによる、比較のラベル</text>
    <text x="320" y="414" textAnchor="middle" className="ap-label" data-pair-correctness-guarantee="false">選好 ≠ 万能な正誤判定</text>
  </>
}

function BradleyTerry({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ap-heading">同じ報酬モデルの、スコア差を見る</text>
    <InputHeader frame={frame} />
    {frame.rows.map((row, index) => <g key={row.responseId}>
      <Response row={row} index={index} />
      <g data-explicit-reward-id={row.responseId} data-reward-score={index ? frame.explicitReward.loser : frame.explicitReward.winner}>
        <rect x="151" y={rowTop(index)} width="194" height="64" rx="11" className="ap-panel" stroke={index ? tones.coral : tones.teal} />
        <text x="248" y={rowTop(index) + 25} textAnchor="middle" className="ap-note">rφ(x, {index ? 'y_l' : 'y_w'})</text>
        <text x="248" y={rowTop(index) + 54} textAnchor="middle" className="ap-response">{index ? '0' : 'ln 3'}</text>
      </g>
    </g>)}
    <Wire id={id} d="M354 130h24v31h22" active phase={frame.phase} />
    <Wire id={id} d="M354 226h24v-35h22" active phase={frame.phase} tone="coral" />
    <text x="361" y="252" className="ap-note ap-coral">−</text>
    <g data-bradley-terry-margin="true" data-value={frame.explicitReward.margin}>
      <text x="515" y="126" textAnchor="middle" className="ap-note">報酬差</text>
      <rect x="414" y="139" width="202" height="87" rx="11" className="ap-panel" stroke={tones.amber} />
      <text x="515" y="171" textAnchor="middle" className="ap-label">ln 3 − 0</text>
      <text x="515" y="207" textAnchor="middle" className="ap-value">{approximate(frame.explicitReward.margin)}</text>
    </g>
    <Wire id={id} d="M515 237v35" active phase={frame.phase} tone="amber" />
    <text x="472" y="262" textAnchor="middle" className="ap-label">σ</text>
    <g data-bradley-terry-probability="true" data-value={frame.explicitReward.probability}>
      <rect x="325" y="285" width="291" height="78" rx="11" fill="#173a3b" stroke={tones.teal} />
      <text x="471" y="315" textAnchor="middle" className="ap-label">選好確率 3/4</text>
      <text x="471" y="347" textAnchor="middle" className="ap-value">{approximate(frame.explicitReward.probability)}</text>
    </g>
    <text x="320" y="410" textAnchor="middle" className="ap-note">固定スコアの説明例。後段の確率比とは別</text>
  </>
}

function Objective({ frame, id }) {
  const coefficient = frame.stage === 4 ? String(frame.effectiveBeta) : 'β'
  return <>
    <text x="320" y="31" textAnchor="middle" className="ap-heading">報酬と、参照からの逸脱を分ける</text>
    <InputHeader frame={frame} reference />
    {frame.rows.map((row, index) => <Response key={row.responseId} row={row} index={index} />)}
    <text x="79" y="290" textAnchor="middle" className="ap-small">＋他の応答</text>
    <rect x="151" y="87" width="465" height="183" rx="12" fill="#102332" stroke="#60768a" />
    <text x="384" y="118" textAnchor="middle" className="ap-label">方策 πθ：全応答の分布</text>
    <g data-objective-term="reward">
      <rect x="166" y="135" width="198" height="98" rx="10" className="ap-panel" stroke={tones.teal} />
      <text x="265" y="171" textAnchor="middle" className="ap-note">報酬期待値</text>
      <text x="265" y="210" textAnchor="middle" className="ap-response">E[rφ]</text>
    </g>
    <text x="387" y="193" textAnchor="middle" className="ap-value" data-objective-operator="minus">−</text>
    <g data-objective-term="kl">
      <rect x="410" y="135" width="192" height="98" rx="10" className="ap-panel" stroke={tones.amber} />
      <text x="506" y="171" textAnchor="middle" className="ap-note">参照からの逸脱</text>
      <text x="506" y="210" textAnchor="middle" className="ap-response ap-amber">{coefficient} × KL</text>
    </g>
    <text x="384" y="257" textAnchor="middle" className="ap-small">この 2 応答だけでは計算できない</text>
    <Wire id={id} d="M265 279v15h55v13" active phase={frame.phase} />
    <Wire id={id} d="M506 279v15h-62v13" active phase={frame.phase} tone="amber" />
    <rect x="151" y="320" width="465" height="48" rx="10" fill="#1b2945" stroke={tones.violet} />
    <text x="384" y="351" textAnchor="middle" className="ap-label">報酬 − {coefficient} KL を最大化する目的</text>
    <text x="320" y="408" textAnchor="middle" className="ap-note" data-full-response-kl="unknown">全応答の KL・目的値：未計算</text>
  </>
}

function ProbabilityRow({ frame, row, index }) {
  const y = rowTop(index), term = frame.normalizerTerms[index]
  return <g data-probability-row={row.responseId} data-input-id={row.inputId}
    data-policy-probability={row.policyProbability} data-reference-probability={row.referenceProbability}
    data-ratio={row.ratio} data-log-ratio={row.logRatio} data-weighted-log-ratio={row.weightedLogRatio}>
    <Response row={row} index={index} />
    <rect x="151" y={y - 9} width="465" height="86" rx="11" className="ap-panel" stroke={index ? tones.coral : tones.teal} />
    <text x="169" y={y + 16} className="ap-small">πθ / πref</text>
    <text x="605" y={y + 16} textAnchor="end" className="ap-note">{fraction(row.policyProbability)} ÷ {fraction(row.referenceProbability)} = {fraction(row.ratio)}</text>
    <text x="246" y={y + 46} textAnchor="middle" className={index ? 'ap-label ap-coral' : 'ap-label ap-teal'}>β {index ? 'ln(1/2)' : 'ln 2'}</text>
    <text x="246" y={y + 69} textAnchor="middle" className="ap-small">{approximate(row.weightedLogRatio)}</text>
    <text x="372" y={y + 46} textAnchor="middle" className="ap-label">+</text>
    <g data-normalizer-term-id={term.termId} data-input-id={term.inputId} data-cancelled={term.cancelled}>
      <rect x="403" y={y + 27} width="199" height="40" rx="8" fill="#2c2941" stroke={tones.violet} strokeDasharray="4 3" />
      <text x="502" y={y + 54} textAnchor="middle" className="ap-label ap-violet">β ln Z(x)</text>
      {term.cancelled && <path d={`M413 ${y + 48}h179`} stroke={tones.amber} strokeWidth="2.5" />}
    </g>
  </g>
}

function ImplicitReward({ frame, id }) {
  const final = frame.stage === 6
  const exactProbability = { .5: '2/3', 1: '4/5', 2: '16/17' }[frame.effectiveBeta]
  return <>
    <text x="320" y="31" textAnchor="middle" className="ap-heading">{final ? '同じ x の共通項が、差で消える' : '応答ごとの比と、共通の正規化項'}</text>
    <InputHeader frame={frame} reference unknown />
    {frame.rows.map((row, index) => <ProbabilityRow key={row.responseId} frame={frame} row={row} index={index} />)}
    {!final ? <>
      <path d="M621 143h7v96h-7" fill="none" stroke={tones.violet} strokeWidth="2" />
      <text x="320" y="312" textAnchor="middle" className="ap-label">同じ x → 共通の Z(x)</text>
      <text x="320" y="347" textAnchor="middle" className="ap-note">Z(x) 自体の値は未知</text>
      <text x="320" y="389" textAnchor="middle" className="ap-note">残りの確率：πθ は 3/8、πref は 1/2</text>
      <text x="320" y="419" textAnchor="middle" className="ap-note">2 応答以外の内訳は、ここでは未指定</text>
    </> : <>
      <path d="M621 143h7v96h-7" fill="none" stroke={tones.amber} strokeWidth="2" />
      <g data-dpo-pair-margin="true" data-value={frame.pair.margin}>
        <rect x="24" y="285" width="181" height="87" rx="10" className="ap-panel" stroke={tones.teal} />
        <text x="114" y="309" textAnchor="middle" className="ap-small">対数比の差 × β</text>
        <text x="114" y="337" textAnchor="middle" className="ap-label">m = β ln 4</text>
        <text x="114" y="363" textAnchor="middle" className="ap-result">{approximate(frame.pair.margin)}</text>
      </g>
      <Wire id={id} d="M211 329h15" active phase={frame.phase} />
      <g data-dpo-pair-probability="true" data-value={frame.pair.preferenceProbability}>
        <rect x="235" y="285" width="174" height="87" rx="10" className="ap-panel" stroke={tones.violet} />
        <text x="322" y="309" textAnchor="middle" className="ap-small">選好確率</text>
        <text x="322" y="337" textAnchor="middle" className="ap-label">σ(m) = {exactProbability}</text>
        <text x="322" y="363" textAnchor="middle" className="ap-result">{approximate(frame.pair.preferenceProbability)}</text>
      </g>
      <Wire id={id} d="M415 329h15" active phase={frame.phase} tone="amber" />
      <g data-dpo-pair-loss="true" data-value={frame.pair.pairLoss}>
        <rect x="439" y="285" width="177" height="87" rx="10" fill="#3a3027" stroke={tones.amber} />
        <text x="527" y="309" textAnchor="middle" className="ap-small">このペアの損失 ℓ</text>
        <text x="527" y="337" textAnchor="middle" className="ap-label">−ln σ(m)</text>
        <text x="527" y="363" textAnchor="middle" className="ap-result">{approximate(frame.pair.pairLoss)}</text>
      </g>
      <text x="320" y="397" textAnchor="middle" className="ap-small" data-dpo-aggregation="expectation">L_DPO はペア全体の期待値 / 平均</text>
      <text x="320" y="424" textAnchor="middle" className="ap-small">直接学習 ／ 報酬再利用・オンライン探索は別設計</text>
    </>}
  </>
}

function PreferenceScene({ phase, id, beta }) {
  const frame = alignmentPreferenceFrame(phase, { beta })
  const Content = [Overview, PreferencePair, BradleyTerry, Objective, Objective, ImplicitReward, ImplicitReward][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene alignment-preference-scene"
    data-alignment-preference-stage={frame.stage} data-empirical-measurement="false" data-training-trajectory="false" data-update-guarantee="false">
    <Content frame={frame} id={id} />
  </SceneBase>
}

export function AlignmentPreference({ children }) {
  const [beta, setBeta] = useState(1)
  function selectBeta(value) {
    if (!PREFERENCE_BETA_VALUES.map(String).includes(value)) throw new RangeError('Unknown illustrative beta')
    setBeta(Number(value))
  }
  return <ReadingFigure diagramId="alignment-preference" title="選好から RLHF と DPO の損失へ" eyebrow="ALIGNMENT / PREFERENCE" stages={ALIGNMENT_PREFERENCE_STAGES} className="alignment-preference-walkthrough"
    renderScene={state => <PreferenceScene {...state} beta={beta} />}
    renderControls={({ ready, stage }) => stage >= 4 && <div className="alignment-preference-controls">
      <Select label="式中の β（説明用）" value={String(beta)} onChange={selectBeta} ready={ready}>{PREFERENCE_BETA_VALUES.map(value => <option key={value} value={String(value)}>{value}</option>)}</Select>
      <div className="ap-control-note"><span>固定した分布で式を比較</span><span>更新量・品質の予測ではない</span></div>
    </div>}
    footnote="固定した説明用の値です。学習の軌跡や実モデルの測定値ではありません。全応答の KL・期待報酬・最適化の結果は未計算です。">{children}</ReadingFigure>
}
