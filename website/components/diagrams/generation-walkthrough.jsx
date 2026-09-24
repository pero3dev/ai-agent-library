'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { GENERATION_STAGES, generationFrame } from '../../lib/generation-model.mjs'

const percent = value => `${(100 * value).toFixed(1)}%`
const tokenX = index => 68 + index * 62
const barY = index => 154 + index * 47
const joinLabels = tokens => tokens.map(token => token.label).join(' ')

function Token({ token, x, y, ghost = false, moving = false }) {
  return <g data-token-id={token.tokenId} data-occurrence-id={token.occurrenceId} data-moving-token={moving || undefined}>
    <rect x={x} y={y} width="48" height="34" rx="7" fill={ghost ? '#182737' : '#173f43'} stroke={ghost ? '#758498' : tones.teal} strokeDasharray={ghost ? '4 4' : undefined} />
    {!ghost && <text x={x + 24} y={y + 24} textAnchor="middle" className={token.label.length > 2 ? 'gen-small' : undefined}>{token.label}</text>}
  </g>
}

function Distribution({ distribution, stage }) {
  const greedy = distribution.selectionKind === 'greedy'
  return <g data-distribution-prefix={joinLabels(distribution.prefix)} data-selection-kind={distribution.selectionKind}>
    <text x="475" y="116" textAnchor="middle" className="gen-small">{greedy ? '参照分布 → 最大を選択' : stage === 4 ? '候補制限後の選択確率' : '次の候補分布'}</text>
    {distribution.rows.map((row, index) => {
      const y = barY(index), value = greedy ? row.probability : row.selectionProbability
      return <g key={row.tokenId} data-candidate={row.label} data-probability={row.probability} data-selection-probability={row.selectionProbability} data-kept={row.kept} data-selected={row.selected}>
        <text x="359" y={y + 5} textAnchor="middle">{row.label}</text>
        <rect x="380" y={y - 16} width="140" height="27" rx="4" fill="#253448" />
        <rect x="380" y={y - 16} width={value * 140} height="27" rx="4" fill={row.kept ? '#458f89' : '#425169'} />
        {stage >= 2 && row.selected && <rect x="345" y={y - 21} width="275" height="36" rx="6" stroke={tones.amber} strokeWidth="2" fill="none" />}
        <text x="610" y={y + 5} textAnchor="end" className="gen-small">{percent(value)}</text>
        {!row.kept && <path d={`M382 ${y - 10}l132 17`} stroke={tones.coral} strokeWidth="2" />}
      </g>
    })}
  </g>
}

function LoopScene({ frame, id }) {
  const { stage, loop, activeDistribution: distribution } = frame
  const prefix = stage === 4 ? distribution.prefix : loop.committedPrefix
  const moving = stage === 2, selectedIndex = loop.source.rows.findIndex(row => row.selected)
  const start = { x: 351, y: barY(selectedIndex) - 18 }, end = { x: tokenX(loop.before.length), y: 58 }
  const progress = loop.appendProgress
  return <g data-committed-prefix={joinLabels(prefix)} data-model-weights="fixed" data-append-progress={progress}>
    <text x="28" y="31" className="gen-heading">{stage === 4 ? '同じ入力で、選び方を比較' : '確定した列が、次の条件になる'}</text>
    <rect x="28" y="46" width="584" height="56" rx="10" fill="#101f31" stroke="#3b5066" />
    <text x="600" y="81" textAnchor="end" className="gen-small">{stage === 4 ? '入力 AB を固定' : '確定済みの列'}</text>
    {prefix.map((token, index) => <Token key={token.occurrenceId} token={token} x={tokenX(index)} y={58} />)}
    {moving && <Token token={{ ...loop.selected, occurrenceId: 'append-target' }} x={end.x} y={end.y} ghost />}
    <Wire id={id} d="M176 107v55" active phase={frame.phase} />
    <rect x="57" y="172" width="222" height="98" rx="13" fill="#23304b" stroke={tones.violet} />
    <text x="168" y="211" textAnchor="middle" className="gen-heading">同じモデル</text>
    <text x="168" y="242" textAnchor="middle" className="gen-small">重みは変えない</text>
    <Wire id={id} d="M284 205h42" active phase={frame.phase} tone="violet" />
    <Distribution distribution={distribution} stage={stage} />
    {moving && <Token token={loop.selected} x={start.x + (end.x - start.x) * progress} y={start.y + (end.y - start.y) * progress} moving />}
    <Wire id={id} d="M481 324v35H44V81h16" active={stage !== 1 && stage !== 4} phase={frame.phase} tone="amber" />
    <text x="295" y="350" textAnchor="middle" className="gen-small">{stage === 4 ? distribution.selectionKind === 'greedy' ? '最大の候補を選択。確信100%の意味ではない' : `温度 ${distribution.temperature} ／ top-p ${distribution.topP}` : stage === 2 ? `${loop.selected.label} を選択 → 末尾へ追加中` : stage === 3 ? '追加済みの列 → 次の候補分布' : '分布 → 1つ選択 → 末尾に追加 → 次へ'}</text>
    <text x="320" y="400" textAnchor="middle" className="gen-small">{stage === 3 ? '過去の列を保ち、続きだけを生成する' : stage === 4 ? '候補の確率を変える操作。品質の点数ではない' : '停止条件を満たすまで、この一巡を繰り返す'}</text>
  </g>
}

