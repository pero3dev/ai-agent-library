'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { CHOICE_OPTIONS, COMPARISON_ROWS, WORKFLOW_STAGES, workflowChoice } from '../../lib/workflow-comparison-model.mjs'
import { Card, Lines, SceneBase, Select, Wire, tones } from './concept-scene-primitives'

function FlowLane({ id, x, agent, phase, active = true, bounded = false }) {
  const tone = agent ? 'violet' : 'teal'
  const color = tones[tone]
  return <g>
    <rect x={x} y="60" width="270" height="285" rx="16" fill="#101f31" stroke={color} strokeOpacity=".3" />
    <text x={x + 135} y="91" textAnchor="middle" className="cd-lane-title" fill={color}>{agent ? 'Agent' : 'Workflow'}</text>
    <text x={x + 135} y="114" textAnchor="middle" className="cd-small">{agent ? '手順の決定をモデルへ' : '手順をコードで固定'}</text>
    {agent ? <>
      <Card x={x + 55} y={141} width={160} height={57} title="モデルの判断" tone="violet" active={active} />
      <Wire id={id} d={`M${x + 135} 198V222L${x + 61} 246`} active={active} phase={phase} tone={tone} />
      <Wire id={id} d={`M${x + 135} 222L${x + 205} 246`} active={active} phase={phase + .4} tone={tone} dash />
      {[61, 205].map((offset, i) => <g key={offset}><rect x={x + offset - 37} y="246" width="74" height="38" rx="8" fill="#20213d" stroke={color} strokeOpacity=".5" /><text x={x + offset} y="271" textAnchor="middle" className="cd-label">{i ? '別の手段' : 'ツール'}</text></g>)}
      <Wire id={id} d={`M${x + 61} 284V308H${x + 245}V170H${x + 215}`} active={active} phase={phase} tone={tone} />
    </> : <>
      {[145, 210, 275].map((y, i) => <g key={y}>
        <rect x={x + 55} y={y} width="160" height="39" rx="8" fill="#11303a" stroke={color} strokeOpacity=".5" />
        <text x={x + 135} y={y + 25} textAnchor="middle" className="cd-label">{['固定したステップ', '必要なら LLM', '固定したステップ'][i]}</text>
        {i < 2 && <Wire id={id} d={`M${x + 135} ${y + 39}V${y + 65}`} active={active} phase={phase} />}
      </g>)}
    </>}
    {bounded && <rect x={x + 42} y="133" width="186" height="76" rx="12" fill="none" stroke="#f1c27e" strokeWidth="2" strokeDasharray="5 5" />}
  </g>
}

function ChoiceScene({ id, choice, phase }) {
  const selected = workflowChoice(choice)
  const questions = ['手順をすべて列挙できる？', '入口の振り分けだけ？', '変わる範囲を限定できる？']
  return <g data-choice={choice}>
    {questions.map((label, index) => <g key={label}>
      <rect x="29" y={61 + index * 90} width="282" height="56" rx="12" fill={selected.steps.includes(index) ? '#183b40' : '#101f31'} stroke="#74e3cf" strokeOpacity={selected.steps.includes(index) ? .8 : .25} />
      <text x="170" y={95 + index * 90} textAnchor="middle" className="cd-label">{label}</text>
      {index < 2 && <Wire id={id} d={`M170 ${117 + index * 90}V${151 + index * 90}`} active={selected.steps.includes(index + 1)} phase={phase} />}
    </g>)}
    {CHOICE_OPTIONS.map((option, index) => <g key={option.id}>
      <Wire id={id} d={`M311 ${89 + Math.min(index, 2) * 90}C345 ${89 + Math.min(index, 2) * 90} 333 ${88 + index * 77} 367 ${88 + index * 77}`} active={choice === option.id} phase={phase} tone={index < 2 ? 'teal' : 'violet'} />
      <rect x="367" y={61 + index * 77} width="245" height="56" rx="10" fill={choice === option.id ? '#243543' : '#101f31'} stroke={index < 2 ? tones.teal : tones.violet} strokeOpacity={choice === option.id ? .95 : .25} />
      <Lines x={490} y={index === 1 ? 82 + index * 77 : 95 + index * 77} lines={index === 1 ? ['Workflow', '＋ ルーティング'] : [option.result]} className="cd-label" gap={20} />
    </g>)}
    <text x="320" y="406" textAnchor="middle" className="cd-small">{selected.answer}</text>
  </g>
}

function HybridScene({ id, phase, direction }) {
  const inside = direction === 'workflow'
  return <g data-hybrid={direction}>
    <rect x="36" y="65" width="568" height="304" rx="20" fill="#101f31" stroke={inside ? tones.teal : tones.violet} strokeOpacity=".7" />
    <text x="320" y="99" textAnchor="middle" className="cd-lane-title" fill={inside ? tones.teal : tones.violet}>{inside ? 'Workflow の 1 ステップに Agent' : 'Agent のツールとして Workflow'}</text>
    {inside ? <>
      <Card x={60} y={175} width={126} height={61} title="固定手順" active />
      <Card x={248} y={175} width={144} height={61} title="探索・判断" tone="violet" active />
      <Card x={454} y={175} width={126} height={61} title="固定手順" active />
      <Wire id={id} d="M186 205H248" active phase={phase} />
      <Wire id={id} d="M392 205H454" active phase={phase} />
      <rect x="232" y="148" width="176" height="113" rx="14" fill="none" stroke={tones.violet} strokeDasharray="5 5" />
      <text x="320" y="287" textAnchor="middle" className="cd-small">不確実な範囲を 1 ステップに閉じ込める</text>
    </> : <>
      <Card x={75} y={151} width={173} height={66} title="モデルの判断" lines={['いつ使うかを決める']} tone="violet" active />
      <Wire id={id} d="M248 184H339" active phase={phase} tone="violet" />
      <rect x="339" y="139" width="225" height="143" rx="14" fill="#133139" stroke={tones.teal} strokeDasharray="5 5" />
      <text x="451" y="166" textAnchor="middle" className="cd-label">1つのツール</text>
      {[372, 452, 532].map((x, i) => <g key={x}><rect x={x - 25} y="192" width="50" height="42" rx="7" fill="#1f444b" /><text x={x} y="219" textAnchor="middle" className="cd-label">{i + 1}</text>{i < 2 && <Wire id={id} d={`M${x + 25} 213H${x + 55}`} active phase={phase} />}</g>)}
      <text x="451" y="261" textAnchor="middle" className="cd-small">中の定型手順は固定</text>
      <Wire id={id} d="M451 282V316H161V217" active phase={phase} tone="violet" />
    </>}
    <text x="320" y="403" textAnchor="middle" className="cd-small">予測可能な部分をコードに固定する</text>
  </g>
}

