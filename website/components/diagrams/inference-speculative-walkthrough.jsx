'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { SPECULATIVE_TOKENS, SPECULATIVE_CASES, SPECULATIVE_STAGES, speculativeFrame } from '../../lib/inference-speculative-model.mjs'
import './inference-speculative.css'

const textOf = tokens => tokens.map(token => token.value).join('')
const probability = value => {
  if (Math.abs(value - 1 / 3) < 1e-10) return '1/3'
  if (Math.abs(value - 2 / 3) < 1e-10) return '2/3'
  if (Math.abs(value - .25) < 1e-10) return '1/4'
  if (Math.abs(value - .5) < 1e-10) return '1/2'
  return Number(value.toFixed(3)).toString()
}
const statuses = { accepted: '採用', rejected: '棄却', discarded: '破棄' }
const statusTone = status => status === 'accepted' ? tones.teal : status === 'rejected' ? tones.coral : '#9daebd'

function Token({ token, x, y, status, width = 66, height = 52 }) {
  return <g data-occurrence-id={token.occurrenceId} data-token-id={token.tokenId} data-token-origin={token.origin}
    data-token-status={status || 'candidate'} opacity={status === 'discarded' ? .52 : 1}>
    <rect x={x} y={y} width={width} height={height} rx="8" className="sp-token" stroke={status ? statusTone(status) : tones.amber} strokeWidth="2" />
    <text x={x + width / 2} y={y + height / 2 + 9} textAnchor="middle" className="sp-symbol">{token.value}</text>
    {status === 'rejected' && <path d={`M${x + 5} ${y + height - 5}L${x + width - 5} ${y + 5}`} stroke={tones.coral} strokeWidth="2" />}
  </g>
}

function Output({ frame, y = 340, acceptedOnly = false }) {
  const suffix = acceptedOnly ? frame.visibleSuffix : frame.committedSuffix
  return <g data-output-prefix={textOf(frame.initialPrefix) + textOf(suffix)}>
    <text x="28" y={y + 34}>確定</text>
    {frame.initialPrefix.map((token, index) => <Token key={token.occurrenceId} token={token} x={106 + index * 52} y={y} width={44} status="accepted" />)}
    <text x="224" y={y + 34}>＋</text>
    {suffix.map((token, index) => <Token key={token.occurrenceId} token={token} x={262 + index * 75} y={y} width={62} status="accepted" />)}
    {!suffix.length && <text x="275" y={y + 34} className="sp-muted">まだ追加しない</text>}
  </g>
}

function Overview({ frame, id }) {
  const verifying = frame.stage === 1
  return <>
    <text x="28" y="35" className="sp-heading">確定 AB</text>
    <text x="614" y="35" textAnchor="end" className="sp-heading">{verifying ? '本命の計算をまとめる' : '下書きは順に選ぶ'}</text>
    {frame.draft.map((token, index) => {
      const x = 28 + index * 164
      return <g key={token.occurrenceId} data-draft-slot={index} data-condition-prefix={token.prefixBefore}>
        <text x={x + 74} y="80" textAnchor="middle" className="sp-muted">条件 {token.prefixBefore}</text>
        <Token token={token} x={x + 31} y={98} width={86} height={62} />
        {!verifying && <>
          <text x={x + 74} y="203" textAnchor="middle">q({token.value}) = {probability(token.proposalDistribution[token.tokenId])}</text>
          {index < 2 && <Wire id={id} d={`M${x + 120} 129H${x + 183}`} active phase={frame.phase} tone="amber" />}
        </>}
        {verifying && <>
          <Wire id={id} d={`M${x + 74} 163V229`} active phase={frame.phase} />
          <rect x={x} y="239" width="148" height="100" rx="9" className="sp-panel" />
          <text x={x + 74} y="268" textAnchor="middle">検証{index + 1}</text>
          <text x={x + 74} y="299" textAnchor="middle">p({token.value})={probability(token.targetDistribution[token.tokenId])}</text>
          <text x={x + 74} y="328" textAnchor="middle" className="sp-muted">{token.prefixBefore}</text>
        </>}
      </g>
    })}
    {verifying ? <g data-bonus-condition="ABABC">
      <Wire id={id} d="M446 164V188H562V229" active phase={frame.phase} tone="violet" />
      <rect x="520" y="239" width="106" height="100" rx="9" className="sp-panel" />
      <text x="573" y="268" textAnchor="middle">追加用</text>
      <text x="573" y="299" textAnchor="middle">p</text>
      <text x="573" y="328" textAnchor="middle" className="sp-muted">ABABC</text>
      <text x="320" y="395" textAnchor="middle">採用の判断は、先頭から順に</text>
    </g> : <>
      <rect x="28" y="245" width="584" height="77" rx="10" className="sp-panel" />
      <text x="320" y="276" textAnchor="middle">ABCは、まだ候補</text>
      <text x="320" y="307" textAnchor="middle" className="sp-muted">本命の検証が終わるまで確定しない</text>
      <text x="320" y="390" textAnchor="middle">確定列は AB のまま</text>
    </>}
  </>
}