function ComparisonScene({ frame }) {
  const { comparison } = frame, sampling = comparison.kind === 'sampling'
  return <g data-comparison-kind={comparison.kind} data-changed-field={comparison.changedField}>
    <text x="320" y="31" textAnchor="middle" className="gen-heading">{sampling ? '同じ分布でも、選択は分かれる' : '拮抗したスコアは、わずかな差で逆転'}</text>
    <text x="320" y="66" textAnchor="middle" className="gen-small">{sampling ? '入力 AB・スコア・温度を固定。選ぶ値 u だけ変更' : '入力 AB・貪欲選択を固定。Aのスコアだけ変更'}</text>
    {[comparison.left, comparison.right].map((side, index) => {
      const y = 94 + index * 143
      return <g key={index} data-comparison-side={index} data-comparison-selected={side.selectedLabel} data-draw={side.draw}>
        <rect x="28" y={y} width="584" height="127" rx="10" fill="#111f31" stroke="#3b5066" />
        <text x="45" y={y + 28} className="gen-small">{sampling ? `u = ${side.draw.toFixed(2)}` : `A: ${side.rows[0].logit.toFixed(6)}`}</text>
        {side.rows.map((row, token) => {
          const cumulative = side.rows.slice(0, token).reduce((total, entry) => total + entry.probability, 0)
          const x = sampling ? 226 + cumulative * 324 : 226 + token * 72
          return <g key={row.tokenId} data-compare-token={row.label} data-compare-probability={row.probability}>
            <rect x={x} y={sampling ? y + 39 : y + 55 - 55 * row.probability} width={sampling ? row.probability * 324 : 45} height={sampling ? 27 : Math.max(1, 55 * row.probability)} fill={row.selected ? '#b89357' : '#438a83'} stroke="#142332" />
            <text x={sampling ? x + row.probability * 162 : x + 22} y={y + 82} textAnchor="middle">{row.label}</text>
          </g>
        })}
        {sampling && <g data-cumulative-draw={side.draw}>
          <path d={`M${226 + side.draw * 324} ${y + 25}v46`} stroke="#fff1d6" strokeWidth="2" />
          <path d={`M${220 + side.draw * 324} ${y + 24}h12l-6 9Z`} fill="#fff1d6" />
        </g>}
        <text x="46" y={y + 64}>選択 {side.selectedLabel}</text>
        <text x="45" y={y + 113} className="gen-small">次の列：{joinLabels(side.nextPrefix)} → 次の分布も分かれる</text>
      </g>
    })}
    <text x="320" y="407" textAnchor="middle" className="gen-small">{sampling ? '帯は確率の累積。uの位置にある候補を選ぶ' : '差の大きさは説明用。実機の誤差量ではない'}</text>
  </g>
}

function StoppingScene({ frame, id }) {
  const trace = frame.stopping
  return <g data-stop-reason={trace.reason} data-selected-count={trace.selectedCount} data-generated-text={trace.generatedText} data-visible-text={trace.visibleText}>
    <text x="320" y="31" textAnchor="middle" className="gen-heading">終了理由を、結果と一緒に受け取る</text>
    <text x="320" y="58" textAnchor="middle" className="gen-small">停止・配信を比べる、別の固定例</text>
    <text x="36" y="106" className="gen-small">選択した順序</text>
    {trace.selectedTokens.map((token, index) => <Token key={token.occurrenceId} token={token} x={177 + index * 66} y={83} />)}
    <Wire id={id} d="M320 126v30" active phase={frame.phase} tone="amber" />
    <rect x="115" y="165" width="410" height="61" rx="10" fill="#392e29" stroke={tones.amber} />
    <text x="320" y="202" textAnchor="middle">停止：{trace.reasonLabel}</text>
    <text x="320" y="257" textAnchor="middle" className="gen-small">{trace.reason === 'natural' ? 'EOSは終端記号。返却する文字列には含まない' : trace.reason === 'sequence' ? '条件 BC が2トークンにまたがって成立' : `選択 ${trace.selectedCount} 回で打ち切り。完了とは限らない`}</text>
    <rect x="70" y="284" width="500" height="60" rx="9" fill="#15343d" stroke={tones.teal} />
    <text x="320" y="321" textAnchor="middle">返却本文：{trace.visibleText || '空'}　→　結果の検証へ</text>
    <text x="320" y="394" textAnchor="middle" className="gen-small">{trace.reason === 'sequence' ? 'この模式図では条件文字列を除く。APIごとに確認' : '終了したことと、必要な結果が揃ったことは別'}</text>
  </g>
}

