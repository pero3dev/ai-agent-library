'use client'

import { useState } from 'react'
import { ATTENTION_SAMPLE as sample } from '../../lib/attention-model.mjs'
import { ReadingFigure, ReadingStep } from '../diagrams/reading-figure'

const STAGES = [
  { label: '入力', title: 'ひとつの列から、始まる。', formula: 'X ∈ ℝⁿˣᵈ', detail: '各位置のベクトルを、行方向に並べた入力 X。' },
  { label: 'Q / K / V', title: '同じ入力に、3つの役割。', formula: 'Q = XWᑫ    K = XWᴷ    V = XWⱽ', detail: 'Q は問い合わせ、K は見出し、V は混ぜ合わせる中身。' },
  { label: 'スコア', title: 'すべての組み合わせを測る。', formula: 'S = QKᵀ / √dₖ', detail: '選んだ Q と各 K の内積を計算し、√dₖ で割ります。' },
  { label: 'マスク', title: '未来への参照を、閉じる。', formula: 'S + M', detail: '未来の位置のスコアを −∞ に。softmax 後の重みは 0 になります。' },
  { label: '重み', title: 'スコアを、混ぜる割合へ。', formula: 'A = softmax(S + M)', detail: '行ごとに正規化。選んだ位置の重みを足すと 1 になります。' },
  { label: '混合', title: '重みで V を混ぜ合わせる。', formula: '出力 = AV', detail: '各 V に重みを掛け、その和をこの位置の出力にします。' }
]
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const lerp = (a, b, t) => a + (b - a) * clamp(t)
const fade = (p, start, end = start + 0.65) => clamp((p - start) / (end - start))
const fmt = n => n === -Infinity ? '−∞' : (Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2).replace('-', '−'))
const vectorFmt = n => (Math.abs(n) < 0.05 ? '0.0' : n.toFixed(1).replace('-', '−'))
function Vector({ values, x, y, label, tone = 'teal', active = true, cell = 27, opacity = 1 }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity} className={`aw-vector aw-${tone}`}>
    {label && <text x="-12" y="17" textAnchor="end" className={active ? 'aw-svg-label' : 'aw-svg-dim'}>{label}</text>}
    {values.map((v, i) => <g key={i}>
      <rect x={i * cell} y="0" width={cell - 3} height="28" rx="4" fill="currentColor" fillOpacity={active ? 0.16 + Math.min(Math.abs(v), 2) * 0.16 : 0.08} />
      <text x={i * cell + (cell - 3) / 2} y="18" textAnchor="middle" className={active ? 'aw-svg-number' : 'aw-svg-dim'}>{vectorFmt(v)}</text>
    </g>)}
  </g>
}

/** A fixed coordinate system keeps the same vectors identifiable across stages.
 * Phase is a reversible presentation clock, not a model execution trace. */
