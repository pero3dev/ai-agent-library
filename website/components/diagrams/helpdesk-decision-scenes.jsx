'use client'
import {useId,useState} from 'react'
import {DecisionFigure,DecisionCanvas,DecisionPanel,Text,Select} from './case-decisions-primitives'
import {helpdeskAction,helpdeskTrace} from '../../lib/case-decisions-model.mjs'
const opts=a=>a.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function HelpdeskActionBoundary({children}){
 const id=useId(),[action,setAction]=useState('reset'),[missing,setMissing]=useState('approval'),result=helpdeskAction({action,identityMatched:missing!=='identity',allowlisted:missing!=='allowlist',approved:missing!=='approval',toolEnforced:missing!=='tool',attributable:missing!=='actor'}),names={reset:'パスワードreset',software:'許可済みsoftware配布',rights:'account権限申請'}
 const panels=[
 {caption:'照会と実行の開放を、同じ速度にしない',columns:[['読み取りの価値','FAQ・申請状況・資産','必要な範囲を照会'],['実行の価値','reset・配布・権限申請','一操作ずつriskを確認']],flow:false},
 {caption:'まず照会のlogで、頻出する本当の要望を把握',columns:[['照会から始める','手順と現在の状態','一次対応の削減を測る'],['実行に進む材料','頻出の操作と損害','一度に全部開放しない']],flow:true},
 {caption:'操作ごとに本人確認・許可リスト・承認を分ける',columns:[[names[action],result.identityRequired?'本人確認を条件にする':'操作別のscopeを確認',result.approvalRequired?'人の承認が必要':'許可リスト内に限定','toolの強制と帰属は共通'],[result.actionReviewCandidate?'操作reviewの検討候補':'操作条件へ戻る','自社でriskを再評価','図は操作を実行しない','一律の自動化にしない']],flow:true},
 {caption:'承認対象を、これからする操作と影響で示す',columns:[['対象と操作','誰のどの操作か','必要な権限と差分'],['影響と承認','誰にどの影響があるか','素通りの承認を避ける']],flow:true},
 {caption:'可逆性・影響・本人確認から、自社の自律度を選ぶ',columns:[['一操作ずつ評価','実行前のrisk','最小の権限'],['自律度を分ける','限定自動化か事前承認か','事例の区分を転用しない']],flow:true}
 ]
 return <DecisionFigure diagram="helpdesk-action-boundary" title="照会の後、操作ごとの条件で実行を開く" scene={({phase})=><DecisionCanvas diagram="helpdesk-action-boundary" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>架空事例の操作区分。可逆性・影響・本人確認を自組織で評価し直す。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===2?<><Select label="原文の操作の種類" value={action} onChange={setAction} ready={ready}>{opts([['reset','パスワードreset'],['software','許可済みsoftware配布'],['rights','account権限申請']])}</Select><Select label="操作reviewで不足する確認" value={missing} onChange={setMissing} ready={ready}>{opts([['identity','本人確認'],['allowlist','許可リスト'],['approval','人の承認'],['tool','tool側の強制'],['actor','行為の帰属'],['none','全条件を照合した模式入力']])}</Select></>:null}>{children}</DecisionFigure>
}
export function HelpdeskAuthorityTrace({children}){
 const id=useId(),[missing,setMissing]=useState('actor'),review=helpdeskTrace({inputRecorded:missing!=='input',decisionRecorded:missing!=='decision',toolRecorded:missing!=='tool',approvalRecorded:missing!=='approval',outcomeRecorded:missing!=='outcome',actorRecorded:missing!=='actor'})
 const panels=[
 {caption:'Agentの行為として帰属できる、操作別の最小権限',columns:[['広い管理者権限','全域へ影響が広がる','必要以上に開放しない'],['操作別のAgent権限','実行に必要なscope','誰が行ったかを記録']],flow:true},
 {caption:'本人のみ・許可リスト内を、実装側で強制する',columns:[['modelへのお願い','指示が回避され得る','認可の正本にしない'],['toolの実装','本人scope・許可リスト','実経路で操作を制限']],flow:true},
 {caption:'入力と判断から、tool・承認・結果・行為者を結ぶ',columns:[['一つの操作の記録','入力・判断・tool','承認と実行結果','行為者のIDと帰属'],[review.traceReviewCandidate?'記録reviewの検討候補':'不足する記録へ戻る','実行済みの証明は別','承認済みの証明は別','図は記録を収集しない']],flow:true},
 {caption:'誰の承認で、どの権限付与が行われたかを説明',columns:[['承認の対象','user・操作・影響','誰が承認したか'],['実行の結果','実行主体と時点','従来の操作logへ対応']],flow:true},
 {caption:'セルフサービスの効果と、権限・承認を運用で見直す',columns:[['効果の測定','一次対応の削減','費用対効果を実測'],['権限と運用','一操作ずつ見直す','照会と実行を別の速度で']],flow:false}
 ]
 return <DecisionFigure diagram="helpdesk-authority-trace" title="最小権限と強制を、帰属できる操作記録へ結ぶ" scene={({phase})=><DecisionCanvas diagram="helpdesk-authority-trace" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>記録項目だけで実行・承認を証明せず、実運用の結果へ照合する。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===2?<Select label="操作記録で不足する項目" value={missing} onChange={setMissing} ready={ready}>{opts([['input','入力'],['decision','判断'],['tool','tool'],['approval','承認'],['outcome','実行結果'],['actor','行為者と帰属'],['none','全項目を照合した模式入力']])}</Select>:null}>{children}</DecisionFigure>
}