function StreamingScene({ frame, id }) {
  const stream = frame.streaming, trace = frame.stopping
  const tokens = trace.selectedTokens.slice(0, stream.selectedCount)
  return <g data-stream-step={stream.eventIndex} data-stream-generated={stream.generatedText} data-stream-visible={stream.visibleText} data-stream-pending={stream.pendingText} data-stream-finished={stream.finished}>
    <text x="320" y="31" textAnchor="middle" className="gen-heading">生成した順に、まとまりを配信する</text>
    <text x="320" y="58" textAnchor="middle" className="gen-small">停止・配信を比べる、別の固定例</text>
    <text x="39" y="99" className="gen-small">生成済み</text>
    {tokens.map((token, index) => <Token key={token.occurrenceId} token={token} x={176 + index * 65} y={75} />)}
    <rect x="154" y="146" width="415" height="58" rx="9" fill="#292a40" stroke={tones.violet} />
    <text x="361" y="182" textAnchor="middle">送信待ち：{stream.pendingText || 'なし'}</text>
    <Wire id={id} d="M362 215v54" active={!stream.finished} phase={frame.phase} />
    <text x="390" y="247" className="gen-small">{stream.chunk ? `今回のまとまり ${stream.chunk}` : '配信のタイミングを待つ'}</text>
    <text x="39" y="307" className="gen-small">受信済み</text>
    <rect x="154" y="279" width="415" height="53" rx="9" fill="#173a40" stroke={tones.teal} />
    <text x="361" y="313" textAnchor="middle">{stream.visibleText || 'まだなし'}</text>
    <text x="320" y="369" textAnchor="middle" className="gen-small">{stream.finished ? `停止：${trace.reasonLabel} ／ 順序を保って終了` : `生成の選択 ${stream.selectedCount} 回目 ／ 配信は別の区切り`}</text>
    <text x="320" y="411" textAnchor="middle" className="gen-small">通信のまとまりと1トークンは、常に同じではない</text>
  </g>
}

function GenerationScene({ phase, id, settings }) {
  const frame = generationFrame(phase, settings)
  return <SceneBase id={id} className="aw-scene generation-scene" title={frame.title} detail={frame.detail} data-generation-stage={frame.stage}>
    {frame.stage <= 4 ? <LoopScene frame={frame} id={id} /> : frame.stage === 5 ? <ComparisonScene frame={frame} /> : frame.stage === 6 ? <StoppingScene frame={frame} id={id} /> : <StreamingScene frame={frame} id={id} />}
  </SceneBase>
}

export function Generation({ children }) {
  const [temperature, setTemperature] = useState(1), [topP, setTopP] = useState(1)
  const [variation, setVariation] = useState('sampling'), [stop, setStop] = useState('natural')
  const settings = { temperature, topP, variation, stop }
  return <ReadingFigure diagramId="generation-token-loop" title="1トークンずつ、続きを生成する" eyebrow="GENERATION / TOKEN LOOP" stages={GENERATION_STAGES}
    className="generation-walkthrough" renderScene={state => <GenerationScene {...state} settings={settings} />}
    renderControls={({ ready, stage }) => stage === 4 ? <div className="generation-controls">
      <Select label="温度・選択" value={String(temperature)} onChange={value => setTemperature(Number(value))} ready={ready}><option value="0">貪欲：最大を選ぶ</option><option value="0.5">温度0.5</option><option value="1">温度1</option><option value="2">温度2</option></Select>
      <Select label="候補の範囲" value={String(topP)} onChange={value => setTopP(Number(value))} ready={ready && temperature !== 0}><option value="1">制限なし</option><option value="0.6">top-p 0.6</option><option value="0.8">top-p 0.8</option></Select>
    </div> : stage === 5 ? <div className="generation-controls"><Select label="分岐の原因" value={variation} onChange={setVariation} ready={ready}><option value="sampling">選ぶ値の差</option><option value="logit">スコアの微小差</option></Select></div>
      : stage >= 6 ? <div className="generation-controls"><Select label="停止条件" value={stop} onChange={setStop} ready={ready}><option value="natural">自然終了</option><option value="sequence">文字列 BC</option><option value="limit">選択2回の上限</option></Select></div> : null}
    footnote="A〜Dと確率は説明用の固定データです。実LLM・品質・所要時間・課金を再現するものではありません。">{children}</ReadingFigure>
}
