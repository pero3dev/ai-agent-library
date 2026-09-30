'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, Select, tones } from './concept-scene-primitives'
import { ALIGNMENT_FEEDBACK_STAGES, FEEDBACK_LABEL_SOURCE_IDS, alignmentFeedbackFrame } from '../../lib/alignment-feedback-model.mjs'

const stepCenters = [86, 242, 398, 554]

function AnswerRow({ frame, id }) {
  return <g data-answer-id={frame.answerId}>
    <text x={frame.stage === 2 ? 598 : 24} y={frame.stage === 2 ? 235 : 176}
      textAnchor={frame.stage === 2 ? 'end' : 'start'} className="af-note">同じ解答</text>
    {[...frame.steps, frame.finalId].map((step, index) => <g key={step} data-step-id={step}>
      {index < 3 && <Wire id={id} d={`M${stepCenters[index] + 62} 277H${stepCenters[index + 1] - 62}`} active phase={frame.phase} />}
      <rect x={stepCenters[index] - 62} y="248" width="124" height="58" rx="10" className="af-box" />
      <text x={stepCenters[index]} y="284" textAnchor="middle" className="af-label">{index < 3 ? `段階 ${index + 1}` : '最終結果'}</text>
    </g>)}
  </g>
}

function Verifier({ frame, id }) {
  return <>
    <text x="320" y="38" textAnchor="middle" className="af-heading">検証できる報酬で学習する</text>
    <text x="320" y="81" textAnchor="middle" className="af-label" data-rlvr-scope="verifiable-reward">報酬を検証できる範囲</text>
    <text x="320" y="125" textAnchor="middle" className="af-note">数学・コード</text>
    <AnswerRow frame={frame} id={id} />
    <Wire id={id} d="M554 306V328" tone="amber" active phase={frame.phase} />
    <Wire id={id} d="M484 355H430" tone="amber" active phase={frame.phase} />
    <Wire id={id} d="M304 355H246" tone="amber" active phase={frame.phase} />
    <g data-reward-source="verifier">
      <rect x="484" y="328" width="140" height="54" rx="10" className="af-box af-source" />
      <text x="554" y="362" textAnchor="middle" className="af-label">検証器</text>
    </g>
    <rect x="304" y="328" width="126" height="54" rx="10" className="af-box af-source" />
    <text x="367" y="362" textAnchor="middle" className="af-label">報酬</text>
    <rect x="82" y="328" width="164" height="54" rx="10" className="af-box af-source" />
    <text x="164" y="362" textAnchor="middle" className="af-label">モデル</text>
    <text x="320" y="416" textAnchor="middle" className="af-note">出所と、結果・過程の粒度は別の分類</text>
  </>
}

function EvaluationLocations({ frame, id }) {
  return <>
    <text x="320" y="38" textAnchor="middle" className="af-heading">評価する位置を比べる</text>
    <path d="M44 80l10 10-10 10-10-10Z" className="af-process-mark" />
    <text x="67" y="98" className="af-label">過程：各段階</text>
    <circle cx="401" cy="90" r="10" className="af-outcome-mark" />
    <text x="423" y="98" className="af-label">結果：最終</text>
    <AnswerRow frame={frame} id={id} />
    {frame.marks.map(mark => {
      const index = mark.target === frame.finalId ? 3 : frame.steps.indexOf(mark.target)
      const x = stepCenters[index], process = mark.granularity === 'process', y = process ? 217 : 337
      return <g key={`${mark.granularity}-${mark.target}`} data-evaluation-mark="true"
        data-granularity={mark.granularity} data-target-step={mark.target}>
        <Wire id={id} d={process ? `M${x} 229V248` : `M${x} 326V306`} tone={process ? 'violet' : 'amber'} active phase={frame.phase} />
        {process ? <path d={`M${x} ${y - 10}l10 10-10 10-10-10Z`} className="af-process-mark" />
          : <circle cx={x} cy={y} r="10" className="af-outcome-mark" />}
      </g>
    })}
    <text x="320" y="394" textAnchor="middle" className="af-note">印は評価位置。正誤の判定ではない</text>
  </>
}

