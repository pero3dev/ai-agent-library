'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { BLOCK_HEADS, BLOCK_STAGES, blockFrame } from '../../lib/transformer-block-model.mjs'

const weightTone = weight => weight.family === 'attention' ? tones.teal : tones.amber
const text = (x, y, value, className = 'tf-label', extra = {}) => <text x={x} y={y} textAnchor="middle" className={className} {...extra}>{value}</text>

function Operator({ x, y, width = 94, height = 38, label, tone = 'teal', active = true }) {
  return <g className="tf-object" opacity={active ? 1 : .48}>
    <rect x={x} y={y} width={width} height={height} rx="8" fill="#142d3a" stroke={tones[tone]} strokeOpacity={active ? .85 : .4} />
    {text(x + width / 2, y + height / 2 + 6, label)}
  </g>
}

function BlockSpine({ frame, id, phase }) {
  const post = frame.placement === 'post'
  const attention = frame.stage < 2 || frame.stage >= 7
  const ffn = frame.stage >= 2 && frame.stage <= 4 || frame.stage >= 7
  return <g data-norm-placement={frame.placement}>
    <rect className="tf-panel" x="18" y="20" width="171" height="394" rx="16" />
    {text(103, 46, '1 Transformer層', 'tf-dim')}
    <Wire id={id} d="M53 60V181" active phase={phase} tone="coral" />
    <Wire id={id} d={post ? 'M53 194V202' : 'M53 194V345'} active phase={phase} tone="coral" />
    {post && <><Wire id={id} d="M53 228V345" active phase={phase} tone="coral" /><Operator x={24} y={201} width={60} height={27} label="Norm" tone="violet" /></>}
    <Wire id={id} d={post ? 'M53 358V366' : 'M53 358V399'} active phase={phase} tone="coral" />
    {post && <><Operator x={24} y={365} width={60} height={27} label="Norm" tone="violet" /><Wire id={id} d="M53 392V405" active phase={phase} tone="coral" /></>}
    {[{ y: 69, label: 'Attention', active: attention }, { y: 235, label: 'FFN', active: ffn }].map(({ y, label, active }) => <g key={label}>
      <Wire id={id} d={`M53 ${y}H132V${y + 43}`} active={active || frame.stage >= 4 && frame.stage <= 6} phase={phase} tone={label === 'FFN' ? 'amber' : 'teal'} />
      {!post && <Operator x={98} y={y + 8} width={68} height={27} label="Norm" tone="violet" active={frame.stage >= 4} />}
      <Operator x={86} y={y + 44} width={92} height={37} label={label} tone={label === 'FFN' ? 'amber' : 'teal'} active={active} />
      <Wire id={id} d={`M132 ${y + 81}V${y + 99}H53V${y + 112}`} active={active || frame.stage === 4} phase={phase} tone={label === 'FFN' ? 'amber' : 'teal'} />
      <circle cx="53" cy={y + 119} r="11" fill="#243747" stroke={tones.coral} />
      {text(53, y + 125, '+')}
    </g>)}
    {text(31, 64, 'd', 'tf-dim')}
    {text(110, 402, '残差へ加算', 'tf-dim')}
  </g>
}

