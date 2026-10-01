'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { planningTrigger, reflectionTransition } from '../../lib/agent-design-model.mjs'

export function PlanningPatterns({ children }) {
  const [reason, setReason] = useState('continue')
  const reflection = reflectionTransition(reason)
  return <AgentConceptFigure diagram="planning-patterns" title="全体の計画と各ステップの判断を組み合わせる"
    controls={({ stage, ready }) => stage === 3 && <Select label="検品の終了条件" value={reason} onChange={setReason} ready={ready}>
      <option value="continue">修正を続ける</option><option value="complete">完了条件を満たす</option><option value="limit">回数上限に達する</option><option value="small">改善幅が小さい</option>
    </Select>}
    scene={state => <Canvas diagram="planning-patterns" {...state}>{f => <>
      <Text y={34}>{f.stage === 0 ? '複数ステップの構造 ／ 一つの判断の深さ' : f.stage === 4 ? '全体を計画し、各手で判断、最後に検品' : ['','観測を使って、次の一手を選び直す','計画を持ち、結果から見直す','評価から修正へ。条件を満たしたら止める'][f.stage]}</Text>
      {f.stage === 4 ? <>
        <Box x={190} y={76} width={260} height={67} title="全体の事前計画" tone="violet" />
        <Wire id={state.id} d="M320 143V180" active phase={f.phase} tone="violet" />
        <rect x="28" y="188" width="584" height="106" rx="14" className="ac-boundary" />
        <Text x={40} y={211} small anchor="start">各ステップの中</Text>
        {['判断', '行動', '観測'].map((label, i) => <Box key={label} x={61 + i * 184} y={225} width={148} height={54} title={label} />)}
        {[0, 1].map(i => <Wire key={i} id={state.id} d={`M${209 + i * 184} 252H${239 + i * 184}`} active phase={f.phase} />)}
        <Wire id={state.id} d="M577 242H624V110H450" active phase={f.phase} tone="violet" dash />
        <Wire id={state.id} d="M320 294V330" active phase={f.phase} tone="amber" />
        <Box x={140} y={337} width={360} height={65} title="最後に成果物を検品" tone="amber" />
      </> : [
        ['逐次判断', ['判断', '行動', '観測']], ['事前計画', ['計画', '実行', '状態更新']], ['検品', ['成果物', '評価', reflection.revise ? '修正' : '終了']]
      ].map(([name, labels], row) => {
        const active = f.stage === 0 || f.stage === row + 1 || f.stage === 4
        const y = 80 + row * 106
        return <g key={name} opacity={active ? 1 : .3}>
          <Text x={24} y={y + 33} small anchor="start">{name}</Text>
          {labels.map((label, i) => <Box key={i} x={156 + i * 160} y={y} width={124} height={54} title={label} tone={row === 2 ? 'amber' : row === 1 ? 'violet' : 'teal'} />)}
          {[0, 1].map(i => <Wire key={i} id={state.id} d={`M${280 + i * 160} ${y + 27}H${310 + i * 160}`} active={active} phase={f.phase} tone={row === 2 ? 'amber' : 'teal'} />)}
          <Wire id={state.id} d={`M538 ${y + 54}V${y + 74}H218V${y + 54}`} active={active && (row !== 2 || reflection.revise)} phase={f.phase} tone={row === 2 ? 'amber' : 'violet'} dash />
          <Text x={375} y={y + 96} small>{row === 0 ? '探索的な次の手' : row === 1 ? '見直しの仕組みが必要' : reflection.label}</Text>
        </g>
      })}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function PlanningMaintenance({ children }) {
  const [trigger, setTrigger] = useState('step')
  const [strength, setStrength] = useState('0')
  return <AgentConceptFigure diagram="planning-maintenance" title="計画を状態として維持し、次の入力へ戻す"
    controls={({ stage, ready }) => stage === 2 ? <Select label="計画を見直す契機" value={trigger} onChange={setTrigger} ready={ready}>
      <option value="step">ステップ完了</option><option value="failure">失敗</option><option value="information">新情報</option>
    </Select> : stage === 4 && <Select label="計画の持たせ方" value={strength} onChange={setStrength} ready={ready}>
      <option value="0">逐次判断</option><option value="1">プロンプトで誘導</option><option value="2">構造として強制</option>
    </Select>}
    scene={state => <Canvas diagram="planning-maintenance" {...state}>{f => <>
      {f.stage < 4 ? <>
        <Text y={35}>{f.stage === 3 ? '推論の深さと、進捗管理を分ける' : '計画を作り、参照し、見直す'}</Text>
        <Box x={32} y={78} width={252} height={84} title="会話履歴の計画" lines={['参照されなくなる']} tone="coral" active={f.stage === 0} />
        <Text x={309} y={127} tone="coral">×</Text>
        <Box x={349} y={78} width={259} height={84} title="構造化した作業状態" lines={['計画 / 完了 / 残り']} tone="amber" />
        <Wire id={state.id} d="M479 162V205" active={f.stage >= 1} phase={f.phase} tone="amber" />
        <Box x={349} y={211} width={259} height={90} title="次の判断" lines={[f.stage === 3 ? '単発の判断は推論を強化' : '毎ターンの入力に含める']} tone="violet" />
        <Wire id={state.id} d="M349 257H292" active={f.stage >= 1} phase={f.phase} />
        <Box x={32} y={216} width={252} height={85} title={f.stage === 2 ? planningTrigger(trigger).label : '実行と結果'} lines={['状態を更新する']} />
        <Wire id={state.id} d="M158 301V352H626V119H608" active={f.stage === 2} phase={f.phase} tone="amber" dash />
        <Text y={390} small>{f.stage === 2 ? '新しい前提で計画を見直してから、次の入力へ' : f.stage === 3 ? '一つの判断が深くなっても、計画の維持は必要' : '生ログだけに頼らず、計画を毎ターン参照する'}</Text>
      </> : f.stage === 4 ? <>
        <Text y={35}>タスクに対し、必要な強さを選ぶ</Text>
        {[
          ['逐次判断', '数ステップのタスク'], ['手順列挙の指示', '中規模タスク'], ['専用の計画ステップ', '長時間・高信頼のタスク']
        ].map(([label, use], i) => <g key={label} opacity={Number(strength) === i ? 1 : .3}>
          <Box x={32} y={82 + i * 96} width={263} height={76} title={label} tone="violet" />
          <Wire id={state.id} d={`M295 ${120 + i * 96}H335`} active={Number(strength) === i} phase={f.phase} />
          <Box x={343} y={82 + i * 96} width={265} height={76} title={use} />
        </g>)}
        <Text y={414} small>足りない証拠が出てから、計画の制御を強める</Text>
      </> : <>
        <Text y={35}>終了条件を、計画と検品の両方へ</Text>
        <Box x={32} y={92} width={260} height={120} title="各ステップ" lines={['判定できる完了条件', '完了を状態へ反映']} />
        <Box x={348} y={92} width={260} height={120} title="リフレクション" lines={['回数上限', '改善幅による終了']} tone="amber" />
        <Wire id={state.id} d="M162 212V262H278V289" active phase={f.phase} /><Wire id={state.id} d="M478 212V262H362V289" active phase={f.phase} tone="amber" />
        <Box x={180} y={297} width={280} height={69} title="継続か停止を管理" tone="violet" />
        <Text y={409} small>「もう少し良くする」を無期限に繰り返さない</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