function Scope({ frame, id }) {
  return <>
    <text x="320" y="33" textAnchor="middle" className="af-heading" data-axis-relation="orthogonal">出所と粒度は別の軸</text>
    <g data-feedback-axis="source">
      <rect x="24" y="48" width="592" height="146" rx="12" className="af-panel" />
      <text x="42" y="77" className="af-label">報酬の出所</text>
      <g data-reward-source="verifier">
        <rect x="42" y="89" width="126" height="40" rx="9" className="af-box af-source" />
        <text x="105" y="117" textAnchor="middle" className="af-label">検証器</text>
      </g>
      <text x="188" y="117" className="af-note" data-rlvr-scope="verifiable-reward">報酬を検証できる範囲</text>
      <text x="42" y="164" className="af-note">人手等の段階ラベル</text>
      <Wire id={id} d="M251 156H287" tone="violet" active phase={frame.phase} />
      <g data-reward-source="learned-reward-model">
        <rect x="295" y="137" width="299" height="44" rx="9" className="af-box af-learned" />
        <text x="445" y="166" textAnchor="middle" className="af-label">学習した報酬モデル</text>
      </g>
    </g>
    <g data-feedback-axis="granularity">
      <rect x="24" y="206" width="592" height="149" rx="12" className="af-panel" />
      <text x="42" y="235" className="af-label">評価する粒度</text>
      <AnswerRow frame={frame} id={id} />
      <path d="M86 314v6H398v-6" className="af-grain-line" />
      <path d="M554 314v6" className="af-grain-line" />
      <text x="242" y="345" textAnchor="middle" className="af-note" data-feedback-granularity="process">過程：各段階</text>
      <text x="554" y="345" textAnchor="middle" className="af-note" data-feedback-granularity="outcome">結果：最終</text>
    </g>
    <text x="320" y="398" textAnchor="middle" className="af-note" data-process-source-caveat="true">過程評価には人手等のラベルもある</text>
  </>
}

function PreferencePath({ frame, id }) {
  return <>
    <Wire id={id} d="M204 141H264" tone="coral" active phase={frame.phase} />
    <Wire id={id} d="M414 141H474" tone="coral" active phase={frame.phase} />
    <g data-label-source-target="preference-data">
      <rect x="24" y="112" width="180" height="58" rx="12" className="af-box" />
      <text x="114" y="148" textAnchor="middle" className="af-label">選好データ</text>
    </g>
    <rect x="264" y="112" width="150" height="58" rx="12" className="af-box" />
    <text x="339" y="148" textAnchor="middle" className="af-label">モデル</text>
    <rect x="474" y="112" width="142" height="58" rx="12" className="af-box" />
    <text x="545" y="148" textAnchor="middle" className="af-label">出力</text>
  </>
}

function SideEffects({ frame, id }) {
  return <>
    <text x="320" y="38" textAnchor="middle" className="af-heading">調整の効果を、別々に評価する</text>
    <text x="320" y="81" textAnchor="middle" className="af-note">選好の偏りが出力へ伝わりうる</text>
    <PreferencePath frame={frame} id={id} />
    <g data-alignment-side-effect="sycophancy" data-side-effect-universality={String(frame.sideEffectUniversality)}>
      <rect x="24" y="206" width="278" height="112" rx="12" className="af-box af-side-effect" />
      <text x="163" y="243" textAnchor="middle" className="af-label">迎合</text>
      <text x="163" y="282" textAnchor="middle" className="af-note">訂正より同調へ寄りうる</text>
    </g>
    <g data-alignment-side-effect="alignment-tax" data-side-effect-universality={String(frame.sideEffectUniversality)}>
      <rect x="338" y="206" width="278" height="112" rx="12" className="af-box af-side-effect" />
      <text x="477" y="243" textAnchor="middle" className="af-label">アラインメント税</text>
      <text x="477" y="277" textAnchor="middle" className="af-note">特定タスクの能力が</text>
      <text x="477" y="305" textAnchor="middle" className="af-note">下がりうる</text>
    </g>
    <Wire id={id} d="M616 141H630V364H616" tone="violet" active phase={frame.phase} />
    <Wire id={id} d="M630 364V394H163V386" tone="teal" active phase={frame.phase} />
    <rect x="24" y="342" width="278" height="44" rx="10" className="af-box" />
    <text x="163" y="372" textAnchor="middle" className="af-label">能力：別に評価</text>
    <rect x="338" y="342" width="278" height="44" rx="10" className="af-box af-learned" />
    <text x="477" y="372" textAnchor="middle" className="af-label">安全：別に評価</text>
    <text x="320" y="422" textAnchor="middle" className="af-note">どちらの副作用も、全モデルの必然ではない</text>
  </>
}

