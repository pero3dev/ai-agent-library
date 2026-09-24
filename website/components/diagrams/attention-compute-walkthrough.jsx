'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { Lines, SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { COMPUTE_STAGES, computeFrame } from '../../lib/attention-compute-model.mjs'

const patternNames = { local: '局所窓', fixed: '固定接続', sink: '先頭保持' }
const cellX = key => 66 + key * 27
const cellY = query => 83 + query * 27

function PairGrid({ frame }) {
  const sparse = frame.stage === 0
  const current = new Set(frame.flash.current.cells.map(cell => `${cell.query}:${cell.key}`))
  const previous = new Set(frame.flash.processed.map(cell => `${cell.query}:${cell.key}`))
  return <g data-pair-mode={sparse ? 'sparse-causal' : 'dense-causal'}>
    <text x="172" y="28" textAnchor="middle" className="av-heading">トークン対</text>
    <text x="173" y="54" textAnchor="middle" className="cd-small">参照先 K →</text>
    <text x="24" y="168" textAnchor="middle" className="cd-small">Q</text>
    <path d="M27 182v75l-4-6m4 6 4-6" stroke="#a8bfcc" fill="none" />
    {Array.from({ length: 8 }, (_, index) => <g key={index}>
      <text x={cellX(index) + 10} y="74" textAnchor="middle" className="cd-small">{index + 1}</text>
      <text x="53" y={cellY(index) + 16} textAnchor="end" className="cd-small">{index + 1}</text>
    </g>)}
    {Array.from({ length: 64 }, (_, index) => {
      const query = Math.floor(index / 8), key = index % 8, allowed = key <= query
      const connected = sparse ? frame.connections[query][key] : allowed
      const active = sparse ? connected && query === 7 : current.has(`${query}:${key}`)
      const processed = !sparse && previous.has(`${query}:${key}`)
      return <rect key={index} x={cellX(key)} y={cellY(query)} width="22" height="22" rx="3"
        fill={!allowed ? '#0c1626' : active ? tones.teal : processed ? '#367469' : connected ? '#264753' : '#142638'}
        stroke={!allowed ? '#1a2a3e' : active ? '#c0fff2' : '#355164'} strokeDasharray={!allowed ? '2 3' : undefined}
        opacity={!allowed ? .45 : 1} data-query={query} data-key={key} data-connected={connected} data-current={active} />
    })}
    <text x="172" y="326" textAnchor="middle" className="cd-small">{sparse ? '因果接続の模式図' : '因果マスク内の対象は同じ'}</text>
  </g>
}

function SparseDetail({ frame, id }) {
  const direct = frame.connections[7].flatMap((connected, key) => connected ? [key] : [])
  return <g data-sparse-pattern={frame.pattern} data-reach-layers={frame.layers}>
    <text x="463" y="28" textAnchor="middle" className="av-heading">{patternNames[frame.pattern]}</text>
    <Lines x={463} y={70} lines={frame.pattern === 'local' ? ['各位置は近傍を参照', '図の窓は自分を含む3位置'] : frame.pattern === 'fixed' ? ['局所窓に固定接続を追加', '配置は説明用の一例'] : ['窓と先頭を保持', '重要語という意味ではない']} className="cd-small" gap={24} />
    <rect x="362" y="130" width="203" height="51" rx="12" fill="#15363d" stroke={tones.teal} />
    <text x="463" y="162" textAnchor="middle">位置 8 から参照</text>
    <Wire id={id} d="M463 186v42" active phase={frame.phase} />
    <text x="463" y="254" textAnchor="middle">{frame.layers}層での到達可能性</text>
    {Array.from({ length: 8 }, (_, key) => {
      const immediate = direct.includes(key), indirect = !immediate && frame.reached.includes(key)
      const x = 333 + key * 34
      return <g key={key} data-reachable={frame.reached.includes(key)}>
        <rect x={x} y="277" width="29" height="33" rx="5" fill={immediate ? '#195447' : indirect ? '#443920' : '#132438'}
          stroke={immediate ? tones.teal : indirect ? tones.amber : '#334557'} strokeDasharray={indirect ? '3 3' : undefined} />
        <text x={x + 14.5} y="301" textAnchor="middle">{key + 1}</text>
      </g>
    })}
    <Lines x={463} y={344} lines={['実線：直接の接続', '破線：もう1層を経由']} className="cd-small" gap={23} />
    <text x="320" y="414" textAnchor="middle" className="cd-small">接続されない対を、計算後の小さい重みとして扱わない</text>
  </g>
}

