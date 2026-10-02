'use client'
import {useId,useState} from 'react'
import {GovernanceFigure,GovernanceCanvas,GovernancePair,GovernanceThree,Text,Wire,Select} from './governance-safety-primitives'
import {standardsKind,harmonizationReview,accreditationChain,managementReview} from '../../lib/governance-safety-model.mjs'
const opts=(entries)=>entries.map(([v,t])=><option key={v} value={v}>{t}</option>)
export function StandardsTypesStage({children}){
 const id=useId(),[kind,setKind]=useState('guidance'),[missing,setMissing]=useState('oj'),cert=standardsKind(kind),review=harmonizationReview({published:missing!=='published',commissionAssessed:missing!=='commission',ojReferenced:missing!=='oj',versionMatched:missing!=='version',clausesMatched:missing!=='clauses'})
 return <GovernanceFigure diagram="standards-types-stage" title="規格の種類と、発行から法的引用までの段階を読む" scene={({phase})=><GovernanceCanvas diagram="standards-types-stage" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['要求事項と指針・任意framework・soft lawを分ける','目的の異なる道具を、全て認証対象にしない','原文の版と草案・発行済みの状態を保つ','発行からCommission評価・OJ引用へ順に読む','組織の管理体制を、既存ISMSへ接続する','概要の所在と、有償本文の要求を分ける'][stage]}</Text>
 {stage===0&&<GovernanceThree columns={[["要求事項","42001など","組織の適合を審査"],["指針・framework","23894・","AI RMFなど","管理と改善を支援"],["認証機関・soft law","認証機関の要求","任意のpolicyなど"]]}/>}
 {stage===1&&<GovernancePair left={['選んだ道具の種類',kind==='requirements'?'組織への要求事項':kind==='certifier'?'認証機関の要求':'指針・frameworkなど','対象主体と目的を読む','名称だけで取得へ進まない']} right={[cert.certificationCandidate?'認証対象の検討候補':'組織の取得認証にしない','実審査と対象範囲は別','出力の無害性を保証しない','図は認証を発行しない']} id={id} phase={phase}/>}
 {stage===2&&<GovernanceThree columns={[["発行済み規格","要求事項・指針","版と範囲を照合"],["評価guide","所在と評価観点","逐条の規格とは別"],["草案","Zero Draft","等の段階","期限の経過≠最終化"]]}/>}
 {stage===3&&<><GovernanceThree columns={[["規格の発行","SDOが作る規格","発行のみで","判定しない"],["委員会評価","整合を評価","引用の条件を確認"],["OJ引用","対象の版・条項","推定の範囲を読む"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={340}>{review.presumptionReviewCandidate?'適合推定の検討候補':'未確認の段階・対象へ戻る'}</Text><Text y={374} small>五条件の模式入力だけで、現在の法的効果を確定しない。</Text></>}
 {stage===4&&<><GovernanceThree columns={[["Plan / Do","目的とrisk","AI固有の統制"],["Check / Act","運用から評価","改善へ戻す"],["既存ISMS","securityと統合","27001の代替でない"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M320 269V330H120V269" active phase={phase}/><Text y={368} small>組織の仕組みの要求。個々のAI出力の安全は別に評価する。</Text></>}
 {stage===5&&<GovernancePair left={['公開の所在情報','ISOとJISの頁','版・目的・範囲','無料概要は逐条本文でない']} right={['要求を確認','有償本文を適切に入手','自社scopeに照合','専門家・認証機関へ']} id={id} phase={phase}/>}
 <Text y={412} small>2026-09-10時点を保持。図は現在のOJ引用・法的効果を決めない。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===1?<Select label="標準の道具の種類" value={kind} onChange={setKind} ready={ready}>{opts([['requirements','組織の要求事項'],['guidance','指針'],['framework','任意framework'],['certifier','認証機関の要求'],['soft-law','ソフトロー']])}</Select>:stage===3?<Select label="適合推定reviewで未確認の条件" value={missing} onChange={setMissing} ready={ready}>{opts([['published','発行'],['commission','Commission評価'],['oj','OJ引用'],['version','対象版'],['clauses','対象条項'],['none','全条件を照合した模式入力']])}</Select>:null}>{children}</GovernanceFigure>
}
export function StandardsFitMaintain({children}){
 const id=useId(),[chain,setChain]=useState('certifier'),[missing,setMissing]=useState('operations');const authority=accreditationChain({accreditorChecked:chain!=='accreditor',certifierScopeChecked:chain!=='certifier',organizationScopeChecked:chain!=='organization'}),review=managementReview({realOperations:missing!=='operations',requirementsMapped:missing!=='requirements',gapsAddressed:missing!=='gaps',recordsAvailable:missing!=='records',sustainable:missing!=='sustain'})
 return <GovernanceFigure diagram="standards-fit-maintain" title="認定・認証・運用と、維持の責任を分ける" scene={({phase})=><GovernanceCanvas diagram="standards-fit-maintain" phase={phase} id={id}>{({stage})=><>
 <Text y={38}>{['第三者の確認を、各出力の安全保証へ拡張しない','認定する主体と認証する主体は異なる','実運用を要求へ写し、gapとAI影響評価を扱う','日々の記録と定期審査で、仕組みを維持する','取引要件と維持の費用・体制を照合する','認証以外の改善と評価も、目的で選ぶ'][stage]}</Text>
 {stage===0&&<GovernancePair left={['認証の意味','管理の仕組みを第三者確認','取引で必要な説明','信頼の一部を外部化']} right={['認証の限界','個々の出力は独立に評価','全てのriskをなくさない','取得だけで永久適合にしない']} id={id} phase={phase} arrow={false}/>}
 {stage===1&&<><GovernanceThree columns={[["認定機関","能力とscopeを認定","国内初の行為を区別"],["認証機関","組織を審査・認証","認定scopeを照合"],["取得組織","管理systemを運用","認証scopeを照合"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Text y={340}>{authority.chainReviewCandidate?'三主体の検討候補':'未確認の主体・scopeへ戻る'}</Text><Text y={374} small>認証の発行と認証機関の認定は、異なる行為・日付。</Text></>}
 {stage===2&&<GovernancePair left={['運用から要求へ','実運用と要求の対応','gapと影響評価','日々の記録と維持体制']} right={[review.reviewCandidate?'審査準備の検討候補':'不足する運用へ戻る','文書は実運用の写像','図は認証を発行しない','各出力の安全は別に評価']} id={id} phase={phase}/>}
 {stage===3&&<><GovernanceThree columns={[["日々の活動","log・review","影響評価"],["要求へ対応","scopeと版","変更のgap"],["定期審査","観測と是正","次の運用へ"]]}/><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/><Wire id={id} d="M520 269V330H120V269" active phase={phase}/></>}
 {stage===4&&<GovernancePair left={['誰が求めるか','顧客・入札の条件','規制の接続','自社の目的とscope']} right={['維持できるか','担当と実運用','費用と時間','専門家・認証機関と確認']} id={id} phase={phase} arrow={false}/>}
 {stage===5&&<GovernanceThree columns={[["内部改善","指針を使う","認証と混同しない"],["外部への説明","自己宣言","第三者評価","根拠と範囲を揃える"],["取得と維持","取引要件と負担","運用体制を続ける"]]}/>}
 <Text y={412} small>名前や取得日だけで判断せず、主体・scope・実運用・維持を読む。</Text>
 </>}</GovernanceCanvas>} controls={({stage,ready})=>stage===1?<Select label="認定認証の未確認の主体" value={chain} onChange={setChain} ready={ready}>{opts([['accreditor','認定機関'],['certifier','認証機関のscope'],['organization','組織のscope'],['none','三主体を照合した模式入力']])}</Select>:stage===2?<Select label="管理systemで不足する条件" value={missing} onChange={setMissing} ready={ready}>{opts([['operations','実運用'],['requirements','要求対応'],['gaps','gap是正'],['records','記録'],['sustain','維持体制'],['none','全条件を照合した模式入力']])}</Select>:null}>{children}</GovernanceFigure>
}
