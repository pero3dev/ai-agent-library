'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { KV_STAGES, KV_SHARING, kvFrame } from '../../lib/attention-kv-model.mjs'
import './attention-kv.css'

const HEAD_X = [104, 248, 392, 536]

function PairMatrix({ lengthComparison }) {
  const cell = 18, x = 84, y = 70
  return <g className="akv-matrix" data-pair-domain="full">
    <text x="165" y="29" className="av-heading" textAnchor="middle">注意の全トークン対</text>
    <text x="156" y="58" className="cd-small" textAnchor="middle">{lengthComparison ? '2n' : 'n'}</text>
    <text x="61" y="146" className="cd-small" textAnchor="middle">{lengthComparison ? '2n' : 'n'}</text>
    {Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, column) => <rect key={`${row}-${column}`}
      x={x + column * cell} y={y + row * cell} width={cell - 2} height={cell - 2} rx="2"
      fill={tones.violet} fillOpacity={lengthComparison ? row < 4 && column < 4 ? .68 : .18 : .3} />))}
    {lengthComparison && <><rect x={x - 3} y={y - 3} width="76" height="76" rx="4" fill="none" stroke={tones.violet} strokeWidth="2" />
      <text x="120" y="117" className="akv-inner-label" textAnchor="middle">n²</text></>}
    <text x="156" y="241" className="cd-label" textAnchor="middle">{lengthComparison ? 'n² → 4n²' : 'n × n は同じ'}</text>
  </g>
}

function CacheStorage({ frame }) {
  const lengthComparison = frame.stage === 0
  return <g className="akv-cache" data-kv-heads={frame.kvHeads}>
    <text x="475" y="29" className="av-heading" textAnchor="middle">保存する K / V</text>
    {[0, 1, 2, 3].map(slot => {
      const active = frame.activeSlots.includes(slot), x = 367 + slot * 60
      return <g key={slot} data-cache-slot={slot} data-active={active}>
        <text x={x + 9} y="58" className="cd-small" textAnchor="middle">K</text>
        <text x={x + 32} y="58" className="cd-small" textAnchor="middle">V</text>
        {[0, 1].map(kind => <g key={kind}>
          <rect x={x + kind * 23} y="70" width="18" height="144" rx="3" fill={active ? tones.teal : 'none'} fillOpacity={lengthComparison ? .17 : .35} stroke={active ? tones.teal : '#496174'} strokeOpacity={active ? .7 : .55} strokeDasharray={active ? undefined : '3 5'} />
          {active && lengthComparison && <rect x={x + kind * 23} y="70" width="18" height="72" rx="3" fill={tones.teal} fillOpacity=".55" />}
        </g>)}
      </g>
    })}
    <path d="M351 70h-7v144h7" fill="none" stroke="#718b9a" />
    <text x="327" y="146" className="cd-small" textAnchor="middle">{lengthComparison ? '2n' : 'n'}</text>
    {lengthComparison && <path d="M364 142H595" stroke={tones.teal} strokeDasharray="4 5" strokeOpacity=".5" />}
    <text x="475" y="241" className="cd-label" textAnchor="middle">{lengthComparison ? '長さ n → 2n：2倍' : `K/V は ${frame.kvHeads} 組`}</text>
  </g>
}