function MatrixCard({ x, y, label, dimension, active = false, width = 150, height = 62 }) {
  return <g>
    <rect x={x} y={y} width={width} height={height} rx="9" fill={active ? '#193e43' : '#12273b'} stroke={active ? tones.teal : '#416074'} />
    <text x={x + width / 2} y={y + 25} textAnchor="middle">{label}</text>
    <text x={x + width / 2} y={y + 49} textAnchor="middle" className="cd-small">{dimension}</text>
  </g>
}

function LinearDetail({ frame, id }) {
  const factored = frame.stage === 2
  return <g data-product-scope="unnormalized-noncausal" data-product-order={factored ? 'kv-first' : 'qk-first'}>
    <text x="320" y="28" textAnchor="middle" className="av-heading">本文の積の並べ替え</text>
    <text x="320" y="56" textAnchor="middle" className="cd-small">正規化・因果制約は省略</text>
    <MatrixCard x={33} y={80} label="φ(Q)" dimension="系列長 × 特徴幅" active={!factored} />
    <MatrixCard x={245} y={80} label="φ(K)ᵀ" dimension="特徴幅 × 系列長" active />
    <MatrixCard x={457} y={80} label="V" dimension="系列長 × V幅" active={factored} />
    <Wire id={id} d={factored ? 'M320 149v32h106v22' : 'M108 149v32h106v22'} active phase={frame.phase} />
    <Wire id={id} d={factored ? 'M532 149v32H426v22' : 'M320 149v32H214v22'} active phase={frame.phase} />
    <g data-intermediate={factored ? 'feature-by-value' : 'sequence-by-sequence'}>
      <rect x={factored ? 349 : 131} y="208" width={factored ? 154 : 166} height={factored ? 60 : 96} rx="9" fill="#21314e" stroke={tones.violet} strokeWidth="1.7" />
      <text x={factored ? 426 : 214} y={factored ? 234 : 241} textAnchor="middle">{factored ? 'φ(K)ᵀV' : 'φ(Q)φ(K)ᵀ'}</text>
      <text x={factored ? 426 : 214} y={factored ? 257 : 267} textAnchor="middle" className="cd-small">{factored ? '特徴幅 × V幅' : '系列長 × 系列長'}</text>
      {!factored && <path d="M135 278h158m-135 0v23m27-23v23m27-23v23m27-23v23m27-23v23" stroke={tones.violet} opacity=".35" />}
    </g>
    <Wire id={id} d={factored ? 'M108 150v185h128' : 'M532 150v185H404'} active phase={frame.phase} tone="amber" />
    <Wire id={id} d={factored ? 'M426 272v63h-22' : 'M214 307v28h22'} active phase={frame.phase} tone="violet" />
    <MatrixCard x={245} y={308} label="積の結果" dimension="系列長 × V幅" active />
    <text x="320" y="414" textAnchor="middle" className="cd-small">{factored ? '幅を固定すると、系列長×系列長の中間領域を作らずに済む' : 'softmax注意の完成出力ではなく、特徴写像を使った積'}</text>
  </g>
}

