'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { TOKENIZATION_STAGES, TOKEN_VOCABULARIES, TOKEN_BOUNDARIES, TOKEN_DEPENDENCIES,
  TOKEN_MEASUREMENTS, tokenizationFrame } from '../../lib/tokenization-model.mjs'
import './tokenization.css'

function Uses() {
  return <g data-token-uses="true">
    {[['コスト', '入出力の量'], ['予算', '入る量'], ['生成', '出力の数']].map(([title, detail], index) => <g key={title}>
      <rect x={28 + index * 204} y="312" width="176" height="75" rx="10" className="tk-panel" />
      <text x={116 + index * 204} y="342" textAnchor="middle" className="tk-label">{title}</text>
      <text x={116 + index * 204} y="371" textAnchor="middle" className="tk-note">{detail}</text>
    </g>)}
  </g>
}

function History({ frame, id, phase }) {
  const historyActive = frame.stage === 6 || frame.measurement === 'history'
  return <g data-history-inclusion="true" data-includes-past-input="true" data-includes-past-output="true" data-includes-current-input="true">
    {frame.stage === 5 ? <>
      {[['estimate', '事前', '公式の手段'], ['usage', '実行後', 'usageを記録']].map(([value, title, detail], index) => <g key={value} data-measurement-step={value} data-active={frame.measurement === value ? 'true' : 'false'}>
        <rect x={28 + index * 308} y="261" width="276" height="65" rx="9" className="tk-panel" stroke={frame.measurement === value ? tones.teal : '#61798a'} strokeWidth={frame.measurement === value ? 2.4 : 1.2} />
        <text x={166 + index * 308} y="287" textAnchor="middle" className="tk-label">{title}</text>
        <text x={166 + index * 308} y="315" textAnchor="middle" className="tk-note">{detail}</text>
      </g>)}
      <text x="320" y="353" textAnchor="middle" className="tk-note">今回の入力には、履歴も含む</text>
    </> : <>
      <rect x="28" y="267" width="332" height="54" rx="9" className="tk-panel" />
      <text x="194" y="302" textAnchor="middle" className="tk-label">以前の入力＋出力</text>
      <Wire id={id} d="M194 322V359" active phase={phase} tone="violet" />
      <Wire id={id} d="M540 239V359" active phase={phase} />
      <text x="375" y="346" textAnchor="middle" className="tk-note">今回の入力</text>
    </>}
    <rect x="28" y="364" width="584" height="46" rx="8" className="tk-history" stroke={historyActive ? tones.teal : '#7d92a2'} strokeWidth={historyActive ? 2.4 : 1.2} />
    <path d="M360 365V409" stroke="#8199aa" strokeDasharray="4 4" />
    <text x="194" y="395" textAnchor="middle" className="tk-note">以前の入力＋出力</text>
    <text x="486" y="395" textAnchor="middle" className="tk-note">今回のテキスト</text>
  </g>
}

