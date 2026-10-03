'use client'
import {useId,useState} from 'react'
import {DecisionFigure,DecisionCanvas,DecisionPanel,Text,Select} from './case-decisions-primitives'
import {expenseMigration,expenseWrite} from '../../lib/case-decisions-model.mjs'
const opts=a=>a.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function ExpenseMigrationEvidence({children}){
 const id=useId(),[missing,setMissing]=useState('evidence'),review=expenseMigration({fixedStepsSufficient:missing==='fixed',evaluatedNeed:missing!=='evidence',regressionPresent:missing!=='regression'})
 const panels=[
 {caption:'構成の限界の証拠を得てから、次の形へ進む',columns:[['単発と固定手順','規定Q&A→固定の照会','今の要件を満たす形'],['自律loopと書込み','複合taskで反復が必要','書込みは別の許可']],flow:true},
 {caption:'一回の検索で足りる間は、loopの費用を足さない',columns:[['規定Q&A','規定文書を検索','回答を生成'],['最初の評価','Q&Aの品質を測る','構成が変わっても残す']],flow:true},
 {caption:'二分類の固定手順で足りたため、Workflowを選ぶ',columns:[['LLMで分類','規定の質問か照会か','型を分ける'],['コードで処理','照会APIは固定','LLMは回答の部品']],flow:true},
 {caption:'複合taskの反復の必要性と、評価・回帰の根拠を照合する',columns:[['移行の根拠','固定手順では足りない','評価した反復の必要','既存Q&Aの回帰'],[review.agentReviewCandidate?'Agentの検討候補':'今の要件と根拠へ戻る','実問い合わせの証拠','図は採用を決めない','架空の2割を転用しない']],flow:true},
 {caption:'自律的な反復を増やしても、権限は読み取りへ固定',columns:[['規定検索','必要な根拠を集める','情報不足なら質問'],['申請照会','実際の状態を読む','書込みtoolはまだない'],['コードの上限','step・時間・token','loopを止める']],flow:true},
 {caption:'既存の評価と記録を、構成変更の前後に持ち越す',columns:[['評価の継続','Q&Aの回帰case','新しい複合task'],['構造化trace','全stepの記録','次の評価と運用']],flow:true}
 ]
 return <DecisionFigure diagram="expense-migration-evidence" title="単発からloopへ、限界の証拠で構成を選ぶ" scene={({phase})=><DecisionCanvas diagram="expense-migration-evidence" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>架空事例の数値や順序を、自社の必要性や唯一の道へ転用しない。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===3?<Select label="Agent移行で不足する根拠" value={missing} onChange={setMissing} ready={ready}>{opts([['fixed','固定手順でまだ足りる'],['evidence','反復の必要を未評価'],['regression','回帰の準備がない'],['none','三条件を照合した模式入力']])}</Select>:null}>{children}</DecisionFigure>
}
export function ExpenseWriteRegression({children}){
 const id=useId(),[missing,setMissing]=useState('target'),review=expenseWrite({approved:missing!=='approved',ownScope:missing!=='scope',targetMatched:missing!=='target',toolEnforced:missing!=='tool'})
 const panels=[
 {caption:'修正案と差分を提示し、取消しにくい提出の前で承認する',columns:[['Agentの担当','修正案の下書き','差分の要約'],['提出前の承認','対象と変更を読む','読み取りは毎回承認しない']],flow:true},
 {caption:'承認に加えて、本人scopeと対象の一致をtoolで強制',columns:[['必要な条件','事前承認・本人の申請','対象が一致している','tool実装で認可'],[review.writeReviewCandidate?'提出reviewの検討候補':'許可条件へ戻る','modelへのお願いだけにしない','図は申請を提出しない','承認対象の変更を見直す']],flow:true},
 {caption:'自律性と権限を別の軸にして、段階を設計する',columns:[['v2の自律性','反復のloopを導入','権限はread-only'],['v3の権限','書込みtoolを一つ追加','提出は承認付き']],flow:false},
 {caption:'タスクの性質に合わせ、採点と承認なし実行の検査を分ける',columns:[['規定Q&A','judgeで採点','回答の品質'],['照会・複合task','最終状態・milestone','taskの達成範囲'],['承認の軌跡','無承認の実行を検査','smokeとfullを分ける']],flow:false},
 {caption:'費用とstepを監視し、前のWorkflowへの縮退を残す',columns:[['運用の観測','task単位の費用','step分布'],['機能flagで縮退','loopを停止する','既提出の取消ではない']],flow:true},
 {caption:'順序の模倣から、自案件の根拠・評価・二軸の制御へ',columns:[['限界の証拠','自社logと実task','必要な構成'],['継続する評価','変更前後の品質','既存caseを保持'],['二軸の設計','自律性と権限','上限と承認を別に']],flow:false}
 ]
 return <DecisionFigure diagram="expense-write-regression" title="差分と本人scopeを承認し、評価と縮退を保つ" scene={({phase})=><DecisionCanvas diagram="expense-write-regression" phase={phase} id={id}>{f=><><DecisionPanel frame={f} panel={panels[f.stage]} id={id}/><Text y={412} small>架空の評価件数を基準にせず、自律性と権限を同時に全解放しない。</Text></>}</DecisionCanvas>} controls={({stage,ready})=>stage===1?<Select label="申請提出で不足する条件" value={missing} onChange={setMissing} ready={ready}>{opts([['approved','事前承認'],['scope','本人scope'],['target','対象の一致'],['tool','tool側の強制'],['none','全条件を照合した模式入力']])}</Select>:null}>{children}</DecisionFigure>
}
