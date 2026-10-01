'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { toolExchange } from '../../lib/agent-concepts-model.mjs'

export function ToolExecution({ children }) {
  const [permission, setPermission] = useState('allow'), [result, setResult] = useState('success'), [next, setNext] = useState('final')
  return <AgentConceptFigure diagram="tool-execution" title="要求と実行を分け、結果を判断へ戻す"
    controls={({ stage, ready }) => <>
      {stage >= 2 && <Select label="アプリの検証" value={permission} onChange={setPermission} ready={ready}><option value="allow">通過</option><option value="deny">拒否</option></Select>}
      {stage >= 4 && permission === 'allow' && <Select label="ツール実行の結果" value={result} onChange={setResult} ready={ready}><option value="success">成功</option><option value="failure">失敗</option></Select>}
      {stage === 6 && <Select label="結果を受けた判断" value={next} onChange={setNext} ready={ready}><option value="final">最終応答</option><option value="request">次のツール要求</option></Select>}
    </>}
    scene={state => <Canvas diagram="tool-execution" {...state}>{f => {
      const exchange = toolExchange(f.stage, { permitted: permission === 'allow', success: result === 'success', next: next === 'request' })
      const rows = [
        [98, 320, '定義＋入力', 'teal'], [320, 98, '名前＋引数の要求', 'violet'],
        [98, 98, permission === 'allow' ? '引数・権限を検証' : '検証で拒否', 'amber'],
        [98, 548, permission === 'allow' ? 'アプリが実行' : '実行しない', 'teal'],
        [548, 98, permission === 'allow' ? exchange.outcome ?? '実行結果' : '検証拒否を観測に', 'amber'],
        [98, 320, '結果を履歴へ', 'amber'], [320, 98, exchange.nextRequest ? '次の要求' : '最終応答', 'violet']
      ]
      return <>
        <Text y={32}>モデル → アプリ → ツール の境界</Text>
        {[['アプリ', 98], ['LLM', 320], ['ツール', 548]].map(([title, x]) => <g key={title}>
          <Box x={x - 68} y={55} width={136} height={50} title={title} tone={title === 'LLM' ? 'violet' : 'teal'} />
          <path d={`M${x} 108V379`} stroke="#6e899f" strokeDasharray="4 5" opacity=".55" />
        </g>)}
        {rows.map(([from, to, label, tone], i) => {
          const y = 136 + i * 38, blocked = permission === 'deny' && (i === 3 || i === 4)
          return <g key={i} opacity={i > f.stage ? .25 : blocked ? .35 : 1} data-tool-message={i} data-delivered={String(i <= f.stage && !blocked)}>
            {i === 2 ? <>
              <Wire id={state.id} d={`M98 ${y - 9}H142V${y + 7}H101`} active={f.stage === i} phase={f.phase} tone={tone} />
              <Text x={300} y={y} small>{label}</Text>
            </> : <>
              <Text x={(from + to) / 2} y={y - 9} small>{label}</Text>
              <Wire id={state.id} d={`M${from} ${y}H${to}`} active={f.stage === i && !blocked} dash={i === 1 || i === 4 || i === 6} phase={f.phase} tone={tone} />
              {blocked && <Text x={528} y={y - 9} small>×</Text>}
            </>}
          </g>
        })}
        <Text y={409} small>{exchange.observation ? `モデルへ返す観測: ${exchange.observation}` : f.stage >= 2 && permission === 'deny' ? '拒否された要求は、ツールへ進まない' : '実行前の制御をアプリケーションに置く'}</Text>
      </>
    }}</Canvas>}>{children}</AgentConceptFigure>
}

