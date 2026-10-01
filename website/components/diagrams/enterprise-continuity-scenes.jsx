'use client'
import { useState } from 'react'
import { ContinuityFigure,ContinuityCanvas,Text,Box,Wire,Select } from './se-continuity-primitives'
import { enterpriseRoute } from '../../lib/se-continuity-model.mjs'
export function EnterpriseConstraintsTopology({children}){
 const [form,setForm]=useState('saas'),[network,setNetwork]=useState('closed'),forms={saas:['SaaS + 契約','ベンダー管理のクラウド','契約と設定で保護'],tenant:['顧客クラウド経由','tenant・regionの境界','proxy・gatewayで統制'],self:['自社ホスト','Agentと推論を顧客環境へ','通信と運用の経路を確認']},choice=forms[form]
 return <ContinuityFigure diagram="enterprise-constraints-topology" title="制約から、モデルと情報経路の配置を考える"
  controls={({stage,ready})=>stage===2?<Select label="比較する一般形態" value={form} onChange={setForm} ready={ready}>{Object.entries(forms).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:stage===3?<Select label="推論APIへの到達" value={network} onChange={setNetwork} ready={ready}><option value="closed">閉域：外部APIへ到達しない</option><option value="open">許可された外部通信経路がある</option></Select>:null}
  scene={s=><ContinuityCanvas diagram="enterprise-constraints-topology" {...s}>{f=><>
   <Text y={35}>{['制約の棚卸しから、形態と可否判断へ','機能の良さでは解けない、五つの制約','顧客側へ寄せる境界を比較する','保持の条件と、通信の到達性は別','推論の場所と、企業の統制は別に設計'][f.stage]}</Text>
   {f.stage===0?<>
    {['制約：案件で何が許されるか','形態：どこへ配置するか','判断：何をどの経路へ渡すか'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>技術防御・規制の詳細は、関連する正本へ進む</Text>
   </>:f.stage===1?<>
    {['顧客データ・秘密保持契約','持ち込みツールの承認','閉域網・オンプレ環境','監査証跡・ログ保全','多重請負の責任分界'].map((t,i)=><Box key={t} x={67} y={75+i*63} width={506} height={50} title={t} tone={i===4?'amber':'violet'}/>)}
    <Text y={419} small>契約・承認・網で許されなければ、高機能でも使えない</Text>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={132} title={choice[0]} lines={choice.slice(1)} tone={form==='self'?'teal':'violet'} data-general-offering={form}/>
    <Box x={67} y={281} width={506} height={114} title="原文の2026-07時点の一般類型" lines={['契約・tenant・region・推論先を確認','採用する製品と構成は最新の公式へ照合']} tone="amber"/>
   </>:f.stage===3?<>
    <Box x={32} y={80} width={260} height={123} title="顧客の環境" lines={['Agentと情報','閉域網の到達性を確認']} tone="violet"/>
    <Wire id={s.id} d="M292 140H340" active={network==='open'} phase={f.phase}/><Box x={348} y={80} width={260} height={123} title="外部の推論API" lines={[network==='closed'?'通信が到達しない':'許可通信と契約は別','ZDRだけでは到達しない']} tone={network==='closed'?'amber':'violet'} data-remote-api-reachable={String(network==='open')}/>
    <Box x={67} y={281} width={506} height={114} title="自社ホストのモデルと全経路を確認" lines={['推論・tool・管理の配置を照合','ローカル推論だけで全経路を保証しない']} tone="teal" data-local-alone-guarantees-airgap="false"/>
   </>:<>
    {['認証・ポリシー強制','監査ログ・保全の基盤','ネットワーク分離・端末管理'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===1?'teal':'violet'}/>)}
    <Text y={418} small>商用の自社ホスト提供と適格条件は、採用時に再確認</Text>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
export function EnterpriseContractRoute({children}){
 const [contract,setContract]=useState('unknown'),[classified,setClassified]=useState('yes'),[verified,setVerified]=useState('no'),state=enterpriseRoute({contract,classified:classified==='yes',routeVerified:verified==='yes'})
 return <ContinuityFigure diagram="enterprise-contract-route" title="契約、分類、経路を順に確認して承認材料へ"
  controls={({stage,ready})=>stage===0||stage===2?<><Select label="説明用案件の契約状態" value={contract} onChange={setContract} ready={ready}><option value="unknown">未確認・未承認</option><option value="denied">渡せない</option><option value="allowed">許可する条件を確認した</option></Select>{stage===2&&<><Select label="対象の情報分類" value={classified} onChange={setClassified} ready={ready}><option value="yes">分類した</option><option value="no">未確認</option></Select><Select label="経路と条件の照合" value={verified} onChange={setVerified} ready={ready}><option value="no">未確認・不適合</option><option value="yes">契約条件へ照合した</option></Select></>}</>:null}
  scene={s=><ContinuityCanvas diagram="enterprise-contract-route" {...s}>{f=><>
   <Text y={35}>{['経路を選ぶ前に、契約で渡せるかを確認','情報を分類し、不要な機微情報を減らす','経路・保持・学習・地域を契約へ照合','承認する人が、三つの材料を判断できる形へ','古い代表例を、現在の仕様へ転用しない'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={81} width={506} height={127} title={contract==='allowed'?'契約の許可条件を確認':contract==='denied'?'契約で渡せない':'契約が未確認・未承認'} lines={['外部送信・保存・AI利用の取り決め','顧客と自社の規程・判断者']} tone={contract==='allowed'?'teal':'amber'}/>
    <Wire id={s.id} d="M320 208V265" active={contract==='allowed'} phase={f.phase}/><Box x={67} y={275} width={506} height={117} title={contract==='allowed'?'分類と経路の確認へ進む':'許可を補完せず、確認へ戻る'} lines={['未知の状態を利用可能としない','口頭了解だけで承認を終えない']} tone={contract==='allowed'?'violet':'amber'} data-contract-can-proceed={String(contract==='allowed')}/>
   </>:f.stage===1?<>
    {['公開可能な自社コード','顧客のソースコード','個人情報・業務データ'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===2?'amber':'violet'}/>)}
    <Text y={418} small>不要な情報は加工。加工後も許可と経路を確認</Text>
   </>:f.stage===2?<>
    {['契約の許可', '対象の分類', '経路・保持・学習・地域'].map((t,i)=><Box key={t} x={67} y={76+i*80} width={506} height={59} title={t} tone={[contract==='allowed',classified==='yes',verified==='yes'][i]?'teal':'amber'}/>)}
    <Box x={67} y={327} width={506} height={73} title={state.candidateReady?'確認した条件の利用候補':'不足・不適合を確認へ戻す'} tone={state.candidateReady?'teal':'amber'} data-enterprise-candidate-ready={String(state.candidateReady)} data-legal-compliance-determined="false"/>
   </>:f.stage===3?<>
    {['フロー：何が・どこへ・どの経路','残留：保存先・期間・地域・ZDR','学習：利用の既定と停止条件'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone="violet"/>)}
    <Text y={418} small>対象の構成で具体化し、承認と監査の判断材料へ</Text>
   </>:<>
    {['ZDR・保持と適格条件','リージョンと対応する地域','自社ホスト・VPC等の提供状況','認証の対象範囲と期間','モデルの顔ぶれ・必要資源'].map((t,i)=><Box key={t} x={67} y={75+i*63} width={506} height={50} title={t} tone="violet"/>)}
    <Text y={419} small>最新の一次情報へ戻り、未確認と変更を記録する</Text>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