function Decisions({ frame, id }) {
  const greedy = frame.mode === 'greedy'
  return <>
    <text x="320" y="32" textAnchor="middle" className="sp-heading">{greedy ? '本命1回で検証 → 先頭から比較' : '同じprefixの p / q で判断'}</text>
    <text x="320" y="65" textAnchor="middle" className="sp-muted">{frame.modeFixtureNote}</text>
    {frame.draft.map((token, index) => {
      const x = 22 + index * 205, active = frame.focusIndex === index
      const target = SPECULATIVE_TOKENS[token.targetDistribution.indexOf(Math.max(...token.targetDistribution))]
      return <g key={token.occurrenceId} data-decision-index={index} data-condition-prefix={token.prefixBefore} data-decision-status={token.status} data-active={active ? 'true' : 'false'}>
        <rect x={x} y="89" width="186" height="236" rx="10" className="sp-panel" style={{ stroke: active ? statusTone(token.status) : '#435d72', strokeWidth: active ? 2.5 : 1 }} />
        <text x={x + 93} y="120" textAnchor="middle" className="sp-muted">条件 {token.prefixBefore}</text>
        <Token token={token} x={x + 60} y={135} status={token.status} />
        {greedy ? <>
          <text x={x + 93} y="225" textAnchor="middle">本命は {target}</text>
          <text x={x + 93} y="259" textAnchor="middle" className="sp-muted">{token.status === 'discarded' ? '判定しない' : token.status === 'accepted' ? '一致' : '最初の不一致'}</text>
        </> : <>
          <text x={x + 93} y="224" textAnchor="middle">α = {probability(token.acceptanceRate)}</text>
          <text x={x + 93} y="257" textAnchor="middle">{token.acceptanceDraw === null ? 'uは使わない' : `u = ${probability(token.acceptanceDraw)}`}</text>
        </>}
        <text x={x + 93} y="302" textAnchor="middle" fill={statusTone(token.status)}>{greedy && token.status === 'rejected' ? '置換' : statuses[token.status]}</text>
      </g>
    })}
    <Wire id={id} d="M27 334H610" active phase={frame.phase} tone="violet" />
    {greedy ? <Output frame={frame} y={354} /> : <>
      <text x="320" y="371" textAnchor="middle">α = min(1, p(x) / q(x))</text>
      <text x="320" y="407" textAnchor="middle" className="sp-muted">{frame.firstRejectedIndex === null ? '全受理。次は本命から追加する' : '最初の棄却で止まり、次に補正する'}</text>
    </>}
  </>
}

function ComparisonTable({ token }) {
  return <g data-probability-comparison={token.prefixBefore}>
    <rect x="24" y="86" width="302" height="150" rx="10" className="sp-panel" />
    {SPECULATIVE_TOKENS.map((label, i) => <text key={label} x={116 + i * 56} y="116" textAnchor="middle" className="sp-muted">{label}</text>)}
    {[['p', token.targetDistribution, 159], ['q', token.proposalDistribution, 206]].map(([label, distribution, y]) => <g key={label} data-distribution-kind={label}>
      <text x="47" y={y}>{label}</text>
      {distribution.map((value, i) => <text key={i} x={116 + i * 56} y={y} textAnchor="middle" className={i === token.tokenId ? 'sp-emphasis' : ''} data-probability-token={i} data-probability-value={value}>{probability(value)}</text>)}
    </g>)}
  </g>
}