function WorkflowScene({ id, phase, stage, criterion, choice, hybrid }) {
  const comparison = COMPARISON_ROWS[criterion]
  const selected = workflowChoice(choice)
  const selectionTitle = stage === 1 ? comparison.label : stage === 2 ? selected.result : stage === 3 ? (hybrid === 'workflow' ? 'Workflow の中に Agent' : 'Agent のツールに Workflow') : 'Workflow と Agent'
  const detail = stage === 1 ? `${comparison.label}。Workflow：${comparison.workflow.join('')}。Agent：${comparison.agent.join('')}。`
    : stage === 2 ? `${selected.label}。選ぶ構成は${selected.result}。${selected.answer}。`
      : stage === 3 ? (hybrid === 'workflow' ? 'Workflowの1ステップとしてAgentを埋め込み、不確実な範囲をそのステップに閉じ込めます。' : '定型手順を1つのツールに固めてAgentへ渡します。モデルはいつ使うかを判断し、手順の中身は固定します。')
        : WORKFLOW_STAGES[stage].detail
  return <SceneBase id={id} title={`${WORKFLOW_STAGES[stage].label}：${selectionTitle}`} detail={detail} data-criterion={comparison.label}>
    {stage === 2 ? <ChoiceScene id={id} choice={choice} phase={phase} /> : stage === 3 ? <HybridScene id={id} phase={phase} direction={hybrid} /> : <>
      <FlowLane id={`${id}`} x={28} phase={phase} active={stage !== 1} bounded={stage === 4} />
      <FlowLane id={`${id}`} x={342} phase={phase} agent active={stage !== 1} bounded={stage === 4} />
      {stage === 1 && <g className="cd-comparison-cards">
        <rect x="40" y="134" width="246" height="189" rx="12" fill="#0c2430" fillOpacity=".98" stroke={tones.teal} />
        <rect x="354" y="134" width="246" height="189" rx="12" fill="#202139" fillOpacity=".98" stroke={tones.violet} />
        {[163, 477].map(x => <text key={x} x={x} y="174" textAnchor="middle" className="cd-overline">{comparison.label}</text>)}
        <Lines x={163} y={comparison.workflow.length === 1 ? 239 : 226} lines={comparison.workflow} className="cd-comparison-text" gap={29} />
        <Lines x={477} y={comparison.agent.length === 1 ? 239 : 226} lines={comparison.agent} className="cd-comparison-text" gap={29} />
      </g>}
      {stage === 4 ? <>
        <Wire id={id} d="M289 166H352" both active phase={phase} tone="amber" />
        <text x="320" y="376" textAnchor="middle" className="cd-label">境界を関数・ツールとして切る</text>
        <text x="320" y="407" textAnchor="middle" className="cd-small">必要な部分だけを変更し、Workflowへ戻す余地を残す</text>
      </> : <>
        <text x="320" y="377" textAnchor="middle" className="cd-label">{stage === 1 ? '柔軟性は、本当に必要か。' : '違いは、手順の決定をどこに置くか。'}</text>
        <text x="320" y="407" textAnchor="middle" className="cd-small">{stage === 1 ? '定性的な比較。点数や成功率を表すものではありません。' : 'Workflow でも LLM を利用できる'}</text>
      </>}
    </>}
  </SceneBase>
}

export function WorkflowComparison({ children }) {
  const [criterion, setCriterion] = useState(0)
  const [choice, setChoice] = useState('bounded')
  const [hybrid, setHybrid] = useState('workflow')
  return <ReadingFigure diagramId="workflow-comparison" title="Workflow と Agent" eyebrow="WORKFLOW / AGENT" stages={WORKFLOW_STAGES} className="concept-walkthrough"
    renderScene={state => <WorkflowScene {...state} criterion={criterion} choice={choice} hybrid={hybrid} />}
    renderControls={({ ready }) => <div className="cd-controls cd-workflow-controls">
      <Select label="比較する観点" value={String(criterion)} onChange={value => setCriterion(Number(value))} ready={ready}>{COMPARISON_ROWS.map((item, i) => <option key={item.label} value={i}>{item.label}</option>)}</Select>
      <Select label="本文の判断経路" value={choice} onChange={setChoice} ready={ready}>{CHOICE_OPTIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
      <Select label="ハイブリッドの向き" value={hybrid} onChange={setHybrid} ready={ready}><option value="workflow">Workflow の中に Agent</option><option value="agent">Agent のツールに Workflow</option></Select>
    </div>}
    footnote="段階は記事の論点に対応します。処理の実行順序や、方式の優劣を表すものではありません。">{children}</ReadingFigure>
}
