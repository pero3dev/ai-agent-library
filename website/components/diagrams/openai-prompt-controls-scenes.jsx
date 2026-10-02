'use client'
import {useId,useState} from 'react'
import {VendorCanvas,VendorFigure,VendorPair,Text,Box,Wire,Select,Tokens,ExampleGate,ExampleSelect,MigrationGate,MigrationSelect} from './vendor-prompt-controls-primitives'
import {openaiConfigurationGate} from '../../lib/vendor-prompt-controls-model.mjs'
export function OpenaiInstructionContract({children}){
 const id=useId(),[model,setModel]=useState('astra'),[example,setExample]=useState('conflict')
 return <VendorFigure diagram="openai-instruction-contract" title="対象モデルと、指示・入力・例の契約" scene={({phase})=><VendorCanvas diagram="openai-instruction-contract" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['モデルの地図と、プロンプトの条件を区分する','GPT-6内でも、対象とAPIで設定を組み立てる','developerの指示と、userの入力を区分する','意味のある節と、内容の境界を使う','まず例なしで試し、必要な例の矛盾を点検する'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} left={['モデルと移行予定','カタログが正本','対象ID別の終了日','原文の確認日に戻る']} right={['プロンプトの調整','指示・思考・出力','モデルとAPIの条件','未確認はTODOを保持']}/>:stage===1?<>
   <VendorPair id={id} phase={phase} arrow={false} left={model==='astra'?['Astraの原文条件','none／minimal非対応','lowから評価する条件','toolはResponsesで照合']:['Sol／Lunaの原文条件','none等の許容値を照合','既定mediumを確認','推論toolはResponses']} right={['個別のリクエスト','samplingの可否','提供地域とtier','自律度と権限を区分']}/>
   <Text y={339} small>2026-09-28の条件。実リクエストは未実施</Text>
  </>:stage===2?<>
   <Box x={64} y={75} width={512} height={87} title="developer: アプリの指示・制約" tone="violet"/>
   <Wire id={id} d="M320 162V190" active phase={phase}/>
   <Box x={64} y={197} width={512} height={87} title="user: 今回の依頼・入力"/>
   <Text y={338} small>{['役割の優先と、資料中の指示を区分する','未確認の4層定式化を、確定仕様にしない']}</Text>
  </>:stage===3?<>
   <Tokens labels={['見出し','内容の区切り','入力']} y={103} selected={[0,1,2]}/>
   <Box x={64} y={229} width={512} height={137} title="矛盾と曖昧さを、節と境界で減らす" lines={['素の段落・平らなリストを基本に','絶対語は真の不変条件へ限定','装飾の量を品質にしない']} tone="violet"/>
  </>:<><Tokens labels={['zero-shot','必要な代表例','指示と整合']} y={99} selected={[0,1,2]}/><Text y={219} small>小型では、正しい処理の流れも例に含める</Text><ExampleGate state={example}/></>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===1?<Select label="原文のモデル条件" value={model} onChange={setModel} ready={ready}><option value="astra">Astra</option><option value="sol">Sol／Luna</option></Select>:stage===4?<ExampleSelect state={example} setState={setExample} ready={ready}/>:null}>{children}</VendorFigure>
}
export function OpenaiThinkingOutput({children}){
 const id=useId(),[output,setOutput]=useState('semantic')
 const outputs={json:['JSONの妥当性だけ','JSONとして読める','schema一致は未確認','業務の意味も未確認'],schema:['schemaに一致','型と形式の制約','意味の正しさは別','アプリの検証へ渡す'],semantic:['業務検証が不足','形式が一致していても','事実・権限・値を検証','不足を成功にしない'],refusal:['拒否・途中終了','通常の結果へ流さない','理由と回復条件を照合','上限や停止を保持']}
 return <VendorFigure diagram="openai-thinking-output" title="推論量・出力形式・文脈・toolの分担" scene={({phase})=><VendorCanvas diagram="openai-thinking-output" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['effortとmodeを、別の制御として比較する','出力の長さ・schema・意味の検証を分ける','今の証拠と成功条件を合わせ、探索の出口を保つ','独立した取得を並列化し、副作用は条件を照合する'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} arrow={false} left={['reasoning effort','労力の水準','対応集合と既定は別','評価して調整する']} right={['reasoning.mode','standard／proの条件','高computeの用途','effortとは別の指定']}/>:stage===1?<>
   <VendorPair id={id} phase={phase} left={['供給する出力契約','JSON Schemaを渡す','verbosityは応答長','生の思考は表示しない']} right={outputs[output]}/>
   <Text y={339} small>形式がそろうことと、業務が正しいことは別</Text>
  </>:stage===2?<>
   <Tokens labels={['必要箇所を検索','状態を圧縮','証拠を照合']} y={99} selected={[0,1,2]}/>
   <Box x={64} y={228} width={512} height={138} title="成功・不足・上限を、停止の条件へ結ぶ" lines={['追加の取得が役立つかを確認','成功したら止まり、未達も残す','圧縮後も必要な制約と状態を保持']} tone="violet"/>
  </>:<VendorPair id={id} phase={phase} left={['toolのdescription','目的と発火条件','入力・副作用・再試行','エラーと回復の境界']} right={['アプリの実行制御','独立した取得は並列','依存と副作用は照合','許可と停止条件を保持']}/>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===1?<Select label="出力の検証段階" value={output} onChange={setOutput} ready={ready}><option value="json">JSONとして妥当</option><option value="schema">schemaに一致</option><option value="semantic">業務検証が不足</option><option value="refusal">拒否・途中終了</option></Select>:null}>{children}</VendorFigure>
}
export function OpenaiHistoryMigration({children}){
 const id=useId(),[configuration,setConfiguration]=useState('auto'),[relevance,setRelevance]=useState('stale'),[missing,setMissing]=useState('regression')
 const result=openaiConfigurationGate({singleAgent:configuration!=='multi',standardMode:configuration!=='pro',automaticCompaction:configuration==='auto',standaloneCompact:configuration==='compact',consecutiveUpdate:configuration==='consecutive'})
 return <VendorFigure diagram="openai-history-migration" title="非同期結果・cache・設定更新と移行" scene={({phase})=><VendorCanvas diagram="openai-history-migration" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['遅れて届く結果を、元のcall_idと現在の目的へ結ぶ','書込・読取と、最短保持の条件を分ける','過去の指示を編集せず、対応する設定を追記する','圧縮の形を照合し、必要な設定を再追加する','最小の製品契約から、旧世代の依存を見直す','対象・契約・回帰・権限をそろえて移行する'][stage]}</Text>
  {stage===0?<g data-openai-result-disposition={relevance==='needed'?'review':'exclude'}>
   <VendorPair id={id} phase={phase} left={['アプリが実行する','元のcall_idを保持','待機中の別作業','遅れた結果を識別']} right={[relevance==='needed'?'現在の目的に必要':'変更後には不要','結果と目的を照合',relevance==='needed'?'現在の判断で検証':'新しい判断から除外','外部作用の取消は別']}/>
   <Text y={339} small>asyncは、耐久実行や外部作用の取消保証ではない</Text>
  </g>:stage===1?<>
   <Tokens labels={['cacheの書込','cacheの読取','保持の条件']} y={98} selected={[0,1,2]}/>
   <Box x={64} y={232} width={512} height={136} title="30分は最短保持。削除の期限ではない" lines={['元記事のTTLと測定項目を照合','保持・削除・利用条件を別々に確認','模式図は削除時刻を生成しない']} tone="amber"/>
  </>:stage===2?<g data-openai-configuration-candidate={String(result.reviewCandidate)} data-openai-request-sent="false">
   <Tokens labels={['元の設定','更新item','次のuser']} y={99} selected={[0,1,2]}/>
   <Box x={64} y={228} width={512} height={141} title={result.reviewCandidate?'設定更新を照合する候補':'非互換・未確認を残す'} lines={['standard・単一Agent等の条件','元のrequest設定は書き換えない','過去の指示の編集へ広げない']} tone={result.reviewCandidate?'teal':'amber'}/>
  </g>:stage===3?<>
   <Tokens labels={['明示の圧縮','設定の再追加','次のuser']} y={99} selected={[0,1,2]}/>
   <Box x={64} y={230} width={512} height={139} title="圧縮後に、希望するeffortを再追加" lines={['compaction_triggerの条件を照合','自動圧縮・単独compactと区分','図はAPIへ履歴を送らない']} tone="violet"/>
  </>:stage===4?<VendorPair id={id} phase={phase} left={['保つ製品の契約','目標と強い制約','成功条件と必要な権限','代表例と回帰を用意']} right={['移行先で再調整','effort・verbosity','tool記述・出力形式','既定とcacheを比較']}/>:<MigrationGate missing={missing}/>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===0?<Select label="遅れた結果の用途" value={relevance} onChange={setRelevance} ready={ready}><option value="stale">変更後の目的には不要</option><option value="needed">現在の目的に必要</option></Select>:stage===2?<Select label="設定更新の条件" value={configuration} onChange={setConfiguration} ready={ready}><option value="multi">複数Agent</option><option value="pro">pro mode</option><option value="auto">自動圧縮との併用</option><option value="compact">単独compactとの併用</option><option value="consecutive">更新itemを連続させる</option><option value="none">必要条件を照合</option></Select>:stage===5?<MigrationSelect missing={missing} setMissing={setMissing} ready={ready}/>:null}>{children}</VendorFigure>
}
