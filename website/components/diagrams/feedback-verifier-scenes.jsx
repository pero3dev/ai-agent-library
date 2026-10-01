'use client'
import {useState} from 'react'
import {FeedbackFigure,FeedbackCanvas,Text,Box,Wire,Select} from './feedback-streaming-primitives'
import {feedbackRetry} from '../../lib/feedback-streaming-model.mjs'
const formats={raw:['生ログ','短い・詳細が判断に必要','長大だと希釈と費用増'],summary:['要約','大量結果の要点を返す','情報損失を点検する'],structured:['構造化','キー・値・表で参照','整形の前処理が必要']}
export function FeedbackObservationDesign({children}){
 const [format,setFormat]=useState('summary'),[error,setError]=useState('date')
 return <FeedbackFigure diagram="feedback-observation-design" title="結果を次の判断へ整形し、回復できるエラーへ翻訳する"
  controls={({stage,ready})=>stage===1?<Select label="結果を返す形式" value={format} onChange={setFormat} ready={ready}>{Object.entries(formats).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===3?<Select label="原文の失敗区分" value={error} onChange={setError} ready={ready}><option value="date">引数の日付形式</option><option value="auth">認証失効</option><option value="missing">対象消失</option></Select>:null}
  scene={s=><FeedbackCanvas diagram="feedback-observation-design" {...s}>{f=><>
   <Text y={35}>{['次の行動へ返す情報も設計する','次の判断に必要な情報を優先','原因・候補・制約を含むエラー','モデルが直せる範囲を照合'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={84} width={260} height={166} title="実行時の観測" lines={['ツール結果・検証結果','次の一手へ返す入力','成功と副作用も記録']} tone="teal"/>
    <Box x={348} y={84} width={260} height={166} title="開発時の評価" lines={['品質を比較して測る','評価セット・軌跡','配置と目的が異なる']} tone="violet"/>
    <Text y={356} small>生ログの量だけで、理解と回復は保証しない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={79} width={260} height={160} title={formats[format][0]} lines={formats[format].slice(1)} tone="violet" data-feedback-format={format}/>
    <Wire id={s.id} d="M292 159H340" active phase={f.phase}/><Box x={348} y={79} width={260} height={160} title="次の一手へ必要な情報" lines={['状態・数値・識別子','省略と続きの所在','成功した作用も確認']} tone="teal"/>
    <Box x={67} y={302} width={506} height={91} title="全N件中M件を表示" lines={['NとMは原文の記法。実件数を作らない']} tone="amber" data-omission-disclosed="true"/>
   </>:f.stage===2?<>
    {['原因：dateの形式が不正','候補：YYYY-MM-DD','制約：過去30日以内'].map((t,i)=><Box key={t} x={67} y={76+i*108} width={506} height={82} title={t} tone={i===0?'amber':'teal'}/>)}
    <Text y={419} small>原文の照会例。全ツール共通の制約ではない</Text>
   </>:<>
    <Box x={67} y={80} width={506} height={110} title={error==='date'?'引数の形式を修正できる':error==='auth'?'認証が失効した':'対象が消失した'} lines={['内部のstack traceをそのまま流さない']} tone="violet"/>
    <Wire id={s.id} d="M320 190V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={110} title={error==='date'?'候補と制約に沿った修正へ':'停止・エスカレーションへ'} lines={['失敗を隠して成功にしない']} tone={error==='date'?'teal':'amber'} data-feedback-recoverable={String(error==='date')}/>
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
export function FeedbackVerifierControl({children}){
 const [deterministic,setDeterministic]=useState('fail'),[model,setModel]=useState('fail'),[recoverable,setRecoverable]=useState('yes'),[budget,setBudget]=useState('yes'),[repeated,setRepeated]=useState('no'),[protectedVerifier,setProtectedVerifier]=useState('yes')
 const state=feedbackRetry({recoverable:recoverable==='yes',budgetRemaining:budget==='yes',repeated:repeated==='yes'})
 return <FeedbackFigure diagram="feedback-verifier-control" title="検証を段階的に配置し、修正予算と書換え権限を分ける"
  controls={({stage,ready})=>stage===0?<Select label="決定的検証の結果" value={deterministic} onChange={setDeterministic} ready={ready}><option value="fail">不合格</option><option value="pass">通過</option></Select>:stage===1?<Select label="基準付きモデル判定" value={model} onChange={setModel} ready={ready}><option value="fail">不合格</option><option value="pass">通過</option></Select>:stage===3?<><Select label="モデルによる回復" value={recoverable} onChange={setRecoverable} ready={ready}><option value="yes">修正可能</option><option value="no">回復不能</option></Select><Select label="修正予算の残り" value={budget} onChange={setBudget} ready={ready}><option value="yes">残っている</option><option value="no">上限に到達</option></Select><Select label="同じ検証エラー" value={repeated} onChange={setRepeated} ready={ready}><option value="no">反復未確認</option><option value="yes">繰り返している</option></Select></>:stage===4?<Select label="検証器の書換え権限" value={protectedVerifier} onChange={setProtectedVerifier} ready={ready}><option value="yes">モデルの権限外</option><option value="no">モデルが変更できる</option></Select>:null}
  scene={s=><FeedbackCanvas diagram="feedback-verifier-control" {...s}>{f=><>
   <Text y={35}>{['安く確認できる検証を先に置く','judgeの検証と、人の要所の確認','具体的な検証結果を返す','予算と反復で修正経路を分ける','検証器の改竄を成功へ変えない','修正の影響と、本来の成果を照合'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={77} width={506} height={105} title="決定的検証" lines={['テスト・lint・型・スキーマ・照合']} tone="teal"/>
    <Wire id={s.id} d="M320 182V261" active phase={f.phase}/><Box x={67} y={273} width={506} height={108} title={deterministic==='pass'?'必要な高い検証へ':'具体的な失敗を修正へ返す'} lines={['通過しても全品質の保証ではない']} tone={deterministic==='pass'?'violet':'amber'} data-verifier-first-pass={String(deterministic==='pass')}/>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={173} title="モデル判定" lines={['開放的な品質と基準','judge自体を検証','人手ラベルと照合']} tone="violet"/>
    <Wire id={s.id} d="M292 169H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={173} title={model==='pass'?'人の要所の確認へ':'フィードバックへ戻す'} lines={['重要操作の承認は別','図は承認を実行しない']} tone={model==='pass'?'teal':'amber'} data-human-approval-executed="false"/>
    <Text y={359} small>検証できる範囲と費用を、タスクに合わせる</Text>
   </>:f.stage===2?<>
    <Box x={32} y={84} width={260} height={156} title="もう一度考えて" lines={['何が失敗したか不明','改善の保証はない']} tone="amber"/>
    <Box x={348} y={84} width={260} height={156} title="検証器の具体的出力" lines={['失敗した箇所と条件','次の修正を選べる情報']} tone="teal"/>
    <Text y={351} small>生成が難しくても、照合できる成果へ設計する</Text>
   </>:f.stage===3?<>
    {['回復の範囲','予算','反復'].map((t,i)=><Box key={t} x={32+i*204} y={78} width={168} height={103} title={t} lines={[[recoverable==='yes'?'修正可能':'回復不能'],[budget==='yes'?'残りあり':'上限到達'],[repeated==='yes'?'同じ失敗':'未確認']][i]} tone={[recoverable==='yes',budget==='yes',repeated==='no'][i]?'teal':'amber'}/>)}
    <Wire id={s.id} d="M116 181V220H320M524 181V220H320M320 181V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={109} title={state.next==='retry'?'具体的な情報で修正へ':state.next==='stop'?'停止して報告へ':'別手段・仕切直し・相談へ'} lines={['図で修正も外部操作も実行しない']} tone={state.next==='retry'?'teal':'amber'} data-feedback-next={state.next}/>
   </>:f.stage===4?<>
    <Box x={32} y={81} width={260} height={167} title="モデルの実装変更" lines={['課題の成果物を修正','成功の自己報告は別']} tone="violet"/>
    <Box x={348} y={81} width={260} height={167} title={protectedVerifier==='yes'?'検証器は権限外':'検証器も変更可能'} lines={['テスト・基準を固定','検査の無効化を検知','元の課題を独立に確認']} tone={protectedVerifier==='yes'?'teal':'amber'} data-verifier-protected={String(protectedVerifier==='yes')} data-green-guarantees-success="false"/>
    <Text y={356} small>緑を作る変更と、課題を解く変更を照合する</Text>
   </>:<>
    {['関連検証を再実行','本来の成果を照合','変更の軌跡を確認'].map((t,i)=><g key={t}><Box x={67} y={76+i*108} width={506} height={79} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${155+i*108}V${174+i*108}`} active phase={f.phase}/>}</g>)}
   </>}
  </>}</FeedbackCanvas>}>{children}</FeedbackFigure>
}
