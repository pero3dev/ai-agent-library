'use client'
import {useId,useState} from 'react'
import {ActionCanvas,ActionFigure,ActionPair,Text,Box,Wire,Select,Tokens} from './slm-computer-voice-primitives'
import {voiceHeardHistory,voiceRiskGate} from '../../lib/slm-computer-voice-model.mjs'

export function VoiceArchitectureLatency({children}){
 const id=useId(),[mode,setMode]=useState('client'),[transport,setTransport]=useState('client')
 return <ActionFigure diagram="voice-architecture-latency" title="音声と推論・ツールの接点を、三つの構成で読む。" scene={({phase})=><ActionCanvas diagram="voice-architecture-latency" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['音声の問題は、沈黙・ターン・中間テキスト','パイプラインの各段に制御点を置く','一つの音声モデルで推論・ツールも扱う','会話と業務処理を別の経路で進める','最初の音声までを、段別・分布で観測する','構成と接続、既存資産を合わせて判断する'][stage]}</Text>
  {stage===0?<>
   <Tokens labels={['沈黙','ターン','中間テキスト']} y={98} selected={[0,1,2]}/>
   <ActionPair id={id} phase={phase} y={201} left={['音声の体験','無言・被せ・待たせ','聞き取れる応答','会話の自然さを評価']} right={['業務の実結果','認識した用件と権限','実際のツール結果','発話だけで完了にせず']} arrow={false}/>
  </>:stage===1?<g data-voice-architecture="pipeline">
   {['STT','テキスト処理','TTS'].map((title,i)=><Box key={title} x={32+i*199} y={104} width={178} height={126} title={title} lines={[[ '文字起こし','推論・ツール','音声合成'][i],'段ごとに制御']} tone={i===1?'amber':'teal'}/>)}
   <Wire id={id} d="M210 167H225" active phase={phase}/><Wire id={id} d="M409 167H424" active phase={phase}/>
   <Box x={64} y={280} width={512} height={101} title="中間テキストを検査する" lines={['既存のプロンプト・評価・ガードレール','部品を交換し、全段をstreamingへ']} tone="violet"/>
  </g>:stage===2?<g data-voice-architecture="single-model">
   <Box x={64} y={81} width={512} height={123} title="単一の音声モデル" lines={['音声入力 → 推論・ツール → 音声出力','一つのセッションで会話と判断']} tone="violet"/>
   <Wire id={id} d="M320 204V242" active phase={phase}/>
   <Box x={64} y={251} width={512} height={127} title="制御点の違いを確かめる" lines={['自然さ・割込みへの即応を評価','文字起こしと業務の実結果を照合','必要な承認と監査は保持']} tone="amber"/>
  </g>:stage===3?<g data-voice-architecture="separate-backend" data-voice-delegation={mode}>
   <Box x={32} y={76} width={260} height={118} title="ユーザーの音声" lines={['聞く・話すを同時に','処理中も会話を継続']} tone="violet"/>
   <Box x={348} y={76} width={260} height={118} title="GPT-Live" lines={['音声の対話を担当','推論・ツールは委譲']}/>
   <Wire id={id} d="M292 121H340" active phase={phase}/><Wire id={id} d="M348 157H300" active phase={phase}/>
   <Wire id={id} d="M478 194V232" active phase={phase}/>
   <Box x={64} y={241} width={512} height={127} title={mode==='client'?'自分のバックエンドへ委譲':'Responsesモデルへ委譲'} lines={mode==='client'?['既存のagent／workflowを接続','アプリが処理と結果を返す','権限と業務記録はアプリが制御']:['OpenAIがホストする推論・ツール','custom functionはアプリが実行','権限と業務記録はアプリが制御']} tone="amber"/>
  </g>:stage===4?<>
   <Tokens labels={['STT確定','最初のtoken','最初の音声']} y={87} selected={[0,1,2]}/>
   <Box x={64} y={187} width={512} height={166} title="段を重ねて、最初の音声へ" lines={['全文完成を待たず、文単位でTTSへ','ユーザーの発話終了から音声到達まで','段別の時間とp95を測る']} tone="violet"/>
   <Text y={389} small>模式図の長さは、実測のミリ秒や短縮率ではない</Text>
  </>:<ActionPair id={id} phase={phase} left={['接続を照合',transport==='client'?'client側とWebRTC':transport==='server'?'server間とWebSocket':'電話基盤・SIP等','元記事の時点を保持','対応する経路を確認']} right={['要件と資産','自然さと制御点','既存の評価を再利用','実利用の遅延を測る']} arrow={false}/>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===3?<Select label="バックエンドの委譲" value={mode} onChange={setMode} ready={ready}><option value="client">client delegation</option><option value="responses">Responses delegation</option></Select>:stage===5?<Select label="接続する環境" value={transport} onChange={setTransport} ready={ready}><option value="client">ブラウザ・モバイル</option><option value="server">サーバー間</option><option value="phone">電話</option></Select>:null}>{children}</ActionFigure>
}

