'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { ROUTING_STAGES, TOKEN_IDS, routingFrame } from '../../lib/moe-routing-model.mjs'

const expertX = expert => 58 + expert * 75
const coefficient = value => value.toFixed(3)
const expression = terms => terms.length ? terms.map(term => `${coefficient(term.weight)} E${term.expert + 1}(x${term.tokenId})`).join(' + ') : '0'

function Gate({ frame, id }) {
  const all = frame.stage === 1, maximum = Math.max(...frame.weights)
  return <g data-gate-normalization="all-experts">
    <text x="320" y="25" textAnchor="middle" className="moe-heading">1トークンの、8つのゲート</text>
    <rect x="28" y="47" width="97" height="42" rx="8" fill="#1b3542" stroke={tones.teal} />
    <text x="76" y="74" textAnchor="middle">入力 xA</text>
    <Wire id={id} d="M132 68h97" active phase={frame.phase} />
    <rect x="236" y="47" width="174" height="42" rx="8" fill="#24304c" stroke={tones.violet} />
    <text x="323" y="74" textAnchor="middle">ルータ → softmax</text>
    {frame.weights.map((weight, expert) => {
      const x = expertX(expert), selected = frame.active[expert], height = weight / maximum * 64
      return <g key={expert} data-gate-expert={expert} data-gate-weight={weight}>
        <Wire id={id} d={`M323 94v17H${x}v24`} active={all || selected} phase={frame.phase} tone="violet" />
        <rect x={x - 21} y={204 - height} width="42" height={height} rx="3" fill={all || selected ? '#419d91' : '#26374a'} />
        <text x={x} y="225" textAnchor="middle" className="moe-small">{coefficient(weight)}</text>
      </g>
    })}
    <text x="630" y="132" textAnchor="end" className="moe-small">g</text>
  </g>
}

function Batch({ frame }) {
  const capacity = frame.stage === 6, expertChoice = frame.choice === 'expert'
  return <g data-selection-choice={frame.choice} data-batch-mask={frame.batch.mask.map(row => row.map(Number).join('')).join(':')}>
    <text x="320" y="25" textAnchor="middle" className="moe-heading">{capacity ? '容量1：A → B → C → Dの順に受理' : expertChoice ? '列から選ぶ：各専門家が1トークン' : '行から選ぶ：各トークンが2専門家'}</text>
    <text x="320" y="51" textAnchor="middle" className="moe-small">{capacity ? '赤い×は超過した経路。残る経路は通す' : '同じゲート値を保持し、囲まれたセルだけを選択'}</text>
    {frame.batch.weights.map((weights, token) => <g key={token} data-batch-token={TOKEN_IDS[token]} data-selected-count={frame.batch.counts[token]}>
      {capacity && frame.selectedToken === token && <rect x="1" y={64 + token * 37} width="637" height="34" rx="5" fill="#4e4027" opacity=".5" />}
      <text x="13" y={87 + token * 37} textAnchor="middle">{TOKEN_IDS[token]}</text>
      {weights.map((weight, expert) => {
        const selected = frame.batch.mask[token][expert], dropped = capacity && frame.capacity.dropped[token][expert]
        const accepted = capacity && frame.capacity.accepted[token][expert], x = expertX(expert), y = 67 + token * 37
        return <g key={expert} data-batch-expert={expert} data-selected={selected} data-dropped={dropped} data-accepted={accepted}>
          <rect x={x - 31} y={y} width="62" height="28" rx="4" fill={dropped ? '#402b36' : selected ? '#16483f' : '#152335'} stroke={dropped ? tones.coral : selected ? tones.teal : '#3e4b60'} strokeWidth={selected ? 2 : 1} strokeDasharray={selected ? undefined : '2 3'} />
          <text x={x} y={y + 20} textAnchor="middle" className="moe-small">{coefficient(weight)}</text>
          {dropped && <path d={`M${x - 24} ${y + 4}l48 20m-48 0 48-20`} stroke={tones.coral} strokeWidth="2" />}
        </g>
      })}
      <text x="633" y={87 + token * 37} textAnchor="middle" className="moe-small">{capacity ? frame.capacity.accepted[token].filter(Boolean).length : frame.batch.counts[token]}</text>
    </g>)}
    <text x="320" y="231" textAnchor="middle" className="moe-small">{capacity ? `選択中：トークン${frame.tokenId}　／　右端は受理された経路数` : '行：トークン　／　列：専門家　／　右端：選択数'}</text>
  </g>
}

function Experts({ frame }) {
  const batchMode = frame.stage >= 4
  return <g>{Array.from({ length: 8 }, (_, expert) => {
    const active = batchMode ? frame.batch.loads[expert] > 0 : frame.active[expert], x = expertX(expert)
    return <g key={expert} data-expert-id={expert} data-expert-selected={active}>
      <rect x={x - 31} y="246" width="62" height="44" rx="7" fill={active ? '#173d45' : '#152335'} stroke={active ? tones.teal : '#48536a'} />
      <text x={x} y="265" textAnchor="middle">E{expert + 1}</text>
      <text x={x} y="284" textAnchor="middle" className="moe-small">FFN</text>
    </g>
  })}</g>
}