function AttentionDetail({ frame, id, phase }) {
  const joined = frame.stage === 1
  return <g data-block-operation={joined ? 'head-concat' : 'head-projection'}>
    {text(412, 50, '全幅の入力 X', 'tf-heading')}
    <rect x="256" y="67" width="310" height="29" rx="5" fill="#1c3546" stroke={tones.coral} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <line key={i} x1={275 + i * 39} x2={275 + i * 39} y1="72" y2="90" stroke={tones.coral} strokeOpacity=".5" />)}
    {text(590, 88, 'd', 'tf-dim')}
    {BLOCK_HEADS.map((head, i) => {
      const x = 282 + i * 129, active = frame.head === head
      return <g key={head} data-head={head} opacity={active ? 1 : .5}>
        <Wire id={id} d={`M412 96V111H${x}V130`} active phase={phase} />
        {text(x, 148, `W${head} Q/K/V`, 'tf-dim')}
        {['Q', 'K', 'V'].map((symbol, j) => <g key={symbol}>
          <rect x={x - 44 + j * 31} y="158" width="26" height="33" rx="4" fill={['#174740', '#393453', '#494031'][j]} stroke={[tones.teal, tones.violet, tones.amber][j]} />
          {text(x - 31 + j * 31, 181, symbol, 'tf-dim')}
        </g>)}
        <path d={`M${x - 31} 191V196H${x + 31}V191M${x} 191V196`} fill="none" stroke={tones.teal} strokeWidth="1.8" />
        <Wire id={id} d={`M${x} 196V201`} active phase={phase} />
        <Operator x={x - 53} y={202} width={106} height={28} label="Attention" />
        <Wire id={id} d={`M${x} 230V239`} active phase={phase} />
        <rect x={x - 43} y="240" width="86" height="27" rx="4" fill="#224945" stroke={tones.teal} />
        {text(x, 260, `head${head}`, 'tf-label')}
        {!joined && text(x, 289, '幅 d/h', 'tf-dim')}
        {joined && <Wire id={id} d={`M${x} 267V279`} active phase={phase} />}
      </g>
    })}
    {text(347, 260, '…', 'tf-dim')}{text(476, 260, '…', 'tf-dim')}
    {joined ? <>
      {BLOCK_HEADS.map((head, i) => <g key={head} data-concat-head={head} data-selected={frame.head === head}><rect x={252 + i * 106} y="280" width="102" height="22" fill={frame.head === head ? '#38736b' : '#224945'} stroke={tones.teal} opacity={frame.head === head ? 1 : .5} /><title>head{head} の出力</title></g>)}
      <Wire id={id} d="M412 302V315" active phase={phase} />
      <Operator x={363} y={316} width={98} height={26} label="Wᴼ" />
      {text(580, 298, 'd', 'tf-dim')}
    </> : <>{text(412, 318, 'Xの列を切り分ける操作ではない', 'tf-dim')}</>}
  </g>
}

function FfnDetail({ frame, id, phase }) {
  if (frame.gated) return <g data-block-operation="swiglu">
    {text(412, 52, 'x  幅d', 'tf-heading')}
    <Wire id={id} d="M412 63V83H303V101" active phase={phase} tone="amber" />
    <Wire id={id} d="M412 83H521V101" active phase={phase} tone="amber" />
    <Operator x={256} y={103} label="W₁" tone="amber" /><Operator x={474} y={103} label="W₃" tone="amber" />
    <Wire id={id} d="M303 141V159" active phase={phase} tone="amber" />
    <Operator x={256} y={161} label="Swish" tone="violet" />
    <Wire id={id} d="M521 141V215H428" active phase={phase} tone="amber" />
    <Wire id={id} d="M303 199V215H396" active phase={phase} tone="amber" />
    <circle cx="412" cy="215" r="17" fill="#3a3048" stroke={tones.violet} />{text(412, 221, '⊙')}
    {text(518, 254, 'd_ff成分の積', 'tf-dim')}
    <Wire id={id} d="M412 232V278" active phase={phase} tone="amber" />
    <Operator x={365} y={280} label="W₂" tone="amber" />
    {text(541, 306, '→ 幅d', 'tf-label')}
  </g>
  return <g data-block-operation="positionwise-ffn">
    {text(412, 50, '位置ごとに独立した変換', 'tf-heading')}
    {text(290, 91, 'd', 'tf-dim')}{text(427, 91, 'd_ff', 'tf-dim')}{text(583, 91, 'd', 'tf-dim')}
    {['t−1', 't', 't+1'].map((position, i) => <g key={position} data-position={position}>
      {text(241, 139 + i * 76, position, 'tf-dim')}
      <rect x="275" y={119 + i * 76} width="32" height="28" rx="4" fill="#284555" stroke={tones.coral} />
      <Wire id={id} d={`M312 ${133 + i * 76}H367`} active phase={phase + i * .1} tone="amber" />
      <rect x="375" y={114 + i * 76} width="107" height="38" rx="5" fill="#433927" stroke={tones.amber} />
      {text(428, 139 + i * 76, 'σ', 'tf-label')}
      <Wire id={id} d={`M490 ${133 + i * 76}H558`} active phase={phase + i * .1} tone="amber" />
      <rect x="567" y={119 + i * 76} width="32" height="28" rx="4" fill="#284555" stroke={tones.coral} />
    </g>)}
    {text(344, 107, 'W₁', 'tf-dim')}{text(526, 107, 'W₂', 'tf-dim')}
    {text(412, 332, '全位置で同じ重みを使う', 'tf-dim')}
  </g>
}

