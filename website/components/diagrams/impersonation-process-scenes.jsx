'use client'
import {useId,useState} from 'react'
import {TrustFigure,TrustCanvas,TrustPair,TrustThree,Text,Box,Wire,Select,Tokens} from './trust-privacy-primitives'
import {callbackReview,reportRoute} from '../../lib/trust-privacy-model.mjs'
const threats=[['電話の声','送金・秘密の要求'],['ビデオ会議','顔と声で指示を装う'],['偽広告・声明','経営層やbrandを装う'],['捜査・被害回復','偽窓口から再被害へ']]
export function ImpersonationCallbackProcess({children}){
 const id=useId(),[missing,setMissing]=useState('contact'),review=callbackReview({knownContact:missing!=='contact',independentChannel:missing!=='channel',identityMatched:missing!=='identity',dualApproval:missing!=='approval',withinLimit:missing!=='limit',urgent:true})
 return <TrustFigure diagram="impersonation-callback-process" title="本人らしい声から、既知の連絡先と業務承認へ" scene={({phase})=><TrustCanvas diagram="impersonation-callback-process" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['声・顔と、本人確認・操作の承認は異なる証拠','本人らしさと急ぎ・内密の圧力で、確認を飛ばさない','既知の正規連絡先へ、別の信頼できる手段で確認','本人確認と多重承認・上限を、重要操作の前に揃える','検出の誤りと来歴の剥離を、確認プロセスへ残す','急かしに応じず、既知の連絡先と承認へ戻す'][stage]}</Text>
 {stage===0&&<TrustPair left={['受信した声・顔','本人に似た内容','合成され得る前提','本人確認の根拠にしない']} right={['重要指示の確認','既知の連絡先','別経路と合言葉','業務の承認と上限']} id={id} phase={phase}/>}
 {stage===1&&<>{threats.map((r,i)=><g key={r[0]}><rect x={40} y={86+i*69} width={560} height={56} rx={6} fill="#142b39" stroke="#526b7c"/><Text x={169} y={122+i*69} small>{r[0]}</Text><Text x={439} y={122+i*69} small>{r[1]}</Text></g>)}</>}
 {stage===2&&<><Box x={42} y={87} width={245} height={154} title="受信した連絡先" lines={['相手が渡した番号・link','そのままかけ直す','攻撃者の経路かもしれない']} tone="amber"/><Box x={352} y={87} width={245} height={154} title="既知の正規連絡先" lines={['事前登録した番号','別の信頼できる手段','本人と指示を確認']}/><Wire id={id} d="M165 242V307H473V243" active phase={phase}/><Text y={350}>受けた番号への確認は、独立した確認ではない</Text></>}
 {stage===3||stage===5?<><Tokens labels={['正規連絡先','別経路','本人確認','多重承認','上限']} selected={[['contact','channel','identity','approval','limit'].indexOf(missing)]} y={88}/><TrustPair left={['本人確認と業務承認','別経路・合言葉','複数人で二重に確認','必要な操作と上限']} right={[review.reviewCandidate?'重要指示の検討候補':'不足する確認へ戻る','急ぎでも確認を省かない','検出合格で承認を飛ばさない','図は送金や実承認をしない']} id={id} phase={phase} y={203} height={171}/></>:null}
 {stage===4&&<TrustPair left={['検出と来歴','誤判定や剥離がある','本物と推定しても補助','本人確認の代わりでない']} right={['維持するプロセス','既知の連絡先と別経路','複数人承認・上限','検出は追加のsignal']} id={id} phase={phase}/>}
 <Text y={412} small>防御の図。声・映像は作らず、本人らしさだけで重要操作を認めない。</Text>
 </>}</TrustCanvas>} controls={({stage,ready})=>stage===3||stage===5?<Select label="重要指示で不足する確認" value={missing} onChange={setMissing} ready={ready}>{[['contact','既知の正規連絡先'],['channel','別経路'],['identity','本人確認'],['approval','多重承認'],['limit','上限'],['none','全条件を確認']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</TrustFigure>
}
export function ImpersonationReportMonitor({children}){
 const id=useId(),[route,setRoute]=useState('received'),report=reportRoute(route==='official')
 return <TrustFigure diagram="impersonation-report-monitor" title="訓練・相談と、偽装される通報先への確認" scene={({phase})=><TrustCanvas diagram="impersonation-report-monitor" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['声・顔の偽装と急かしへの確認を、業務で訓練する','確認は正当とし、未遂も相談とincident記録へ','捜査・返金を名乗る窓口そのものも偽装される','内向きの指示と、外向きの声明・広告を監視する','注意喚起から、訓練・窓口・確認・対処へ戻す'][stage]}</Text>
 {stage===0&&<TrustThree columns={[["気づく","声・顔は偽装可能","急ぎ・内密の圧力"],["確認する","既知の連絡先","重要指示は別経路"],["訓練する","送金・機密の担当","確認を正当とする"]]}/>}
 {stage===1&&<><TrustThree columns={[["怪しい連絡","被害だけでなく未遂","迷わず相談"],["既知の窓口","事前の正規経路","記録と証拠を保持"],["incident対応","影響と操作を確認","権限・送金を止める"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/></>}
 {stage===2&&<><TrustPair left={[route==='official'?'既知の公式URL':'受信した通報link','窓口名だけで判断しない','偽フォーム・合成映像','回復名目の追加要求']} right={[report.reviewCandidate?'正規窓口への確認候補':'既知の正規経路へ戻る','受信linkへそのまま進まない','返金でも承認を省かない','図は移動や通報をしない']} id={id} phase={phase}/><Text y={347} small>2026-07-20の原文の注意喚起。新しい事件の発生を示していない。</Text></>}
 {stage===3&&<TrustPair left={['組織の内側','経営層を装った送金指示','既知の連絡先で確認','多重承認・上限']} right={['組織の外側','偽の声明・広告・account','brandの監視','正規窓口への対処手順']} id={id} phase={phase} arrow={false}/>}
 {stage===4&&<><TrustThree columns={[["公的な注意喚起","公式の原文を確認","最新の手口"],["業務へ反映","訓練とcallback","正規窓口と承認"],["監視と対処","記録・相談・申請","新しい経路を見直す"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Wire id={id} d="M520 269V330H120V271" active phase={phase}/><Text y={365} small>捜査・返金の名目でも、通常の承認を維持する。</Text></>}
 <Text y={412} small>既知の正規窓口を使う。図は実通報・削除申請・外部送信を行わない。</Text>
 </>}</TrustCanvas>} controls={({stage,ready})=>stage===2?<Select label="通報先へ到達する経路" value={route} onChange={setRoute} ready={ready}><option value="received">受信した通報link</option><option value="official">既知の公式URL</option></Select>:null}>{children}</TrustFigure>
}
