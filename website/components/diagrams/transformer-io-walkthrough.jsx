'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, Lines, tones } from './concept-scene-primitives'
import { IO_STAGES, ioFrame, embeddingCell, outputWeightCell } from '../../lib/transformer-io-model.mjs'

// Cells distinguish parameter identity only. Their count and fill are not data.
const COMPONENT_COLORS = ['#74e3cf', '#91d8ee', '#baa7f3', '#f1c27e']

function VectorStrip({ x, y, width = 138, tone = 'teal', selected = false, symbol, shape = 'd' }) {
  return <g className="tio-vector" data-active={selected}>
    <text x={x + width / 2} y={y - 11} className="cd-label" textAnchor="middle">{symbol}<tspan className="cd-small">　{shape} 次元</tspan></text>
    <rect x={x} y={y} width={width} height="26" rx="5" fill="#101f31" stroke={tones[tone]} strokeOpacity={selected ? .9 : .4} />
    {[0, 1, 2, 3].map(index => <rect key={index} x={x + 5 + index * (width - 10) / 4} y={y + 5} width={(width - 10) / 4 - 4} height="16" rx="2" fill={tone === 'teal' ? COMPONENT_COLORS[index] : tones[tone]} opacity={selected ? .75 : .28} />)}
    <text x={x + width * .62} y={y + 20} fill="#0b1526" fontSize="17" textAnchor="middle">⋯</text>
  </g>
}

function WeightTable({ output = false, stage, shared }) {
  const x = output ? 450 : 40, y = 91
  const columns = output ? 5 : 4, rows = output ? 4 : 5
  const width = columns * 34, height = rows * 32
  const active = stage === 0 || (output ? stage >= 2 : stage === 1 || stage === 3)
  const selected = stage === 1 && !output || stage === 3 && (!output || shared)
  const tone = output && !shared ? tones.amber : tones.teal
  return <g className="tio-weight" data-active={active} data-weight={output ? 'output' : 'embedding'}>
    <text x={x + width / 2} y="30" className="tf-heading" textAnchor="middle">{output ? '出力 W_U' : '埋め込み E'}</text>
    <text x={x + width / 2} y="55" className="cd-small" textAnchor="middle">{output ? 'd × V' : 'V × d'}</text>
    <path d={`M${x} 83v-6h${width}v6`} fill="none" stroke="#647e90" />
    <text x={x + width / 2} y="73" className="tio-axis" textAnchor="middle">{output ? 'V' : 'd'}</text>
    <path d={`M${x - 6} ${y}h-5v${height}h5`} fill="none" stroke="#647e90" />
    <text x={x - 19} y={y + height / 2 + 6} className="tio-axis" textAnchor="middle">{output ? 'd' : 'V'}</text>
    <rect x={x - 1} y={y - 1} width={width + 2} height={height + 2} rx="7" fill="#0f2130" stroke={tone} strokeOpacity={active ? .7 : .32} />
    {Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => {
      const emphasis = selected && (output ? column === 2 : row === 2)
      const component = output ? row : column
      const identity = output ? outputWeightCell(row + 1, column + 1, shared ? 'tied' : 'untied') : embeddingCell(row + 1, column + 1)
      return <rect key={`${row}-${column}`} data-cell-identity={identity}
        x={x + column * 34 + 3} y={y + row * 32 + 3} width="28" height="26" rx="3"
        fill={emphasis ? COMPONENT_COLORS[component] : tone} fillOpacity={emphasis ? .85 : active ? .13 : .06}
        stroke={emphasis ? COMPONENT_COLORS[component] : tone} strokeOpacity={emphasis ? .95 : .18} />
    }))}
    {selected && <rect x={output ? x + 68 : x - 3} y={output ? y - 3 : y + 64} width={output ? 34 : width + 6} height={output ? height + 6 : 32} rx="4" fill="none" stroke={tones.teal} strokeWidth="2" />}
    <text x={x + width / 2} y={y + height + 27} className="cd-small" textAnchor="middle">{output ? shared ? '共有時は E の転置' : 'E とは独立の重み' : '選択する行：id_t'}</text>
  </g>
}

