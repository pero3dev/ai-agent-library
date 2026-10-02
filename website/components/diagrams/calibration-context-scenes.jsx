'use client'
import {useId,useState} from 'react'
import {ContextCanvas,ContextFigure,ContextPair,ContextThree,Text,Box,Select,Tokens} from './evaluation-context-primitives'
import {calibrationBins,selectivePrediction} from '../../lib/evaluation-context-model.mjs'
const makeBins=counts=>[.5,.7,.8,.9].map((confidence,i)=>({confidence,total:10,correct:counts[i]}))
const samples={overconfident:makeBins([4,6,5,7]),calibrated:makeBins([5,7,8,9]),broken:makeBins([4,8,6,5]),empty:[.5,.7,.8,.9].map(confidence=>({confidence,total:0,correct:0}))}
const methods={self:['自己申告','確信度を数値で尋ねる','過信・迎合が残る','そのまま確率にせず'],logprob:['logprob','出力tokenの確率','使えるモデル・用途に条件','長い生成の解釈に注意'],agreement:['反復の一致度','同じ入力で答えを比較','割れることは不確実の信号','一致を正解にせず']}
const percent=value=>value===null?'母数なし':`${Math.round(value*100)}%`
function SampleSelect({value,onChange,ready,label='較正の模式集計'}){return <Select label={label} value={value} onChange={onChange} ready={ready}><option value="overconfident">確信より正解率が低い</option><option value="calibrated">模式集計で対角線に一致</option><option value="broken">高信頼の順序が壊れる</option><option value="empty">評価したケースがない</option></Select>}
export function CalibrationSignalsBins({children}){
 const id=useId(),[method,setMethod]=useState('self'),[sample,setSample]=useState('overconfident'),bins=calibrationBins(samples[sample]),focus=bins[2]
 return <ContextFigure diagram="calibration-signals-bins" title="信頼度の信号と、確信・正解率の較正" scene={({phase})=><ContextCanvas diagram="calibration-signals-bins" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['確信の数字を、検証して行動へ渡す','取り出す方法と、その信頼性の限界を読む','確信80%のケースが、実際に何割正しいか','平均確信度と正解率を、母数付きで照合する','信頼度の順序が、正解率の順序か確認する'][stage]}</Text>
  {stage===0?<ContextPair id={id} phase={phase} left={['取り出した信号','過信・幻覚を前提に','数値をそのまま信じず','実際の正解と照合']} right={['低信頼の行動へ','不明と答える経路','人への引き継ぎ','閾値と較正を監視']}/>:stage===1?<Box x={64} y={104} width={512} height={207} title={methods[method][0]} lines={methods[method].slice(1)} tone="violet"/>:stage===2?<ContextPair id={id} phase={phase} arrow={false} left={['同じ確信のケース','確信80%と答えた群','個別回答の確率にせず','正解ラベルを別に保つ']} right={['実際の正解率','8/10正解なら80%','5/10正解なら50%','原文の概念例で実測でない']}/>:stage===3?<g data-calibration-bin-observed={focus.accuracy===null?'unavailable':String(focus.accuracy)} data-calibration-model-measured="false">
   <Text x={64} y={78} small anchor="start">模式の正解率 ↑</Text>
   <Text x={566} y={78} small anchor="end">破線: 確信＝正解率</Text>
   <path d="M88 101V327H569" fill="none" stroke="#a7becf" strokeWidth="2"/>
   {[.25,.5,.75,1].map(value=><g key={value}><path d={`M88 ${327-value*216}H569`} stroke="#7893a7" strokeOpacity=".35"/><Text x={60} y={334-value*216} small>{`${value*100}`}</Text></g>)}
   <path d="M88 327L568 111" stroke="#bfd1df" strokeWidth="2" strokeDasharray="6 6" fill="none"/>
   {bins.map(bin=><g key={bin.confidence}><Text x={88+bin.confidence*480} y={354} small>{`${bin.confidence*100}`}</Text>{bin.accuracy!==null&&<><path d={`M${88+bin.confidence*480} ${327-bin.confidence*216}V${327-bin.accuracy*216}`} stroke="#ffd48a" strokeWidth="2"/><circle cx={88+bin.confidence*480} cy={327-bin.accuracy*216} r={bin.confidence===.8?11:7} fill="#42d6b2" stroke="#e4efff" strokeWidth="2"/></>}</g>)}
   <Text x={567} y={382} small anchor="end">平均確信度(%) →</Text>
   <Text y={409} small>{focus.total?`80%のビン: ${focus.correct}/${focus.total}正解。点と破線の差を読む。`:'母数がないビン: 正解率の点を描かない'}</Text>
  </g>:<ContextPair id={id} phase={phase} arrow={false} left={['完全な較正が難しくても','高い信頼ほど正解するか','順序を評価セットで確認','縮退の閾値へ使う']} right={['順位が壊れるなら','高信頼の誤答が残る','閾値の高さだけで決めず','測定と較正へ戻る']}/>}
 </>}</ContextCanvas>} controls={({stage,ready})=>stage===1?<Select label="確信度を取り出す方法" value={method} onChange={setMethod} ready={ready}>{Object.entries(methods).map(([value,row])=><option key={value} value={value}>{row[0]}</option>)}</Select>:stage===3?<SampleSelect value={sample} onChange={setSample} ready={ready}/>:null}>{children}</ContextFigure>
}
export function CalibrationAbstainUpdate({children}){
 const id=useId(),[sample,setSample]=useState('overconfident'),[threshold,setThreshold]=useState('0.8'),[risk,setRisk]=useState('high'),result=selectivePrediction(samples[sample],Number(threshold))
 return <ContextFigure diagram="calibration-abstain-update" title="棄権の割合・回答した精度と、閾値の再測定" scene={({phase})=><ContextCanvas diagram="calibration-abstain-update" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['低信頼を、答えない・人へ回す経路へ結ぶ','答えた母数と、答える割合を別々に読む','誤答と棄権の負担を、タスクから判断する','閾値を変えた結果を、セット上で測る','構成の変更後に、旧閾値を転用しない','監視と回帰で、較正のずれを点検する'][stage]}</Text>
  {stage===0?<ContextPair id={id} phase={phase} arrow={false} left={['信頼度が閾値以上','回答する経路の候補','高信頼でも誤答は残る','実行時ガードも保つ']} right={['信頼度が閾値未満','不明と答える','人へエスカレーション','業務の運用へつなぐ']}/>:stage===1||stage===3?<>
   <ContextPair id={id} phase={phase} arrow={false} left={['答える割合',`${result.answered}/${result.total}件に回答`,percent(result.coverage),'全評価ケースが母数']} right={['答えたケースの精度',`${result.correct}/${result.answered}件が正解`,percent(result.accuracy),'回答したケースが母数']}/>
   <g data-selective-coverage={result.coverage===null?'unavailable':String(result.coverage)} data-selective-accuracy={result.accuracy===null?'unavailable':String(result.accuracy)} data-selective-escalation-sent="false"><Text y={322} small>{`模式閾値: ${Number(threshold)*100}%。実モデルの測定・最適閾値ではない。`}</Text></g>
   <Text y={365} small>{sample==='broken'?'順序が壊れる集計では、閾値を上げても精度は改善しない':'較正と順位を点検し、失敗費用に合う点を選ぶ'}</Text>
  </>:stage===2?<Box x={64} y={104} width={512} height={207} title={risk==='high'?'誤答が高くつくタスク':'下書き・候補提示などのタスク'} lines={risk==='high'?['医療・金融・不可逆操作の条件','疑わしい回答は人へ回す設計','図は実リスク判定や閾値を決めない']:['誤答と棄権の負担を比較','評価セットで閾値を選ぶ','低い閾値を無条件に安全にせず']} tone={risk==='high'?'amber':'violet'}/>:stage===4?<ContextPair id={id} phase={phase} left={['構成の変更','モデルの更新','大きなprompt変更','確信と正解の関係がずれる']} right={['較正を測り直す','同条件の評価へ','閾値を再調整','回帰の検査へ含める']}/>:<ContextPair id={id} phase={phase} left={['定期の監視','較正と分布のずれ','高信頼の誤答を点検','過信の素通りを検知']} right={['測定と運用へ戻す','旧閾値を固定しない','セット・構成の版を保持','一度の測定を永久保証にせず']}/>}
 </>}</ContextCanvas>} controls={({stage,ready})=>stage===1||stage===3?<><SampleSelect value={sample} onChange={setSample} ready={ready} label="棄権で読む模式集計"/><Select label="模式の回答閾値" value={threshold} onChange={setThreshold} ready={ready}><option value="0">すべて回答</option><option value="0.7">70%以上</option><option value="0.8">80%以上</option><option value="0.9">90%以上</option><option value="1">100%以上・全棄権</option></Select></>:stage===2?<Select label="誤答と棄権を比べるタスク" value={risk} onChange={setRisk} ready={ready}><option value="high">誤答の負担が高い</option><option value="draft">下書き・候補提示</option></Select>:null}>{children}</ContextFigure>
}