function AttentionScene({ phase, stage, row, id }) {
  const projection = fade(phase, 0, 1)
  const matrix = fade(phase, 1.2, 2)
  const masked = fade(phase, 2.25, 3)
  const normalized = fade(phase, 3.25, 4)
  const mixed = fade(phase, 4.15, 5)
  const weight = sample.weights[row]
  const matrixX = lerp(206, 80, mixed)
  const matrixY = 139
  const cell = 49
  const dim = 1 - mixed * 0.85
  return <svg className="aw-scene" viewBox="0 0 640 410" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{`${STAGES[stage].label}：位置 ${row + 1} の自己注意`}</title>
    <desc id={`${id}-desc`}>{STAGES[stage].detail} 4位置、1ヘッドの説明用データ。未来の位置の重みは0です。</desc>
    <defs>
      <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.65" fill="currentColor" opacity="0.12" /></pattern>
      <linearGradient id={`${id}-flow`}><stop offset="0" stopColor="#6ee7cf" stopOpacity="0.1" /><stop offset="1" stopColor="#6ee7cf" stopOpacity="0.85" /></linearGradient>
    </defs>
    <rect x="0" y="0" width="640" height="410" fill={`url(#${id}-grid)`} />

    {/* Inputs share their row positions with the projected Q/K/V vectors. */}
    <g opacity={1 - projection}>
      <text x="320" y="80" textAnchor="middle" className="aw-svg-heading">入力 X</text>
      <text x="320" y="103" textAnchor="middle" className="aw-svg-dim">4 位置 × 4 次元</text>
      {sample.input.map((values, i) => <Vector key={i} values={values} x={lerp(260, 87, projection)} y={145 + i * 49} label={`位置 ${i + 1}`} cell={32} active={i === row} />)}
    </g>
    <g opacity={projection * (1 - matrix)}>
      {['Q', 'K', 'V'].map((key, c) => <g key={key} className={`aw-${['teal', 'amber', 'violet'][c]}`}>
        <text x={130 + c * 190} y="80" textAnchor="middle" className="aw-svg-heading">{key}</text>
        <text x={130 + c * 190} y="103" textAnchor="middle" className="aw-svg-dim">{['問い合わせ', '見出し', '中身'][c]}</text>
        {sample[key].map((values, i) => <Vector key={i} values={values} x={lerp(270, 87 + c * 190, projection)} y={145 + i * 49} label={`${i + 1}`} tone={['teal', 'amber', 'violet'][c]} active={i === row} cell={32} />)}
      </g>)}
    </g>

    {/* The score matrix changes in place: scale -> mask -> normalize. */}
    <g opacity={matrix * (1 - mixed)}>
      <text x="320" y="53" textAnchor="middle" className="aw-svg-heading">{stage >= 4 ? '注意の重み A' : stage >= 3 ? '未来のスコアを −∞ に' : 'Q と K の組み合わせ'}</text>
      <text x="305" y="99" textAnchor="middle" className="aw-svg-dim">参照する位置 K →</text>
      <text x="85" y="231" textAnchor="middle" transform="rotate(-90 85 231)" className="aw-svg-dim">問い合わせ Q →</text>
      {[0, 1, 2, 3].map(i => <g key={i}>
        <text x={206 + i * cell + 22} y="127" textAnchor="middle" className="aw-svg-label">{i + 1}</text>
        <text x="191" y={matrixY + i * cell + 27} textAnchor="end" className={i === row ? 'aw-svg-label' : 'aw-svg-dim'}>{i + 1}</text>
      </g>)}
    </g>
    <g opacity={matrix}>
      {sample.scaledScores.map((values, i) => values.map((v, j) => {
        const future = j > i
        const isSelected = i === row
        const scoreAlpha = 0.1 + clamp((v + 2) / 4) * 0.45
        const alpha = future ? lerp(scoreAlpha, 0.025, masked) : lerp(scoreAlpha, 0.08 + sample.weights[i][j] * 0.7, normalized)
        const value = stage >= 4 ? sample.weights[i][j] : stage >= 3 && future ? -Infinity : v
        return <g key={`${i}-${j}`} opacity={isSelected ? 1 : dim * 0.55} transform={`translate(${matrixX + j * cell} ${matrixY + i * cell})`}>
          <rect width="43" height="43" rx="7" fill={future && stage >= 3 ? '#96a3b8' : '#6ee7cf'} fillOpacity={alpha} />
          {isSelected && <rect width="43" height="43" rx="7" fill="none" stroke="#6ee7cf" strokeOpacity={future ? 0.2 : 0.8} strokeWidth="1.2" />}
          <text x="21.5" y="26" textAnchor="middle" className={future && stage >= 3 ? 'aw-svg-dim' : 'aw-svg-number'}>{fmt(value)}</text>
          {future && <path d="M8 35 35 8" stroke="#96a3b8" opacity={masked * (1 - normalized) * 0.5} />}
        </g>
      }))}
    </g>
    <g opacity={matrix * (1 - mixed)}>
      <path d={`M424 ${matrixY + row * cell + 22}h26`} stroke="#6ee7cf" strokeWidth="1.5" fill="none" />
      <text x="463" y={matrixY + row * cell + 19} className="aw-svg-label">位置 {row + 1}</text>
      <text x="463" y={matrixY + row * cell + 38} className="aw-svg-dim">{stage >= 4 ? '重みの合計 = 1' : stage >= 3 ? '現在と過去だけ' : 'この行を追う'}</text>
      <text x="320" y="377" textAnchor="middle" className="aw-svg-dim">{stage >= 4 ? '各行を softmax で正規化' : stage >= 3 ? '斜線の位置は softmax 後に 0' : '4 × 4 のスコア行列 · dₖ = 3'}</text>
    </g>

    {/* V remains distinct from the attention weights; lines encode coefficients. */}
    <g opacity={mixed}>
      <rect x="50" y="124" width="270" height="227" rx="12" fill="#0b1526" fillOpacity="0.97" />
      <text x="166" y="79" textAnchor="middle" className="aw-svg-heading">重み × V</text>
      <text x="489" y="79" textAnchor="middle" className="aw-svg-heading">位置 {row + 1} の出力</text>
      {sample.V.map((values, i) => {
        const y = 145 + i * 49
        return <g key={i} opacity={weight[i] > 0 ? 1 : 0.35}>
          <text x="66" y={y + 18} className="aw-svg-number">{weight[i].toFixed(2)}</text>
          <text x="111" y={y + 18} className="aw-svg-dim">×</text>
          <Vector values={values} x={139} y={y} tone="violet" cell={36} />
          <text x="261" y={y + 18} className="aw-svg-dim">V{i + 1}</text>
          <path d={`M292 ${y + 14} C350 ${y + 14} 350 233 399 233`} fill="none" stroke={weight[i] > 0 ? `url(#${id}-flow)` : '#64748b'} strokeWidth={weight[i] > 0 ? 1 + weight[i] * 12 : 1} strokeDasharray={weight[i] === 0 ? '3 6' : undefined} />
          {weight[i] > 0 && <circle cx={lerp(294, 394, mixed)} cy={lerp(y + 14, 233, mixed)} r={2 + weight[i] * 3} fill="#6ee7cf" />}
        </g>
      })}
      <circle cx="408" cy="233" r="15" fill="#142e35" stroke="#6ee7cf" strokeWidth="1" />
      <text x="408" y="238" textAnchor="middle" className="aw-svg-label">Σ</text>
      <Vector values={sample.output[row]} x={448} y={219} cell={35} />
      <text x="496" y="273" textAnchor="middle" className="aw-svg-dim">3 次元のベクトル</text>
      <text x="320" y="377" textAnchor="middle" className="aw-svg-dim">未来の V は、重み 0 で寄与しない</text>
    </g>
  </svg>
}

export function AttentionStep({ step, children }) {
  return <ReadingStep step={step} data-attention-step={step}>{children}</ReadingStep>
}

export function AttentionWalkthrough({ children }) {
  const [row, setRow] = useState(2)
  return <ReadingFigure
    diagramId="self-attention"
    title="自己注意"
    eyebrow={<>SELF-ATTENTION <span>/ 1 HEAD</span></>}
    stages={STAGES}
    className="attention-walkthrough"
    renderScene={({ phase, stage, id }) => <AttentionScene phase={phase} stage={stage} row={row} id={id} />}
    renderControls={({ ready }) => <div className="aw-row-picker" role="group" aria-label="追跡する位置">
      <span>追う位置</span>
      {[0, 1, 2, 3].map(i => <button key={i} type="button" aria-label={`位置 ${i + 1} を追う`} aria-pressed={row === i} onClick={() => setRow(i)} disabled={!ready}>{i + 1}</button>)}
      <span className="aw-row-note">行を選んで、流れを追跡</span>
    </div>}
    footnote={<>4位置・1ヘッドの説明用データ。数値は丸めて表示。<br />実モデルの観測値や、並列計算の時間順を表すものではありません。</>}
  >{children}</ReadingFigure>
}
