'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Lines, Wire, Select } from './concept-scene-primitives'
import { REASONING_EVALUATION_STAGES, reasoningEvaluationFrame } from '../../lib/reasoning-evaluation-model.mjs'

const candidateLines = [
  [['多段の数学・計画', '複雑なデバッグ'], ['事実検索', '定型の抽出・分類']],
  [['正しさを', '検証できる問題'], ['低遅延の対話', '大量処理']],
  [['制約が多い', '慎重な判断'], ['参照・手順が', '定型化された問い']]
]

function Comparison({ frame, children }) {
  return <g data-comparison-input={frame.comparison.inputId} data-comparison-model={frame.comparison.modelId}>{children}</g>
}

function TaskCandidates({ frame, id }) {
  const selected = frame.taskRows.findIndex(row => row.emphasized)
  return <>
    <text x="320" y="31" textAnchor="middle" className="re-heading">候補から、同じ入力の比較へ</text>
    <text x="170" y="63" textAnchor="middle" className="re-note">改善を評価する候補</text>
    <text x="470" y="63" textAnchor="middle" className="re-note">低めとの比較が必要な候補</text>
    {frame.taskRows.map((row, index) => <g key={row.id} data-task-row={row.id} data-emphasized={String(row.emphasized)}>
      <rect x="24" y={76 + index * 64} width="592" height="59" rx="9" className="re-task-row" />
      <path d={`M320 ${85 + index * 64}v41`} className="re-divider" />
      {row.candidates.map((candidate, column) => <g key={column} data-task-candidate={column ? 'lower-comparison' : 'improvement'}>
        <title>{candidate}</title>
        <Lines x={170 + column * 300} y={100 + index * 64} lines={candidateLines[index][column]} className="re-note" gap={24} />
      </g>)}
      {row.emphasized && <path d={`M33 ${93 + index * 64}v25`} className="re-selected-mark" />}
    </g>)}
    <Wire id={id} d={`M24 ${105 + selected * 64}H12V320H48`} active phase={frame.phase} />
    <text x="320" y="289" textAnchor="middle" className="re-note" data-caveat="no-auto-choice">各欄は別タスク。表だけで採否を決めない</text>
    <Comparison frame={frame}>
      <text x="320" y="322" textAnchor="middle" className="re-label">同じ実入力で設定を比較</text>
      {frame.variants.map((variant, index) => <g key={variant.id} data-effort-variant={variant.id} data-emphasized="false">
        <rect x={24 + index * 306} y="336" width="286" height="37" rx="9" className="re-box" />
        <text x={167 + index * 306} y="362" textAnchor="middle" className="re-note">{variant.label}</text>
      </g>)}
      {frame.metrics.map((metric, index) => <g key={metric.id} data-metric={metric.id} data-metric-status={metric.status}>
        <text x={121 + index * 199} y="409" textAnchor="middle" className="re-note">{metric.label}：未計測</text>
      </g>)}
    </Comparison>
  </>
}

