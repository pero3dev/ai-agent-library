'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { CONTEXT_STAGES, CONTEXT_CHECKS, contextFrame } from '../../lib/attention-context-model.mjs'
import './attention-context.css'

const axisX = position => 76 + position * 61

function ContextScene({ id, phase, stage, check }) {
  const frame = contextFrame(stage, { phase, check })
  const trainingEnd = axisX(frame.trainingLength), axisEnd = axisX(frame.inputLength)
  const quality = frame.check === 'quality', cost = frame.check === 'cost'
  const changed = frame.interpolation > 0, interpolating = changed && frame.interpolation < 1
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene av-scene av-context-scene"
    data-position-mapping={changed ? 'interpolation' : 'extrapolation'} data-interpolation={frame.interpolation}
    data-context-check={frame.check || 'none'} data-input-count={frame.tokens.length} data-quality-judgment="none">
    <text x="320" y="30" className="av-heading" textAnchor="middle">入力トークンの並びは保持</text>
    <path d={`M${axisX(0)} 115H${axisEnd}`} stroke="#7890a1" strokeWidth="1.5" />
    <text x={axisX(0)} y="141" className="cd-small" textAnchor="middle">先頭</text>
    <text x="290" y="141" className="cd-small" textAnchor="middle">中盤</text>
    <text x={axisX(7)} y="141" className="cd-small" textAnchor="middle">末尾</text>
    {cost && <path d={`M${axisX(0) - 22} 55v-9H${axisX(7) + 22}v9`} fill="none" stroke={tones.amber} strokeWidth="2.5" />}
    {frame.tokens.map((token, index) => {
      const x = axisX(token.position), target = axisX(token.assignedPosition)
      const beyond = token.assignedPosition >= frame.trainingLength
      const middle = index === 3 || index === 4
      const focus = quality && middle
      const tone = stage === 1 && beyond ? 'amber' : 'teal'
      return <g key={token.id} data-token-id={token.id} data-input-position={token.position} data-assigned-position={token.assignedPosition}>
        <Wire id={id} d={`M${x} 155L${target} 235`} active={stage === 1 ? beyond : stage === 2 || focus} tone={tone} phase={phase} />
        <rect x={x - 20} y="68" width="40" height="37" rx="7" fill={focus ? '#3a2f31' : '#12303a'} stroke={focus ? tones.amber : tones.teal} strokeWidth={focus ? 2.5 : 1.2} />
        <text x={x} y="93" className="cd-label" textAnchor="middle">{index + 1}</text>
        <circle cx={target} cy="250" r="12" fill={stage === 1 && beyond ? '#3a2f31' : '#12303a'} stroke={stage === 1 && beyond ? tones.amber : tones.teal} strokeWidth="1.5" />
        <text x={target} y="256" className="acx-position-label" textAnchor="middle">{index + 1}</text>
      </g>
    })}
    <rect x={axisX(0) - 18} y="212" width={trainingEnd - axisX(0) + 18} height="75" rx="8" fill="none" stroke={frame.check === 'training' || stage === 0 ? tones.violet : '#7684ad'} strokeWidth={frame.check === 'training' || stage === 0 ? 2.5 : 1.4} />
    <path d={`M${trainingEnd} 208V291`} stroke={tones.violet} strokeDasharray="4 5" />
    <rect x="91" y="177" width="214" height="28" rx="6" fill="#102030" />
    <text x={(axisX(0) + trainingEnd) / 2} y="198" className="cd-label" textAnchor="middle">学習時の位置の範囲</text>
    <text x="450" y="198" className="cd-small" textAnchor="middle">{changed ? '対応先を縮める' : '範囲外の位置'}</text>
    <path d={`M${axisX(0)} 273H${axisEnd}`} stroke="#687f91" strokeWidth="1.3" />
    <text x={axisX(0)} y="310" className="cd-small" textAnchor="middle">0</text>
    <text x={trainingEnd} y="310" className="cd-small" textAnchor="middle">学習長</text>
    <text x={axisEnd} y="310" className="cd-small" textAnchor="middle">入力長</text>
    <text x="320" y="343" className="cd-label" textAnchor="middle">{interpolating ? '全位置を同じ比率で再割当て中' : changed ? '8個の入力 → 8個の異なる割当て位置' : stage === 2 ? '同じ入力から、位置の再割当てを始める' : '入力位置をそのまま割り当てる'}</text>
    <path d="M32 361H608" stroke="#334d60" />
    <text x="320" y="389" className="cd-label" textAnchor="middle">{stage === 3 ? frame.checkCaption : '枠の内側に入っても、品質の保証にはならない'}</text>
    <text x="320" y="418" className="cd-small" textAnchor="middle">{stage === 3 ? '強調は確認対象のみ。合否や測定値は示さない' : '番号は同じ入力の対応を示す目印'}</text>
  </SceneBase>
}

export function AttentionContext({ children }) {
  const [check, setCheck] = useState('quality')
  const stages = CONTEXT_STAGES.map((_, stage) => contextFrame(stage, { check }))
  return <ReadingFigure diagramId="attention-context-range" title="位置の対応範囲" eyebrow="ATTENTION / CONTEXT RANGE"
    stages={stages} className="attention-variants-walkthrough"
    renderScene={state => <ContextScene {...state} check={check} />}
    renderControls={({ ready, stage }) => stage === 3 ? <div className="av-controls">
      <Select label="確認する対象" value={check} onChange={setCheck} ready={ready}>
        {CONTEXT_CHECKS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : null}
    footnote="位置の対応を示す模式図。入力を削除せず、連続した位置へ一様に割り当てます。位置補間の学習手順・YaRNの周波数調整・実タスクの品質は計算していません。">{children}</ReadingFigure>
}