function TokenizationScene({ id, phase, stage, vocabulary, boundary, dependency, measurement }) {
  const frame = tokenizationFrame(stage, { vocabulary, boundary, dependency, measurement })
  const comparing = stage === 2, converting = stage === 1
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene tk-scene"
    data-tokenization-stage={frame.stage} data-token-vocabulary={frame.vocabulary} data-token-boundary={frame.boundary}
    data-token-count={frame.tokenCount} data-segment-count={frame.segmentCount} data-segment-unit={frame.segmentUnit}
    data-dependency-focus={frame.dependency || 'none'} data-measurement-focus={frame.measurement || 'none'}
    data-usage-measured="false" data-quality-judgment="none">
    <text x="320" y="39" textAnchor="middle" className="tk-heading">{frame.history.visible ? '今回のテキスト' : '元のテキストは同じ'}</text>
    <rect x="64" y="62" width="512" height="58" rx="9" className="tk-source" />
    <g data-source-text={frame.text}>
      {frame.characters.map(character => <text key={character.index} x={character.x} y="101" textAnchor="middle" className="tk-character" data-source-position={character.index}>{character.value}</text>)}
    </g>
    {converting ? <>
      <Wire id={id} d="M105 123V158" active phase={phase} />
      <Wire id={id} d="M535 159V123" active phase={phase} tone="violet" />
      <text x="320" y="150" textAnchor="middle" className="tk-note">テキスト ↔ 語彙AのID列</text>
    </> : <text x="320" y="150" textAnchor="middle" className="tk-note">{comparing && !frame.showTokenIds ? `${frame.segmentUnit}の境界（トークンとは別）` : `${frame.vocabularyLabel}の語片とID`}</text>}
    <g data-segmentation={frame.boundary}>
      {frame.segments.map(segment => <g key={segment.occurrenceId} data-segment-kind={segment.kind} data-segment-start={segment.start} data-segment-end={segment.end}
        data-token-id={segment.tokenId ?? undefined} data-occurrence-id={segment.occurrenceId} data-vocabulary={segment.vocabulary ?? undefined}>
        <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} rx="7" className="tk-piece" />
        <text x={segment.center} y={frame.showTokenIds ? 193 : 209} textAnchor="middle" className="tk-piece-text">{segment.piece}</text>
        {frame.showTokenIds && <text x={segment.center} y="225" textAnchor="middle" className="tk-id" data-vocabulary-id={segment.tokenId}>{segment.tokenId}</text>}
      </g>)}
    </g>
    {stage <= 2 && <>
      <text x="320" y="277" textAnchor="middle" className="tk-label">{comparing ? `${frame.segmentCount}${frame.segmentUnit}として区切る` : '説明用の語彙Aでは、2トークン'}</text>
      <Uses />
      <text x="320" y="417" textAnchor="middle" className="tk-note">{converting ? '語片をつなぐと、元の文字列に戻る' : comparing ? '文字数・語数をトークン数にしない' : '数えた量が、設計の出発点になる'}</text>
    </>}
    {stage === 3 && <>
      <text x="320" y="276" textAnchor="middle" className="tk-note">分割に関わる条件を確認</text>
      {TOKEN_DEPENDENCIES.map((item, index) => <g key={item.id} data-token-dependency={item.id} data-active={frame.dependency === item.id ? 'true' : 'false'}>
        <rect x={28 + index * 308} y="294" width="276" height="80" rx="9" className="tk-panel" stroke={frame.dependency === item.id ? tones.amber : '#61798a'} strokeWidth={frame.dependency === item.id ? 2.4 : 1.2} />
        <text x={166 + index * 308} y="325" textAnchor="middle" className="tk-label">{item.label}</text>
        <text x={166 + index * 308} y="356" textAnchor="middle" className="tk-note">{item.detail}</text>
      </g>)}
      <text x="320" y="406" textAnchor="middle" className="tk-note">言語間の倍率は、実データで確かめる</text>
    </>}
    {stage === 4 && <>
      <text x="320" y="279" textAnchor="middle" className="tk-label">{frame.vocabularyLabel}：{frame.tokenCount}トークン</text>
      <text x="320" y="315" textAnchor="middle" className="tk-note">IDから戻して、語片をつなぐ</text>
      <rect x="108" y="329" width="424" height="53" rx="9" className="tk-source" />
      <text x="320" y="367" textAnchor="middle" className="tk-character" data-reconstructed-text={frame.reconstructed}>{frame.reconstructed}</text>
      <text x="320" y="417" textAnchor="middle" className="tk-note">同じ文字列でも、語彙で個数が変わる</text>
    </>}
    {frame.history.visible && <History frame={frame} id={id} phase={phase} />}
  </SceneBase>
}

export function Tokenization({ children }) {
  const [vocabulary, setVocabulary] = useState('a')
  const [boundary, setBoundary] = useState('subword')
  const [dependency, setDependency] = useState('language')
  const [measurement, setMeasurement] = useState('estimate')
  const options = { vocabulary, boundary, dependency, measurement }
  const stages = TOKENIZATION_STAGES.map((_, stage) => tokenizationFrame(stage, options))
  return <ReadingFigure diagramId="tokenization-counting" title="分割・数え方・予算" eyebrow="TOKENIZATION / COUNTING"
    className="tokenization-walkthrough" stages={stages}
    renderScene={state => <TokenizationScene {...state} {...options} />}
    renderControls={({ ready, stage }) => {
      const controls = {
        2: { label: '比較する境界', value: boundary, change: setBoundary, items: TOKEN_BOUNDARIES },
        3: { label: '確認する条件', value: dependency, change: setDependency, items: TOKEN_DEPENDENCIES },
        4: { label: '説明用の語彙', value: vocabulary, change: setVocabulary, items: TOKEN_VOCABULARIES },
        5: { label: '確認する対象', value: measurement, change: setMeasurement, items: TOKEN_MEASUREMENTS }
      }
      const control = controls[stage]
      return control ? <div className="tk-controls"><Select label={control.label} value={control.value} onChange={control.change} ready={ready}>
        {control.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select></div> : null
    }}
    footnote="手で定義した説明用の語彙です。実BPE・実モデルの分割結果、usage、料金、言語間の倍率を測った値ではありません。IDは語彙内の値、図中の位置は出現ごとの目印です。">{children}</ReadingFigure>
}