function FlashDetail({ frame, id }) {
  const carry = frame.stage === 4, io = frame.stage === 5, tile = frame.flash
  return <g data-flash-tile={tile.index} data-row-carry={carry}>
    <rect x="335" y="9" width="288" height="250" rx="12" fill="#102d37" stroke="#458c89" />
    <text x="479" y="36" textAnchor="middle" className="av-heading">高速メモリ</text>
    <text x="479" y="64" textAnchor="middle" className="cd-small">タイル {tile.index + 1} / {tile.count}</text>
    <text x="479" y="90" textAnchor="middle" className="cd-small">行 {tile.current.queryStart + 1}–{tile.current.queryStart + 2} を処理</text>
    <rect x="355" y="111" width="247" height="45" rx="7" fill={carry ? '#40382a' : '#183b48'} stroke={carry ? tones.amber : '#466575'} />
    <text x="479" y="138" textAnchor="middle">{carry ? '同じ行の、前までの状態' : 'Q と K/V のタイル'}</text>
    <Wire id={id} d="M479 160v31" active phase={frame.phase} tone={carry ? 'amber' : 'teal'} />
    <rect x="355" y="196" width="247" height="45" rx="7" fill="#24324d" stroke={tones.violet} />
    <text x="479" y="224" textAnchor="middle">{carry ? '更新した状態 → 次へ' : 'スコア・逐次更新・出力'}</text>
    {carry && <path d="M605 218h10V133h-8" fill="none" stroke={tones.amber} markerEnd={`url(#${id}-amber-arrow)`} />}
    <Wire id={id} d="M396 315v-48" active phase={frame.phase} />
    <Wire id={id} d="M566 268v46" active phase={frame.phase} tone="violet" />
    <text x="368" y="291" textAnchor="middle" className="cd-small">読込</text>
    <text x="594" y="292" textAnchor="middle" className="cd-small">書戻</text>
    <rect x="335" y="321" width="288" height="66" rx="10" fill="#1a253b" stroke="#51617c" />
    <text x="479" y="344" textAnchor="middle">低速メモリ（HBM）</text>
    <text x="391" y="375" textAnchor="middle" className="cd-small">Q / K / V</text>
    <text x="566" y="375" textAnchor="middle" className="cd-small">出力</text>
    <rect x="64" y="345" width="218" height="39" rx="7" fill="#18283a" stroke="#6a7990" strokeDasharray="4 4" />
    <text x="173" y="369" textAnchor="middle" className="cd-small">n × n の全中間行列</text>
    <path d="M283 365h32m-11-10 17 20m-17 0 17-20" stroke={tones.coral} fill="none" strokeWidth="2" />
    <text x="320" y="414" textAnchor="middle" className="cd-small">{io ? '全中間行列の保存を省く。入力・出力のIOは残る' : carry ? '行の状態を引き継ぐ。タイルごとの独立なsoftmax合算ではない' : '処理対象は同じ。巨大な中間行列をHBMへ書き出さない'}</text>
  </g>
}

function ComputeScene({ phase, id, pattern, layers }) {
  const frame = computeFrame(phase, { pattern, layers })
  return <SceneBase id={id} className="aw-scene av-scene" title={frame.title}
    detail={`${frame.detail}${frame.stage === 0 ? ` 選択: ${patternNames[pattern]}、${layers}層。` : frame.linear ? ' 正規化・因果制約を省略した積の比較。' : ' Q/K/Vの読込と出力の書戻しを保持。'}`}>
    {frame.linear ? <LinearDetail frame={frame} id={id} /> : <><PairGrid frame={frame} />
      {frame.stage === 0 ? <SparseDetail frame={frame} id={id} /> : <FlashDetail frame={frame} id={id} />}</>}
  </SceneBase>
}

export function AttentionComputeMemory({ children }) {
  const [pattern, setPattern] = useState('local'), [layers, setLayers] = useState(1)
  return <ReadingFigure diagramId="attention-compute-memory" title="注意の計算と保存" eyebrow="ATTENTION VARIANTS / COMPUTE & MEMORY"
    stages={COMPUTE_STAGES} className="attention-variants-walkthrough"
    renderScene={state => <ComputeScene {...state} pattern={pattern} layers={layers} />}
    renderControls={({ ready, stage }) => stage === 0 ? <div className="av-controls">
      <Select label="接続パターン" value={pattern} onChange={setPattern} ready={ready}>
        <option value="local">局所窓</option><option value="fixed">局所窓＋固定接続</option><option value="sink">局所窓＋先頭保持</option>
      </Select>
      <Select label="層数" value={String(layers)} onChange={value => setLayers(Number(value))} ready={ready}>
        <option value="1">1層：直接</option><option value="2">2層：間接も確認</option>
      </Select>
    </div> : null}
    footnote="接続・形状・保存先の模式図。セルは実モデルの値ではありません。線形の場面は本文の積だけを示し、速度・品質を計測した図ではありません。">{children}</ReadingFigure>
}