function Correction({ frame, id }) {
  const token = frame.comparison, rejected = frame.firstRejectedIndex !== null, exit = frame.correction || frame.bonus
  return <>
    <text x="320" y="31" textAnchor="middle" className="sp-heading">同じ条件 {token.prefixBefore} で比較</text>
    <text x="320" y="65" textAnchor="middle">下書き {token.value} を{rejected ? '棄却し、後続も破棄' : '受理 → 全3個を採用'}</text>
    <ComparisonTable token={token} />
    <g data-acceptance-rate={token.acceptanceRate} data-acceptance-draw={token.acceptanceDraw}>
      <rect x="352" y="86" width="264" height="150" rx="10" className="sp-panel" />
      <text x="484" y="119" textAnchor="middle">α = min(1, p(x)/q(x))</text>
      <text x="484" y="160" textAnchor="middle">α={probability(token.acceptanceRate)}, u={probability(token.acceptanceDraw)}</text>
      <text x="484" y="207" textAnchor="middle">{rejected ? 'u ≥ α → 棄却' : 'u < α → 受理'}</text>
    </g>
    <Wire id={id} d="M318 325H583V316" active phase={frame.phase} />
    <g data-correction-prefix={frame.correction?.prefixBefore} data-residual-mass={frame.correction?.mass} data-bonus-prefix={frame.bonus?.prefixBefore}>
      <text x="28" y="271">{rejected ? '補正 R(A, B, C, D)' : `追加の条件 ${exit.prefixBefore}`}</text>
      <text x="28" y="311" className="sp-math" data-exit-distribution={exit.distribution.join(',')}>[{exit.distribution.map(probability).join(', ')}]</text>
      <text x="462" y="271" textAnchor="middle">{rejected ? '補正から' : '本命から'}</text>
      <Token token={exit.occurrence} x={552} y={260} width={62} status="accepted" />
      <text x="462" y="313" textAnchor="middle">u = {probability(exit.draw)}</text>
    </g>
    <Output frame={frame} y={342} />
    <text x="320" y="418" textAnchor="middle" className="sp-muted">{rejected ? 'R = 正規化した max(p − q, 0)' : '棄却なし。補正せず、追加1個を確定'}</text>
  </>
}

function Summary({ frame, id }) {
  return <>
    <text x="320" y="34" textAnchor="middle" className="sp-heading">{frame.mode === 'greedy' ? '貪欲：本命の選択列と一致' : '確率的：有効な p の分布を保つ'}</text>
    <text x="320" y="71" textAnchor="middle" className="sp-muted">{frame.modeFixtureNote}</text>
    <text x="28" y="122">下書き</text>
    {frame.draft.map((token, index) => <g key={token.occurrenceId}>
      <Token token={token} x={184 + index * 146} y={95} status={token.status} width={90} height={58} />
      <text x={229 + index * 146} y="186" textAnchor="middle">{frame.mode === 'greedy' && token.status === 'rejected' ? '不一致' : statuses[token.status]}</text>
    </g>)}
    <Wire id={id} d="M320 200V246" active phase={frame.phase} />
    <Output frame={frame} y={262} />
    <text x="320" y="345" textAnchor="middle">{frame.firstRejectedIndex === null ? '全受理 ＋ 本命から1個' : '先頭の採用分 ＋ 置換した1個'}</text>
    <text x="320" y="380" textAnchor="middle" className="sp-muted">{frame.mode === 'greedy' ? '同率時の選択規則も揃える' : '同じprefixの p / q と正しい補正が条件'}</text>
    <text x="320" y="414" textAnchor="middle" className="sp-muted">速度の利得は、受理率と実行コスト次第</text>
  </>
}

export function SpeculativeScene({ id, phase, mode, caseId }) {
  const frame = speculativeFrame(phase, { mode, caseId })
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene sp-scene"
    data-speculative-stage={frame.stage} data-speculative-mode={frame.mode} data-speculative-case={frame.caseId}
    data-first-rejected={frame.firstRejectedIndex ?? 'none'} data-accepted-count={frame.acceptedDraftCount}
    data-candidate-prefix={textOf(frame.initialPrefix)} data-draft-tokens={textOf(frame.draft)}
    data-committed-suffix={textOf(frame.visibleSuffix)} data-quality-judgment="none">
    {frame.stage < 2 ? <Overview frame={frame} id={id} /> : frame.stage < 4 ? <Decisions frame={frame} id={id} />
      : frame.stage === 4 ? <Correction frame={frame} id={id} /> : <Summary frame={frame} id={id} />}
  </SceneBase>
}

export function InferenceSpeculative({ children }) {
  const [mode, setMode] = useState('sampling'), [caseId, setCaseId] = useState('middle-reject')
  const stages = SPECULATIVE_STAGES.map((_, stage) => speculativeFrame(stage, { mode, caseId }))
  return <ReadingFigure diagramId="inference-speculative" title="下書きの検証と補正" eyebrow="INFERENCE / SPECULATIVE DECODING"
    className="speculative-walkthrough" stages={stages}
    renderScene={state => <SpeculativeScene {...state} mode={mode} caseId={caseId} />}
    renderControls={({ ready, stage }) => stage >= 2 ? <div className="sp-controls">
      {stage === 5 && <Select label="確認する方式" value={mode} onChange={setMode} ready={ready}>
        <option value="sampling">確率的</option><option value="greedy">貪欲</option>
      </Select>}
      <Select label="固定の経路例" value={caseId} onChange={setCaseId} ready={ready}>
        {SPECULATIVE_CASES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : null}
    footnote="4記号の説明用分布です。確率的な3例は同じ下書きとp/qで受理用uだけを変え、貪欲の3例は別の下書き分布を使います。候補の確定数を実速度や品質の保証に換算していません。">{children}</ReadingFigure>
}