function EffortComparison({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="re-heading">{frame.stage === 1 ? '同じ条件で、思考量を比べる' : '追加の作業と、便益を分ける'}</text>
    <Comparison frame={frame}>
      <rect x="24" y="52" width="592" height="45" rx="10" className="re-panel" />
      <text x="320" y="82" textAnchor="middle" className="re-note">同じ入力・モデル・指示・評価基準</text>
      <Wire id={id} d="M320 97V111H165V125" active phase={frame.phase} />
      <Wire id={id} d="M320 111H475V125" active phase={frame.phase} />
      {frame.variants.map((variant, index) => <g key={variant.id} data-effort-variant={variant.id} data-emphasized={String(variant.emphasized)}>
        <rect x={24 + index * 310} y="125" width="282" height="221" rx="12" className="re-variant" />
        {variant.emphasized && <path d={`M${39 + index * 310} 140v26`} className="re-selected-mark" />}
        <text x={165 + index * 310} y="158" textAnchor="middle" className="re-label">{variant.label}</text>
        {variant.measurements.map((metric, metricIndex) => <g key={metric.id} data-metric={metric.id} data-metric-status={metric.status}>
          <text x={43 + index * 310} y={201 + metricIndex * 41} className="re-note">{metric.label}</text>
          <text x={288 + index * 310} y={201 + metricIndex * 41} textAnchor="end" className="re-label">未計測</text>
        </g>)}
        {frame.extraWork.visible && variant.id === 'higher' && <g data-extra-work="nonquantitative" data-measured="false">
          <rect x="354" y="301" width="242" height="33" rx="7" className="re-extra" />
          <text x="475" y="325" textAnchor="middle" className="re-note">追加の作業（模式）</text>
        </g>}
      </g>)}
    </Comparison>
    {frame.stage === 1 ? <>
      <text x="320" y="382" textAnchor="middle" className="re-note" data-caveat="provider-specific">名称・仕様はモデル別</text>
      <text x="320" y="414" textAnchor="middle" className="re-note">品質・費用・待ち時間は未計測</text>
    </> : <>
      <text x="320" y="370" textAnchor="middle" className="re-note" data-caveat="benefit-not-guaranteed">追加便益が小さい場合もある</text>
      <text x="320" y="395" textAnchor="middle" className="re-note">すべての簡単な問いで悪化するわけではない</text>
      <text x="320" y="420" textAnchor="middle" className="re-note" data-caveat="effort-not-permission">曖昧な要件・権限制御は別に見直す</text>
    </>}
  </>
}

function RequiredConditions({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="re-heading">必須手順と、探索の余地を分ける</text>
    {frame.requiredConditions.map((condition, index) => <g key={condition.id} data-required-condition={condition.id}>
      <rect x={24 + index * 120} y="68" width="112" height="44" rx="9" className="re-condition" />
      <text x={80 + index * 120} y="97" textAnchor="middle" className="re-note">{condition.label}</text>
    </g>)}
    <g data-exploration="within-boundary">
      <rect x="24" y="130" width="592" height="150" rx="12" className="re-boundary" />
      <text x="320" y="159" textAnchor="middle" className="re-label">探索の余地</text>
      <g transform={`translate(${90 + frame.exploration.presentationOffset} 185)`}>
        <rect width="130" height="43" rx="20" className="re-exploration" />
        <text x="65" y="29" textAnchor="middle" className="re-label">探索</text>
      </g>
      <text x="320" y="259" textAnchor="middle" className="re-note">必須手順を保ち、探索は境界内で</text>
    </g>
    <g data-execution-boundary={frame.executionBoundary.owner} data-operation-executed="false">
      <rect x="24" y="310" width="592" height="64" rx="11" className="re-execution" />
      <text x="320" y="337" textAnchor="middle" className="re-label">モデル外の実行コード</text>
      <text x="320" y="363" textAnchor="middle" className="re-note" data-caveat="effort-not-permission">安全条件は実行側でも強制</text>
    </g>
    <text x="320" y="414" textAnchor="middle" className="re-note">思考指示の効果はモデル別に比較</text>
  </>
}

function RepeatedTrials({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="re-heading">同条件で複数回</text>
    <text x="320" y="63" textAnchor="middle" className="re-note">品質・費用・待ち時間を同時に記録</text>
    <Comparison frame={frame}>
      <text x="320" y="92" textAnchor="middle" className="re-note">同じ入力・モデル・指示・評価基準</text>
      {frame.metrics.map((metric, index) => <text key={metric.id} x={236 + index * 157} y="127" textAnchor="middle" className="re-label">{metric.label}</text>)}
      {frame.trials.map((trial, row) => <g key={trial.id} data-trial-id={trial.id} data-trial-condition={trial.conditionId}
        data-trial-input={trial.inputId} data-trial-effort={trial.effort}>
        <rect x="24" y={140 + row * 42} width="592" height="36" rx="7" className="re-trial" />
        <text x="87" y={166 + row * 42} textAnchor="middle" className="re-note">{trial.effort === 'lower' ? '低め' : '高め'} {row % 2 ? 'B' : 'A'}</text>
        {trial.measurements.map((metric, column) => <g key={metric.id} data-metric={metric.id} data-metric-status={metric.status}>
          <text x={236 + column * 157} y={166 + row * 42} textAnchor="middle" className="re-note">未計測</text>
        </g>)}
      </g>)}
    </Comparison>
    <text x="320" y="333" textAnchor="middle" className="re-note">設定内は同条件／設定間は思考量だけ変更</text>
    <text x="320" y="359" textAnchor="middle" className="re-note">A/B は空の見本。推奨回数ではない</text>
    <text x="320" y="385" textAnchor="middle" className="re-note">思考は非公開・要約のみの場合もある</text>
    <text x="320" y="414" textAnchor="middle" className="re-note" data-caveat="thought-not-cause">見える思考から原因を断定しない</text>
  </>
}

function EvaluationScene({ phase, id, taskFocus, effortFocus }) {
  const frame = reasoningEvaluationFrame(phase, { taskFocus, effortFocus })
  const Content = [TaskCandidates, EffortComparison, EffortComparison, RequiredConditions, RepeatedTrials][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene reasoning-evaluation-scene"
    data-reasoning-evaluation-stage={frame.stage} data-task-focus={frame.taskFocus ?? 'none'} data-effort-focus={frame.effortFocus ?? 'none'}
    data-measurement-state="unmeasured" data-task-decision="none">
    <Content frame={frame} id={id} />
  </SceneBase>
}

export function ReasoningEvaluation({ children }) {
  const [taskFocus, setTaskFocus] = useState('multi-step')
  const [effortFocus, setEffortFocus] = useState('lower')
  return <ReadingFigure diagramId="reasoning-evaluation" title="思考量を比較して決める" eyebrow="REASONING / EVALUATION"
    stages={REASONING_EVALUATION_STAGES} className="reasoning-evaluation-walkthrough"
    renderScene={state => <EvaluationScene {...state} taskFocus={taskFocus} effortFocus={effortFocus} />}
    renderControls={({ ready, stage }) => stage === 0 ? <div className="re-controls" data-control="reasoning-task-focus">
      <Select label="表の観点" value={taskFocus} onChange={setTaskFocus} ready={ready}>
        <option value="multi-step">多段推論と定型処理</option><option value="verifiable">検証可能性と待ち時間</option><option value="constraints">制約と定型手順</option>
      </Select>
    </div> : (stage === 1 || stage === 2) && <div className="re-controls" data-control="reasoning-effort-focus">
      <Select label="注目する思考量" value={effortFocus} onChange={setEffortFocus} ready={ready}>
        <option value="lower">低め</option><option value="higher">高め</option>
      </Select>
    </div>}
    footnote="思考量を比べるための模式図です。品質・費用・待ち時間は未計測で、最適な設定や必要な試行回数を決める図ではありません。">
    {children}
  </ReadingFigure>
}