function ResidualDetail({ id, phase }) {
  return <g data-block-operation="residual-add">
    {text(410, 56, '幅dの流れを保つ', 'tf-heading')}
    <Wire id={id} d="M286 94V289" active phase={phase} tone="coral" />
    {text(286, 86, 'x', 'tf-label')}
    <Wire id={id} d="M286 122H474V145" active phase={phase} tone="violet" />
    <Operator x={427} y={146} label="Norm" tone="violet" />
    <Wire id={id} d="M474 184V204" active phase={phase} />
    <Operator x={404} y={205} width={140} label="副層の変換" />
    <Wire id={id} d="M474 243V289H303" active phase={phase} />
    <circle cx="286" cy="289" r="18" fill="#243747" stroke={tones.coral} />{text(286, 296, '+', 'tf-heading')}
    <Wire id={id} d="M286 307V334" active phase={phase} tone="coral" />
    {text(454, 330, 'x + 変換結果', 'tf-label')}
  </g>
}

function NormDetail({ frame, id, phase }) {
  if (frame.stage === 6) return <g data-block-operation="norm-placement">
    {text(413, 55, frame.placement === 'pre' ? 'Pre-LN：副層の前' : 'Post-LN：加算の後', 'tf-heading')}
    {text(413, 89, 'Normの種類は同じまま', 'tf-dim')}
    <Wire id={id} d="M272 119V263H481" active phase={phase} tone="coral" />
    {text(271, 111, 'x', 'tf-label')}
    <Wire id={id} d="M272 147H364" active phase={phase} tone="violet" />
    <Operator x={365} y={129} width={90} label={frame.placement === 'pre' ? 'Norm' : '副層'} tone={frame.placement === 'pre' ? 'violet' : 'teal'} />
    <Wire id={id} d="M455 148H499V191" active phase={phase} />
    {frame.placement === 'pre' && <Operator x={453} y={192} label="副層" />}
    <Wire id={id} d={frame.placement === 'pre' ? 'M499 230V246' : 'M499 191V246'} active phase={phase} />
    <circle cx="499" cy="263" r="17" fill="#243747" stroke={tones.coral} />{text(499, 269, '+')}
    <Wire id={id} d="M499 280V301" active phase={phase} tone="violet" />
    {frame.placement === 'post' ? <Operator x={454} y={302} width={90} label="Norm" tone="violet" /> : text(499, 330, '出力', 'tf-label')}
  </g>
  return <g data-block-operation="rmsnorm">
    {text(412, 54, '同じ位置のベクトル x', 'tf-heading')}
    <Wire id={id} d="M294 91V265" active phase={phase} tone="coral" />
    <Wire id={id} d="M294 109H393" active phase={phase} tone="violet" />
    <Operator x={395} y={90} width={191} label="二乗 → 成分の平均" tone="violet" />
    <Wire id={id} d="M490 128V148" active phase={phase} tone="violet" />
    <Operator x={409} y={150} width={161} label="+ ε → 平方根" tone="violet" />
    <Wire id={id} d="M490 188V224H412V244" active phase={phase} tone="violet" />
    <Wire id={id} d="M294 265H362" active phase={phase} tone="coral" />
    <Operator x={365} y={246} width={94} label="割る" tone="violet" />
    <Wire id={id} d="M459 265H491" active phase={phase} tone="violet" />
    <Operator x={493} y={246} width={89} label="⊙ g" tone="violet" />
    {text(412, 320, '平均は引かない・成分別のgを保持', 'tf-dim')}
  </g>
}

