'use client'
import { useState } from 'react'
import { ContractFigure,ContractCanvas,Text,Box,Wire,Select } from './durable-contract-primitives'
import { requestIdempotency,approvalScope } from '../../lib/durable-tenant-api-model.mjs'

export function AgentApiJobStates({children}) {
  const [status,setStatus]=useState('awaiting_approval')
  const statuses=[['queued','受付'],['running','実行'],['awaiting_approval','承認待ち'],['succeeded','成功'],['partial','部分成功'],['failed','失敗'],['canceled','キャンセル']]
  return <ContractFigure diagram="agent-api-job-states" title="受付を完了にせず、途中状態と項目別結果を公開する"
    controls={({stage,ready})=>stage===2?<Select label="照会で返すジョブの状態" value={status} onChange={setStatus} ready={ready}>{statuses.map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}
    scene={s=><ContractCanvas diagram="agent-api-job-states" {...s}>{f=><>
      <Text y={35}>{['内部の実行モデルを、外部の約束へ写す','HTTP の受付と、ジョブの最終結果を分ける','途中・部分成功・承認待ちも、照会できる状態へ','成功分まで、全件やり直させない','承認する権限・対象・期限を契約にする','エラーを、呼出し側が機械で分岐できる形へ'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={102} width={260} height={149} title="内部の能力" lines={['長い実行・再開', '部分成功・途中状態']} tone="violet"/><Wire id={s.id} d="M292 177H340" active phase={f.phase}/><Box x={348} y={102} width={260} height={149} title="外部APIの契約" lines={['入力・状態・結果', '再送・互換性・上限']} />
        <Text y={345} small>内部で実現できない保証を、外部へ約束しない</Text>
      </>:f.stage===1?<>
        <Box x={32} y={99} width={260} height={113} title="202 Accepted" lines={['受付済み・処理は未完了']} tone="violet" data-accepted-final-success="false"/><Wire id={s.id} d="M292 155H340" active phase={f.phase}/><Box x={348} y={99} width={260} height={113} title="ジョブIDと照会先" lines={['進捗・結果を後で確認']}/>
        <Box x={94} y={282} width={452} height={98} title="p99 と、接続経路の許容を比較" lines={['平均だけで同期か非同期かを決めない']} tone="amber"/>
      </>:f.stage===2?<>
        {statuses.map(([v,t],i)=><Box key={v} x={32+i%3*197} y={83+Math.floor(i/3)*91} width={182} height={72} title={t} tone={['failed','canceled','awaiting_approval'].includes(v)?'amber':'teal'} active={status===v} data-public-job-status={v} data-selected={String(status===v)}/>)}
        <Text y={400} small>{['ポーリング・Webhook・イベントで通知も可能','色分けは状態の選択であり、実ジョブの計測ではない']}</Text>
      </>:f.stage===3?<>
        <Box x={32} y={88} width={260} height={164} title="項目別の結果" lines={['成功した項目', '失敗・未完了の項目', '再試行できる範囲']} tone="violet"/><Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={88} width={260} height={164} title="集約は partial" lines={['成功分を再実行しない', '残りを機械可読で返す']} tone="amber"/>
        <Text y={342} small>{['内部に同名の状態がなくても、項目結果から写せる','完了済み副作用の範囲も、結果へ残す']}</Text>
      </>:f.stage===4?<>
        <Box x={32} y={95} width={260} height={151} title="内部の永続待機" lines={['待機対象と状態を保存', '進捗と結び付ける']} tone="violet"/><Wire id={s.id} d="M292 171H340" active phase={f.phase}/><Box x={348} y={95} width={260} height={151} title="公開する承認待ち" lines={['誰が判断できるか', '対象・期限・期限後処理']} tone="amber"/>
        <Text y={339} small>期限切れを、承認として返さない</Text>
      </>:<>
        {['一時的な失敗','入力起因','ポリシー拒否'].map((t,i)=><Box key={t} x={32+i*197} y={113} width={182} height={127} title={t} lines={[[ '条件内で再試行' ],[ '入力を直す' ],[ '権限・方針確認' ]][i]} tone={i===0?'teal':'amber'}/>)}
        <Text y={335}>{['自然文だけに依存せず、コードで区別','再試行可否と、修正する対象を返す']}</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}

export function AgentApiEventsIdempotency({children}) {
  const [granularity,setGranularity]=useState('step'),[request,setRequest]=useState('match')
  const dedup=requestIdempotency(request)
  return <ContractFigure diagram="agent-api-events-and-idempotency" title="安定したイベントと、再送して増えない受付を設計する"
    controls={({stage,ready})=>stage===0?<Select label="公開するイベントの粒度" value={granularity} onChange={setGranularity} ready={ready}><option value="token">トークン：対話中の見え方</option><option value="step">ステップ：処理の進捗</option><option value="milestone">マイルストーン：機械間の節目</option></Select>:stage===2?<Select label="再送のキーと内容" value={request} onChange={setRequest} ready={ready}><option value="match">同じキー・同じ内容</option><option value="different">同じキー・異なる内容</option><option value="new">新しいキーの別操作</option></Select>:null}
    scene={s=><ContractCanvas diagram="agent-api-events-and-idempotency" {...s}>{f=><>
      <Text y={35}>{['用途に合う、進捗の粒度を選ぶ','内部の生ログを、そのまま公開しない','同じキーの再送は、内容も照合する','キーの登録とジョブ作成を、原子的に確定','受付と副作用先で、別の冪等契約を持つ','ジョブ投入以外の、副作用のある操作にも'][f.stage]}</Text>
      {f.stage===0?<>
        {['token','step','milestone'].map((v,i)=><Box key={v} x={32+i*197} y={112} width={182} height={121} title={['トークン','ステップ','節目'][i]} lines={[[ '細かな表示' ],[ '処理の進捗' ],[ '機械間の連携' ]][i]} active={granularity===v} tone={granularity===v?'teal':'violet'}/>)}
        <Text y={328} small>{['対人UIと機械間連携で、適切な粒度は違う','選択は設計の比較であり、実際の通知は送らない']}</Text>
      </>:f.stage===1?<>
        <Box x={32} y={95} width={260} height={157} title="内部イベント" lines={['ツール名・実行ログ', 'プロンプトなどの詳細']} tone="violet"/><Wire id={s.id} d="M292 173H340" active phase={f.phase}/><Box x={348} y={95} width={260} height={157} title="公開用の写像層" lines={['安定したイベント型', '必要な公開情報だけ']} />
        <Text y={341} small>内部変更による互換性破壊と、情報漏えいを防ぐ</Text>
      </>:f.stage===2?<>
        <Box x={32} y={96} width={260} height={137} title="キーと内容を照合" lines={['保持期間と範囲を確認', '認証キーとは別']} tone="violet"/><Wire id={s.id} d="M292 164H340" active phase={f.phase} tone={dedup.reject?'amber':'teal'}/><Box x={348} y={96} width={260} height={137} title={dedup.reject?'内容不一致を拒否':dedup.reuse?'元のジョブ・結果を返す':'別操作のジョブを作る'} lines={[dedup.reject?'同じキーで別操作しない':dedup.reuse?'新しいジョブを増やさない':'安定したキーで受付']} tone={dedup.reject?'amber':'teal'} data-request-create={String(dedup.create)} data-request-reject={String(dedup.reject)} data-request-reuse={String(dedup.reuse)}/>
        <Text y={330} small>キーの一致だけで、別の要求を同一視しない</Text>
      </>:f.stage===3?<>
        <rect x={32} y={104} width={576} height={189} rx={14} fill="#102b35" stroke="#77dec4" strokeWidth={2}/>
        <Box x={52} y={132} width={250} height={125} title="キーの登録" lines={['範囲・内容を記録', '一意制約で競合を制御']} tone="violet"/><Wire id={s.id} d="M302 194H330" active phase={f.phase}/><Box x={338} y={132} width={250} height={125} title="ジョブの作成" lines={['同時再送でも増やさない']}/>
        <Text y={356}>{['一つの原子的な受付','認証キー更新で、重複排除を失わない']}</Text>
      </>:f.stage===4?<>
        {['呼出し元','受付とワーカー','副作用の受信側'].map((t,i)=><g key={t}><Box x={32+i*197} y={110} width={182} height={121} title={t} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 170H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={294} small>{['要求のキーと、外部操作の業務キーを引き継ぐ','同じ操作のキーは、再試行ごとに作り直さない']}</Text>
        <Box x={87} y={353} width={466} height={64} title="外部結果不明・契約なしなら自動再送を止める" tone="amber"/>
      </>:<>
        <Box x={32} y={95} width={260} height={161} title="副作用のあるAPI" lines={['ジョブ投入', '承認・差戻しなど']} tone="violet"/><Wire id={s.id} d="M292 175H340" active phase={f.phase}/><Box x={348} y={95} width={260} height={161} title="契約と内部を整合" lines={['公開APIの再送契約', '原子的な状態遷移']} />
        <Text y={344} small>承認の重複排除と、承認後の副作用も分ける</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}

export function AgentApiChangeMetering({children}) {
  const [billing,setBilling]=useState('task'),[scope,setScope]=useState('changed')
  const approval=approvalScope(scope)
  return <ContractFigure diagram="agent-api-change-and-metering" title="挙動の互換性・費用・実行中の変更を契約にする"
    controls={({stage,ready})=>stage===2?<Select label="公開する課金の単位" value={billing} onChange={setBilling} ready={ready}><option value="token">トークン単位</option><option value="task">タスク単位</option><option value="success">成功したタスク単位</option></Select>:stage===4?<Select label="変更後の承認対象" value={scope} onChange={setScope} ready={ready}><option value="same">承認済みの同じ対象・条件</option><option value="changed">支払先・対象・引数が変更</option><option value="late">旧版の結果が遅れて届く</option></Select>:null}
    scene={s=><ContractCanvas diagram="agent-api-change-and-metering" {...s}>{f=><>
      <Text y={35}>{['スキーマが同じでも、挙動は変わりうる','旧版の提供期限と、並行運用を決める','利用者の予測可能性と、原価変動を比較する','計測・クォータ・権限を、外部契約へ','変更を受理したrunと版、完了済み処理を返す'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={97} width={260} height={159} title="スキーマの互換性" lines={['型・フィールド', '下流が読める形']} tone="violet"/><Box x={348} y={97} width={260} height={159} title="挙動の互換性" lines={['モデル・プロンプト更新', '下流の品質を変えうる']} tone="amber"/>
        <Text y={340} small>変更履歴・事前予告・利用者の回帰を運用にする</Text>
      </>:f.stage===1?<>
        <Box x={32} y={109} width={260} height={143} title="後方互換な変更" lines={['既存の版を維持', '提供する挙動を明示']} tone="teal"/><Box x={348} y={109} width={260} height={143} title="新バージョン" lines={['旧版の提供期限', '移行経路を契約へ']} tone="violet"/>
        <Text y={343} small>旧モデル・プロンプトの固定には、並行運用費用が掛かる</Text>
      </>:f.stage===2?<>
        <Box x={32} y={95} width={260} height={164} title="利用者からの見え方" lines={{token:['計算量に連動', '前もって費用を読みにくい'],task:['一回の依頼単位', '費用を予測しやすい'],success:['成功時だけ負担', '成功の基準を定義']}[billing]} tone="violet"/><Box x={348} y={95} width={260} height={164} title="提供者が負担する変動" lines={{token:['実費に近い単位', '請求へ計測を接続'],task:['タスクごとの原価変動', '単価へ変動を織り込む'],success:['失敗の原価も負担', '成功と内部費用を計測']}[billing]} tone="amber"/>
        <Text y={345} small>内部のメータリングが先：図は価格や請求を作らない</Text>
      </>:f.stage===3?<>
        <Box x={32} y={91} width={260} height={171} title="上限と応答" lines={['テナント・キー別計測', 'クォータ・共有上限', '429 と再試行待ち時間']} tone="amber"/><Box x={348} y={91} width={260} height={171} title="実行する権限" lines={['APIキー・OAuthで認証', 'ユーザー代理か', 'サービス権限かを明示']} tone="violet"/>
        <Text y={350} small>認証・計測・容量のそれぞれの境界を定義する</Text>
      </>:<>
        <Box x={32} y={80} width={260} height={163} title="変更・取消の応答" lines={['run と引数の版', '受理時点・完了済み処理', '取り消せない副作用']} tone="violet"/><Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={80} width={260} height={163} title={approval.label} lines={scope==='same'?['同じ対象の承認範囲']:scope==='changed'?['認可と承認を再評価']:['現行版への適用を検証']} tone={approval.execute?'teal':'amber'} data-api-approval-execute={String(approval.execute)}/>
        <Text y={330}>{['取消受理は、業務の巻戻し完了ではない','自社runと、提供元の呼出しIDを対応させる']}</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}
