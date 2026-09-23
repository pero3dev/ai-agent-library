'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { LOOP_STAGES, RESPONSE_OPTIONS, loopFrame } from '../../lib/agent-loop-model.mjs'
import { Card, SceneBase, Select, Wire } from './concept-scene-primitives'

function LoopScene({ id, phase, stage, response, boundary, toolResult }) {
  const frame = loopFrame(stage, response, boundary, toolResult)
  const active = name => frame.active === name
  const edge = name => frame.edges.includes(name)
  const terminalText = frame.terminal === 'complete' ? '正常完了' : '未完了・状態報告'
  return <SceneBase id={id} title={`${LOOP_STAGES[stage].label}：${RESPONSE_OPTIONS.find(item => item.id === response).label}`} detail={frame.detail} data-tool-executed={String(frame.toolExecuted)} data-terminal={frame.terminal || 'none'} data-repeats={String(frame.repeats)}>
    <rect x="21" y="52" width="598" height="338" rx="19" fill="none" stroke="#34485a" strokeDasharray="4 5" />
    <text x="37" y="42" className="cd-overline">APPLICATION / 制御と履歴</text>
    <rect x="367" y="60" width="229" height="114" rx="15" fill="#baa7f3" fillOpacity=".035" stroke="#baa7f3" strokeOpacity=".25" />
    <text x="382" y="80" className="cd-overline" fill="#baa7f3">MODEL / 次の一手</text>

    <Wire id={id} d="M259 123H387" active={edge('input')} phase={phase} tone="violet" />
    <Wire id={id} d="M481 153V205" active={edge('response')} phase={phase} tone="violet" />
    <Wire id={id} d="M387 237H281" active={edge('execute')} phase={phase} tone="amber" />
    <Wire id={id} d="M170 278V312" active={edge('observe')} phase={phase} />
    <Wire id={id} d="M413 270C388 308 326 337 281 337" active={edge('resume')} phase={phase} dash />
    <Wire id={id} d="M480 271V313" active={edge('complete') || edge('incomplete')} phase={phase} tone={response === 'complete' ? 'teal' : 'coral'} />
    <Wire id={id} d="M281 342H387" active={edge('app-stop')} phase={phase} tone="coral" />
    <Wire id={id} d="M68 344H43V125H68" active={edge('repeat')} phase={phase} />
    <text x="320" y="111" textAnchor="middle" className="cd-small">入力</text>
    <text x="495" y="190" className="cd-small">応答を残す</text>
    <text x="330" y="224" textAnchor="middle" className="cd-small">要求</text>

    <Card x={68} y={90} width={191} title="コンテキスト" lines={['指示 ＋ 履歴 ＋ 結果']} active={active('context')} number="1" />
    <Card x={387} y={92} width={190} height={61} title="LLM 呼び出し" lines={['判断・応答']} tone="violet" active={active('model')} number="2" />
    <Card x={387} y={205} width={190} title="応答の解釈" lines={['本文 ＋ 停止理由']} active={active('interpret')} number="3" />
    <Card x={68} y={205} width={213} height={73} title="ツール実行・追記" lines={[toolResult === 'success' ? '成功結果を履歴へ' : '失敗内容も履歴へ']} tone="amber" active={active('tool')} number="4" muted={frame.bypassTool} />
    <Card x={68} y={312} width={213} height={61} title="アプリの停止判定" lines={['周回・時間・費用等']} active={active('boundary')} number="5" />
    <Card x={387} y={313} width={190} height={60} title={frame.terminal ? terminalText : '終了時は状態を残す'} lines={frame.terminal === 'complete' ? ['業務上の成功は別に検証'] : ['途中経過を捨てない']} tone={frame.terminal === 'complete' ? 'teal' : 'coral'} active={active('terminal')} />

    <g transform="translate(76 172)"><text className="cd-small">履歴</text>
      {frame.history.map((label, index) => <g key={label} transform={`translate(${40 + index * 134} 0)`}><rect x="-4" y="-14" width="129" height="22" rx="5" fill="#243747" /><text className="cd-history-label">{label}</text></g>)}
      {!frame.history.length && <text x="40" className="cd-small">会話・これまでの結果</text>}
    </g>
    <text x="320" y="417" textAnchor="middle" className="cd-small">{frame.bypassTool ? 'この応答は、ツール実行を通らない' : 'モデルは要求を返す。実行・履歴・停止の管理はアプリが担う。'}</text>
  </SceneBase>
}

export function AgentLoop({ children }) {
  const [response, setResponse] = useState('tool')
  const [boundary, setBoundary] = useState('continue')
  const [toolResult, setToolResult] = useState('success')
  const stages = LOOP_STAGES.map((item, index) => {
    const frame = loopFrame(index, response, boundary, toolResult)
    return { ...item, title: frame.title, formula: frame.formula, detail: frame.detail }
  })
  return <ReadingFigure diagramId="agent-loop" title="Agent ループ" eyebrow="AGENT LOOP / CONTROL FLOW" stages={stages} className="concept-walkthrough"
    renderScene={state => <LoopScene {...state} response={response} boundary={boundary} toolResult={toolResult} />}
    renderControls={({ ready }) => <div className="cd-controls">
      <Select label="応答の種類" value={response} onChange={setResponse} ready={ready}>{RESPONSE_OPTIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
      <div className="cd-control-pair">
        {response === 'tool' && <Select label="ツール結果" value={toolResult} onChange={setToolResult} ready={ready}><option value="success">成功</option><option value="failure">失敗</option></Select>}
        {['tool', 'continue'].includes(response) && <Select label="アプリの停止条件" value={boundary} onChange={setBoundary} ready={ready}><option value="continue">継続できる</option><option value="stop">上限に達した</option></Select>}
      </div>
    </div>}
    footnote="本文の制御構造を示す概念図。応答に応じて通る経路が変わります。">{children}</ReadingFigure>
}
