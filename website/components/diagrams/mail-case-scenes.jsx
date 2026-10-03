'use client'
import {useId,useState} from 'react'
import {CaseFigure,CaseCanvas,CasePair,CaseThree,Text,Box,Wire,Select} from './case-evidence-primitives'
import {mailCapabilities,mailEgress,mailContainment} from '../../lib/case-evidence-model.mjs'
const opts=a=>a.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function MailCapabilityPath({children}){
 const id=useId(),[month,setMonth]=useState('auto'),[channel,setChannel]=useState('proxy'),egress=mailEgress({externalFetchAllowed:channel!=='blocked',sensitiveUrl:true,proxy:channel==='proxy'})
 return <CaseFigure diagram="mail-capability-path" title="便利な追加が、未信頼入力・私的data・送信を結ぶ" scene={({phase})=><CaseCanvas diagram="mail-capability-path" phase={phase} id={id}>{({stage})=>{const cap=mailCapabilities(month==='auto'?Math.min(2,Math.max(0,stage-1)):Number(month));return <>
 <Text y={38}>{['要約の依頼と、外部メールの指示を別の権限に置く','外部メールを読む入口がある','横断検索で、私的dataへの接続を足す','toolと表示の外部通信が加わり、三要素が揃う','data中の指示が、私的dataから応答へ流れる','toolの承認とは別に、UIからの通信が発生する'][stage]}</Text>
 {stage===0&&<CasePair left={['ユーザーの依頼','今日のメールを要約','攻撃を要求していない','タスクの範囲はここ']} right={['外部メール','未信頼の本文','隠れた指示もdataとして扱う','上位の指示へ昇格しない']} id={id} phase={phase} arrow={false}/>}
 {stage>0&&stage<4&&<><CaseThree columns={[["未信頼の入力","外部メールの要約","初期から接触"],["非公開data",...(cap.privateData?['横断検索が','追加済み']:['横断検索は','まだない']),cap.privateData?"私信・社内文書":'取得範囲を確認'],["外部への通信",...(cap.externalChannel?['tool・画像の取得']:['送信経路は','まだない']),cap.externalChannel?'応答表示も攻撃面':'追加時に再点検']]}/><Wire id={id} d="M208 180H230" active={cap.privateData} phase={phase}/><Wire id={id} d="M408 180H430" active={cap.externalChannel} phase={phase}/><Text y={340}>{cap.trifecta?'三重奏が同じ処理へ揃う':'この三要素はまだ揃っていない'}</Text><Text y={374} small>未成立を全安全にしない。追加ごとに組合せと送信経路を再点検する。</Text></>}
 {stage===4&&<><CaseThree columns={[["外部メール","未信頼の指示","タスクへ誤昇格"],["社内検索","私的な内容を取得","応答へまとめる"],["応答のURL","記号でdataを示す","外部資源の取得へ"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={360} small>攻撃文面は実行せず、dataの流れだけを示す。</Text></>}
 {stage===5&&<CasePair left={['応答の表示','機微dataを含むURL','外部画像の自動取得',channel==='proxy'?'proxy経由でも上流を取得':'閲覧者から直接取得']} right={[egress.illustratedLeakPath?'URLのdataが上流へ':'模式の取得経路を遮断','proxyはdataを隠さない','toolの承認とは別の経路','図はrequestを送らない']} id={id} phase={phase} arrow={egress.illustratedLeakPath}/>}
 <Text y={412} small>架空事例。送信tool・read-only・proxyだけで全経路を塞がない。</Text>
 </>}}</CaseCanvas>} controls={({stage,ready})=>stage>0&&stage<4?<Select label="原文の機能追加の段階" value={month} onChange={setMonth} ready={ready}>{opts([['auto','読書段階に合わせる'],['0','初期：外部メールの要約'],['1','1か月後：横断検索'],['2','2か月後：送信とHTML表示']])}</Select>:stage===5?<Select label="応答表示の外部取得経路" value={channel} onChange={setChannel} ready={ready}>{opts([['direct','直接取得'],['proxy','proxyで上流を取得'],['blocked','外部取得を遮断した模式入力']])}</Select>:null}>{children}</CaseFigure>
}
export function MailContainmentReturn({children}){
 const id=useId(),[missing,setMissing]=useState('history'),review=mailContainment({imageFetchBlocked:missing!=='image',egressBlocked:missing!=='egress',sessionsStopped:missing!=='sessions',controlsVerified:missing!=='verified',freshHistory:missing!=='history'})
 return <CaseFigure diagram="mail-containment-return" title="実際の送信を止めてから、限定再開と構造修正へ" scene={({phase})=><CaseCanvas diagram="mail-containment-return" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['技術の異常と利用者報告から、影響を調べる','外部取得・通信を遮断し、進行中sessionを止める','遮断を確認し、旧履歴を使わない限定機能へ','検知ruleだけで終えず、組合せと権限を構造から直す','traceで影響を調べ、持出し防止を回帰へ残す','構成変更のたびに、実送信経路を再点検する'][stage]}</Text>
 {stage===0&&<CasePair left={['技術の観測','外部ドメインへ通信急増','社内検索の異常','版とtraceへ結ぶ']} right={['利用者の報告','見覚えのない画像','どのsessionにあるか','持出し候補と影響を調べる']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<CaseThree columns={[["送信を遮断","外部画像の","自動取得","外部通信を止める"],["sessionを停止","進行中の実行","旧履歴に私的data"],["実遮断を確認","logとtest","検索停止","だけにしない"]]}/>}
 {stage===2&&<CasePair left={['再開前の条件','外部取得と通信を遮断','進行中sessionを停止','遮断の検証と新規履歴']} right={[review.limitedRestartCandidate?'限定再開の検討候補':'遮断条件へ戻る','対象メールをplain textで','確認できない機能は停止','既送信は取り消せない']} id={id} phase={phase}/>}
 {stage===3&&<><CaseThree columns={[["実経路を閉じる","自動取得を","既定禁止","例外のURLを検証"],["処理と権限を分離","未信頼出力を維持","機微処理は","送信禁止"],["承認と回帰","副作用を","承認対象へ","持出し防止を","testへ"]]}/><Text y={350} small>分離や要約だけで無害化しない。proxyもURL内容を隠さない。</Text></>}
 {stage===4&&<CasePair left={['影響の調査','構成の版とtrace','検索toolの呼出し','sessionとdata範囲']} right={['再発防止の資産','持ち出しの回帰case','変更後の実送信を検査','停止は既送信の取消でない']} id={id} phase={phase}/>}
 {stage===5&&<><CaseThree columns={[["便利な機能追加","単体だけで","判断しない","脅威モデルを更新"],["全送信経路","toolと応答表示","外部取得を点検"],["構造と回帰","組合せを分断","亜種も経路で扱う"]]}/><Wire id={id} d="M520 269V330H120V269" active phase={phase}/></>}
 <Text y={412} small>遮断・停止・確認し限定再開。図は攻撃・通信・停止・復旧をしない。</Text>
 </>}</CaseCanvas>} controls={({stage,ready})=>stage===2?<Select label="限定再開で不足する条件" value={missing} onChange={setMissing} ready={ready}>{opts([['image','外部画像の遮断'],['egress','外部通信の遮断'],['sessions','進行中sessionの停止'],['verified','遮断の検証'],['history','旧履歴を使わない'],['none','全条件を照合した模式入力']])}</Select>:null}>{children}</CaseFigure>
}
