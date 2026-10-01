'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Tokens, Wire, Select } from './agent-concepts-primitives'
import { memoryPlacement } from '../../lib/agent-concepts-model.mjs'

export function MemoryLayers({ children }) {
  return <AgentConceptFigure diagram="memory-layers" title="入力・作業状態・長期記憶の置き場所"
    scene={state => <Canvas diagram="memory-layers" {...state}>{f => <>
      <Text y={35}>情報はアプリが管理し、必要な分を入力へ</Text>
      <rect x="23" y="65" width="373" height="336" rx="16" className="ac-boundary" />
      <Text x={210} y={93} small>アプリケーションが管理</Text>
      {[
        ['短期記憶', '会話履歴・ツール結果'], ['作業状態', '計画・進捗・決定'], ['長期記憶', '好み・ナレッジ']
      ].map(([title, detail], i) => <g key={title}>
        <Box x={42} y={112 + i * 89} width={272} height={73} title={title} lines={[detail]} tone={i === 0 ? 'teal' : i === 1 ? 'amber' : 'violet'} active={f.stage === i + 1 || f.stage === 0} />
        <Wire id={state.id} d={`M314 ${149 + i * 89}H365V219H424`} active={f.stage === i + 1 || f.stage === 0} phase={f.phase} tone={i === 0 ? 'teal' : i === 1 ? 'amber' : 'violet'} />
      </g>)}
      <Text x={349} y={372} small>選ぶ</Text>
      <Box x={430} y={111} width={178} height={68} title="LLM呼出し①" active={f.stage === 0} />
      <Box x={430} y={197} width={178} height={90} title="LLM呼出し②" lines={['入力された情報']} />
      <path d="M513 181L525 193M525 181L513 193" stroke="#f5a697" strokeWidth="2" />
      <Text x={521} y={337} small>{['呼出し間の', '自動の記憶はない']}</Text>
      {f.stage < 4 ? <Text y={422} small>{['入力を毎回構築する', '1タスク〜1セッション', 'タスクの開始〜完了', 'セッション横断'][f.stage]}</Text> : <>
        <rect x="32" y="108" width="360" height="81" rx="10" fill="#112333" stroke="#f1c27e" strokeWidth="2" />
        <Text x={211} y={136}>増え続ける履歴</Text>
        <Text x={211} y={165} small>上限 / コスト / 品質</Text>
        <Text y={422} small>大きな入力枠があっても、全部入れるとは限らない</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function MemoryLifecycle({ children }) {
  const [kind, setKind] = useState('current')
  return <AgentConceptFigure diagram="memory-lifecycle" title="必要な情報を残し、中断後の入力を再構築する"
    controls={({ stage, ready }) => stage === 6 && <Select label="情報の性質" value={kind} onChange={setKind} ready={ready}>
      <option value="current">毎ターン参照する</option><option value="reference">ときどき参照する</option><option value="progress">再開・監視に必要</option><option value="preference">セッションを越えて使う</option>
    </Select>}
    scene={state => <Canvas diagram="memory-lifecycle" {...state}>{f => <>
      {f.stage < 3 && <>
        <Text y={34}>{['古いログを落とす', '古いターンを要約に置き換える', '大きな成果物を外へ置く'][f.stage]}</Text>
        <Box x={32} y={65} width={576} height={79} title="圧縮後も必ず残す情報" lines={['ユーザー指示 / 制約 / 決定']} tone="amber" />
        <Text x={115} y={190} small>元の履歴</Text><Text x={470} y={190} small>圧縮後の入力</Text>
        <Tokens labels={['結果', 'ログ', '成果物']} start={32} width={245} y={214} />
        <Wire id={state.id} d="M279 238H354" active phase={f.phase} tone="amber" />
        <Box x={364} y={211} width={244} height={70} title={['必要な情報のみ', '要約', '成果物への参照'][f.stage]} />
        {f.stage === 2 ? <>
          <Box x={55} y={327} width={245} height={64} title="ファイル / DB" tone="violet" />
          <Wire id={state.id} d="M485 281V358H305" active phase={f.phase} both tone="violet" />
          <Text x={460} y={331} small>読み出しツール</Text>
        </> : <Text y={342} small>{f.stage === 0 ? ['落としてよい情報はタスク依存', '残すべき情報を先に決める'] : ['要約は損失圧縮', '制約や決定が消えていないか確認']}</Text>}
      </>}
      {f.stage === 3 || f.stage === 4 ? <>
        <Text y={35}>{f.stage === 3 ? '生ログとは別に、作業状態を保存する' : '完了位置を残して、必要な入力から再開する'}</Text>
        <Box x={32} y={76} width={252} height={89} title="経緯の要約" lines={['何をしてきたか']} />
        <Box x={32} y={212} width={252} height={166} title="構造化した作業状態" lines={['完了したステップ', '残りのステップ', '成果物の場所 / 決定']} tone="amber" />
        <Wire id={state.id} d="M284 120H328V215H364" active={f.stage === 4} phase={f.phase} />
        <Wire id={state.id} d="M284 293H328V236H364" active phase={f.phase} tone="amber" />
        <Box x={371} y={174} width={237} height={118} title={f.stage === 3 ? 'チェックポイント' : '新しいコンテキスト'} lines={f.stage === 3 ? ['中断後も使える保存先'] : ['次の作業を判断', '全履歴の再投入は不要']} tone="violet" />
        <Text y={413} small>{f.stage === 3 ? '保存するだけでなく、再構築できる形へ' : '会話の生ログだけを再開状態の代わりにしない'}</Text>
      </> : null}
      {f.stage === 5 && <>
        <Text y={35}>読み出しと書き込みに、別々の設計が要る</Text>
        <Box x={210} y={80} width={220} height={76} title="長期記憶" lines={['ファイル / DB / 検索']} tone="violet" />
        <Wire id={state.id} d="M255 156V196H167V221" active phase={f.phase} />
        <Box x={32} y={228} width={270} height={99} title="読み出し" lines={['検索・必要な情報の選択']} />
        <Wire id={state.id} d="M474 228V196H388V161" active phase={f.phase} tone="amber" />
        <Box x={338} y={228} width={270} height={99} title="書き込み" lines={['何を / どの粒度で / いつ']} tone="amber" />
        <Text y={381} small>{['検索の設計はRAGと共通', 'すべてを保存すると、ノイズが増える']}</Text>
      </>}
      {f.stage === 6 && <>
        <Text y={35}>情報の性質から、置き場所を選ぶ</Text>
        <Box x={70} y={94} width={500} height={80} title={memoryPlacement(kind)[1]} />
        <Wire id={state.id} d="M320 174V229" active phase={f.phase} />
        <Box x={70} y={236} width={500} height={80} title={memoryPlacement(kind)[0]} tone="violet" />
        <Text y={377} small>{['外に置いた情報は、必要な分を読み出して渡す', '保存先と、毎回渡すコンテキストを区別する']}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