export function ToolContract({ children }) {
  const [observation, setObservation] = useState('0'), [connection, setConnection] = useState('custom'), [granularity, setGranularity] = useState('purpose')
  return <AgentConceptFigure diagram="tool-contract" title="定義・観測・ツールの粒度を設計する"
    controls={({ stage, ready }) => stage === 3 ? <Select label="返す結果の種類" value={observation} onChange={setObservation} ready={ready}>
      {['成功', '失敗', '大きい結果'].map((name, i) => <option value={i} key={name}>{name}</option>)}
    </Select> : stage === 4 ? <Select label="ツールの接続" value={connection} onChange={setConnection} ready={ready}><option value="custom">自前定義</option><option value="mcp">MCP</option></Select>
      : stage === 5 && <Select label="ツールを切る粒度" value={granularity} onChange={setGranularity} ready={ready}><option value="purpose">判断させたい境界</option><option value="fine">細かすぎる</option><option value="coarse">粗すぎる</option></Select>}
    scene={state => <Canvas diagram="tool-contract" {...state}>{f => <>
      {f.stage < 3 && <>
        <Text y={35}>search_expenses の定義を要求へつなぐ</Text>
        {[
          ['名前', 'search_expenses'], ['説明', '照会専用 / 申請・修正不可'], ['入力スキーマ', 'employee_id / month']
        ].map(([title, detail], i) => <g key={title} opacity={f.stage === 0 || f.stage === i ? 1 : .4}>
          <Box x={32} y={78 + i * 97} width={308} height={79} title={title} lines={[detail]} tone={i === 1 ? 'amber' : 'teal'} />
          <Wire id={state.id} d={`M340 ${118 + i * 97}H382V217H418`} active={f.stage === 0 || f.stage === i} phase={f.phase} />
        </g>)}
        <Box x={425} y={164} width={180} height={112} title="構造化要求" lines={['名前＋引数', 'アプリ側で検証']} tone="violet" />
        <Text y={403} small>{f.stage === 1 ? '用途と制約を、名前だけから推測させない' : f.stage === 2 ? 'month: YYYY-MM ／ 必須項目を指定' : '名前だけでは、用途・制約・引数は伝わらない'}</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={35}>結果が次の判断の「観測」になる</Text>
        <Box x={158} y={78} width={324} height={70} title={['成功した結果', '失敗した結果', '大きい結果'][Number(observation)]} tone="amber" />
        <Wire id={state.id} d="M320 148V188" active phase={f.phase} tone="amber" />
        <Box x={75} y={196} width={490} height={90} title={['必要なフィールドに絞る', '原因と修正方法を返す', '制限・要約・ページング'][Number(observation)]} lines={['生レスポンスの全量ダンプを避ける', '例: month は YYYY-MM 形式', '次に読める範囲も設計する'].slice(Number(observation), Number(observation) + 1)} />
        <Wire id={state.id} d="M320 286V326" active phase={f.phase} />
        <Box x={222} y={333} width={196} height={61} title="次の判断へ" tone="violet" />
      </>}
      {f.stage === 4 && <>
        <Text y={35}>接続方式が変わっても、実行主体はアプリ</Text>
        <Box x={32} y={90} width={170} title="LLM" tone="violet" />
        <Wire id={state.id} d="M202 122H232" active phase={f.phase} tone="violet" />
        <Box x={240} y={90} width={170} title="アプリ" />
        <Wire id={state.id} d="M410 122H439" active phase={f.phase} />
        <Box x={446} y={90} width={162} title="ツール" />
        <Text x={219} y={188} small>要求</Text><Text x={429} y={188} small>実行</Text>
        <Box x={240} y={228} width={170} height={93} title={connection === 'mcp' ? 'MCPで接続' : '自前で定義'} lines={['定義と結果の接続']} tone="amber" />
        <Wire id={state.id} d="M325 228V160" active phase={f.phase} tone="amber" />
        <Text y={378} small>{['引数・権限・承認の確認は必要', '製品別の接続仕様は本文の参照先で確認']}</Text>
      </>}
      {f.stage === 5 && <>
        <Text y={35}>モデルへ任せる判断と、コードで済ませる処理</Text>
        <Box x={160} y={77} width={320} height={64} title="LLMの判断" tone="violet" />
        <Wire id={state.id} d="M320 141V184" active phase={f.phase} />
        {granularity === 'fine' ? <>
          {['API①', 'API②', 'API③', '…'].map((name, i) => <Box x={32 + i * 147} y={192} width={135} height={60} title={name} key={name} />)}
          <Text y={298} small>毎回、呼び出す順序も推論する</Text>
        </> : <>
          <Box x={72} y={192} width={496} height={92} title={granularity === 'coarse' ? 'do_anything(action: string)' : '目的に応じた機能＋入力スキーマ'} lines={[granularity === 'coarse' ? '万能入力では検証の制約が弱い' : '整形・集計・入力検証は内部コードへ']} tone={granularity === 'coarse' ? 'coral' : 'teal'} />
        </>}
        <Text y={377} small>{['必要なツールセットに絞る', 'ツール数・粒度は、タスクに合わせて設計する']}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
