'use client'
import {useId,useState} from 'react'
import {GovernanceFigure,GovernanceCanvas,GovernancePair,GovernanceThree,Text,Box,Wire,Select} from './governance-safety-primitives'
import {regulatoryReview,legislativeStage,deletionScope,contractScope} from '../../lib/governance-safety-model.mjs'
const questions=[['法域と用途','法務・事業','地域と責任主体'],['dataとログ','個人情報・技術','保持と削除'],['統制・監査・契約','責任者・調達','承認と変更']]
export function ComplianceRegulatoryMap({children}){
 const id=useId(),[missing,setMissing]=useState('role'),[legal,setLegal]=useState('promulgated');const review=regulatoryReview({jurisdictionChecked:missing!=='region',useClassified:missing!=='use',roleChecked:missing!=='role',currentSourceChecked:missing!=='source'}),law=legislativeStage(legal)
 return <GovernanceFigure diagram="compliance-regulatory-map" title="五つの問いを、法域・担当・時点から整理する" scene={({phase})=><GovernanceCanvas diagram="compliance-regulatory-map" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['同じ規制の箱へ、運用と契約を全部入れない','地域・用途・責任主体と現行の根拠を結ぶ','EUの各義務は、対象と適用時期を別々に持つ','成立・公布・施行は、それぞれ別の段階','州ごとの法・対象主体・提案段階を照合する','任意の枠組みと認証規格を、制度へ接続する'][stage]}</Text>
 {stage===0&&<GovernanceThree columns={questions}/>}
 {stage===1&&<GovernancePair left={['利用する構成','法域とユースケース','providerかdeployerか','一次情報の確認日']} right={[review.reviewCandidate?'法務の検討へ':'不足する根拠へ戻る','名称だけで役割を決めない','PoCから本番への関門','図は法的適合を判定しない']} id={id} phase={phase}/>}
 {stage===2&&<><GovernanceThree columns={[["適用義務","透明性を別に確認","全延期としない"],["延期と猶予","高riskの","新しい期日","systemの対象条件"],["禁止の範囲","新設禁止の対象","施行・経過措置"]]}/><Text y={344} small>2026-09-10時点の原文。新しい法域や現行法の断定は加えていない。</Text></>}
 {stage===3&&<><GovernanceThree columns={[["成立","議論から法へ","本文と公布を確認"],["公布","法の公表","将来の施行版","もある"],["施行","効力の開始","対象条項を確認"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={337}>{law.effectiveObserved?'模式入力は施行段階':'施行したとは読めない'}</Text><Text y={367} small>議論や意見募集の資料を、最終規則へ変換しない。</Text></>}
 {stage===4&&<GovernancePair left={['California','model開発者の透明性','適用済みの法を読む','提案・訴訟は別の状態']} right={['Colorado','別の主体と用途','改正法と規則案','予定を確定義務にしない']} id={id} phase={phase} arrow={false}/>}
 {stage===5&&<GovernancePair left={['任意framework','リスクを管理・改善','組織内の共通言語','法的適合は独立に確認']} right={['認証規格','組織の管理体制','要求・範囲と実審査','個々の出力安全は別']} id={id} phase={phase} arrow={false}/>}
 <Text y={412} small>法域・用途・役割・一次情報を、技術担当と法務の判断へ結ぶ。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===1?<Select label="規制の整理で不足する根拠" value={missing} onChange={setMissing} ready={ready}>{[['region','法域'],['use','用途'],['role','役割'],['source','現行の一次情報'],['none','全条件を照合した模式入力']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:stage===3?<Select label="模式の法の段階" value={legal} onChange={setLegal} ready={ready}>{[['discussion','議論'],['enacted','成立'],['promulgated','公布'],['in-force','施行']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</GovernanceFigure>
}
export function ComplianceDataGovernance({children}){
 const id=useId(),[missing,setMissing]=useState('derived'),scope=deletionScope({logs:missing!=='logs',memory:missing!=='memory',evaluation:missing!=='evaluation',derived:missing!=='derived'})
 return <GovernanceFigure diagram="compliance-data-governance" title="dataの保存先から、本番前の責任と関門へ" scene={({phase})=><GovernanceCanvas diagram="compliance-data-governance" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['会話logに含まれる機微dataを、扱いの設計へ戻す','会話を消すだけでは、全ての派生先を確認できない','policyと利用実態を、責任者が対応づける','riskに応じたレビューを、本番前へ置く','既存のsecurity・個人情報・調達の運用へ加える'][stage]}</Text>
 {stage===0&&<GovernancePair left={['会話と記録','入力と社内data','modelが生成した応答','利用者や第三者の情報']} right={['扱いを定義','目的と二次利用','保持・閲覧・外部送信','削除と責任者']} id={id} phase={phase}/>}
 {stage===1&&<><GovernanceThree columns={[["会話log","原本の記録","保持と削除"],["memory・評価","用途別の保存","同じ人物への波及"],["派生data","要約・学習用など","責任と削除を照合"]]}/><Text y={340}>{scope.scopeReviewCandidate?'全保存先の検討候補':'未確認の保存先へ戻る'}</Text><Text y={374} small>目的・保持・越境・二次利用の条件も独立に確認。図は削除しない。</Text></>}
 {stage===2&&<GovernancePair left={['policy','利用できる場面とdata','承認フローと責任者','社内に共有するルール']} right={['利用の実態','どのsystemにあるか','用途・owner・主要risk','変更時に更新する']} id={id} phase={phase}/>}
 {stage===3&&<GovernancePair left={['用途のrisk','個人dataの使用','操作の自動実行','社外への影響']} right={['本番前の関門','軽い確認か詳細reviewか','担当者と停止条件','許可と実権限を確認']} id={id} phase={phase}/>}
 {stage===4&&<><GovernanceThree columns={[["security","攻撃面と権限","incident対応"],["個人情報","利用目的と保持","削除・越境"],["調達","契約と提供範囲","変更通知"]]}/><Wire id={id} d="M120 269V330H520V269" active phase={phase}/><Text y={365} small>名称だけの独立組織にせず、実際の承認と運用へ接続する。</Text></>}
 <Text y={412} small>制度・契約の責任と実装。条件照合は実削除・適合の証明ではない。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===1?<Select label="削除範囲で未確認の保存先" value={missing} onChange={setMissing} ready={ready}>{[['logs','会話log'],['memory','memory'],['evaluation','評価'],['derived','派生data'],['none','全保存先を照合した模式入力']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</GovernanceFigure>
}
export function ComplianceAuditVendor({children}){
 const id=useId(),[missing,setMissing]=useState('endpoint'),review=contractScope({regionChecked:missing!=='region',accountChecked:missing!=='account',billingChecked:missing!=='billing',endpointChecked:missing!=='endpoint'})
 const records=[['利用と変更','inventory・review'],['実行の帰属','版・trace・承認'],['品質と事故','評価・incident']]
 return <GovernanceFigure diagram="compliance-audit-vendor" title="日々の運用を、監査と構成別の契約確認へ結ぶ" scene={({phase})=><GovernanceCanvas diagram="compliance-audit-vendor" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['後付け書類より、普段の運用を記録へ写す','何が・いつ・誰の判断で動いたかを対応づける','規制の延期があっても、運用の土台は必要','契約名と実際に使う構成の範囲を揃える','六つの観点を、対象accountとendpointで照合','変更通知を、担当者の再確認へ戻す'][stage]}</Text>
 {stage===0&&<GovernancePair left={['普段の運用','変更・実行・承認','評価と事故対応','実際の構成と担当']} right={['説明できる記録','時点と版と帰属','再現できる手順','書類だけで実行を証明しない']} id={id} phase={phase}/>}
 {stage===1&&<>{records.map(([title,detail],i)=><Box key={title} x={70} y={86+i*88} width={500} height={70} title={title} lines={[detail]} tone={i===1?'teal':'violet'}/>)}</>}
 {stage===2&&<GovernancePair left={['個別の規制','一部義務の延期','地域と対象が異なる','確認日と変更を追う']} right={['共通の運用','版・承認・評価・事故','変更を説明する土台','延期を無統制にしない']} id={id} phase={phase}/>}
 {stage===3&&<GovernancePair left={['契約と構成','契約・region・account','無料・有料の区分','実際に使うendpoint']} right={[review.reviewCandidate?'契約reviewの候補':'未確認の構成へ戻る','無料＝別条項と即断しない','提供範囲と確認日','図は契約解釈をしない']} id={id} phase={phase}/>}
 {stage===4&&<GovernanceThree columns={[["dataの扱い","学習の既定","保持・ZDR"],["契約と場所","DPA","利用region"],["説明と変更","監査資料","変更通知"]]}/>}
 {stage===5&&<><GovernanceThree columns={[["法務・調達","対象契約と責任","自社の要件"],["技術の担当","account・","endpoint","対象機能と版"],["変更通知","何が変わったか","再確認と対応"]]}/><Wire id={id} d="M520 269V330H120V271" active phase={phase}/><Text y={364} small>機能の存在だけで、自社の契約上の利用可能性を確定しない。</Text></>}
 <Text y={412} small>自社構成と公式・契約へ戻す。請求0円だけでdata条項を判定しない。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===3?<Select label="契約reviewで未確認の構成" value={missing} onChange={setMissing} ready={ready}>{[['region','region'],['account','account'],['billing','無料・有料の区分'],['endpoint','endpoint'],['none','全構成を照合した模式入力']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>:null}>{children}</GovernanceFigure>
}
