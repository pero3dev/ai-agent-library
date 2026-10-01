'use client'
import { useState } from 'react'
import { ProductFigure,ProductCanvas,Text,Box,Wire,Select } from './coding-products-primitives'
import { geminiApiDataClass } from '../../lib/coding-products-model.mjs'
const productNames=['Gemini CLI','Code Assist','Jules']
export function GoogleProductsRuntime({children}){
 const [product,setProduct]=useState('cli')
 return <ProductFigure diagram="google-products-runtime" title="製品と契約を分け、実行場所と承認へつなぐ"
  controls={({stage,ready})=>stage===2?<Select label="Google製品の実行面" value={product} onChange={setProduct} ready={ready}><option value="cli">Gemini CLI</option><option value="ide">Code Assist IDE</option><option value="review">Code Assist PRレビュー</option><option value="jules">Jules</option></Select>:null}
  scene={s=><ProductCanvas diagram="google-products-runtime" {...s}>{f=><>
   <Text y={35}>{['三製品の入口・実行場所・契約を分ける','個人向けの終了と、移行先の案内を読む','手元の操作と、cloudでの実行を分ける','探索・組織への適応・計画承認は別の仕組み','計画の確認から、VM・差分・PRへ進む'][f.stage]}</Text>
   {f.stage===0?<>
    {productNames.map((t,i)=><g key={t}><Box x={32} y={79+i*100} width={260} height={72} title={t} tone={i===2?'amber':'violet'}/><Wire id={s.id} d={`M292 ${115+i*100}H340`} active phase={f.phase}/><Box x={348} y={79+i*100} width={260} height={72} title={['ライセンス・API等','Code Assistの契約','独立した個人契約'][i]} lines={i===1?['Standard／Enterprise']:[]} tone={i===2?'amber':'teal'}/></g>)}
    <Text y={417} small>CLIとCode Assistは連動。Julesを同じ契約としない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={105} width={260} height={154} title="旧個人向けの提供" lines={['本文の2026-06-18終了','CLI・IDEの旧経路']} tone="amber"/><Wire id={s.id} d="M292 182H340" active phase={f.phase}/><Box x={348} y={105} width={260} height={154} title="Antigravityへ案内" lines={['CLI・IDE等の移行先','契約と条件を再確認']} tone="teal"/>
    <Text y={351} small>Code Assist組織契約とは、終了の対象を分けて読む</Text>
   </>:f.stage===2?<>
    <Box x={32} y={91} width={260} height={146} title={{cli:'CLIのターミナル',ide:'IDEのAgent操作',review:'GitHub PRレビュー',jules:'Web・Tools・API'}[product]} lines={['入口と契約を確認','本文の提供時点を保持']} tone="violet"/>
    <Wire id={s.id} d="M292 164H340" active phase={f.phase}/><Box x={348} y={91} width={260} height={146} title={['cli','ide'].includes(product)?'ローカルで操作':product==='jules'?'短命VMで実行':'クラウドサービス'} lines={product==='jules'?['リポジトリをクローン','環境スナップショット']:product==='review'?['IDEの実行とは別','Preview等を確認']:['推論の通信は外部','ローカル資源へアクセス']} tone={['cli','ide'].includes(product)?'teal':'amber'} data-google-local-execution={String(['cli','ide'].includes(product))}/>
    <Text y={345} small>PRレビューの終了日未確認と、本文のpreviewを保持</Text>
   </>:f.stage===3?<>
    {productNames.map((t,i)=><g key={t}><Box x={32} y={82+i*101} width={260} height={74} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${119+i*101}H340`} active phase={f.phase}/><Box x={348} y={82+i*101} width={260} height={74} title={['オンデマンド探索','組織コードへ適応','人が計画を承認'][i]} tone={i===2?'amber':'teal'}/></g>)}
    <Text y={419} small>Enterprise索引・CLIの復元は、製品と提供条件を確認</Text>
   </>:<>
    {['プロンプトと計画','人が計画を承認','VM内で変更','差分を確認','PRを作成'].map((t,i)=><g key={t}><Box x={32} y={68+i*65} width={260} height={52} title={t} tone={i===1?'amber':'violet'}/>{i<4&&<Wire id={s.id} d={`M162 ${120+i*65}V${125+i*65}`} active phase={f.phase}/>}</g>)}
    <Box x={348} y={147} width={260} height={156} title="確認を挟む委任" lines={['セットアップを検証','保存環境を再利用','図は実タスクを投入せず']} tone="teal"/><Text y={415} small>計画承認と、できた変更のレビューは別の確認</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function GoogleConfigData({children}){
 const [billing,setBilling]=useState('active'),[region,setRegion]=useState('other')
 const policy=geminiApiDataClass({paidService:billing==='active',europeanException:region==='exception'})
 return <ProductFigure diagram="google-config-data" title="ルール・権限・認証を、データ条件へ結びつける"
  controls={({stage,ready})=>stage===4?<><Select label="APIの課金条件" value={billing} onChange={setBilling} ready={ready}><option value="active">有効なBillingに紐づく</option><option value="unpaid">Unpaidの経路</option></Select><Select label="データ条項の地域条件" value={region} onChange={setRegion} ready={ready}><option value="other">地域例外に該当しない</option><option value="exception">EEA・スイス・英国の例外</option></Select></>:null}
  scene={s=><ProductCanvas diagram="google-config-data" {...s}>{f=><>
   <Text y={35}>{['製品別のルール名と読込範囲を確認する','ユーザーとworkspace、承認方式を照合する','隔離の選択と、自動承認の条件を分ける','認証の経路ごとに、データ条件の根拠が変わる','Gemini APIのPaid条件と、保持を分けて読む','秘密と組織データを、契約ごとの条件へ照合'][f.stage]}</Text>
   {f.stage===0?<>
    {productNames.map((t,i)=><g key={t}><Box x={32} y={78+i*102} width={260} height={75} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${115+i*102}H340`} active phase={f.phase}/><Box x={348} y={78+i*102} width={260} height={75} title={i===2?'ルートのAGENTS.md':'GEMINI.md'} tone="teal"/></g>)}
    <Text y={417} small>CLIの互換名・IDEの例外・同期方法を本文で確認</Text>
   </>:f.stage===1?<>
    <Box x={32} y={87} width={260} height={134} title="settings.json" lines={['ユーザー＋workspace','extensions等の拡張']} tone="violet"/><Box x={348} y={87} width={260} height={134} title="承認モード" lines={['都度・編集のみ・plan','YOLOはCLIフラグ']} tone="amber"/>
    <Box x={90} y={285} width={460} height={96} title="信頼と有効な設定を確認" lines={['本文の版と現在の既定を分ける']} tone="teal"/>
   </>:f.stage===2?<>
    <Box x={32} y={100} width={260} height={157} title="CLIの隔離を選ぶ" lines={['OS・コンテナ等','有効化と実効性を確認']} tone="teal"/><Box x={348} y={100} width={260} height={157} title="IDEの自動承認" lines={['オプトインの範囲','隔離の実効性と別']} tone="amber"/><Text y={351} small>広い方式の選択肢を、全OSで同一の保証としない</Text>
   </>:f.stage===3?<>
    {['Code Assistの契約','Gemini APIキー','Vertex AI','Jules'].map((t,i)=><Box key={t} x={32+i%2*316} y={90+Math.floor(i/2)*132} width={260} height={103} title={t} tone={i===1?'amber':'violet'}/>)}
    <Text y={405} small>OSSの公開だけで、送信先や学習利用は決まらない</Text>
   </>:f.stage===4?<>
    <Box x={32} y={86} width={260} height={142} title={policy.paidDataConditions?'Paidのデータ条項':'Unpaidのデータ条項'} lines={[billing==='active'?'有効なBillingの条件':'無料の利用経路',region==='exception'?'地域の例外を適用':'地域例外はなし']} tone="violet" data-paid-data-conditions={String(policy.paidDataConditions)}/>
    <Wire id={s.id} d="M292 157H340" active phase={f.phase}/><Box x={348} y={86} width={260} height={142} title={policy.productImprovementUse?'改善利用・人手確認あり':'改善利用に使わない'} lines={['保持なしを意味しない','安全・法的目的を区別']} tone={policy.productImprovementUse?'amber':'teal'} data-product-improvement-use={String(policy.productImprovementUse)} data-no-retention-guaranteed="false"/>
    <Text y={326}>{['請求額ゼロだけで、Unpaidと判定しない','AI Studioは別の課金・アカウント条件も確認']}</Text>
   </>:<>
    <Box x={32} y={93} width={260} height={148} title="送る情報の分類" lines={['機密・個人・組織データ','Unpaidへ機密を送らず']} tone="amber"/><Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={93} width={260} height={148} title="対応する契約と設定" lines={['学習利用と保持を確認','製品ごとに資料を照合']} tone="teal"/>
    <Text y={341}>{['Code Assistの契約条件とAPI条件を同一視しない','Julesのデータ差・秘密の未確認を保持']}</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function GoogleIntegrationsAdoption({children}){
 return <ProductFigure diagram="google-integrations-adoption" title="製品ごとの接続と管理を、採用要件へ照合する"
  scene={s=><ProductCanvas diagram="google-integrations-adoption" {...s}>{f=><>
   <Text y={35}>{['MCPの対応面と、信頼・認証・フィルタを照合','CIとタスク投入の入口を、製品別に確認','組織契約の提供条件を、個別に照合する','本文のJulesの制約と、未確認事項を保持','併用する契約・規約・実行場所の管理も評価'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={95} width={260} height={148} title="CLI・Code Assist" lines={['MCPの接続を確認','信頼・OAuth・フィルタ']} tone="teal"/><Box x={348} y={95} width={260} height={148} title="Jules・IDEの条件" lines={['MCPは未確認を保持','IDEの機能差を確認']} tone="amber"/><Text y={347} small>同じ提供者の別製品へ、対応を補完しない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={104} width={260} height={146} title="CLIとActions" lines={['PRレビュー・トリアージ','CIの認証と権限']} tone="violet"/><Box x={348} y={104} width={260} height={146} title="Jules API・Tools" lines={['タスク投入の入口','alpha等の時点を確認']} tone="teal"/><Text y={347} small>図から実タスク・コメント・通知を送らない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={97} width={260} height={156} title="Code Assist" lines={['Cloudのシート管理','Edition別の枠']} tone="violet"/><Box x={348} y={97} width={260} height={156} title="Antigravity" lines={['Organizationの条件','同梱の対象を照合']} tone="teal"/><Text y={351} small>本文の提供時点と、採用する契約の適用を分ける</Text>
   </>:f.stage===3?<>
    <Box x={32} y={97} width={260} height={158} title="本文の2026-08時点" lines={['GitHub・個人向け','チーム提供の記載なし']} tone="violet"/><Box x={348} y={97} width={260} height={158} title="組織の要件へ照合" lines={['SSO・集中管理・監査','秘密とデータ差は未確認']} tone="amber"/><Text y={351} small>未確認の機能や契約を、対応済みとして扱わない</Text>
   </>:<>
    {['Cloud契約と統制','OSSの拡張','組織の提案適応'].map((t,i)=><Box key={t} x={32+i*197} y={97} width={182} height={113} title={t} tone="violet"/>)}
    <Wire id={s.id} d="M320 210V274" active phase={f.phase}/><Box x={77} y={282} width={486} height={101} title="製品ごとの選定と、併用管理" lines={['契約・ルール名・実行先を揃えて照合']} tone="teal"/>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
