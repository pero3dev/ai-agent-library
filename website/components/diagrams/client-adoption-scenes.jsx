'use client'
import { useState } from 'react'
import { ClientFigure,ClientCanvas,Text,Box,Wire,Select } from './client-adoption-primitives'
import { clientTrialGate } from '../../lib/client-adoption-model.mjs'
const actors={client:['顧客・発注者','データの安全と成果物品質','データ・品質担保・責任分界'],prime:['元請・上位ベンダー','契約条件と再委託の可否','契約・規程への適合と承認範囲'],company:['自社の法務・情シス','契約リスクと秘密保持','提供形態・データ経路・監査'],audit:['監査・品質保証','証跡とプロセス準拠','検証する手順と記録']}
export function ClientApprovalContract({children}){
 const [actor,setActor]=useState('client'),[topic,setTopic]=useState('quality'),topics={quality:['成果物の品質責任','検証と不具合対応の範囲'],ip:['知的財産・第三者の権利','既存IP条項とツール規約'],data:['データと秘密保持','渡す対象・契約と提供経路'],industry:['規制産業の入口','関連正本と案件の要請']}
 return <ClientFigure diagram="client-approval-contract" title="誰の判断が必要かと、法務へつなぐ論点"
  controls={({stage,ready})=>stage===1?<Select label="資料を示す相手" value={actor} onChange={setActor} ready={ready}>{Object.entries(actors).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:stage===2?<Select label="法務へつなぐ論点" value={topic} onChange={setTopic} ready={ready}>{Object.entries(topics).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><ClientCanvas diagram="client-approval-contract" {...s}>{f=><>
   <Text y={35}>{['誰に・何を・どの順で示すかを設計','案件の必要な判断者と、関心を棚卸し','論点を整理し、契約と適用法へ照合','実装の速さと、単価・品質責任は別','データ・品質・責任分界と承認範囲を合わせる'][f.stage]}</Text>
   {f.stage===0?<>
    {['判断者：必要な合意先','資料：データ・品質・責任分界','順序：小さい確認済みの範囲から'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>顧客・商流の合意と、自社チームの展開を分ける</Text>
   </>:f.stage===1?<>
    {Object.entries(actors).map(([id,row],i)=><Box key={id} x={32+i%2*316} y={78+Math.floor(i/2)*115} width={260} height={83} title={row[0]} tone={id===actor?'teal':'violet'} active={id===actor}/>)}
    <Box x={67} y={331} width={506} height={75} title={actors[actor][1]} lines={[actors[actor][2]]} tone="teal" data-client-actor={actor}/>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={124} title={topics[topic][0]} lines={[topics[topic][1],'契約類型・合意条項・適用法を確認']} tone="violet"/>
    <Wire id={s.id} d="M320 205V266" active phase={f.phase}/><Box x={67} y={276} width={506} height={117} title="法務と確認する論点" lines={['AI利用だけで免責としない','契約文言や法的適合を図で決めない']} tone="teal" data-ai-exempts-quality="false"/>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={170} title="工数の変化" lines={['対象の作業を測る','効果と条件を示す','単価の判断は別']} tone="violet"/>
    <Box x={348} y={82} width={260} height={170} title="残る品質と責任" lines={['reviewと検証の負荷','不具合の対応範囲','価格は経営・案件の判断']} tone="amber"/>
    <Text y={357} small>値下げ・短納期・付加価値を、自動で結論にしない</Text>
   </>:<>
    {['データ：対象と許可経路','品質：検証と不具合対応','責任：必要な判断者と範囲'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone="violet"/>)}
    <Text y={418} small>現場の口頭了解だけで、他部門の必要承認を省かない</Text>
   </>}
  </>}</ClientCanvas>}>{children}</ClientFigure>
}
export function ClientStagedAdoption({children}){
 const [contract,setContract]=useState('yes'),[classified,setClassified]=useState('no'),[approved,setApproved]=useState('no'),[measured,setMeasured]=useState('yes'),state=clientTrialGate({contractChecked:contract==='yes',classified:classified==='yes',approvalsChecked:approved==='yes',evidenceMeasured:measured==='yes'})
 return <ClientFigure diagram="client-staged-adoption" title="確認済みの題材と承認範囲から段階的に広げる"
  controls={({stage,ready})=>stage===2?<>{[['契約と経路の確認',contract,setContract],['顧客非依存の分類確認',classified,setClassified],['必要承認の確認',approved,setApproved],['対象の効果とリスクの測定',measured,setMeasured]].map(([label,value,setValue])=><Select key={label} label={label} value={value} onChange={setValue} ready={ready}><option value="no">未確認・未承認</option><option value="yes">確認した</option></Select>)}</>:null}
  scene={s=><ClientCanvas diagram="client-staged-adoption" {...s}>{f=><>
   <Text y={35}>{['社内の小さな題材から、効果とリスクを測る','自社が書いたコードも、契約と機密を確認','確認して承認された範囲へ、適用候補を絞る','実績とリスクで、次の範囲の合意を得る'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={81} width={506} height={132} title="顧客に依存しない社内検証" lines={['小さく効果とリスクを測る','提供形態・データ経路を確立']} tone="violet"/>
    <Wire id={s.id} d="M320 213V268" active phase={f.phase}/><Box x={67} y={278} width={506} height={115} title="確認済みの題材と次の承認へ" lines={['最初から顧客本番へ全面適用しない','範囲と根拠を用意する']} tone="teal"/>
   </>:f.stage===1?<>
    <Box x={32} y={82} width={260} height={171} title="自社が書いたコード" lines={['作成者だけで決めない','顧客契約の対象にもなる','機密区分と内容を確認']} tone="amber" data-self-authorship-exempt="false"/>
    <Box x={348} y={82} width={260} height={171} title="確認済みの題材" lines={['顧客情報を含まない','必要な社内・契約上の承認','許可経路と利用の範囲']} tone="teal"/>
    <Text y={356} small>自社共通資産や公開題材も、契約と内容を先に確認</Text>
   </>:f.stage===2?<>
    {['契約と経路','題材の分類','必要な承認','効果とリスクの測定'].map((t,i)=><Box key={t} x={32+i%2*316} y={78+Math.floor(i/2)*113} width={260} height={82} title={t} tone={[contract,classified,approved,measured][i]==='yes'?'teal':'amber'}/>)}
    <Box x={67} y={330} width={506} height={76} title={state.candidateScopeReady?'確認した範囲の適用候補':'不足する確認へ戻る'} tone={state.candidateScopeReady?'teal':'amber'} data-client-scope-ready={String(state.candidateScopeReady)} data-unlimited-rollout="false"/>
   </>:<>
    {['小さな合意範囲で実行','効果・品質・リスクを測る','次の範囲を新たに合意'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>小さな成功は、全顧客資産への適用許可ではない</Text>
   </>}
  </>}</ClientCanvas>}>{children}</ClientFigure>
}
export function ClientMeasuredEvidence({children}){
 return <ClientFigure diagram="client-measured-evidence" title="実装の速さだけでなく、品質と確認負荷を示す"
  scene={s=><ClientCanvas diagram="client-measured-evidence" {...s}>{f=><>
   <Text y={35}>{['同じ対象と条件で、作業の工数を測る','手戻り・欠陥と、残る品質確認を示す','確認する人の負荷も、効果へ含める','効果とリスクを並べて、次の合意の材料へ'][f.stage]}</Text>
   {f.stage<3?<>
    <Box x={32} y={82} width={260} height={171} title={['対象作業の工数','手戻り・欠陥','reviewと検証の負荷'][f.stage]} lines={['対象・条件・範囲を明示','実際に測った結果を示す','未知の変化は未確認に残す']} tone="violet"/>
    <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={171} title="判断する材料へ" lines={['体感を実測にしない','実装時間だけで決めない','価格や短納期は別の判断']} tone="teal"/>
    <Text y={357} small>架空の工数・短縮率・単価・ROIを生成しない</Text>
   </>:<>
    {['効果：工数・品質・review負荷','情報：対象のデータと経路','対応：品質担保と失敗時の扱い'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===0?'teal':'violet'}/>)}
    <Text y={418} small>小さな実績とリスクを、必要な判断者へ示す</Text>
   </>}
  </>}</ClientCanvas>}>{children}</ClientFigure>
}
