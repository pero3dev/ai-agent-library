'use client'
import { useState } from 'react'
import { SeFigure,SeCanvas,Text,Box,Wire,Select } from './se-process-primitives'
import { seInformationRoute } from '../../lib/se-process-model.mjs'
export function SeUpstreamReview({children}){
 return <SeFigure diagram="se-upstream-review" title="候補から、要件・設計・レビューの確定へ"
  scene={s=><SeCanvas diagram="se-upstream-review" {...s}>{f=><>
   <Text y={35}>{['上流の候補と、確定する担当を分ける','観点・矛盾・曖昧さを、人と顧客へ戻す','資産とテンプレートで草案を作り、根拠を確かめる','横断的な指摘を、採否と承認へつなぐ'][f.stage]}</Text>
   {f.stage===0?<>
    {['要件の抜け漏れ','設計書と図','整合性レビュー'].map((t,i)=><g key={t}><Box x={32} y={ 80+i*101} width={260} height={72} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${116+i*101}H340`} active phase={f.phase}/><Box x={348} y={ 80+i*101} width={260} height={72} title={['要件確定・顧客合意','方式・非機能・責任','指摘の採否・最終承認'][i]} tone="teal"/></g>)}
   </>:f.stage===1?<>
    <Box x={75} y={75} width={490} height={96} title="要求の草案から観点を出す" lines={['異常系・性能・可用性・移行・運用']} tone="violet"/>
    <Wire id={s.id} d="M320 171V220" active phase={f.phase}/><Box x={75} y={228} width={490} height={130} title="業務の実態へ照合し、人と顧客が選ぶ" lines={['質問・矛盾・曖昧さを確認','知らない業務の補完を、合意済みにしない']} tone="teal" data-generated-is-agreed="false"/>
    <Text y={412} small>観点は候補。レビュー時間も含めて効果を測る</Text>
   </>:f.stage===2?<>
    <Box x={32} y={77} width={260} height={121} title="草案への入力" lines={['コード・類似設計・要件','自社テンプレートの項目']} tone="violet"/>
    <Wire id={s.id} d="M292 138H340" active phase={f.phase}/><Box x={348} y={77} width={260} height={121} title="生成した草案" lines={['断定は確認前の候補','既存方式との整合を確認']} tone="amber"/>
    <Wire id={s.id} d="M478 198V244H320V276" active phase={f.phase}/><Box x={77} y={284} width={486} height={101} title="人が方式・非機能を決め直す" lines={['確認・修正を含む工数を、白紙作成と比較']} tone="teal"/>
   </>:<>
    {['要件 ↔ 設計','基本 ↔ 詳細','設計書 ↔ コード'].map((t,i)=><Box key={t} x={32+i*197} y={80} width={182} height={95} title={t} tone="violet"/>)}
    <Box x={77} y={244} width={486} height={142} title="人が指摘を採否・承認へつなぐ" lines={['security・性能・運用の観点を指定','的外れ・過剰な指摘をそのまま根拠にしない','最終レビューを置き換えない']} tone="teal" data-ai-review-is-approval="false"/>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
export function SeDocumentDelivery({children}){
 const [source,setSource]=useState('text'),[approved,setApproved]=useState('no'),[abstracted,setAbstracted]=useState('yes'),route=seInformationRoute({approved:approved==='yes',abstracted:abstracted==='yes'})
 return <SeFigure diagram="se-document-delivery" title="図の正しさ、設計書の正本、許可した経路を確認"
  controls={({stage,ready})=>[1,2].includes(stage)?<Select label="合意した正本" value={source} onChange={setSource} ready={ready}><option value="text">テキストへ寄せる場合</option><option value="excel">既存Excelを正本に保つ場合</option></Select>:stage===3?<><Select label="情報経路の許可" value={approved} onChange={setApproved} ready={ready}><option value="yes">契約と経路を確認済み</option><option value="no">未確認・未許可</option></Select><Select label="不要な機微情報" value={abstracted} onChange={setAbstracted} ready={ready}><option value="yes">マスク・抽象化した</option><option value="no">具体情報を含む</option></Select></>:null}
  scene={s=><SeCanvas diagram="se-document-delivery" {...s}>{f=><>
   <Text y={35}>{['図の構文と、業務上の関係線の正しさは別','中身と提出形式を、段階的に扱う','抽出・転記した重要箇所を、正本へ照合','抽象化しても、許可した情報経路が必要'][f.stage]}</Text>
   {f.stage===0?<>
    {['説明からMermaidの下書き','差分で関係線・状態を確認','人が設計意図との一致をレビュー'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={75} title={t} tone={i===1?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M320 ${152+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={420} small>描画できることだけで、設計が正しいとは判断しない</Text>
   </>:[1,2].includes(f.stage)?<>
    <Box x={32} y={82} width={260} height={142} title={source==='text'?'Markdown等の正本':'既存Excelの正本'} lines={source==='text'?['中身を生成・差分レビュー','合意できた範囲から移行']:['顧客指定・既存資産','正本の扱いを合意して保つ']} tone="teal" data-design-source={source}/>
    <Wire id={s.id} d="M292 153H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={142} title={source==='text'?'提出用Excel等へ転記':'画像・CSV等へ抽出'} lines={['細かい表・結合セルに注意','重要箇所を人が照合']} tone="violet"/>
    <Box x={70} y={292} width={500} height={101} title="正本と派生の対応を確認" lines={['形式変換しただけで、正本を自動的に移さない']} tone="amber" data-conversion-moves-source="false"/>
   </>:<>
    <Box x={32} y={90} width={260} height={145} title={route.abstracted?'不要な情報を抽象化':'具体情報を含む入力'} lines={['顧客名・個人情報・実データ','必要な情報と経路を確認']} tone={route.abstracted?'violet':'amber'}/>
    <Wire id={s.id} d="M292 162H340" active={route.canSend} phase={f.phase}/><Box x={348} y={90} width={260} height={145} title={route.canSend?'確認した経路で扱う':'送信へ進めない'} lines={['マスクだけで許可しない','契約と提供形態を確認']} tone={route.canSend?'teal':'amber'} data-can-send={String(route.canSend)} data-mask-replaces-approval="false"/>
    <Text y={335} small>抽象化した使い方でも、観点・矛盾・項目の候補出しから試せる</Text>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
