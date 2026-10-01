'use client'
import { useState } from 'react'
import { ActionFigure, ActionCanvas, Text, Box, Wire, Select } from './action-boundaries-primitives'
import { retryBoundary } from '../../lib/action-boundaries-model.mjs'
export function ErrorLayerRouting({ children }) {
  const labels = ['エラーを分類','コードで処理','モデルへ観測','コードで検証','上限で停止']
  const actors = ['処理主体を決める','再試行可能性を確認','引数修正・代替を判断','エラーを添えて再生成','途中経過を人へ渡す']
  return <ActionFigure diagram="error-layer-routing" title="4層の失敗を、処理できる主体へ渡す"
    scene={s => <ActionCanvas diagram="error-layer-routing" {...s}>{f => <>
      <Text y={35}>{['決定論的な回復と、判断による回復','インフラ：一時障害でも、副作用を確認','ツール：モデルが修正を判断できる','モデル出力：検証して、エラーを返す','タスク：行き詰まりを止め、人へ渡す'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={107} width={260} height={147} title="コード" lines={['待機・検証・停止', '決定論的な処理']} /><Box x={348} y={107} width={260} height={147} title="モデル" lines={['引数修正・代替の判断', '失敗を観測として読む']} tone="violet" />
        <Text y={341} small>{['すべてモデルへ任せない。一律に再試行しない', '層ごとに、処理の主体・上限・報告先を決める']}</Text>
      </> : <>
        <Box x={32} y={95} width={260} height={144} title={labels[f.stage]} lines={[
          ['','レート制限・一時障害','引数・対象・権限','形式不正・指示違反','堂々巡り・目標未達'][f.stage],
          ['','副作用の成否を確認','修正で直るかを判断','コードが検出','コードが停止'][f.stage]
        ]} tone="violet" /><Wire id={s.id} d="M292 167H340" active phase={f.phase} />
        <Box x={348} y={95} width={260} height={144} title={actors[f.stage]} lines={[
          ['','上限付きで待機','回復・権限を保証しない','再生成も上限付き','試したことと残り'][f.stage]
        ]} tone={f.stage === 4 ? 'amber' : 'teal'} />
        <Box x={100} y={296} width={440} height={88} title={f.stage === 1 ? '結果不明は、安全な契約を確認' : f.stage === 2 ? '同じ失敗の繰り返しは停止' : f.stage === 3 ? 'エラー内容を、次の入力へ' : '未完了を成功として報告しない'} tone="amber" />
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
export function RetryRecoveryBoundaries({ children }) {
  const [contract,setContract] = useState('unknown'), [limit,setLimit] = useState('remaining')
  const retry = retryBoundary(contract, { remaining: limit === 'exhausted' ? 0 : 1, repeated: limit === 'repeated' })
  return <ActionFigure diagram="retry-and-recovery-boundaries" title="再送できる条件、止めた後に残す価値"
    controls={({ stage, ready }) => stage <= 2 && <>
      <Select label="副作用の再試行契約" value={contract} onChange={setContract} ready={ready}><option value="idempotent">受信側の同じ冪等キー</option><option value="atomic">同一DBの原子操作</option><option value="unknown">結果不明・契約なし</option></Select>
      {stage === 2 && <Select label="再試行の停止条件" value={limit} onChange={setLimit} ready={ready}><option value="remaining">再試行可能・回数あり</option><option value="exhausted">上限に到達</option><option value="repeated">同じ失敗を反復</option></Select>}
    </>}
    scene={s => <ActionCanvas diagram="retry-and-recovery-boundaries" {...s}>{f => <>
      <Text y={35}>{['重複排除と、副作用の更新を一緒に扱う','送信後に止まると、成功か失敗か不明になる','安全な契約があっても、上限で止める','簡易な経路へ縮退し、制限を説明する','成果と現在地を保存して、人へ渡す','成功と未完了を、明確に分けて表示する'][f.stage]}</Text>
      {f.stage <= 2 ? <>
        <Box x={32} y={105} width={260} height={136} title={contract === 'unknown' ? '外部の結果が不明' : '重複を防ぐ契約'} lines={contract === 'unknown' ? ['送信後・記録前に停止', '未実行を確定できない'] : contract === 'idempotent' ? ['受信側が冪等キーを受理', '同じキーを再利用'] : ['重複排除と更新を', '1トランザクションに']} tone="violet" />
        <Wire id={s.id} d="M292 173H340" active={retry.automaticRetry} phase={f.phase} tone={retry.automaticRetry ? 'teal' : 'amber'} />
        <Box x={348} y={105} width={260} height={136} title={retry.label} lines={retry.automaticRetry ? ['再試行可能・上限内', '同じ操作の重複を防ぐ'] : contract === 'unknown' ? ['業務IDなどで照合', '確定できなければ人へ'] : ['途中経過を保存', '上位へ通知・人へ']} tone={retry.automaticRetry ? 'teal' : 'amber'} data-automatic-retry={String(retry.automaticRetry)} />
        <Text y={325} small>{contract === 'unknown' ? ['事前の照会だけで、同時実行を防げない', '人の承認だけで、二重実行は防げない'] : ['コードとモデルの、両方に再試行の上限', '同一ツール・引数・エラーの反復でも停止']}</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={119} width={260} height={123} title="Agentが失敗" lines={['提供できる価値を確認']} tone="amber" /><Wire id={s.id} d="M292 180H340" active phase={f.phase} />
        <Box x={348} y={119} width={260} height={123} title="固定Workflowなど" lines={['定型応答・FAQ', '簡易版へ切替']} />
        <Text y={334} small>{['利用できる機能と制限を伝える', '縮退した結果を、完全な達成に見せない']}</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={92} width={260} height={168} title="保全した部分結果" lines={['どこまで終えたか', '試したこと・失敗理由', '残りの作業']} /><Wire id={s.id} d="M292 176H340" active phase={f.phase} />
        <Box x={348} y={92} width={260} height={168} title="人への引き継ぎ" lines={['判断に必要な要約', '成果物と参照']} tone="violet" />
        <Text y={348} small>途中の成果を残し、生ログだけを押し付けない</Text>
      </> : <>
        <Box x={68} y={95} width={504} height={217} title="ユーザーへ見せる状態" lines={['完了した部分', '失敗・未完了の部分', '次にできること']} tone="amber" />
        <Text y={385} small>失敗を握りつぶして、「完了しました」と表示しない</Text>
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