function CountDetail({ frame }) {
  const terms = frame.parameters, total = frame.stage === 8
  return <g data-block-operation={total ? 'model-count' : 'layer-count'}>
    {text(412, 53, terms.assumptions, 'tf-label')}
    {text(412, 83, '重みの個数（概算）', 'tf-dim')}
    <rect x="234" y="106" width="119" height="54" rx="7" fill="#174740" stroke={tones.teal} />
    <rect x="359" y="106" width="237" height="54" rx="7" fill="#433927" stroke={tones.amber} />
    {text(294, 139, `${terms.attention}d²`, 'tf-heading')}{text(478, 139, `${terms.ffn}d²`, 'tf-heading')}
    {text(294, 185, 'Q/K/V/O', 'tf-dim')}{text(478, 185, 'W₁・W₂', 'tf-dim')}
    {total ? <>
      {text(412, 224, `× L → ${terms.layer}Ld²`, 'tf-heading')}
      <rect x="259" y="247" width="307" height="43" rx="8" fill="#302e48" stroke={tones.violet} />
      {text(412, 274, `+ ${terms.vocabulary === 1 ? '' : terms.vocabulary}Vd　${frame.tying === 'tied' ? '重み共有あり' : '重み共有なし'}`)}
    </> : <>
      {text(412, 235, `1層 ≈ ${terms.layer}d²`, 'tf-heading')}
      {text(412, 277, 'FFNが本体の 2/3', 'tf-label')}
    </>}
    {text(412, 327, terms.omitted, 'tf-dim')}
  </g>
}

function Inventory({ frame }) {
  const width = 386 / frame.weights.length
  return <g data-weight-inventory={frame.gated ? 'swiglu' : 'basic'}>
    {frame.weights.map((weight, index) => <g key={weight.id}>
      <rect x={218 + index * width} y="366" width={width - 5} height="36" rx="5" fill={weight.family === 'attention' ? '#173b39' : '#3a3226'} stroke={weightTone(weight)} strokeOpacity=".7" />
      {text(218 + index * width + (width - 5) / 2, 391, weight.label)}
      <title>{`${weight.label}: ${weight.rows} × ${weight.columns}`}</title>
    </g>)}
    {text(412, 421, frame.gated ? '重み：Q/K/V/O ＋ W₁/W₂/W₃' : '重み：Q/K/V/O ＋ W₁/W₂', 'tf-dim')}
  </g>
}

export function TransformerBlock({ children }) {
  const [head, setHead] = useState('i'), [placement, setPlacement] = useState('pre'), [tying, setTying] = useState('tied')
  const stages = BLOCK_STAGES.map((item, index) => index === 8 ? { ...item, formula: `N ≈ 12Ld² + ${tying === 'tied' ? '' : '2'}Vd（${tying === 'tied' ? '共有あり' : '共有なし'}）` } : item)
  return <ReadingFigure diagramId="transformer-block" title="Transformerブロックと重みの内訳" eyebrow="TRANSFORMER / BLOCK & WEIGHTS" className="tf-block" stages={stages}
    renderScene={({ stage, phase, id }) => {
      const frame = blockFrame(stage, { head, placement, tying })
      const selection = stage <= 1 ? `注目する出力はhead ${head}。` : stage === 6 ? `表示は${placement === 'pre' ? 'Pre-LN' : 'Post-LN'}。` : stage === 8 ? `重みの共有${tying === 'tied' ? 'あり' : 'なし'}。` : ''
      return <SceneBase id={id} className="aw-scene tf-scene tf-block-scene" title={frame.title} detail={`${frame.detail}${selection}`} data-block-stage={stage}>
        <BlockSpine frame={frame} id={id} phase={phase} />
        <rect className="tf-panel" x="203" y="20" width="419" height="328" rx="16" />
        {stage <= 1 ? <AttentionDetail frame={frame} id={id} phase={phase} />
          : stage <= 3 ? <FfnDetail frame={frame} id={id} phase={phase} />
            : stage === 4 ? <ResidualDetail id={id} phase={phase} />
              : stage <= 6 ? <NormDetail frame={frame} id={id} phase={phase} /> : <CountDetail frame={frame} />}
        <Inventory frame={frame} />
      </SceneBase>
    }}
    renderControls={({ ready, stage }) => <div className="tf-controls">
      {stage <= 1 && <Select label="注目するヘッド" value={head} onChange={setHead} ready={ready}>{BLOCK_HEADS.map(item => <option key={item} value={item}>head {item}</option>)}</Select>}
      {stage === 6 && <Select label="Normの配置" value={placement} onChange={setPlacement} ready={ready}><option value="pre">Pre-LN：副層の前</option><option value="post">Post-LN：加算の後</option></Select>}
      {stage === 8 && <Select label="重みの共有" value={tying} onChange={setTying} ready={ready}><option value="tied">共有あり</option><option value="untied">共有なし</option></Select>}
    </div>}
    footnote="構造と寸法の模式図です。線の動きは処理時間を表しません。計数は基本2層MLP・d_ff = 4dに限った概算です。">{children}</ReadingFigure>
}
