'use client'
import {useId,useState} from 'react'
import {DecisionFigure,DecisionCanvas,DecisionPanel,Text,Select} from './case-decisions-primitives'
import {pilotCriteria,prospectiveDecision} from '../../lib/case-decisions-model.mjs'
const opts=a=>a.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function PilotCriteriaValue({children}){
 const id=useId(),[threshold,setThreshold]=useState('95'),result=pilotCriteria(Number(threshold));const panels=[
 {caption:'demoの期待から、実入力の品質・費用とやめる判断へ',columns:[['demo','選ばれた質問で成功','経営の期待'],['本番に近い入力','品質と費用の壁','構造と基準へ戻す']],flow:true},
 {caption:'答えられる例の存在と、実入力の成功率は別の証拠',columns:[['選別したdemo','うまくいく例が存在','曖昧・複合的な問いは少ない'],['代表する評価','実入力の分布を測る','成功率は別の測定']],flow:false},
 {caption:'高い誤答の損害と、知識源の欠落を前提として確認',columns:[['誤答の損害','専門的な社外照会','人が全てreviewする負担'],['知識源の前提','古い・散在・矛盾','検索だけで解決しない']],flow:false},
 {caption:'基準を下げても、残る人手と負の費用対効果は消えない',columns:[['架空の品質','事例の設定：80%',`表示する基準：${threshold}%`,result.displayedCriterionMet?'変更した表示基準は達成':'表示基準に未達'],['元の目的と条件','着手時95%は未達','人手と運用費が残る','省力化の達成は別']],flow:false,note:'95%・80%は原文の架空設定。実測値や自社の推奨値ではない。'},
 {caption:'生成費だけでなく、検証・人手と削減効果を一緒に照合',columns:[['増える費用','大きなmodelと多段検証','人手review'],['残る効果','引取りが多いと減る','将来費用と比較']],flow:false},
 {caption:'事後に成功へ見せるより、先に合意した基準へ戻る',columns:[['照合の根拠','代表する評価','知識源と実運用費'],['判断の候補','続行・縮小・撤退','図は実投資を決めない']],flow:true}
 ]
 return <DecisionFigure diagram="pilot-criteria-value" title="見かけの成功基準と、省力化の目的を分ける" scene={({phase})=><DecisionCanvas diagram="pilot-criteria-value" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>架空の例。数値・結末を一般則にせず、自分のdataと基準で判断。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===3?<Select label="原文の架空の成功基準" value={threshold} onChange={setThreshold} ready={ready}>{opts([['95','着手時の95%'],['80','事後に緩めた80%']])}</Select>:null}>{children}</DecisionFigure>
}
export function PilotWithdrawalAssets({children}){
 const id=useId(),[future,setFuture]=useState('negative'),[past,setPast]=useState('0');const review=prospectiveDecision({qualityMet:future==='all',futureValuePositive:future!=='negative',problemSolvable:future==='all',sunkCost:Number(past)})
 const panels=[
 {caption:'先に決めた品質と費用対効果へ、パイロット結果を照合',columns:[['着手時の基準','品質と費用対効果','未達なら撤退を検討'],['パイロットの根拠','知識源と実入力','事後の緩和で隠さない']],flow:true},
 {caption:'過去の費用の大きさから、これからの価値と費用へ',columns:[['過去の費用',`${past}：模式の入力`,'既に使った分は除く','大小を続行の理由にしない'],[review.continuationReviewCandidate?'続行reviewの検討候補':'将来の基準と見込みへ','品質・将来価値・解ける根拠','図は実採否を決めない','過去費用は判定に使わない']],flow:false},
 {caption:'追加投資で問題が解ける根拠を、構造から確認する',columns:[['残る構造問題','知識源の古さと矛盾','追加予算だけで解けない'],['将来の見込み','何を変えれば解けるか','品質と価値を再評価']],flow:true},
 {caption:'曖昧に終えず、根拠を説明して資産を回収する',columns:[['関係者への説明','基準・試算・判断根拠','経営・現場・関係部署'],['残る資産','評価・分類・知識源の発見','次の整備の起点']],flow:true},
 {caption:'学びと評価を、次の企画の前提確認へ渡す',columns:[['回収した資産','評価セット・分類','知識源の課題'],['次の案件','前提の整備と許可','同じ欠落を見逃さない']],flow:true},
 {caption:'この事例の結末から、やめる判断の型を持ち帰る',columns:[['先決めした基準','品質と将来価値','サンクコストを除く'],['自案件の判断','実結果と許容risk','続ける判断もあり得る']],flow:false}
 ]
 return <DecisionFigure diagram="pilot-withdrawal-assets" title="将来価値で検討し、説明と評価資産を残す" scene={({phase})=><DecisionCanvas diagram="pilot-withdrawal-assets" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>過去の投入量だけで判断せず、模式入力を実価格・効果へ変換しない。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===1?<><Select label="将来の品質と価値の模式条件" value={future} onChange={setFuture} ready={ready}>{opts([['negative','将来価値が負'],['unsolved','価値は正でも品質と見込みが不足'],['all','品質・価値・見込みを照合した模式入力']])}</Select><Select label="判断から除く過去費用の模式入力" value={past} onChange={setPast} ready={ready}>{opts([['0','0'],['100','100'],['10000','10000']])}</Select></>:null}>{children}</DecisionFigure>
}
