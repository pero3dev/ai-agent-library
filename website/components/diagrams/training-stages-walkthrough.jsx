'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { TRAINING_STAGES, trainingStagesFrame } from '../../lib/training-stages-model.mjs'

function Panel({ x, y, width, height, title, lines = [], tone = 'teal', emphasized = false, ...props }) {
  return <g {...props}>
    <rect x={x} y={y} width={width} height={height} rx="10" fill={emphasized ? '#1b3946' : '#132638'} stroke={tones[tone]} strokeWidth={emphasized ? 2 : 1} strokeOpacity={emphasized ? 1 : .55} />
    <text x={x + width / 2} y={y + 29} textAnchor="middle" className="ts-label">{title}</text>
    {lines.map((line, index) => <text key={line} x={x + width / 2} y={y + 57 + index * 25} textAnchor="middle" className="ts-note">{line}</text>)}
  </g>
}
function Weights({ frame }) {
  const { x, y, width, height } = frame.weights
  return <g data-node-id="weights" data-model-id={frame.modelId} data-parameter-values="none">
    <rect x={x} y={y} width={width} height={height} rx="13" fill="#26324b" stroke={tones.violet} strokeWidth="2" />
    <path d={`M${x + 18} ${y + 14}h22m-22 6h22M${x + width - 40} ${y + height - 18}h22m-22 6h22`} fill="none" stroke={tones.violet} strokeOpacity=".5" />
    <text x={x + width / 2} y={y + 43} textAnchor="middle" className="ts-label">モデル重み</text>
    <text x={x + width / 2} y={y + 73} textAnchor="middle" className="ts-note">学習で更新</text>
  </g>
}
function Route({ frame, id, source, target, d, tone = 'violet' }) {
  return <g data-route-source={source} data-route-target={target} data-route-effect={target === 'weights' ? 'parameter-update' : 'context-input'}>
    <Wire id={id} d={d} active phase={frame.phase} tone={tone} />
  </g>
}
function Context({ frame, id, y = 165 }) {
  return <g data-node-id="runtime-context" data-weights-updated="false">
    <text x="530" y={y} textAnchor="middle" className="ts-note">検索で得た情報</text>
    <Route frame={frame} id={id} source="retrieval" target="runtime-context" d={`M530 ${y + 8}V214`} tone="teal" />
    <Panel x={448} y={222} width={164} height={62} title="実行時の文脈" />
  </g>
}
function Overview({ frame, id }) {
  const inputs = [['text', 'テキスト', '事前学習'], ['demonstration', '指示＋模範応答', 'SFT'], ['preference', '候補の比較', '選好調整']]
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">異なる入力で、重みを更新</text>
    {inputs.map(([kind, input, method], index) => <Panel key={kind} x={28 + index * 208} y={60} width={168} height={85} title={input} lines={[method]} tone={index === 1 ? 'teal' : index === 2 ? 'amber' : 'violet'} data-data-kind={kind} />)}
    <Route frame={frame} id={id} source="text" target="weights" d="M112 152v83h121" />
    <Route frame={frame} id={id} source="demonstration" target="weights" d="M320 152v27" />
    <Route frame={frame} id={id} source="preference" target="weights" d="M528 152v83H407" />
    <text x="320" y="328" textAnchor="middle" className="ts-label">事前学習 → SFT → 選好調整</text>
    <text x="320" y="371" textAnchor="middle" className="ts-note" data-caveat="representative-order">代表構成・順序や反復は一律ではない</text>
    <text x="320" y="410" textAnchor="middle" className="ts-note">各工程で、入力と学習目的を確かめる</text>
  </>
}
function Prediction({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">直前までを条件に、次を予測</text>
    <Panel x={28} y={66} width={340} height={63} title="直前までの列（prefix）" data-data-kind="text" />
    <Panel x={440} y={66} width={172} height={63} title="次の正解" tone="amber" />
    <Wire id={id} d="M110 136v66" active phase={frame.phase} />
    <Panel x={28} y={210} width={160} height={60} title="次を予測" />
    <Wire id={id} d="M233 235h-38" active phase={frame.phase} tone="violet" />
    <Wire id={id} d="M110 277v36h418v-27" active phase={frame.phase} />
    <Wire id={id} d="M528 136v42" active phase={frame.phase} tone="amber" />
    <Panel x={448} y={186} width={164} height={98} title="正解と照合" lines={['学習の誤差']} tone="amber" />
    <Route frame={frame} id={id} source="text" target="weights" d="M441 235h-34" />
    <text x="320" y="360" textAnchor="middle" className="ts-label">予測の誤差を使って、重みを更新</text>
    <text x="320" y="407" textAnchor="middle" className="ts-note">言語・知識のパターンを学ぶ</text>
  </>
}
function Knowledge({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">知識と指示追従には、別の確認が要る</text>
    {frame.knowledgeCards.map((card, index) => <Panel key={card.id} x={20 + index * 207} y={53} width={186} height={104} title={card.title} lines={card.lines} tone={index === 0 ? 'violet' : index === 1 ? 'amber' : 'teal'} emphasized={card.emphasized} data-knowledge-card={card.id} data-emphasized={card.emphasized} />)}
    <text x="110" y="199" textAnchor="middle" className="ts-note">追加学習</text>
    <Panel x={28} y={218} width={160} height={66} title="学習データ" tone="violet" />
    <Route frame={frame} id={id} source="additional-training" target="weights" d="M195 251h38" />
    <Context frame={frame} id={id} y={199} />
    <text x="320" y="329" textAnchor="middle" className="ts-note">重みの更新と、文脈への入力は別</text>
    <text x="320" y="368" textAnchor="middle" className="ts-note" data-caveat="knowledge-coverage">最新性・未収録の社内情報は自動保証しない</text>
    <text x="320" y="410" textAnchor="middle" className="ts-note">必要な事実は、検証済みの情報源と照合</text>
  </>
}
function Demonstrations({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">模範となる入出力から追加学習</text>
    <Panel x={28} y={67} width={252} height={94} title="指示 ＋ 模範応答" lines={['望ましい入出力の組']} data-data-kind="demonstration" />
    <text x="470" y="114" textAnchor="middle" className="ts-label">指示チューニング</text>
    <text x="470" y="147" textAnchor="middle" className="ts-note">SFT</text>
    <Route frame={frame} id={id} source="demonstration" target="weights" d="M152 168v66h81" />
    <Wire id={id} d="M407 235h34" active phase={frame.phase} />
    <Panel x={448} y={186} width={164} height={98} title="形式・振る舞い" lines={['応答を調整']} />
    <text x="320" y="334" textAnchor="middle" className="ts-label" data-caveat="new-facts">新しい事実も学びうる</text>
    <text x="320" y="374" textAnchor="middle" className="ts-note">学習効率・誤答への影響は</text>
    <text x="320" y="408" textAnchor="middle" className="ts-note">データと手法に依存する</text>
  </>
}
function Evaluation({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">学習と検索は、入る場所が違う</text>
    <Panel x={28} y={64} width={188} height={94} title="追加学習" lines={['データと手法を選ぶ']} tone="violet" />
    <Route frame={frame} id={id} source="additional-training" target="weights" d="M122 165v70h111" />
    <Panel x={448} y={64} width={164} height={70} title="検索" />
    <Context frame={frame} id={id} />
    {frame.evaluationRows.map((row, index) => <g key={row.id} data-evaluation-row={row.id} data-emphasized={row.emphasized}>
      <rect x={28 + index * 306} y="305" width="278" height="48" rx="8" fill={row.emphasized ? '#1b3946' : '#132638'} stroke={row.emphasized ? tones.teal : '#68849b'} strokeWidth={row.emphasized ? 2 : 1} />
      <text x={167 + index * 306} y="336" textAnchor="middle" className="ts-label">{row.label}</text>
    </g>)}
    <text x="320" y="383" textAnchor="middle" className="ts-note">別に評価 ／ 最新性・出典・削除・権限も確認</text>
    <text x="320" y="417" textAnchor="middle" className="ts-note" data-caveat="closed-book-qa">対象QAの報告 ≠ 全FTで新知識を学べない</text>
  </>
}
function Preference({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="ts-heading">候補の比較が、学習データになる</text>
    <Panel x={28} y={66} width={164} height={53} title="応答候補 A" tone="amber" />
    <Panel x={28} y={133} width={164} height={53} title="応答候補 B" tone="amber" />
    <Wire id={id} d="M199 93h32" active phase={frame.phase} tone="amber" />
    <Wire id={id} d="M199 160h18v-34h14" active phase={frame.phase} tone="amber" />
    <Panel x={238} y={66} width={164} height={90} title="人間 / AI" lines={['候補を比較']} tone="amber" />
    <Wire id={id} d="M409 111h32" active phase={frame.phase} tone="amber" />
    <Panel x={448} y={66} width={164} height={90} title="選好データ" lines={['比較を集める']} tone="amber" data-data-kind="preference" />
    <path d="M530 163v11h-12v13m12-13h74v79h-8" fill="none" stroke={tones.violet} strokeWidth="2" />
    {frame.preferenceMethods.map((method, index) => <g key={method} data-preference-method={method}>
      <rect x="456" y={190 + index * 57} width="136" height="37" rx="8" fill="#26324b" stroke={tones.violet} />
      <text x="524" y={217 + index * 57} textAnchor="middle" className="ts-note">{method}</text>
      <Route frame={frame} id={id} source={`preference:${method}`} target="weights" d={`M449 ${209 + index * 55}h-42`} />
    </g>)}
    <text x="524" y="313" textAnchor="middle" className="ts-note">異なる手法</text>
    <text x="320" y="359" textAnchor="middle" className="ts-label">有用さ・無害さ・トーン・拒否を調整</text>
    <text x="320" y="408" textAnchor="middle" className="ts-note">安全性や正確さの保証を示す点数ではない</text>
  </>
}
function TrainingScene({ phase, id, settings }) {
  const frame = trainingStagesFrame(phase, settings)
  const Content = [Overview, Prediction, Knowledge, Demonstrations, Evaluation, Preference][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene training-stages-scene" data-training-stage={frame.stage} data-model-id={frame.modelId} data-training-target={frame.trainingTarget} data-retrieval-target={frame.retrievalTarget} data-numeric-performance="none" data-knowledge-focus={frame.knowledgeFocus || 'none'} data-evaluation-focus={frame.evaluationFocus || 'none'}>
    <Content frame={frame} id={id} /><Weights frame={frame} />
  </SceneBase>
}
export function TrainingStages({ children }) {
  const [knowledgeFocus, setKnowledgeFocus] = useState('coverage'), [evaluationFocus, setEvaluationFocus] = useState('behavior')
  return <ReadingFigure diagramId="training-stages" title="入力の違いと、重みの更新" eyebrow="TRAINING / STAGES" stages={TRAINING_STAGES} className="training-stages-walkthrough"
    renderScene={state => <TrainingScene {...state} settings={{ knowledgeFocus, evaluationFocus }} />}
    renderControls={({ ready, stage }) => <div className="training-stages-controls">
      {stage === 2 && <div data-control="knowledge-focus"><Select label="確認する性質" value={knowledgeFocus} onChange={setKnowledgeFocus} ready={ready}><option value="coverage">収録範囲</option><option value="accuracy">正確さ</option><option value="instruction">指示追従</option></Select></div>}
      {stage === 4 && <div data-control="evaluation-focus"><Select label="評価の観点" value={evaluationFocus} onChange={setEvaluationFocus} ready={ready}><option value="behavior">形式・振る舞い</option><option value="facts">事実再現性</option></Select></div>}
    </div>}
    footnote="代表的な学習構成の模式図です。重みの数値、改善率や品質点数は示しません。選択は強調だけを変え、比較内容は保持します。">{children}</ReadingFigure>
}
