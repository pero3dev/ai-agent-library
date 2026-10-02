'use client'
import {useId,useState} from 'react'
import {ActionCanvas,ActionFigure,ActionPair,Text,Box,Wire,Select,Tokens} from './slm-computer-voice-primitives'
import {computerAction} from '../../lib/slm-computer-voice-model.mjs'
export function ComputerObservationPermission({children}){
 const id=useId(),[state,setState]=useState('unapproved')
 const decision=computerAction({scopeAllowed:state!=='scope',budgetAvailable:state!=='limit',targetChanged:state==='changed',approvalRequired:state!=='no-approval',approved:state==='approved'||state==='changed',stopped:state==='stopped'})
 return <ActionFigure diagram="computer-observation-permission" title="観測から副作用前の許可へ、変更した対象は観測へ戻す。" scene={({phase})=><ActionCanvas diagram="computer-observation-permission" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['画面操作を選ぶ前に、API区間を切り出す','行動案を、対象と内容を持つ候補として扱う','許可・上限・必要な承認を副作用の前に確認','対象が変わったら、古い承認を転用しない','待機・検証を経て、次の観測へ戻る'][stage]}</Text>
  {stage===0?<ActionPair id={id} phase={phase} left={['手順を棚卸し','APIがあるか確認','認証と入力を分離','安定した区間を利用']} right={['画面操作を限定','残るGUI区間だけ','専用環境と最小権限','両経路とも承認保持']}/>:stage===1?<ActionPair id={id} phase={phase} left={['現在の画面を観測','対象・内容・状態','作業の達成済み範囲','外部指示は非信頼']} right={['次の行動案','クリック・入力等','実行権限は別に確認','周回・時間・費用上限']}/>:stage<=3?<g data-computer-next={decision.next} data-computer-operation-executed="false">
   <Tokens labels={['許可範囲','上限','現在の対象','必要な承認']} y={82} selected={[0,1,2,3].filter(i=>![state==='scope',state==='limit',state==='changed',state==='unapproved'][i])}/>
   <Box x={64} y={190} width={512} height={151} title={decision.next==='action-candidate'?'現在の対象への操作候補':decision.next==='reobserve'?'再観測して承認を取り直す':decision.next==='wait-approval'?'対象と内容を示して承認を待つ':'実行せず停止・差し戻し'} lines={['行動案と実行権限を区分','対象・内容・画面の変更を照合','図は操作を実行しない']} tone={decision.next==='action-candidate'?'teal':'amber'}/>
  </g>:<>
   {['観測','行動案','許可・承認','操作','条件待機','結果検証'].map((title,i)=><Box key={title} x={32+(i%3)*199} y={76+Math.floor(i/3)*160} width={178} height={94} title={title} lines={[[ '画面・作業状態','対象・内容','副作用の前','許可した対象','要素・遷移','画面とデータ'][i]]} tone={i===2?'amber':i===3?'violet':'teal'}/>)}
   <Wire id={id} d="M210 121H225" active phase={phase}/><Wire id={id} d="M409 121H424" active phase={phase}/>
   <Wire id={id} d="M518 170V206H120V230" active phase={phase}/><Wire id={id} d="M210 281H225" active phase={phase}/><Wire id={id} d="M409 281H424" active phase={phase}/>
   <Text y={379} small>検証の結果を、次の観測と作業状態へ戻す</Text>
  </>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===2||stage===3?<Select label="操作候補の状態" value={state} onChange={setState} ready={ready}><option value="unapproved">必要な承認を待っている</option><option value="scope">許可範囲の外</option><option value="limit">周回・時間・費用の上限</option><option value="changed">承認後に対象が変わった</option><option value="stopped">緊急停止が有効</option><option value="approved">現在の対象へ承認済み</option><option value="no-approval">承認不要の許可内操作</option></Select>:null}>{children}</ActionFigure>
}
export function ComputerStabilityEvidence({children}){
 const id=useId(),[batch,setBatch]=useState('change')
 const pairs=[
  [['対象の特定','DOM・accessibility','相対・意味で指定','ブラウザ専用も検討'],['環境と変更','解像度・zoom・言語','固定でばらつきを減らす','UI変更の監視は残す']],
  [['条件付きの待機','要素出現・遷移完了','行動後に再観測','固定sleepへ依存せず'],['結果の二重照合','画面上の結果','API・DB側の結果','静かな失敗を見つける']],
  [['API区間へ置換','20手順中15手順の例','GUIは残り5手順の例','手順ごとに棚卸し'],['認証と入力の経路','事前の認証準備','専用アカウント','一文字ずつ操作せず']],
  [['隔離と最小権限','専用VM・profile','許可ドメインと操作','外部指示を権限にせず'],['副作用の制御','人間の承認ゲート','緊急停止・上限','GAで範囲を広げず']],
  [['軌跡をたどる','観測・決定・行動','結果と失敗地点','デバッグへ戻す'],['実タスクの評価','複数回の成功率','公開順位は参考','UI変更を継続監視']]
 ]
 return <ActionFigure diagram="computer-stability-evidence" title="脆さを下げる実装と、結果を確かめる証拠を読む。" scene={({phase})=><ActionCanvas diagram="computer-stability-evidence" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['対象の特定と環境の固定を組み合わせる','条件の完了と、業務の成功を区分する','画面操作を減らし、認証と入力を安定させる','外部コンテンツが実行範囲を広げない構造にする','一度の成功だけで品質を確定しない','操作列をまとめても、境界ごとの確認を保つ'][stage]}</Text>
  {stage<5?<ActionPair id={id} phase={phase} left={pairs[stage][0]} right={pairs[stage][1]} arrow={stage===0||stage===4}/>:<>
   <Tokens labels={['旧形状を移行','操作列を分ける','uploadを照合']} y={88} selected={[batch==='upload'?2:1]}/>
   <Box x={64} y={199} width={512} height={149} title={batch==='upload'?'opt-inと送信先を確認する':batch==='change'?'対象変更の前で列を分ける':'副作用前で承認を確認する'} lines={['GAは外部送信の許可ではない','まとめ実行でも再観測を保持','設定・返却ツールの処理を移行']} tone="amber"/>
  </>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===5?<Select label="操作列の確認点" value={batch} onChange={setBatch} ready={ready}><option value="change">次の対象が変わる</option><option value="effect">送信・削除を含む</option><option value="upload">ファイルuploadを含む</option></Select>:null}>{children}</ActionFigure>
}
