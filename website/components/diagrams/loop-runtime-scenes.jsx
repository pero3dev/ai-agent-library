'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Tokens, Wire, Select } from './agent-concepts-primitives'
import { loopResponse } from '../../lib/screen-loop-model.mjs'

export function LoopStopReasons({ children }) {
  const [reason, setReason] = useState('truncated')
  return <AgentConceptFigure diagram="loop-stop-reasons" title="停止理由・有効な応答・途中経過を分ける"
    controls={({ stage, ready }) => stage === 1 && <Select label="モデル応答の停止理由" value={reason} onChange={setReason} ready={ready}><option value="complete">正常終了と有効な最終応答</option><option value="tool">完全なツール要求</option><option value="truncated">生成上限による打ち切り</option><option value="refused">拒否</option><option value="continue">継続可能な停止</option></Select>}
    scene={state => <Canvas diagram="loop-stop-reasons" {...state}>{f => <>
      <Text y={35}>{['「ツール要求なし」だけでは完了しない','停止理由と、応答の妥当性を確認する','コード側の上限でループを止める','回復不能な失敗は、実行済み操作も報告','人の介入でも、状態を保存する','再開しても、上限の外には出ない'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['正常完了','上限到達','回復不能な失敗','人の介入'].map((label, i) => <Box key={label} x={32 + (i % 2) * 316} y={89 + Math.floor(i / 2) * 143} width={260} height={103} title={label} lines={[[ '成果物を返す' ],[ '途中経過と理由' ],[ '操作とエラーを報告' ],[ '状態を保存する' ]][i]} tone={i ? 'amber' : 'teal'} />)}
        <Text y={400} small>APIの終了理由と、業務の成功条件は別に確認する</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={108} width={240} height={108} title="応答を分類する" lines={['本文 ＋ 停止理由']} />
        <Wire id={state.id} d="M272 162H350" active phase={f.phase} tone={loopResponse(reason).completed ? 'teal' : 'amber'} />
        <Box x={358} y={108} width={250} height={108} title={loopResponse(reason).action} lines={[loopResponse(reason).completed ? '正常完了の応答' : '正常完了とは分ける']} tone={loopResponse(reason).completed ? 'teal' : 'amber'} data-loop-complete={String(loopResponse(reason).completed)} data-loop-execute={String(loopResponse(reason).execute)} />
        <Text y={322} small>{['不完全なツール要求を実行しない', '停止理由の値は採用APIの契約へ対応づける']}</Text>
      </> : f.stage === 2 ? <>
        <Tokens labels={['ステップ', '時間', '費用', '出力・入力']} y={85} selected={[0,1,2,3]} tone="amber" />
        <Wire id={state.id} d="M320 132V200" active phase={f.phase} tone="amber" />
        <Box x={112} y={208} width={416} height={107} title="上限到達で強制終了" lines={['途中経過 ＋ 未完了理由']} tone="amber" />
        <Text y={388} small>最終応答を待ち続ける構成にしない</Text>
      </> : f.stage === 5 ? <>
        <rect x="36" y="81" width="568" height="291" rx="17" fill="none" stroke="#f1c27e" strokeDasharray="6 5" />
        <Text y={112} small>ステップ・時間・費用の上限の内側</Text>
        <Box x={59} y={172} width={235} height={100} title="履歴を維持" lines={['途中状態を引き継ぐ']} />
        <Wire id={state.id} d="M294 223H338" active phase={f.phase} /><Box x={346} y={172} width={235} height={100} title="モデルを再開" lines={['次の呼び出しへ']} tone="violet" />
        <Wire id={state.id} d="M463 272V318H176V272" active phase={f.phase} dash />
        <Text y={407} small>再開回数にも上限を適用する</Text>
      </> : <>
        <Box x={32} y={106} width={250} height={114} title={f.stage === 3 ? '認証失敗・対象消失' : 'キャンセル・承認拒否'} lines={['ループを止める']} tone="amber" />
        <Wire id={state.id} d="M282 163H350" active phase={f.phase} tone="amber" />
        <Box x={358} y={106} width={250} height={114} title="状態と理由を残す" lines={['実行済み操作', '途中結果 / 未完了理由']} />
        <Text y={330} small>{f.stage === 3 ? '回復できるツールエラーとは分ける' : '途中経過を捨てず、再開可能にする'}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function LoopRuntime({ children }) {
  return <AgentConceptFigure diagram="loop-runtime" title="失敗・履歴・制御の責務を、元のコードに結びつける"
    scene={state => <Canvas diagram="loop-runtime" {...state}>{f => <>
      <Text y={35}>{['失敗も、モデルへの観測になる','履歴は、周回のたびに積み重なる','抽象の下の制御を確認する','分類してから実行し、結果を戻す','各周回の記録と、停止時の報告'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={98} width={244} height={104} title="ツールの失敗" lines={['引数違い / 対象なし']} tone="amber" />
        <Wire id={state.id} d="M276 150H356" active phase={f.phase} tone="amber" />
        <Box x={364} y={98} width={244} height={104} title="履歴に結果を追記" lines={['エラーを観測として返す']} />
        <Wire id={state.id} d="M486 202V283H327" active phase={f.phase} /><Box x={32} y={249} width={287} height={91} title="モデルの次の判断" lines={['引数修正 / 別の手段']} tone="violet" />
        <Text y={408} small>回復不能なら停止 ／ 再試行の二重実行にも注意</Text>
      </> : f.stage === 1 ? <>
        {Array.from({ length: 3 }, (_, i) => <g key={i}><Text x={83} y={106 + i * 88} small>{i + 1}周目</Text><Tokens labels={['指示', ...Array.from({ length: i + 1 }, (_, j) => `応答${j + 1}`), '結果']} y={76 + i * 88} start={140} width={465} selected={[i + 2]} /></g>)}
        <Box x={92} y={342} width={456} height={69} title="刈り込み・要約・外部化を設計する" tone="amber" />
      </> : f.stage === 2 ? <>
        <Box x={32} y={96} width={260} height={118} title="自前のループ" lines={['制御・ログ・権限を所有', '周辺機能を作り込む']} /><Box x={348} y={96} width={260} height={118} title="フレームワーク" lines={['標準機能を利用', 'デフォルトを確認する']} tone="violet" />
        <Box x={92} y={287} width={456} height={100} title="責務は抽象の下にも残る" lines={['停止 / リトライ / 履歴 / 監視']} tone="amber" />
      </> : f.stage === 3 ? <>
        <Box x={32} y={76} width={255} height={65} title="応答を保存" />
        <Wire id={state.id} d="M160 141V197" active phase={f.phase} />
        <Box x={32} y={205} width={255} height={65} title="停止理由を分類" />
        <Wire id={state.id} d="M160 270V326" active phase={f.phase} tone="amber" />
        <Text x={160} y={306} small>完全なツール要求なら</Text>
        <Box x={32} y={334} width={255} height={65} title="検証して実行" tone="amber" />
        <Wire id={state.id} d="M287 238H315V108H345" active phase={f.phase} />
        <Box x={353} y={76} width={255} height={65} title="正常完了は返す" />
        <Wire id={state.id} d="M287 238H345" active phase={f.phase} tone="violet" />
        <Box x={353} y={205} width={255} height={65} title="継続は上限内で再開" tone="violet" />
        <Wire id={state.id} d="M287 366H345" active phase={f.phase} tone="amber" />
        <Box x={353} y={334} width={255} height={65} title="結果を履歴に追記" />
        <Text y={421} small>打ち切りや拒否は、途中出力を保って報告する</Text>
      </> : <>
        <Box x={32} y={104} width={250} height={122} title="周回ごとの記録" lines={['入力 / 応答 / ツール結果', '実行した操作']} />
        <Wire id={state.id} d="M282 165H350" active phase={f.phase} /><Box x={358} y={104} width={250} height={122} title="停止時の報告" lines={['成果物 or 途中結果', '停止理由 / 未完了理由']} tone="amber" />
        <Text y={327} small>未完了でも、途中の作業結果を捨てない</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
