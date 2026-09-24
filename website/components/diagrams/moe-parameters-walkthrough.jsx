'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { PARAMETER_STAGES, PARAMETER_LAYOUTS, PARAMETER_CHECKS, parametersFrame } from '../../lib/moe-parameters-model.mjs'
import './moe-parameters.css'

function DeviceBoundaries({ frame }) {
  if (!frame.showDevices) return null
  return <g data-device-layout={frame.layout}>
    {frame.layout === 'single' ? <>
      <rect x="17" y="136" width="606" height="250" rx="10" />
      <text x="320" y="130" textAnchor="middle" className="cd-small">単一デバイス</text>
    </> : <>
      <rect x="17" y="136" width="301" height="250" rx="10" />
      <rect x="322" y="136" width="301" height="250" rx="10" />
      <text x="168" y="130" textAnchor="middle" className="cd-small">デバイス1（入力側）</text>
      <text x="472" y="130" textAnchor="middle" className="cd-small">デバイス2</text>
    </>}
  </g>
}

function ParametersScene({ id, phase, stage, layout, check }) {
  const frame = parametersFrame(stage, { phase, layout, check })
  const current = frame.stage, load = frame.check === 'load'
  const communication = frame.check === 'communication'
  const resident = current === 0 || frame.check === 'resident'
  const active = current > 0 && frame.check !== 'resident' && !load
  const flow = current >= 1 && (current < 5 || communication)
  const sending = current === 3 || communication, returning = current === 4 || communication
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene moe-scene moe-parameters-scene"
    data-parameters-stage={current} data-parameters-layout={frame.layout} data-parameters-check={frame.check || 'none'}
    data-transfer-direction={frame.direction || 'none'} data-cross-device-transfers={frame.crossDeviceTransfers}
    data-transferred-weights={frame.transferredWeightCount} data-quality-judgment="none">
    <text x="320" y="30" textAnchor="middle" className="moe-heading">総量と、1トークンで使う量</text>
    <g data-shared-part="true" data-resident="true">
      <rect x={frame.shared.x} y={frame.shared.y} width={frame.shared.width} height={frame.shared.height} className="mp-shared" stroke={resident ? tones.violet : tones.teal} strokeWidth="1.8" rx="8" />
      <text x="138" y="72" textAnchor="middle">共有部分 S</text>
      <text x="138" y="93" textAnchor="middle" className="cd-small">専門家以外を含む</text>
    </g>
    <text x="286" y="72" className={resident ? 'mp-emphasis' : ''}>総 ≈ S + 8 × P</text>
    <text x="286" y="98" className={active ? 'mp-emphasis' : ''}>使用 ≈ S + 2 × P</text>
    <DeviceBoundaries frame={frame} />
    {frame.experts.map(expert => {
      const emphasized = resident || (active && expert.selected)
      const color = resident ? tones.violet : emphasized ? tones.teal : '#778d9b'
      return <g key={expert.index} data-expert-weight={expert.index} data-resident="true" data-selected={expert.selected ? 'true' : 'false'} data-device={expert.device}>
        <rect x={expert.x} y={expert.y} width={expert.width} height={expert.height} rx="7" fill={emphasized ? '#17313e' : '#142332'} stroke={color} strokeWidth={emphasized ? 2 : 1.2} />
        <text x={expert.x + expert.width / 2} y={expert.y + 26} textAnchor="middle">E{expert.index + 1}</text>
        <text x={expert.x + expert.width / 2} y={expert.y + 49} textAnchor="middle" className="cd-small">重み</text>
      </g>
    })}
    {flow && <>
      {frame.routes.map(route => <g key={route.expertIndex} data-parameter-route={route.expertIndex} data-token-id={route.tokenId} data-remote={route.remote ? 'true' : 'false'}>
        {(current !== 4 || communication) && <Wire id={id} d={route.dispatchPath} active={sending} phase={phase} tone="teal" />}
        {(current !== 3 || communication) && <Wire id={id} d={route.returnPath} active={returning} phase={phase} tone="violet" />}
      </g>)}
      <g data-token-source={frame.source.tokenId}>
        <rect x={frame.source.x} y={frame.source.y} width={frame.source.width} height={frame.source.height} rx="8" fill="#12313b" stroke={tones.teal} strokeWidth="1.5" />
        <text x="102" y="285" textAnchor="middle">トークン{frame.source.tokenId}</text>
        <text x="102" y="307" textAnchor="middle" className="cd-small">入力表現 x</text>
      </g>
      <g data-token-sum={frame.sum.tokenId} data-gate-applications={frame.sum.gateApplications}>
        <rect x={frame.sum.x} y={frame.sum.y} width={frame.sum.width} height={frame.sum.height} rx="8" fill="#24283e" stroke={tones.violet} strokeWidth="1.5" />
        <text x="231" y="344" textAnchor="middle">{frame.sum.tokenId}の合算</text>
        <text x="231" y="367" textAnchor="middle" className="cd-small">Σ gᵢ Eᵢ(x)</text>
      </g>
      {(current === 3 || current === 4) && <text x="360" y="250" textAnchor="middle" className="cd-small">{current === 3 ? '送出：Aの表現 x' : '返送：E₂(x)、E₆(x)'}</text>}
      {frame.transfers.map(transfer => <circle key={`${transfer.expertIndex}-${transfer.direction}`} cx={transfer.point.x} cy={transfer.point.y} r="5" fill={transfer.direction === 'dispatch' ? tones.teal : tones.violet}
        data-payload={transfer.payload} data-token-id={transfer.tokenId} data-payload-expert={transfer.expertIndex} />)}
      {frame.showDevices && <text x="471" y="371" textAnchor="middle" className="cd-small">{frame.layout === 'single' ? '全経路がデバイス内' : 'E6の経路はデバイス間'}</text>}
    </>}
    {load && <g data-batch-load="token">
      <text x="320" y="248" textAnchor="middle" className="cd-small">各専門家への割当て数</text>
      {frame.experts.map(expert => <g key={expert.index} data-expert-load={expert.index} data-load-count={expert.load}>
        <rect x={expert.x + 17} y={316 - expert.load * 14} width="26" height={expert.load * 14} rx="3" fill={expert.load ? tones.amber : 'none'} />
        <path d={`M${expert.x + 10} 316H${expert.x + 50}`} stroke="#9aacb8" />
        <text x={expert.x + 30} y="341" textAnchor="middle">{expert.load}</text>
      </g>)}
      <text x="320" y="372" textAnchor="middle" className="cd-small">0は割当てなし。補助損失で直ちに並べ替えない</text>
    </g>}
    {!flow && !load && <>
      <text x="320" y="274" textAnchor="middle">{resident ? '非選択の6専門家も、重みを保持' : 'Aの計算経路は、E2とE6'}</text>
      <text x="320" y="312" textAnchor="middle" className="cd-small">{resident ? '重み量の図。実VRAM容量は示さない' : '2/8は専門家部分の比。全モデルの25%ではない'}</text>
    </>}
    <text x="320" y="412" textAnchor="middle" className="mp-caption">{current === 5 ? frame.checkCaption : [
      'Pは1専門家分のパラメータ数。全8専門家を保持',
      '使う経路を選んでも、他の重みは消えない',
      '境界は配置の違い。重みを移動する操作ではない',
      '選択した入力表現だけを送る',
      '結果を元のAへ戻し、ゲート重みで一度合算'
    ][current]}</text>
  </SceneBase>
}

export function MoEParameters({ children }) {
  const [layout, setLayout] = useState('distributed')
  const [check, setCheck] = useState('resident')
  const stages = PARAMETER_STAGES.map((_, stage) => parametersFrame(stage, { layout, check }))
  return <ReadingFigure diagramId="moe-parameters-communication" title="保持・使用する重みと通信" eyebrow="MoE / PARAMETERS & COMMUNICATION"
    stages={stages} className="moe-walkthrough"
    renderScene={state => <ParametersScene {...state} layout={layout} check={check} />}
    renderControls={({ ready, stage }) => stage >= 2 && stage <= 4 ? <div className="moe-controls">
      <Select label="重みの配置" value={layout} onChange={setLayout} ready={ready}>
        {PARAMETER_LAYOUTS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : stage === 5 ? <div className="moe-controls">
      <Select label="確認する対象" value={check} onChange={setCheck} ready={ready}>
        {PARAMETER_CHECKS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
    </div> : null}
    footnote="8専門家から2つを使う模式図。重みを保持したまま、選択した入力表現と結果を送ります。共有部分は共有専門家を意味しません。実測の速度・VRAM容量・費用は計算していません。">{children}</ReadingFigure>
}