export function VoiceInterruptionTools({children}){
 const id=useId(),[vad,setVad]=useState('balanced'),[played,setPlayed]=useState('1'),[missing,setMissing]=useState('channel')
 const history=voiceHeardHistory({generatedSegments:3,playedSegments:Number(played)}),gate=voiceRiskGate({repeatConfirmed:missing!=='repeat',otherChannelApproved:missing!=='channel',currentTarget:missing!=='target'})
 return <ActionFigure diagram="voice-interruption-tools" title="割込みで届いた履歴を揃え、会話と業務操作を分ける。" scene={({phase})=><ActionCanvas diagram="voice-interruption-tools" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['早すぎる割込みと、待たせすぎの両方を測る','進行中の生成と、再生をそれぞれ止める','生成済みの区間を、そのまま届いた履歴にしない','会話の継続と、ツールの処理完了を区分する','会話を閉じても、処理と結果確認は残る','音声の「はい」だけで不可逆操作を進めない'][stage]}</Text>
  {stage===0?<ActionPair id={id} phase={phase} left={['ターンの検出',vad==='manual'?'押して話す':vad==='early'?'短めの区切りを試す':vad==='late'?'長めの区切りを試す':'VADの感度を調整','無音か内容で推定','騒音・考え中も評価']} right={['二つの失敗を測る','考え中に被せる','応答を待たせすぎる','誤割込みと間隔を測る']} arrow={false}/>:stage===1?<>
   <Tokens labels={['ユーザーが話す','生成をcancel','再生を停止']} y={97} selected={[0,1,2]}/>
   <Box x={64} y={206} width={512} height={141} title="未再生の部分を次の履歴へ持ち越さない" lines={['生成の終了と、実際の再生は別','接続方式に応じて未再生分を除く','業務ツールの既実行は取消にならない']} tone="amber"/>
  </>:stage===2?<g data-voice-retained-segments={history.retainedSegments} data-voice-exact-transcript="false">
   <Text x={32} y={92} small anchor="start">生成済みの模式区間</Text>
   <Tokens labels={['区間①','区間②','区間③']} y={115} selected={[0,1,2]} name="generated"/>
   <Wire id={id} d="M320 168V211" active phase={phase}/>
   <Text x={32} y={235} small anchor="start">実際に届いた範囲へ揃える</Text>
   <Tokens labels={[0,1,2].map(i=>i<history.retainedSegments?`届いた${i+1}`:`未到達${i+1}`)} y={252} selected={[0,1,2].filter(i=>i<history.retainedSegments)} name="heard"/>
   <Text y={356} small>{['未再生は履歴から除く','音声と文字の精密な対応は保証しない']}</Text>
  </g>:stage===3?<ActionPair id={id} phase={phase} left={['会話を続ける','つなぎの発話','対応APIで非同期処理','声の確認文と実結果は別']} right={['ツールの実処理','用件と引数・権限','完了・失敗・業務状態','発話を完了証拠にせず']} arrow={false}/>:stage===4?<>
   <Tokens labels={['会話を閉じる','長い処理','結果と通知']} y={101} selected={[1,2]}/>
   <Box x={64} y={211} width={512} height={135} title="折り返しの経路と、業務状態を残す" lines={['処理の実結果を確認する','失敗・再開・通知の責任を決める','耐久実行の正本へ接続']} tone="amber"/>
  </>:<g data-voice-risk-candidate={String(gate.reviewCandidate)} data-voice-operation-executed="false">
   <Tokens labels={['復唱','別チャネル','現在の対象']} y={94} selected={[0,1,2].filter(i=>missing!==['repeat','channel','target'][i])}/>
   <Box x={64} y={204} width={512} height={139} title={gate.reviewCandidate?'条件を照合する候補':'不足を残して確認を待つ'} lines={['聞き間違い・本人性を確認','現在の金額・対象へ承認を結ぶ','図は不可逆操作を実行しない']} tone={gate.reviewCandidate?'teal':'amber'}/>
  </g>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===0?<Select label="ターン制御の選択" value={vad} onChange={setVad} ready={ready}><option value="balanced">感度を実測で調整</option><option value="early">短めの区切りを試す</option><option value="late">長めの区切りを試す</option><option value="manual">押して話す手動制御</option></Select>:stage===2?<Select label="実際に届いた区間" value={played} onChange={setPlayed} ready={ready}><option value="0">まだ届いていない</option><option value="1">区間①まで届いた</option><option value="2">区間②まで届いた</option><option value="3">全区間が届いた</option></Select>:stage===5?<Select label="高リスクの不足条件" value={missing} onChange={setMissing} ready={ready}><option value="repeat">復唱の確認が不足</option><option value="channel">別チャネル承認が不足</option><option value="target">現在の対象の確認が不足</option><option value="none">必要条件を照合</option></Select>:null}>{children}</ActionFigure>
}