function Output({ frame, id }) {
  const capacity = frame.stage === 6, expertTerms = frame.terms.filter(term => term.kind === 'expert')
  return <g data-output-experts={expertTerms.map(term => term.expert).join(',')} data-residual-count={capacity ? 1 : 0}>
    {frame.active.map((selected, expert) => selected && <Wire key={expert} id={id} d={`M${expertX(expert)} 297v24H${capacity ? 387 : 320}v20`} active phase={frame.phase} />)}
    {capacity && frame.capacity.dropped[frame.selectedToken].map((dropped, expert) => dropped && <g key={expert} data-stopped-route={expert}>
      <path d={`M${expertX(expert)} 296v18m-5 0 10 10m-10 0 10-10`} stroke={tones.coral} fill="none" strokeWidth="2" />
    </g>)}
    {capacity ? <>
      <rect x="25" y="347" width="96" height="41" rx="8" fill="#263047" stroke={tones.violet} />
      <text x="73" y="374" textAnchor="middle" data-residual-token={frame.tokenId}>x{frame.tokenId}</text>
      <text x="147" y="374" textAnchor="middle">+</text>
      <rect x="173" y="347" width="438" height="41" rx="8" fill="#163e3e" stroke={tones.teal} />
      <text x="392" y="373" textAnchor="middle" className="moe-small">{expression(expertTerms)}</text>
      <text x="320" y="418" textAnchor="middle" className="moe-small">{expertTerms.length ? '残った枝の寄与に、残差を1回だけ足す' : '全経路が超過したこのトークンは、残差だけを通る'}</text>
    </> : <>
      <rect x="53" y="347" width="534" height="41" rx="8" fill="#173e42" stroke={tones.teal} />
      <text x="320" y="373" textAnchor="middle">{frame.stage === 3 ? `y = ${expression(expertTerms)}` : '選択したFFNの結果 → 重み付き合算 → y'}</text>
      <text x="320" y="418" textAnchor="middle" className="moe-small">{frame.stage === 1 ? '全8成分の和 = 1（表示値は丸め）' : frame.stage === 2 ? `選択した重みの和 = ${coefficient(frame.selectedWeightSum)}　／　再正規化しない` : 'y はMoE枝の出力。この後、残差へ渡す'}</text>
    </>}
  </g>
}

function BatchFooter({ frame, id }) {
  if (frame.stage === 5) return <g data-load-counts={frame.batch.loads.join(',')}>
    {frame.batch.loads.map((count, expert) => <g key={expert}>
      <rect x={expertX(expert) - 20} y={380 - count * 18} width="40" height={Math.max(1, count * 18)} fill={count ? '#d1a967' : '#425169'} rx="2" />
      <text x={expertX(expert)} y="405" textAnchor="middle">{count}</text>
    </g>)}
    <text x="320" y="424" textAnchor="middle" className="moe-small">割当て経路数：4 + 1 + 3 = 8</text>
  </g>
  return <g data-load-counts={frame.batch.loads.join(',')}>
    {frame.batch.loads.map((count, expert) => <text key={expert} x={expertX(expert)} y="317" textAnchor="middle">{count}</text>)}
    {frame.stage === 7 ? <>
      <Wire id={id} d="M320 323v18" active phase={frame.phase} tone="amber" />
      <rect x="100" y="347" width="440" height="45" rx="8" fill="#382f23" stroke={tones.amber} />
      <text x="320" y="376" textAnchor="middle">L主目的 + α L負荷分散</text>
      <text x="320" y="418" textAnchor="middle" className="moe-small">学習の目的を加えても、今の割当ては変わらない</text>
    </> : <>
      <rect x="109" y="348" width="422" height="42" rx="8" fill="#17343b" stroke={tones.teal} />
      <text x="320" y="375" textAnchor="middle">データ：トークン → FFN → 合算</text>
      <text x="320" y="418" textAnchor="middle" className="moe-small">{frame.choice === 'expert' ? 'バッチ単位の方式。逐次生成への置換を示さない' : '上位2個は各行。専門家ごとの割当て数は異なる'}</text>
    </>}
  </g>
}

function RoutingScene({ phase, id, choice, token }) {
  const frame = routingFrame(phase, { choice, token })
  return <SceneBase id={id} className="aw-scene moe-scene" title={frame.title} detail={`${frame.detail} 選択方式: ${frame.choice}。対象: トークン${frame.tokenId}。`} data-routing-stage={frame.stage} data-selected-token={frame.tokenId}>
    {frame.stage < 4 ? <Gate frame={frame} id={id} /> : <Batch frame={frame} />}
    <Experts frame={frame} />
    {frame.stage < 4 || frame.stage === 6 ? <Output frame={frame} id={id} /> : <BatchFooter frame={frame} id={id} />}
  </SceneBase>
}

export function MoERouting({ children }) {
  const [choice, setChoice] = useState('token'), [token, setToken] = useState(0)
  return <ReadingFigure diagramId="moe-routing-load" title="MoEのルーティングと負荷" eyebrow="MOE / ROUTING & LOAD"
    stages={ROUTING_STAGES} className="moe-walkthrough" renderScene={state => <RoutingScene {...state} choice={choice} token={token} />}
    renderControls={({ ready, stage }) => stage === 4 ? <div className="moe-controls"><Select label="選ぶ方式" value={choice} onChange={setChoice} ready={ready}>
      <option value="token">token-choice：各行から2個</option><option value="expert">expert-choice：各列から1個</option>
    </Select></div> : stage === 6 ? <div className="moe-controls"><Select label="同じバッチのトークン" value={String(token)} onChange={value => setToken(Number(value))} ready={ready}>
      <option value="0">A：両経路を受理</option><option value="1">B：片経路が超過</option><option value="2">C：両経路が超過</option>
    </Select></div> : null}
    footnote="説明用のゲート値と割当て。FFNの内部計算・訓練・実性能は再現していません。容量の場面は経路単位で超過を処理する一方式です。">{children}</ReadingFigure>
}
