'use client'
import { useState } from 'react'
import { SeFigure,SeCanvas,Text,Box,Wire,Select } from './se-process-primitives'
import { SE_PROCESS_ROLES } from '../../lib/se-process-model.mjs'
export function SeCommonPrinciples({children}){
 return <SeFigure diagram="se-common-principles" title="Agentの候補と、人の確定・根拠を分ける"
  scene={s=><SeCanvas diagram="se-common-principles" {...s}>{f=><>
   <Text y={35}>{['SEの工程へ、コーディングAgentを道具として使う','候補を広げる担当と、成果物を確定する担当を分ける','観測・要求・仮説を、同じ根拠にしない'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={83} y={82} width={474} height={105} title="選定・設定・依頼・権限の土台" lines={['既存08章の知識を工程へ適用']} tone="violet"/>
    <Wire id={s.id} d="M320 187V236" active phase={f.phase}/><Box x={83} y={244} width={474} height={116} title="開発・保守する対象システム" lines={['要件・設計・実装・テスト・運用','Agent製品を作る話とは別']} tone="teal"/>
   </>:f.stage===1?<>
    <Box x={32} y={102} width={260} height={156} title="Agent：候補を広げる" lines={['観点・列挙・下書き','生成物は確認前の候補']} tone="violet"/>
    <Wire id={s.id} d="M292 180H340" active phase={f.phase}/><Box x={348} y={102} width={260} height={156} title="人：確認し確定" lines={['整合性・採否・顧客合意','成果物の担当者を置く']} tone="teal"/>
    <Text y={344} small>Agentを使ったことだけで、確認の工程を省略しない</Text>
    <Text y={393} small>法的な責任分担は、契約・適用法へ別途照合</Text>
   </>:<>
    {['現行挙動の観測','合意した要求','生成された仮説'].map((t,i)=><Box key={t} x={32+i*197} y={79} width={182} height={99} title={t} tone={i===2?'amber':'violet'}/>)}
    <Box x={77} y={253} width={486} height={127} title="根拠を照合して判断する" lines={['現行実装も、不具合を含み得る','情報の契約経路を先に決め、効果は測る']} tone="teal" data-observed-means-correct="false"/>
    <Text y={421} small>動いていることと、要求どおりであることは別</Text>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
export function SeVModelMap({children}){
 const [pair,setPair]=useState('requirements'),[process,setProcess]=useState('testing'),role=SE_PROCESS_ROLES[process]
 return <SeFigure diagram="se-v-model-map" title="成果物とテストの対応から、自分の工程へ"
  controls={({stage,ready})=>stage===0?<Select label="対応する成果物" value={pair} onChange={setPair} ready={ready}><option value="requirements">要件と総合テスト</option><option value="basic">基本設計と結合テスト</option><option value="detail">詳細設計と単体テスト</option></Select>:stage===1?<Select label="担当する工程" value={process} onChange={setProcess} ready={ready}>{Object.entries(SE_PROCESS_ROLES).map(([id,r])=><option key={id} value={id}>{r.title}</option>)}</Select>:null}
  scene={s=><SeCanvas diagram="se-v-model-map" {...s}>{f=><>
   <Text y={35}>{['V字は、作る成果物と検証の対応を示す','工程の候補作業と、人の判断を並べる','誤りの影響と検出手段を、その変更へ照合','短い反復でも、同じ活動と責任がある','自分の工程から、小さな候補出しを選ぶ'][f.stage]}</Text>
   {f.stage===0?<>
    {['requirements','basic','detail'].map((key,i)=><g key={key} data-v-pair={key} data-selected={String(pair===key)}>
     <Box x={32+i*48} y={70+i*87} width={160} height={57} title={['要件定義','基本設計','詳細設計'][i]} tone="violet" active={pair===key}/>
     <Wire id={s.id} d={`M${192+i*48} ${98+i*87}H${440-i*48}`} active={pair===key} phase={f.phase}/>
     <Box x={448-i*48} y={70+i*87} width={160} height={57} title={['総合テスト','結合テスト','単体テスト'][i]} tone="teal" active={pair===key}/>
    </g>)}
    <Wire id={s.id} d="M112 127L160 157M160 214L208 244M208 301L320 343M320 343L432 301M432 244L480 214M480 157L528 127" active phase={f.phase}/>
    <Box x={244} y={335} width={152} height={52} title="実装" tone="violet"/>
    <Text y={416} small>位置だけで費用・検出率は測れない</Text>
   </>:f.stage===1?<>
    <Text y={82} tone="teal">{role.title}</Text>
    <Box x={32} y={120} width={260} height={143} title="Agentが候補を作る" lines={role.draft} tone="violet"/>
    <Wire id={s.id} d="M292 192H340" active phase={f.phase}/><Box x={348} y={120} width={260} height={143} title="人が確定する" lines={role.human} tone="teal"/>
    <Box x={78} y={317} width={484} height={74} title={`リスク：${role.risk}`} tone="amber" data-process-role={process}/>
   </>:f.stage===2?<>
    {['変更範囲','影響する要求','検証できる手段'].map((t,i)=><Box key={t} x={32+i*197} y={90} width={182} height={95} title={t} tone={i===1?'amber':'violet'}/>)}
    <Box x={75} y={260} width={490} height={130} title="この変更の誤りと、検出の機会を評価" lines={['業務補完・方式不整合・自己参照・本番境界','工程名だけで危険度や費用を数値化しない']} tone="teal"/>
   </>:f.stage===3?<>
    {['要件','設計','実装','テスト'].map((t,i)=><g key={t}><Box x={32+i%2*316} y={80+Math.floor(i/2)*135} width={260} height={80} title={t} tone={i===3?'teal':'violet'}/></g>)}
    <Wire id={s.id} d="M292 120H340M478 160V207M348 255H300M162 215V168" active phase={f.phase}/>
    <Text y={361} small>候補 → 人の確定を繰り返す。回転が速いほどレビューを管理</Text>
    <Text y={410} small>工程間の設計書・テスト仕様書の体裁も確認</Text>
   </>:<>
    {['上流：要件と設計','テスト：観点と妥当性','保守：レガシー理解・運用','環境：企業制約・顧客合意'].map((t,i)=><Box key={t} x={67} y={70+i*78} width={506} height={60} title={t} tone={i===3?'amber':'violet'}/>)}
    <Text y={421} small>確認責任と情報経路を保ち、測ってから範囲を広げる</Text>
   </>}
  </>}</SeCanvas>}>{children}</SeFigure>
}
