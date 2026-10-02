'use client'
import {useId,useState} from 'react'
import {IntegrationCanvas,IntegrationFigure,IntegrationPair,Text,Box,Wire,Select,Tokens} from './model-mcp-evaluation-primitives'
import {evaluationGraderRoute,evaluationRepeatResult} from '../../lib/model-mcp-evaluation-model.mjs'
const graders={code:['コードによる採点','決定的な条件を確認','再現できる検査','基準と期待値を版管理'],judge:['検証したjudgeを候補へ','開放出力の基準を照合','人手との一致を点検','採点者自体も評価する'],human:['人手による点検へ','曖昧な条件と業務の判断','基準の合意を確認','次の回帰へ反映する'],unconfirmed:['採点の基準を整える','未検証のjudgeに任せず','必要な人手を確認','図は採点を実行しない']}
export function EvaluationLayersGraders({children}){
 const id=useId(),[grader,setGrader]=useState('unconfirmed')
 const result=evaluationGraderRoute({deterministicCriterion:grader==='code',openOutput:true,judgeValidated:grader==='judge',humanAvailable:grader==='human'})
 return <IntegrationFigure diagram="evaluation-layers-graders" title="成果・軌跡・部品と、採点を分担する条件" scene={({phase})=><IntegrationCanvas diagram="evaluation-layers-graders" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['難しさの原因に合わせ、評価する対象を分ける','投入判断は、最終の回答と実状態から見る','原因と安全性は、途中の作用を照合する','部品の改善から、タスク全体の回帰へ戻る','コード・judge・人手で、採点を分担する'][stage]}</Text>
  {stage===0?<>
   <Box x={32} y={91} width={260} height={112} title="非決定性" lines={['同じ入力でも成否が変わる','低温度で消えるとは限らず']} tone="violet"/>
   <Box x={348} y={91} width={260} height={112} title="自由な経路" lines={['複数の達成経路がある','一つの軌跡に固定しない']} tone="teal"/>
   <Box x={32} y={239} width={260} height={112} title="開放出力" lines={['文字列一致では判定不足','内容と条件を照合する']} tone="amber"/>
   <Box x={348} y={239} width={260} height={112} title="多段の失敗" lines={['原因が複数の層にある','部品と全体を区分する']} tone="violet"/>
  </>:stage===1?<IntegrationPair id={id} phase={phase} arrow={false} left={['最終の回答','依頼の条件に照合','根拠と必要な内容','成功宣言だけで決めず']} right={['実際の最終状態','保存や業務の結果','タスクの成功条件へ照合','投入の判断に使う']}/>:stage===2?<>
   <Tokens labels={['toolの選択','渡した引数','実際の作用']} y={103} selected={[0,1,2]}/>
   <Box x={64} y={229} width={512} height={141} title="失敗原因と、安全性の境界を照合" lines={['最終成果と軌跡を別々に記録する','正解経路を一つだけ要求しない','許可・副作用・停止の条件を残す']} tone="violet"/>
  </>:stage===3?<IntegrationPair id={id} phase={phase} left={['部品を切り分ける','検索・分類・tool実装','小さな反復で原因を探る','部品の合格は局所の結果']} right={['全体の回帰へ戻る','実入力のタスクで再確認','最終状態と失敗を照合','部品合格を達成にしない']}/>:<Box x={64} y={104} width={512} height={201} title={graders[grader][0]} lines={graders[grader].slice(1)} tone={grader==='unconfirmed'?'amber':'teal'} data-evaluation-grader-next={result.next} data-evaluation-grading-executed="false"/>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===4?<Select label="採点条件の選択" value={grader} onChange={setGrader} ready={ready}><option value="code">決定的な条件がある</option><option value="judge">judgeを検証した</option><option value="human">人手の点検が可能</option><option value="unconfirmed">基準と採点者が未確認</option></Select>:null}>{children}</IntegrationFigure>
}
const investments={prototype:['試作の段階','実入力と失敗から始める','軽い評価で反復する','件数目安は網羅の保証でない'],before:['投入前の段階','期待する品質へ合意','代表ケースと回帰を固定','必要な安全性も照合する'],live:['運用の段階','失敗を次のケースへ戻す','回帰・監視へ接続','評価の版と基準を管理']}
export function EvaluationHarnessDecision({children}){
 const id=useId(),[runs,setRuns]=useState(3),[passed,setPassed]=useState(1),[policy,setPolicy]=useState('all'),[investment,setInvestment]=useState('before')
 const result=evaluationRepeatResult({runs,passed,policy})
 return <IntegrationFigure diagram="evaluation-harness-decision" title="評価資産・反復の基準・投入条件" scene={({phase})=><IntegrationCanvas diagram="evaluation-harness-decision" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['実際の失敗から、入力と期待条件をケースにする','四つの部品で、再実行できる評価を管理する','平均だけでなく、ケースごとの合否と原因を残す','同じ成否でも、採用する基準で判定が変わる','品質と、費用・遅延・ステップを別に見る','試作・投入前・運用で、評価の投資を変える'][stage]}</Text>
  {stage===0?<>
   <Tokens labels={['通常','曖昧','不足','拒否','秘密']} y={102} selected={[0,1,2,3,4]}/>
   <Box x={64} y={231} width={512} height={140} title="秘密を除き、期待する条件を版管理" lines={['正常系や容易な想像だけに偏らせない','実入力と業務の失敗を取り込む','採点基準とデータの版を残す']} tone="violet"/>
  </>:stage===1?<>
   <Box x={32} y={85} width={260} height={125} title="1. データセット" lines={['入力・期待値・条件','ケースと基準を版管理']} tone="violet"/>
   <Box x={348} y={85} width={260} height={125} title="2. 実行" lines={['対象と設定を記録','軌跡と最終状態を保存']} tone="teal"/>
   <Box x={348} y={245} width={260} height={125} title="3. 採点" lines={['基準に照合する','judgeも必要なら検証']} tone="amber"/>
   <Box x={32} y={245} width={260} height={125} title="4. 報告" lines={['失敗一覧と差分','品質と費用を区分']} tone="violet"/>
   <Wire id={id} d="M292 147H340" active phase={phase}/><Wire id={id} d="M478 210V237" active phase={phase}/><Wire id={id} d="M348 307H300" active phase={phase}/>
  </>:stage===2?<IntegrationPair id={id} phase={phase} arrow={false} left={['ケースごとの合否','成功条件への達成を確認','失敗の入力と原因を記録','平均だけで理由を隠さず']} right={['変更前後の差分','成功と失敗を並べる','費用・遅延・ステップ','品質と混ぜて判断せず']}/>:stage===3?<>
   <Tokens labels={Array.from({length:runs},(_,i)=>i<passed?'成功':'失敗')} y={101} selected={Array.from({length:passed},(_,i)=>i)}/>
   <Box x={64} y={228} width={512} height={143} title={result.observedAccepted?'選んだ基準で、観測入力は合格':'選んだ基準で、観測入力は不合格'} lines={[`模式入力: ${runs}回中${passed}回の成功`,policy==='any'?'基準: 1回以上の成功':'基準: 全回の成功','実Agentの測定や品質保証ではない']} tone={result.observedAccepted?'teal':'amber'} data-evaluation-repeat-accepted={String(result.observedAccepted)} data-evaluation-repeat-rate={String(result.passRate)} data-evaluation-quality-guaranteed="false"/>
  </>:stage===4?<IntegrationPair id={id} phase={phase} arrow={false} left={['品質の条件','自タスクの成功条件','ケースと失敗の傾向','公開順位を転用しない']} right={['運用の条件','費用と待ち時間','必要なステップと予算','品質と別々に合意する']}/>:<Box x={64} y={106} width={512} height={201} title={investments[investment][0]} lines={investments[investment].slice(1)} tone="violet"/>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===3?<div className="evaluation-repeat-controls"><Select label="模式入力の反復回数" value={String(runs)} onChange={value=>{const n=Number(value);setRuns(n);setPassed(p=>Math.min(p,n))}} ready={ready}>{[3,4,5].map(n=><option key={n} value={String(n)}>{n}回</option>)}</Select><Select label="模式入力の成功回数" value={String(passed)} onChange={value=>setPassed(Number(value))} ready={ready}>{Array.from({length:runs+1},(_,n)=><option key={n} value={String(n)}>{n}回</option>)}</Select><Select label="反復の合格基準" value={policy} onChange={setPolicy} ready={ready}><option value="any">1回以上の成功</option><option value="all">全回の成功</option></Select></div>:stage===5?<Select label="評価投資の段階" value={investment} onChange={setInvestment} ready={ready}><option value="prototype">試作</option><option value="before">投入前</option><option value="live">運用</option></Select>:null}>{children}</IntegrationFigure>
}