export function VoiceEvaluationProviders({children}){
 const id=useId(),[provider,setProvider]=useState('openai')
 return <ActionFigure diagram="voice-evaluation-providers" title="音声の評価を実状態へ結び、提供条件の更新を区分する。" scene={({phase})=><ActionCanvas diagram="voice-evaluation-providers" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['会話の自然さだけで、成功を確定しない','発話の確認と、業務の結果を照合する','実環境の入力と、人手の確認を含める','認識・対話・地域・IDの条件を別々に読む'][stage]}</Text>
  {stage===0?<>
   <Tokens labels={['タスク','認識・了解性','応答速度','会話制御']} y={93} selected={[0,1,2,3]}/>
   <Box x={64} y={202} width={512} height={141} title="記録と測定を四つの軸へ結ぶ" lines={['トランスクリプトと最終状態','first-audioの分布とp95','誤割込み・ターン間隔と人手確認']} tone="violet"/>
  </>:stage===1?<ActionPair id={id} phase={phase} left={['会話の記録','トランスクリプト','既存の評価資産へ接続','監査・デバッグへ接続']} right={['業務の実状態','本当に用件が解決したか','ツール結果と最終状態','発話だけで成功にせず']}/>:stage===2?<>
   <Tokens labels={['騒音','言い直し','方言','電話品質']} y={93} selected={[0,1,2,3]}/>
   <Box x={64} y={206} width={512} height={143} title="実利用の条件を評価セットへ" lines={['きれいな音声だけで判断しない','聞き取りと認識を別々に確認','環境別の結果と人手確認を含める']} tone="amber"/>
  </>:<ActionPair id={id} phase={phase} left={[provider==='openai'?'STTとRealtime':provider==='google'?'TranscribeとLive':'旧Sonicと後継','モデルIDを照合','提供経路・地域も別','確認日と予定を保持']} right={['移行前の評価','終了予定と実停止は別','後継へ条件を流用せず','声・割込み・ツール確認']} arrow={false}/>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===3?<Select label="更新条件の読み方" value={provider} onChange={setProvider} ready={ready}><option value="openai">OpenAI: STTと対話を区分</option><option value="google">Google: STTのGAとLiveを区分</option><option value="aws">AWS: 旧IDと後継・地域を区分</option></Select>:null}>{children}</ActionFigure>
}
