'use client'
import { useState } from 'react'
import { ContractFigure,ContractCanvas,Text,Box,Wire,Select } from './durable-contract-primitives'
import { approvalScope } from '../../lib/durable-tenant-api-model.mjs'

export function DurableResumeDesign({children}) {
  const [restart,setRestart]=useState('recorded'),[resume,setResume]=useState('continue')
  return <ContractFigure diagram="durable-resume-design" title="プロセスを越えて、記録した続きから再開する"
    controls={({stage,ready})=>stage===2?<Select label="会話の再開方法" value={resume} onChange={setResume} ready={ready}><option value="continue">プロトコルを保つ継続再開</option><option value="summary">構造化状態と要約で新規再開</option></Select>:stage===3?<Select label="再開時のLLM結果" value={restart} onChange={setRestart} ready={ready}><option value="recorded">記録済み結果を再利用</option><option value="rerun">再計算：別の計画になる危険</option></Select>:null}
    scene={s=><ContractCanvas diagram="durable-resume-design" {...s}>{f=><>
      <Text y={35}>{['プロセスの寿命と、ジョブの寿命を分ける','三つの条件から、ジョブ化を判断する','再開に必要な情報を、意味のある節目で保存','記録済みの処理は、その結果を使う','複雑さと、版・履歴の制約から選ぶ'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={93} width={260} height={104} title="以前のプロセス" lines={['停止・再起動']} tone="amber" active={false}/><Box x={348} y={93} width={260} height={104} title="新しいプロセス" lines={['同じジョブを再開']}/>
        <Box x={108} y={285} width={424} height={98} title="プロセス外の状態ストア" lines={['ジョブID・状態・結果']} tone="violet"/>
        <Wire id={s.id} d="M162 197V252H250V277" active phase={f.phase} tone="violet"/><Wire id={s.id} d="M390 285V252H478V205" active phase={f.phase}/>
        <Text y={237} small>再起動しても消えない保存先</Text>
      </>:f.stage===1?<>
        {['p99 が経路の許容外','人の待機が入る','全やり直しが高い'].map((t,i)=><Box key={t} x={32} y={79+i*91} width={356} height={69} title={t} tone={i===1?'amber':'violet'}/>)}
        <Wire id={s.id} d="M388 204H426" active phase={f.phase}/><Box x={434} y={164} width={174} height={89} title="ジョブ型へ"/>
        <Text y={395} small>一つでも該当するかを確認する：図は実測時間ではない</Text>
      </>:f.stage===2?<>
        {['ステップと結果','会話・推論の状態','成果物への参照','次の計画'].map((t,i)=><Box key={t} x={32+i%2*292} y={81+Math.floor(i/2)*102} width={284} height={77} title={t} tone="violet"/>)}
        <Box x={32} y={295} width={576} height={99} title={resume==='continue'?'必要な履歴・未完了ツールを保持':'構造化状態と、経緯の要約から再構成'} lines={[resume==='continue'?'継続条件とキャッシュ再利用も確認':'継続と新規再開のコスト・条件を比較']}/>
      </>:f.stage===3?<>
        <Box x={32} y={82} width={260} height={98} title="決定的な制御" lines={['分岐・次のステップ']} tone="violet"/><Wire id={s.id} d="M292 130H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={98} title="非決定処理" lines={['LLM・ツール・時刻']}/>
        <Wire id={s.id} d="M478 180V247" active phase={f.phase}/><Box x={348} y={255} width={260} height={107} title="操作と結果の記録" lines={['完了済みを照会']} tone="violet"/>
        <Wire id={s.id} d="M348 309H300" active phase={f.phase} tone={restart==='recorded'?'teal':'amber'}/><Box x={32} y={255} width={260} height={107} title={restart==='recorded'?'同じ結果で続きへ':'別の計画になる危険'} lines={[restart==='recorded'?'保存した結果を再利用':'保存済みを再計算しない']} tone={restart==='recorded'?'teal':'amber'} data-recorded-result-reused={String(restart==='recorded')}/>
        <Text y={411} small>結果が記録される実行単位へ、非決定処理を隔離</Text>
      </>:<>
        <Box x={32} y={91} width={260} height={148} title="自前の実行系" lines={['少ないステップ', '単純な承認待ち']} tone="violet"/><Box x={348} y={91} width={260} height={148} title="耐久実行エンジン" lines={['分岐・並列・長い待機', '再試行が複雑']} />
        <Box x={84} y={286} width={472} height={96} title="旧定義の共存と、履歴サイズの管理" lines={['大きな成果物は、外部に置いて参照']} tone="amber"/>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}

export function DurableSideEffectContract({children}) {
  const [contract,setContract]=useState('unknown')
  return <ContractFigure diagram="durable-side-effect-contract" title="再開しても、外部操作の契約は別に必要"
    controls={({stage,ready})=>stage===2?<Select label="外部操作先の重複排除契約" value={contract} onChange={setContract} ready={ready}><option value="unknown">契約なし・結果不明</option><option value="supported">受信側が同じキーの結果を返す</option></Select>:null}
    scene={s=><ContractCanvas diagram="durable-side-effect-contract" {...s}>{f=><>
      <Text y={35}>{['同じ業務操作の再試行には、同じキー','重複排除と業務更新を、まとめて確定','外部成功と、ローカル記録の間に隙間がある','承認の重複排除と、副作用の契約を分ける','ジョブの再受付でも、同じ業務キーを維持'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={102} width={260} height={140} title="再試行する側" lines={['同じキー・同じ内容', '別操作には新しいキー']} tone="violet"/><Wire id={s.id} d="M292 172H340" active phase={f.phase}/><Box x={348} y={102} width={260} height={140} title="受信側の契約" lines={['同じ操作の結果を返す', '範囲・有効期間も確認']}/>
        <Text y={330} small>{['認証キーは、業務の冪等キーではない','同じキーで別の引数を送る場合も定義する']}</Text>
      </>:f.stage===1?<>
        <Text y={89} small>ワーカー同士の「未実行」確認だけでは競合する</Text>
        <rect x={32} y={134} width={576} height={169} rx={14} fill="#102b35" stroke="#77dec4" strokeWidth={2}/>
        <Box x={52} y={156} width={250} height={109} title="キーの一意制約" lines={['重複を受け付けない']} tone="violet"/><Wire id={s.id} d="M302 210H330" active phase={f.phase}/><Box x={338} y={156} width={250} height={109} title="業務データ更新" lines={['同じDBで確定']}/>
        <Text y={365}>一つのトランザクション</Text>
      </>:f.stage===2?<>
        <Box x={32} y={85} width={260} height={102} title="外部操作は成功" lines={['副作用は生じた']}/><Wire id={s.id} d="M292 135H340" active phase={f.phase} tone="amber"/><Box x={348} y={85} width={260} height={102} title="記録前に停止" lines={['ローカルは結果不明']} tone="amber"/>
        <Box x={76} y={263} width={488} height={110} title={contract==='unknown'?'自動再送を止め、業務IDなどで照合':'同じキーで、受信側の結果を照会・再利用'} lines={[contract==='unknown'?'ロックや承認だけで、隙間は閉じない':'契約の範囲・期限・再試行上限を守る']} tone={contract==='unknown'?'amber':'teal'} data-unknown-side-effect-stop={String(contract==='unknown')}/>
      </>:f.stage===3?<>
        <Box x={32} y={100} width={260} height={166} title="承認イベント側" lines={['処理済みIDを記録', '状態遷移と原子的に確定']} tone="violet"/><Wire id={s.id} d="M292 183H340" active phase={f.phase}/><Box x={348} y={100} width={260} height={166} title="副作用の受信側" lines={['業務キーの重複排除', '別の契約として確認']}/>
        <Text y={355} small>同じ承認を一度処理しても、外部再送の安全は別</Text>
      </>:<>
        <Box x={32} y={95} width={260} height={105} title="以前のジョブ" lines={['同じ業務操作']} tone="violet"/><Box x={348} y={95} width={260} height={105} title="再受付のジョブ" lines={['同じ業務操作']} />
        <Wire id={s.id} d="M162 200V249H320V272" active phase={f.phase}/><Wire id={s.id} d="M478 200V249H320" active phase={f.phase}/><Box x={109} y={280} width={422} height={91} title="安定した業務キーへ対応させる" tone="amber"/>
        <Text y={412} small>チェックポイントだけで、任意の副作用は1回にできない</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}

export function DurableWaitProgress({children}) {
  const [scope,setScope]=useState('changed'),[wait,setWait]=useState('pending')
  const approval=approvalScope(scope)
  return <ContractFigure diagram="durable-wait-and-progress" title="待機を保存し、進捗・取消・対象変更を区別する"
    controls={({stage,ready})=>stage===1?<Select label="承認待ちの現在" value={wait} onChange={setWait} ready={ready}><option value="pending">期限内の待機</option><option value="expired">期限超過・同意は未取得</option></Select>:stage===5?<Select label="以前の承認と現在の対象" value={scope} onChange={setScope} ready={ready}><option value="same">承認済みの同じ対象・条件</option><option value="changed">対象・引数が変更された</option><option value="late">旧版の処理結果が遅れて届く</option></Select>:null}
    scene={s=><ContractCanvas diagram="durable-wait-and-progress" {...s}>{f=><>
      <Text y={35}>{['待っている状態を、プロセスの外へ','通知と期限処理を、監査へつなぐ','利用者と運用者へ、状態と進捗を届ける','取消要求・停止・巻戻しを区別する','待ちながら別作業することと、復元を分ける','変更後に、以前の承認や結果を流用しない'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={99} width={260} height={172} title="永続化する待機" lines={['何を・誰の承認で', 'いつから待つか', '再起動後も照会可能']} tone="violet"/><Wire id={s.id} d="M292 184H340" active phase={f.phase}/><Box x={348} y={99} width={260} height={172} title="プロセスは解放" lines={['sleepで占有しない', 'メモリフラグに依存しない']}/>
        <Text y={354} small>待機と、承認する権限・対象を紐づける</Text>
      </>:f.stage===1?<>
        <Box x={32} y={89} width={260} height={141} title="通知・リマインド" lines={['承認者が気づける', '誰がいつ判断したか']} tone="violet"/><Wire id={s.id} d="M292 159H340" active phase={f.phase}/><Box x={348} y={89} width={260} height={141} title={wait==='pending'?'承認を待つ':'期限後の処理へ'} lines={wait==='pending'?['未取得の同意を待つ']:['代理へ引継ぎ・取消', '期限切れは同意ではない']} tone="amber" data-expiry-approved="false"/>
        <Box x={112} y={287} width={416} height={92} title="ジョブと結び付いた監査記録" lines={['通知・期限処理・承認・却下']} />
      </>:f.stage===2?<>
        <Box x={32} y={97} width={260} height={162} title="利用者へ" lines={['現在の状態を照会', 'ステップ進捗を通知']} tone="teal"/><Box x={348} y={97} width={260} height={162} title="運用者へ" lines={['進捗停止を検知', '承認滞留を監視']} tone="amber"/>
        <Text y={340} small>{['実行中と、進捗が進んでいることは別','長い沈黙を、失敗と区別できるようにする']}</Text>
      </>:f.stage===3?<>
        {['取消を受理','処理を停止','後始末と保存'].map((t,i)=><g key={t}><Box x={32+i*197} y={123} width={182} height={109} title={t} tone={i===1?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 177H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Text y={323}>{['部分結果と、完了済みの副作用を記録','業務上の巻戻しを保証しない']}</Text>
      </>:f.stage===4?<>
        <Box x={32} y={91} width={260} height={161} title="非同期ツール" lines={['待機中にも別の作業', '元の呼出しIDへ結果']} tone="violet"/><Box x={348} y={91} width={260} height={161} title="ジョブ側の永続化" lines={['ID・引数の版・結果', '取消・承認の対象']} tone="teal"/>
        <Text y={337} small>{['非同期APIだけで、再起動後の復元は保証されない','切断時の復旧と、外部結果の照会も設計する']}</Text>
      </>:<>
        <Box x={32} y={91} width={260} height={146} title="現在のrun・引数版" lines={['以前の対象と比較', '遅延結果の版を確認']} tone="violet"/><Wire id={s.id} d="M292 164H340" active phase={f.phase}/><Box x={348} y={91} width={260} height={146} title={approval.label} lines={scope==='same'?['承認済みの範囲内']:scope==='changed'?['旧承認を流用しない']:['現行計画へ適用前に検証']} tone={approval.execute?'teal':'amber'} data-approval-scope-execute={String(approval.execute)}/>
        <Text y={330} small>{['同じ対象と認可・承認条件を確認して再開','図の切替は、実際の承認や操作を送信しない']}</Text>
      </>}
    </>}</ContractCanvas>}>{children}</ContractFigure>
}