function Factors({ stage, phase, id }) {
  const factors = [
    { x: 42, width: 76, symbol: '2', label: 'KとV' },
    { x: 126, width: 70, symbol: 'n', label: '長さ' },
    { x: 204, width: 70, symbol: 'L', label: '層数' },
    { x: 282, width: 102, symbol: 'h_kv', label: 'KV組数' },
    { x: 392, width: 88, symbol: 'd_h', label: '幅' },
    { x: 488, width: 110, symbol: 'b', label: '要素サイズ' }
  ]
  return <g className="akv-factors">
    {stage === 1 && <Wire id={id} d="M599 326H609V241H593" active phase={phase} />}
    <text x="320" y="278" className="cd-small" textAnchor="middle">{stage === 0 ? 'ほかの因子を固定して、長さを比較' : '各因子の積が KV bytes の概算'}</text>
    {factors.map(factor => <g key={factor.symbol}>
      <rect x={factor.x} y="295" width={factor.width} height="73" rx="9" fill="#112634" stroke={factor.symbol === 'h_kv' && stage === 1 ? tones.teal : '#395568'} />
      <text x={factor.x + factor.width / 2} y="323" className="cd-label" textAnchor="middle">{factor.symbol}</text>
      <text x={factor.x + factor.width / 2} y="351" className="cd-small" textAnchor="middle">{factor.label}</text>
    </g>)}
    <text x="320" y="405" className="cd-label" textAnchor="middle">{stage === 0 ? '全対行列の広がりと、KVの長さ方向を区別' : '次は h_kv だけを変えて比べる'}</text>
  </g>
}

function Sharing({ id, phase, frame }) {
  return <g className="akv-sharing" data-sharing={frame.mode}>
    <text x="320" y="278" className="cd-small" textAnchor="middle">図の Q は4本のまま　｜　n・L・d_h・b は固定</text>
    {frame.connections.map(({ query, slot }) => <Wire key={query} id={id}
      d={`M${HEAD_X[query]} 319L${HEAD_X[slot]} 354`} active phase={phase} />)}
    {HEAD_X.map((x, index) => <g key={index} data-query-head={index}>
      <rect x={x - 39} y="290" width="78" height="29" rx="7" fill="#202a43" stroke={tones.violet} strokeOpacity=".8" />
      <text x={x} y="312" className="cd-label" textAnchor="middle">Q{['₁', '₂', '₃', '₄'][index]}</text>
      <rect x={x - 43} y="356" width="86" height="31" rx="7" fill={frame.activeSlots.includes(index) ? '#163b40' : '#101f31'} stroke={frame.activeSlots.includes(index) ? tones.teal : '#496174'} strokeDasharray={frame.activeSlots.includes(index) ? undefined : '4 5'} />
      <text x={x} y="378" className={frame.activeSlots.includes(index) ? 'cd-label' : 'cd-small'} textAnchor="middle">{frame.activeSlots.includes(index) ? 'K / V' : '—'}</text>
    </g>)}
    <text x="320" y="418" className="cd-label" textAnchor="middle">{frame.mode.toUpperCase()}　｜　KV部分のMHA比：{frame.ratioLabel}</text>
  </g>
}

function KVScene({ id, phase, stage, sharing }) {
  const frame = kvFrame(stage, { sharing })
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene av-scene av-kv-scene"
    data-kv-mode={frame.mode} data-query-heads={frame.queryHeads} data-kv-heads={frame.kvHeads} data-cache-ratio={frame.cacheRatio}>
    <PairMatrix lengthComparison={stage === 0} />
    <CacheStorage frame={frame} />
    <path d="M24 254H616" stroke="#334d60" />
    {stage < 2 ? <Factors stage={stage} id={id} phase={phase} /> : <Sharing id={id} phase={phase} frame={frame} />}
  </SceneBase>
}

export function AttentionKV({ children }) {
  const [sharing, setSharing] = useState('mqa')
  const stages = KV_STAGES.map((_, stage) => kvFrame(stage, { sharing }))
  return <ReadingFigure diagramId="attention-kv-sharing" title="長さとKV共有" eyebrow="ATTENTION / KV SHARING"
    stages={stages} className="attention-variants-walkthrough"
    renderScene={state => <KVScene {...state} sharing={sharing} />}
    renderControls={({ ready, stage }) => stage === 4 ? <div className="av-controls">
      <Select label="KVの共有" value={sharing} onChange={setSharing} ready={ready}>
        {KV_SHARING.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : null}
    footnote="全対行列とKV部分の模式図。因果マスク後の対数は n(n+1)/2 で、長さ2倍時に厳密な4倍ではありません。図の比率は実測速度・総GPUメモリ・品質を表しません。">{children}</ReadingFigure>
}