function LabelSource({ frame, id }) {
  return <>
    <text x="320" y="38" textAnchor="middle" className="af-heading">同じ上流位置で、作り手を比べる</text>
    <PreferencePath frame={frame} id={id} />
    {FEEDBACK_LABEL_SOURCE_IDS.map((source, index) => {
      const y = 220 + index * 78, emphasized = frame.effectiveLabelSource === source
      return <g key={source} data-label-source={source} data-emphasized={String(emphasized)}>
        <Wire id={id} d={`M150 ${y + 27}H${180 + index * 22}V189H114V170`} tone={index ? 'violet' : 'teal'} active={emphasized} phase={frame.phase} />
        <rect x="24" y={y} width="126" height="54" rx="10" className="af-box"
          style={{ stroke: index ? tones.violet : tones.teal, strokeWidth: emphasized ? 3 : 1, fill: emphasized ? '#1b3b45' : '#112638' }} />
        <text x="87" y={y + 35} textAnchor="middle" className="af-label">{source === 'human' ? '人手' : 'AI'}</text>
      </g>
    })}
    <text x="425" y="251" textAnchor="middle" className="af-label">選好ラベルの作り手</text>
    <text x="425" y="293" textAnchor="middle" className="af-note">変わるのは強調だけ</text>
    <text x="320" y="402" textAnchor="middle" className="af-label" data-label-source-guarantee="false">無害性の保証ではない</text>
  </>
}

function FeedbackScene({ phase, id, labelSource }) {
  const frame = alignmentFeedbackFrame(phase, { labelSource })
  const Content = [Verifier, EvaluationLocations, Scope, SideEffects, LabelSource][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene alignment-feedback-scene"
    data-alignment-feedback-stage={frame.stage} data-harmlessness-guarantee={String(frame.harmlessnessGuarantee)}
    data-side-effect-guarantee={String(frame.sideEffectUniversality)} data-empirical-measurement={String(frame.empiricalMeasurement)}>
    <Content frame={frame} id={id} />
  </SceneBase>
}

export function AlignmentFeedback({ children }) {
  const [labelSource, setLabelSource] = useState('human')
  return <ReadingFigure diagramId="alignment-feedback" title="報酬の出所と評価する粒度" eyebrow="ALIGNMENT / FEEDBACK"
    stages={ALIGNMENT_FEEDBACK_STAGES} className="alignment-feedback-walkthrough"
    renderScene={state => <FeedbackScene {...state} labelSource={labelSource} />}
    renderControls={({ ready, stage }) => stage === 4 && <div className="alignment-feedback-controls" data-control="labelSource">
      <Select label="選好ラベルの作り手" value={labelSource} onChange={setLabelSource} ready={ready}>
        <option value="human">人手</option><option value="ai">AI</option>
      </Select>
    </div>}
    footnote="段階列は評価位置の模式図です。実際の思考内容・正誤・性能値を表しません。">
    {children}
  </ReadingFigure>
}