function IOScene({ id, phase, stage, tying }) {
  const frame = ioFrame(stage, { tying })
  const active = node => frame.activeNodes.includes(node)
  const edge = name => frame.activeEdges.includes(name)
  const shared = frame.weights.sharedWithEmbedding
  return <SceneBase id={id} title={frame.title} detail={frame.detail}
    className="aw-scene tf-scene tf-io-scene" data-io-tying={tying} data-values="symbolic">
    <g className="tio-sharing" opacity={stage === 3 ? 1 : 0} aria-hidden={stage !== 3}>
      <path d="M178 102C211 58 412 58 448 102" fill="none" stroke={shared ? tones.teal : '#71828e'} strokeWidth="1.8" strokeDasharray={shared ? '4 5' : '2 8'} opacity={shared ? .9 : .4} />
      <rect x="239" y="36" width="155" height="30" rx="15" fill="#17333e" />
      <text x="316" y="57" className="cd-label" textAnchor="middle">{shared ? '同じ重みを転置' : '独立した重み'}</text>
    </g>

    <Wire id={id} d="M178 171H249" active={edge('lookup')} phase={phase} />
    <Wire id={id} d="M322 185V211" active={edge('position')} phase={phase} />
    <Wire id={id} d="M322 263V278" active={edge('norm')} phase={phase} tone="violet" />
    <Wire id={id} d="M322 310V346" active={edge('hidden')} phase={phase} tone="violet" />
    <Wire id={id} d="M393 360H419V164H447" active={edge('unembedding')} phase={phase} tone="violet" />
    <Wire id={id} d="M535 249V274" active={edge('logits')} phase={phase} tone="amber" />
    <Wire id={id} d="M535 301V318" active={edge('softmax')} phase={phase} tone="amber" />
    <Wire id={id} d="M535 344V366" active={edge('probabilities')} phase={phase} tone="amber" />

    <WeightTable stage={stage} shared={shared} />
    <WeightTable output stage={stage} shared={shared} />
    <text x="216" y="150" className="cd-small" textAnchor="middle">行取得</text>
    <VectorStrip x={253} y={158} symbol="x_t" selected={active('input')} />
    <text x="322" y="203" className="cd-small" textAnchor="middle">位置情報を反映</text>
    <g className="tio-stack" data-active={active('blocks')}>
      <rect x="261" y="205" width="130" height="50" rx="8" />
      <rect x="257" y="209" width="134" height="50" rx="8" />
      <rect x="253" y="213" width="138" height="50" rx="8" />
      <text x="322" y="244" className="cd-label" textAnchor="middle">ブロック × L</text>
    </g>
    <g className="tio-norm" data-active={active('final-norm')}>
      <rect x="253" y="278" width="138" height="32" rx="7" />
      <text x="322" y="300" className="cd-label" textAnchor="middle">最終正規化</text>
    </g>
    <VectorStrip x={253} y={346} symbol="h_t" tone="violet" selected={active('hidden')} />

    <g className="tio-output" data-active={active('logits')}>
      <rect x="451" y="275" width="168" height="26" rx="5" fill="#182a37" stroke={tones.amber} strokeOpacity=".6" />
      <text x="535" y="294" className="cd-label" textAnchor="middle">z₁　z₂　⋯　z_V</text>
      <text x="535" y="267" className="cd-small" textAnchor="middle">V 個のロジット</text>
    </g>
    <g className="tio-softmax" data-active={active('softmax')}>
      <rect x="481" y="318" width="108" height="27" rx="14" fill="#2b2933" stroke={tones.amber} strokeOpacity=".45" />
      <text x="535" y="338" className="cd-label" textAnchor="middle">softmax</text>
    </g>
    <g className="tio-output" data-active={active('probabilities')}>
      <rect x="451" y="366" width="168" height="28" rx="5" fill="#182a37" stroke={tones.amber} strokeOpacity=".6" />
      <text x="535" y="386" className="cd-label" textAnchor="middle">p₁　p₂　⋯　p_V</text>
      <text x="535" y="417" className="cd-small" textAnchor="middle">次トークンの分布</text>
    </g>
    <Lines x={110} y={315} lines={stage === 3 ? shared ? ['E の1行が', 'W_U の1列へ'] : ['形状が対応しても', '同じ重みではない'] : ['IDで選ぶのは', '表の1行']} className="cd-label" gap={25} />
    <text x="322" y="404" className="cd-small" textAnchor="middle">Transformer 通過後</text>
  </SceneBase>
}

export function TransformerIO({ children }) {
  const [tying, setTying] = useState('tied')
  const stages = IO_STAGES.map((_, stage) => ioFrame(stage, { tying }))
  return <ReadingFigure diagramId="transformer-io" title="入力と出力、重みの共有" eyebrow="TRANSFORMER / INPUT & OUTPUT"
    stages={stages} className="transformer-walkthrough"
    renderScene={state => <IOScene {...state} tying={tying} />}
    renderControls={({ ready, stage }) => stage === 3 ? <div className="tf-controls">
      <Select label="重みの共有" value={tying} onChange={setTying} ready={ready}>
        <option value="tied">共有あり：W_U = Eᵀ</option><option value="untied">共有なし：独立した重み</option>
      </Select>
    </div> : null}
    footnote="形状と重みの対応を示す模式図。セルの数・色は実モデルの次元や重みの値を表しません。予測確率は計算していません。">{children}</ReadingFigure>
}
