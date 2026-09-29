'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { PRETRAINING_DATA_STAGES, pretrainingDataFrame } from '../../lib/pretraining-data-model.mjs'

const sourceColors = { A: tones.teal, B: tones.violet, C: tones.amber, D: tones.coral }
const sourceX = index => 32 + index * 149

function Sources({ frame, y = 84 }) {
  return frame.documents.map((document, index) => <g key={document.id} data-data-document={document.id}>
    <path d={`M${sourceX(index) + 5} ${y - 5}h119v74`} fill="none" stroke={sourceColors[document.id]} strokeOpacity=".35" />
    <rect x={sourceX(index)} y={y} width="129" height="74" rx="8" fill="#142638" stroke={sourceColors[document.id]} />
    <text x={sourceX(index) + 64.5} y={y + 25} textAnchor="middle" className="pd-label">資料 {document.id}</text>
    {document.positions.map((position, j) => <g key={position.id} data-source-position={position.id} data-document-id={document.id}>
      <rect x={sourceX(index) + 15 + j * 53} y={y + 38} width="46" height="26" rx="4" fill={sourceColors[document.id]} fillOpacity=".13" />
      <text x={sourceX(index) + 38 + j * 53} y={y + 58} textAnchor="middle" className="pd-position">{position.id}</text>
    </g>)}
  </g>)
}
function Overview({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pd-heading">Dは読んだ量。中身は別に確かめる</text>
    <text x="320" y="68" textAnchor="middle" className="pd-note">元の資料：4件・8位置</text>
    <Sources frame={frame} />
    {frame.documents.map((document, index) => <Wire key={document.id} id={id} d={`M${sourceX(index) + 64.5} 166V185H320v27`} tone={['teal', 'violet', 'amber', 'coral'][index]} active phase={frame.phase + index / 4} />)}
    <rect x="182" y="219" width="276" height="51" rx="9" fill="#17323d" stroke={tones.teal} />
    <text x="320" y="251" textAnchor="middle" className="pd-label">繰り返しも含めて読む</text>
    <Wire id={id} d="M320 278v30" active phase={frame.phase} />
    <g data-count-meaning="processed-occurrences">
      <rect x="32" y="316" width="274" height="67" rx="9" fill="#153237" stroke={tones.teal} />
      <text x="170" y="344" textAnchor="middle" className="pd-label">処理出現 12</text>
      <text x="170" y="370" textAnchor="middle" className="pd-note">この例の D</text>
    </g>
    <g data-count-meaning="independent-information">
      <rect x="334" y="316" width="274" height="67" rx="9" fill="#1e263a" stroke={tones.violet} />
      <text x="471" y="344" textAnchor="middle" className="pd-label">中身・独立情報量</text>
      <text x="471" y="370" textAnchor="middle" className="pd-note">Dからは決まらない</text>
    </g>
    <text x="320" y="417" textAnchor="middle" className="pd-note" data-caveat="quantity-information">処理量 ≠ 独立な情報量</text>
  </>
}
function Reuse({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pd-heading">読むたびに出現が増える。資料は同じ</text>
    <text x="320" y="68" textAnchor="middle" className="pd-note">元資料のIDと8位置を保持</text>
    <Sources frame={frame} />
    {frame.reads.map(read => {
      const source = frame.documents.findIndex(document => document.id === read.documentId), x = 24 + read.index * 101
      return <g key={read.id}>
        <Wire id={id} d={`M${sourceX(source) + 64.5} 167C${sourceX(source) + 64.5} 202 ${x + 42} 208 ${x + 42} 242`} tone={['teal', 'violet', 'amber', 'coral'][source]} active phase={frame.phase + read.index / 6} />
        <g data-data-read={read.id} data-document-id={read.documentId} data-read-index={read.index}>
          <rect x={x} y="249" width="84" height="68" rx="7" fill="#142638" stroke={sourceColors[read.documentId]} />
          <text x={x + 42} y="273" textAnchor="middle" className="pd-position">{read.index + 1}回目</text>
          {read.occurrences.map((occurrence, j) => <g key={occurrence.id} data-processing-occurrence={occurrence.id} data-source-position-ref={occurrence.sourcePositionId} data-document-id={occurrence.documentId} data-read-index={occurrence.readIndex}>
            <rect x={x + 5 + j * 39} y="282" width="35" height="26" rx="4" fill={sourceColors[read.documentId]} fillOpacity=".17" />
            <text x={x + 22.5 + j * 39} y="302" textAnchor="middle" className="pd-position">{occurrence.sourcePositionId}</text>
          </g>)}
        </g>
      </g>
    })}
    <text x="320" y="351" textAnchor="middle" className="pd-label" data-count-equation="6-times-2">6回の読取 × 各2位置 = 12処理出現</text>
    <text x="320" y="385" textAnchor="middle" className="pd-note" data-caveat="source-positions-not-vocabulary">元資料の8位置 ≠ 語彙の種類数</text>
    <text x="320" y="418" textAnchor="middle" className="pd-note">同じA・Bを再利用。独立情報量は未判定</text>
  </>
}
function AspectIcon({ type, x, y, color }) {
  if (type === 'quality') return <g stroke={color} fill="none" strokeWidth="1.8"><rect x={x + 6} y={y - 5} width="25" height="28" rx="3" /><rect x={x} y={y} width="25" height="28" rx="3" /><path d={`M${x + 5} ${y + 9}h14m-14 7h10`} /></g>
  if (type === 'mixture') return <g>{[tones.teal, tones.violet, tones.amber, tones.coral].map((tone, i) => <rect key={tone} x={x + i * 8} y={y + 1} width="5" height="27" rx="2" fill={tone} />)}</g>
  if (type === 'reuse') return <g fill="none" stroke={color} strokeWidth="2"><path d={`M${x + 29} ${y + 10}a13 13 0 1 0-1 12m1-12v-9m0 9h-9`} /><path d={`M${x + 5} ${y + 13}h15m-15 6h10`} /></g>
  return <g stroke={color} fill="none" strokeWidth="1.8"><rect x={x - 2} y={y + 2} width="11" height="25" rx="2" /><path d={`M${x + 15} ${y - 3}v36`} strokeDasharray="3 4" /><rect x={x + 22} y={y + 2} width="11" height="25" rx="2" /></g>
}
function Aspects({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pd-heading">量のほかに、4つの設計観点</text>
    {frame.aspects.map((aspect, index) => {
      const x = 28 + index % 2 * 300, y = 65 + Math.floor(index / 2) * 144, color = [tones.teal, tones.violet, tones.amber, tones.coral][index]
      return <g key={aspect.id} data-data-aspect={aspect.id} data-emphasized={aspect.emphasized}>
        <rect x={x} y={y} width="284" height="126" rx="10" fill={aspect.emphasized ? '#1b3542' : '#122334'} stroke={color} strokeWidth={aspect.emphasized ? 2.5 : 1} strokeOpacity={aspect.emphasized ? 1 : .6} />
        <AspectIcon type={aspect.id} x={x + 17} y={y + 20} color={color} />
        <text x={x + 66} y={y + 39} className="pd-label">{aspect.label}</text>
        {aspect.lines.map((line, i) => <text key={line} x={x + 142} y={y + 77 + i * 29} textAnchor="middle" className="pd-note">{line}</text>)}
      </g>
    })}
    <text x="320" y="378" textAnchor="middle" className="pd-label" data-caveat="overfitting">過学習の可能性も確認</text>
    <text x="320" y="417" textAnchor="middle" className="pd-note" data-caveat="reuse-value">量の増加 ≠ 独立な情報の増加</text>
  </>
}
function Constraint({ id, frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="pd-heading">規模に見合う、良質なデータが要る</text>
    <text x="158" y="78" textAnchor="middle" className="pd-label">モデル規模 N</text>
    <text x="481" y="78" textAnchor="middle" className="pd-label">良質な学習データ</text>
    <g data-scale-part="model" aria-label="モデル規模を表す模式図">
      <rect x="42" y="96" width="228" height="191" rx="11" fill="#1b233b" stroke={tones.violet} />
      <rect x="61" y="115" width="190" height="153" rx="7" fill="none" stroke={tones.violet} strokeDasharray="5 5" opacity=".6" />
      {Array.from({ length: 35 }, (_, index) => <rect key={index} x={76 + index % 7 * 24} y={135 + Math.floor(index / 7) * 24} width="15" height="15" rx="2" fill={tones.violet} opacity={.3 + Math.floor(index / 7) * .1} />)}
    </g>
    <g data-scale-part="data" aria-label="量だけでなく中身を確認するデータ">
      <rect x="366" y="96" width="232" height="191" rx="11" fill="#123039" stroke={tones.teal} />
      {['量', '品質', '配合', '分離'].map((label, i) => <g key={label}><rect x={380 + i % 2 * 107} y={119 + Math.floor(i / 2) * 76} width="96" height="61" rx="7" fill="#172d3e" stroke={tones.teal} strokeOpacity=".55" /><text x={428 + i % 2 * 107} y={157 + Math.floor(i / 2) * 76} textAnchor="middle" className="pd-label">{label}</text></g>)}
    </g>
    <Wire id={id} d="M282 192h69" active tone="amber" both phase={frame.phase} />
    <path d="M158 298v18h323v-18" fill="none" stroke={tones.amber} strokeWidth="1.7" />
    <text x="320" y="348" textAnchor="middle" className="pd-label">両方の条件を確かめる</text>
    <text x="320" y="384" textAnchor="middle" className="pd-note" data-caveat="model-alone-insufficient">Nだけ増やしても、データ条件は満たせない</text>
    <text x="320" y="418" textAnchor="middle" className="pd-fine" data-caveat="no-investment-judgment">投資の可否・能力改善量は、この図では判定しない</text>
  </>
}
function DataScene({ phase, id, dataFocus }) {
  const frame = pretrainingDataFrame(phase, { dataFocus }), Content = [Overview, Reuse, Aspects, Constraint][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene pretraining-data-scene" data-pretraining-data-stage={frame.stage} data-data-focus={frame.dataFocus || 'none'} data-read-count={frame.readCount} data-source-document-count={frame.sourceDocumentCount} data-processed-token-occurrences={frame.processedTokenOccurrences} data-source-token-positions={frame.sourceTokenPositions} data-unique-vocabulary-count="unknown" data-independent-information="unknown" data-quality-score="unknown" data-learning-effect="unknown" data-investment-decision="none">
    <Content frame={frame} id={id} />
  </SceneBase>
}
export function PretrainingData({ children }) {
  const [dataFocus, setDataFocus] = useState('quality')
  return <ReadingFigure diagramId="pretraining-data" title="処理した量と、データの中身を動きで読む。" eyebrow="PRETRAINING / DATA" stages={PRETRAINING_DATA_STAGES} className="pretraining-data-walkthrough"
    renderScene={state => <DataScene {...state} dataFocus={dataFocus} />}
    renderControls={({ ready, stage }) => stage === 2 && <div className="pretraining-data-controls" data-control="data-focus"><Select label="確認するデータ観点" value={dataFocus} onChange={setDataFocus} ready={ready}><option value="quality">品質・重複</option><option value="mixture">配合</option><option value="reuse">再利用</option><option value="contamination">評価データ混入</option></Select></div>}
    footnote="4資料×2位置の説明用データです。8位置は語彙種類数ではなく、12出現は独立情報量ではありません。品質点・最適配合・学習効果は計算しません。">{children}</ReadingFigure>
}
