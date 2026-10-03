'use client'
import {useId,useState} from 'react'
import {CaseFigure,CaseCanvas,CasePair,CaseThree,Text,Wire,Select} from './case-evidence-primitives'
import {supportGate,supportRelease} from '../../lib/case-evidence-model.mjs'
const opts=a=>a.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function SupportScopeGates({children}){
 const id=useId(),[missing,setMissing]=useState('identity'),review=supportGate({identity:missing!=='identity',authorizedRetrieval:missing!=='retrieval',capacity:missing!=='capacity',dataAgreement:missing!=='data'})
 return <CaseFigure diagram="support-scope-gates" title="下書きの価値から、本番化の四つの関門へ" scene={({phase})=><CaseCanvas diagram="support-scope-gates" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['検証しやすい定型質問と、下書きの自律度へ絞る','成功基準を先に合意し、現状のbaselineを測る','検索と生成を分けて代表評価し、残課題を出す','機能の成功から、本番化の条件へ進む','受付とqueue・workerをproviderの枠へ合わせる','要件・評価・残課題の成果物が次の判断の入力になる'][stage]}</Text>
 {stage===0&&<CasePair left={['最初の範囲','製品仕様と使い方','FAQと過去の問い合わせ','検証しやすい定型質問']} right={['自律度の上限','出典つきの下書き','送信は担当者が判断','請求トラブルは後にする']} id={id} phase={phase}/>}
 {stage===1&&<CaseThree columns={[["入出力・data","質問と顧客情報","下書きと保持方針"],["人と自律度","review・送信判断","人のqueueへ"],["成功の測定","採用と修正率","事前baseline","と比較"]]}/>}
 {stage===2&&<><CaseThree columns={[["代表する評価","demo数件へ","偏らない","実際の分布"],["検索と生成","必要情報が来るか","下書きと出典","を評価"],["残課題と除外","鮮度が保てない","問い","本番化に必要な","条件"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/></>}
 {stage===3&&<><CaseThree columns={[["認証と検索","queue範囲と","vault","他顧客の混入","を防ぐ"],["実行の容量","非同期構成","API枠と同時上限"],["会話data","保持・mask・削除","法務との合意"]]}/><Text y={340}>{review.reviewCandidate?'本番化reviewの検討候補':'未確認の関門へ戻る'}</Text><Text y={374} small>機能だけで本番化しない。四条件は実認証・配信の証明ではない。</Text></>}
 {stage===4&&<><CaseThree columns={[["受付API","問い合わせの","spike","受付と処理","を分ける"],["job queue","処理を待たせる","負荷を制御"],["worker","外部APIの枠","同時実行の上限"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={361} small>workerの増設だけで外部APIのrate limitは増えない。</Text></>}
 {stage===5&&<CaseThree columns={[["要件","範囲と自律度","合意した基準"],["PoCの成果","代表評価・","失敗分析","本番化の残課題"],["導入の判断","実権限と","dataの合意","限定の開始へ"]]}/>}
 <Text y={412} small>架空の構成事例。原文の割合・件数を実測や自社の基準へ転用しない。</Text>
 </>}</CaseCanvas>} controls={({stage,ready})=>stage===3?<Select label="本番化で不足する関門" value={missing} onChange={setMissing} ready={ready}>{opts([['identity','認証とscope'],['retrieval','権限反映検索'],['capacity','provider容量'],['data','会話dataの合意'],['none','四条件を照合した模式入力']])}</Select>:null}>{children}</CaseFigure>
}
export function SupportRolloutReturn({children}){
 const id=useId(),[mode,setMode]=useState('shadow'),release=supportRelease(mode)
 return <CaseFigure diagram="support-rollout-return" title="限定の提示から、純削減と次の範囲へ戻す" scene={({phase})=><CaseCanvas diagram="support-rollout-return" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['shadowは、人の回答と比較して下書きをまだ見せない','限定の担当者と定型質問だけへ、下書きを提示する','利用者の信号を、失敗modeと回帰へ戻す','生成時間だけでなく、reviewと引取りを差し引く','範囲と自律度を別の軸として、合意と実績で進める'][stage]}</Text>
 {stage<2&&<CasePair left={['Agentの下書き','人の回答と突合せ',release.draftVisible?'限定して提示する':'担当者へ提示しない','品質・時間・費用を比較']} right={['顧客への応答','送信判断は人','全問い合わせへ広げない','対象と条件を確認する']} id={id} phase={phase} arrow={release.draftVisible}/>}
 {stage===2&&<><CaseThree columns={[["信号を集める","修正と","使えない報告","意図を即断しない"],["原因別の変更","検索→知識源","口調→prompt"],["代表caseへ戻す","評価セットに追加","変更後の回帰"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Wire id={id} d="M520 269V330H120V269" active phase={phase}/></>}
 {stage===3&&<><CaseThree columns={[["浮いた時間","下書き生成の効果","実際に測る"],["reviewの時間","修正と確認の負担","ここを差し引く"],["人への引取り","回答不能の処理","ここも差し引く"]]}/><Text y={350}>純削減 = 浮いた時間 − review時間 − 引取り時間</Text><Text y={383} small>当初の試算を実績で更新。図は架空の新しい数値を足さない。</Text></>}
 {stage===4&&<CasePair left={['対象の軸','定型質問からcategoryへ','類型ごとの品質を測る','全問い合わせへ転用しない']} right={['自律度の軸','全件reviewから抜き取りへ','事前の引上げ計画','合意と実績の条件を確認']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>事例の物語と実証を分け、自社baseline・影響・負担で判断する。</Text>
 </>}</CaseCanvas>} controls={({stage,ready})=>stage<2?<Select label="下書きの段階導入" value={mode} onChange={setMode} ready={ready}>{opts([['shadow','shadowで比較'],['canary','一部へ提示'],['expanded','合意と実績で範囲を拡張']])}</Select>:null}>{children}</CaseFigure>
}
