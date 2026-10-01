'use client'
import {useState} from 'react'
import {FeedbackFigure,FeedbackCanvas,Text,Box,Wire,Select} from './feedback-streaming-primitives'
import {streamStop} from '../../lib/feedback-streaming-model.mjs'
const outputs={partial:['部分テキスト','生成途中で、未確定'],tool:['ツール呼出しへ移行','実行結果を待って照合'],error:['stream中のエラー','失敗を明示して回復'],complete:['完了した結果','内容と終端状態を照合']}
export function StreamProgressSurface({children}){
 const [output,setOutput]=useState('partial'),[display,setDisplay]=useState('summary')
 return <FeedbackFigure diagram="stream-progress-surface" title="逐次表示と進捗を分け、部分テキストを完了扱いしない"
  controls={({stage,ready})=>stage===1?<Select label="逐次応答の状態" value={output} onChange={setOutput} ready={ready}>{Object.entries(outputs).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===2?<Select label="ユーザーへの進捗表示" value={display} onChange={setDisplay} ready={ready}><option value="summary">語彙に翻訳した一文</option><option value="raw">生の入出力をダンプ</option></Select>:null}
  scene={s=><FeedbackCanvas diagram="stream-progress-surface" {...s}>{f=><>
   <Text y={35}>{['推論・ツール・APIの待ちを伝える','最初の表示と、最終結果を区分する','内部イベントをユーザー語彙へ翻訳'][f.stage]}</Text>
   {f.stage===0?<>
    {['推論','ツール実行','外部API'].map((t,i)=><Box key={t} x={32+i*204} y={84} width={168} height={102} title={t} tone="violet"/>)}
    <Wire id={s.id} d="M200 135H229M404 135H433" active phase={f.phase}/><Box x={67} y={279} width={506} height={104} title="動いているか理解できる表示" lines={['待ち時間と、故障か分からない不安を分ける']} tone="teal"/>
    <Text y={243} small>数十秒〜数分は原文の説明。実測時間ではない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={83} width={260} height={148} title="最初のtoken" lines={['生成しながら表示','TTFTと全体時間は別','接続開始は成功と別']} tone="violet"/>
    <Wire id={s.id} d="M292 157H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={148} title={outputs[output][0]} lines={[outputs[output][1],'応答の状態を記録']} tone={output==='complete'?'teal':'amber'} data-stream-output-state={output} data-partial-is-final={String(output==='complete')}/>
    <Text y={355} small>途中でツール呼出し・エラーへ切り替わり得る</Text>
   </>:<>
    <Box x={67} y={76} width={506} height={101} title="ツール呼出しイベント" lines={['内部の結果・秘密情報・個人情報を含み得る']} tone="violet"/>
    <Wire id={s.id} d="M320 177V241" active phase={f.phase}/><Box x={67} y={252} width={506} height={119} title={display==='summary'?'ユーザー向けの一文へ翻訳':'生のダンプは表示設計を見直す'} lines={display==='summary'?['検索しています → 規定と照合しています','必要な状態を伝え、表示内容をレビュー']:['読めない量と、内部情報の流出を点検','進捗率や結果を推測で作らない']} tone={display==='summary'?'teal':'amber'} data-raw-output-safe="false"/>
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
export function StreamCancellationState({children}){
 const [stopped,setStopped]=useState('yes'),[external,setExternal]=useState('yes'),[saved,setSaved]=useState('no'),[mode,setMode]=useState('job'),[changed,setChanged]=useState('yes'),[adopt,setAdopt]=useState('no')
 const state=streamStop({loopStopped:stopped==='yes',externalCompleted:external==='yes',checkpointSaved:saved==='yes'})
 return <FeedbackFigure diagram="stream-cancellation-state" title="停止・保存・遅れた結果を、呼出しIDと外部作用へ結び付ける"
  controls={({stage,ready})=>stage===0?<><Select label="裏のループの停止" value={stopped} onChange={setStopped} ready={ready}><option value="yes">停止を確認</option><option value="no">走り続けている</option></Select><Select label="外部操作の完了" value={external} onChange={setExternal} ready={ready}><option value="yes">送信・更新が完了済み</option><option value="no">完了を確認していない</option></Select></>:stage===1?<Select label="途中状態の保存" value={saved} onChange={setSaved} ready={ready}><option value="no">保存未確認</option><option value="yes">checkpointを保存</option></Select>:stage===2?<Select label="原文の実行形態" value={mode} onChange={setMode} ready={ready}><option value="chat">同期チャット型</option><option value="job">非同期ジョブ型</option></Select>:stage===3?<Select label="実行中の条件変更" value={changed} onChange={setChanged} ready={ready}><option value="yes">条件が変わった</option><option value="no">変更を確認していない</option></Select>:stage===4?<Select label="新しい実行への結果採用" value={adopt} onChange={setAdopt} ready={ready}><option value="no">採用しない・未判断</option><option value="yes">条件を照合して採用</option></Select>:null}
  scene={s=><FeedbackCanvas diagram="stream-cancellation-state" {...s}>{f=><>
   <Text y={35}>{['UIの停止と、実行・作用を照合','保存した状態から、再開と引継ぎを検討','対話の修正と、長い仕事の照会を分ける','IDと実行状態で、重複と条件変更を扱う','遅れた結果を元の実行へ記録','APIの機能と、アプリの復旧責任'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={82} width={260} height={165} title={state.loopStopped?'ループ停止を確認':'UIだけ停止の可能性'} lines={['ループ・実行中ツール','停止条件まで貫通','見た目だけで判断しない']} tone={state.loopStopped?'teal':'amber'} data-loop-stopped={String(state.loopStopped)}/>
    <Box x={348} y={82} width={260} height={165} title={state.externalEffectRemains?'完了した作用は残る':'外部の実状態を照会'} lines={['送信済み・更新済み','取消不能なら補償を検討','推論停止は巻戻しではない']} tone="amber" data-external-effect-remains={String(state.externalEffectRemains)} data-external-undone="false"/>
    <Text y={355} small>停止と追加指示は、すでに実行した作用を消さない</Text>
   </>:f.stage===1?<>
    <Box x={67} y={79} width={506} height={106} title="途中経過をcheckpointへ" lines={['中断を、再開・引継ぎできる状態にする']} tone="violet"/>
    <Wire id={s.id} d="M320 185V262" active phase={f.phase}/><Box x={67} y={274} width={506} height={111} title={state.resumeCandidate?'保存状態から再開を検討':'停止と保存の確認へ戻す'} lines={['画面を閉じるだけで復旧は得られない']} tone={state.resumeCandidate?'teal':'amber'} data-resume-candidate={String(state.resumeCandidate)}/>
   </>:f.stage===2?<>
    <Box x={67} y={79} width={506} height={110} title={mode==='chat'?'同期チャット：数秒〜1分程度':'非同期ジョブ：数分〜時間単位'} lines={['原文の目安。タスクの特性と合わせる']} tone="violet"/>
    <Wire id={s.id} d="M320 189V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={111} title={mode==='chat'?'逐次表示・進捗・キャンセル':'受付 → 実行 → 照会・通知'} lines={[mode==='chat'?'対話で方向を修正したい仕事':'長い仕事と、承認待ちを通知で運ぶ']} tone="teal" data-stream-work-mode={mode}/>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={165} title="call_idと実行状態" lines={['同じ操作を重複起動しない','元の呼出しへ結果を対応','受付と反映を別に確認']} tone="violet"/>
    <Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={165} title={changed==='yes'?'対象・引数・承認を再評価':'条件の有効性を確認'} lines={['変更内容と残件を表示','完了済みの仕事を保持','既実行は自動取消しない']} tone="teal" data-steering-undoes="false"/>
    <Text y={358} small>実行中の追加指示は、次の入力へ結び付ける</Text>
   </>:f.stage===4?<>
    <Box x={67} y={79} width={506} height={110} title="停止後に結果が到着" lines={['元の実行へ記録し、外部作用の事実を表示']} tone="violet"/>
    <Wire id={s.id} d="M320 189V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={111} title={adopt==='yes'?'新条件と照合した結果を採用':'新実行へ自動で混ぜない'} lines={['採用の判断を実行状態とともに残す']} tone={adopt==='yes'?'teal':'amber'} data-late-result-auto-adopted="false"/>
   </>:<>
    <Box x={32} y={82} width={260} height={174} title="APIの例" lines={['Astraのasyncツール','結果は元のcall_idへ','WebSocketのsteering']} tone="violet"/>
    <Box x={348} y={82} width={260} height={174} title="アプリの実装責任" lines={['永続化・重複防止','再起動後の復旧','取消不能な作用の照会']} tone="teal" data-api-guarantees-recovery="false"/>
    <Text y={359} small>asyncは、アプリがツールを実行する間の継続</Text>
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
