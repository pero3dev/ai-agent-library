'use client'
import { useState } from 'react'
import { IdeFigure,IdeCanvas,Text,Box,Wire,Select } from './coding-ide-cloud-primitives'
import { desktopContract } from '../../lib/coding-ide-cloud-model.mjs'
export function WindsurfRuntimeMigration({children}){
 const [agent,setAgent]=useState('external'),[policy,setPolicy]=useState('new'),contract=desktopContract(agent)
 return <IdeFigure diagram="windsurf-runtime-migration" title="改名、実行の場所、権限モデルの移行を追う"
  controls={({stage,ready})=>stage===1?<Select label="Desktopで扱うAgent" value={agent} onChange={setAgent} ready={ready}><option value="local">Devin Local</option><option value="cloud">Devin Cloudへ委任</option><option value="external">ACPの他社Agent</option></Select>:stage===4?<Select label="権限モデルの世代" value={policy} onChange={setPolicy} ready={ready}><option value="new">Devin Local</option><option value="old">レガシーCascade</option></Select>:null}
  scene={s=><IdeCanvas diagram="windsurf-runtime-migration" {...s}>{f=><>
   <Text y={35}>{['買収・改名・Agent移行を、同じ出来事にしない','一つの画面でも、実行と契約は別','端末の索引、共有埋め込み、探索を分ける','hunkの確認と、旧巻戻しの制約を分ける','新旧の設定を、一対一に置換しない'][f.stage]}</Text>
   {f.stage===0?<>
    {['Codeium → Windsurf','2025-07：Cognitionが買収','2026-06：Devin Desktopへ改名','Cascade → Devin Localへ移行'].map((t,i)=><g key={t}><Box x={67} y={71+i*78} width={506} height={56} title={t} tone={i===3?'amber':'violet'}/>{i<3&&<Wire id={s.id} d={`M320 ${127+i*78}V${141+i*78}`} active phase={f.phase}/>}</g>)}
    <Text y={421} small>GA宣言とCascadeの実終了は本文時点で未確認</Text>
   </>:f.stage===1?<>
    <Box x={74} y={73} width={492} height={88} title="Agent Command Center" lines={['Desktop・CLI・Pluginsと、cloudの往復']} tone="violet"/>
    <Wire id={s.id} d="M320 161V205" active phase={f.phase}/>
    <Box x={32} y={213} width={260} height={147} title={{local:'Devin Local',cloud:'Devin Cloud',external:'ACPの他社Agent'}[agent]} lines={[contract.cloudExecution?'cloudで実行':'ローカルで実行','入口と実行先を確認']} tone="teal" data-cloud-execution={String(contract.cloudExecution)}/>
    <Wire id={s.id} d="M292 286H340" active phase={f.phase}/><Box x={348} y={213} width={260} height={147} title={contract.devinTermsApply?'Devinの契約条件':'第三者の契約条件'} lines={contract.thirdPartyBilling?['Devinのprivacy適用外','課金も第三者と直接']:['利用するプランの条件','学習利用・保持を確認']} tone="amber" data-devin-terms-apply={String(contract.devinTermsApply)} data-third-party-billing={String(contract.thirdPartyBilling)}/>
    <Text y={418} small>ACPは接続の方式。Agentの契約を統一する機構ではない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={76} width={260} height={126} title="ローカル索引" lines={['既定の理解の方式','ignoreで対象を絞る']} tone="teal"/>
    <Box x={348} y={76} width={260} height={126} title="remote索引" lines={['Teams／Enterprise','埋め込みをチーム共有']} tone="violet"/>
    <Wire id={s.id} d="M478 202V259" active phase={f.phase}/><Box x={348} y={267} width={260} height={110} title="埋め込み後にコード削除" lines={['推論送信なしの保証ではない']} tone="amber" data-index-deletion-no-inference="false"/>
    <Box x={32} y={267} width={260} height={110} title="Fast Context" lines={['SWE-grepで実行時探索','索引と組み合わせる']} tone="teal"/>
   </>:f.stage===3?<>
    <Box x={32} y={99} width={260} height={156} title="diffのhunk" lines={['編集領域で確認','承認・却下して反映']} tone="teal"/>
    <Box x={348} y={99} width={260} height={156} title="Cascadeの復元" lines={['prompt単位で巻戻し','巻戻しの取り消し不可']} tone="amber" data-cascade-undo-rewind="false"/>
    <Text y={343} small>旧機構を、Devin Localへ同じ仕様として適用しない</Text>
   </>:policy==='old'?<>
    {['Disabled','Allowlist Only','Auto','Turbo'].map((t,i)=><Box key={t} x={32+i%2*316} y={79+Math.floor(i/2)*115} width={260} height={80} title={t} tone={i===3?'amber':'violet'}/>)}
    <Box x={76} y={323} width={488} height={70} title="旧4段階＋許可・拒否リスト" tone="amber" data-permission-generation="cascade"/>
   </>:<>
    {['Deny','Ask','Allow'].map((t,i)=><Box key={t} x={32+i*197} y={80} width={182} height={72} title={t} tone={i===0?'amber':i===1?'violet':'teal'}/>)}
    <Wire id={s.id} d="M320 152V197" active phase={f.phase}/><Box x={67} y={205} width={506} height={80} title="読取・書込・コマンド・HTTP・MCP" tone="violet"/>
    <Wire id={s.id} d="M320 285V314" active phase={f.phase}/><Box x={67} y={322} width={506} height={70} title="プロジェクト・ユーザー・組織の規則" tone="teal" data-permission-generation="devin-local"/>
    <Text y={422} small>操作スコープと階層に対して、規則を照合する</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function WindsurfRulesSecurity({children}){
 return <IdeFigure diagram="windsurf-rules-security" title="設定の移行と、組織の隔離・データ条件を読む"
  scene={s=><IdeCanvas diagram="windsurf-rules-security" {...s}>{f=><>
   <Text y={35}>{['推奨規約と互換パスを、実際の読込へ照合','自動記憶と、共有する規約・Skillsを分ける','操作規則とOS隔離を、組織へ配布する','学習の設定と、安全・法的保持を分ける','契約の版と適用日、企業の管理条件を確認'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={76} y={76} width={488} height={86} title="推奨：.devin/rules/*.md" lines={['AGENTS：root常時・下位glob']} tone="teal"/>
    <Wire id={s.id} d="M320 162V208" active phase={f.phase}/><Box x={76} y={216} width={488} height={154} title="互換と混在を確認" lines={['.windsurf/rules・.windsurfrules・global規約','~/.devin・~/.windsurf・旧Codeium','4適用モードと、実際の設定先']} tone="amber"/>
   </>:f.stage===1?<>
    <Box x={32} y={85} width={260} height={143} title="Cascade Memories" lines={['会話から自動生成','ローカルに保存']} tone="violet"/>
    <Box x={348} y={85} width={260} height={143} title="Devin Local" lines={['本文時点で非永続化','CLI共通のSkillsを使う']} tone="amber"/>
    <Wire id={s.id} d="M162 228V270H320V297" active phase={f.phase}/><Box x={74} y={305} width={492} height={79} title="共有したい知識は規約・AGENTSへ" tone="teal"/>
    <Text y={423} small>旧Memoriesの存在だけで、新Agentの永続化を保証しない</Text>
   </>:f.stage===2?<>
    <Box x={76} y={75} width={488} height={96} title="OSサンドボックスを組織で強制" lines={['ファイル隔離・ドメインの通信フィルタ']} tone="teal"/>
    <Wire id={s.id} d="M320 171V207H162V243" active phase={f.phase}/><Wire id={s.id} d="M320 207H478V243" active phase={f.phase}/>
    <Box x={32} y={251} width={260} height={138} title="Agentの許可" lines={['コマンドの許可・拒否','MCP／ACP registry']} tone="violet"/>
    <Box x={348} y={251} width={260} height={138} title="端末の管理" lines={['拡張の発行者制限','MDM・telemetry']} tone="violet"/>
   </>:f.stage===3?<>
    {['プラン・契約版を確認','有料tierのopt-outを設定','学習条件と、保持例外を照合'].map((t,i)=><g key={t}><Box x={76} y={76+i*103} width={488} height={75} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${151+i*103}V${171+i*103}`} active phase={f.phase}/>}</g>)}
    <Text y={421} small>Teamsは管理者が設定。ZDRにも安全・法的保持の例外</Text>
   </>:<>
    <Box x={32} y={100} width={260} height={151} title="規約の更新と適用" lines={['更新日と適用日は別','重大変更の30日条件']} tone="amber"/>
    <Box x={348} y={100} width={260} height={151} title="Enterpriseの管理" lines={['個別契約・SOC 2','SSO・RBACの条件']} tone="teal"/>
    <Text y={343} small>旧個人規約とFreeの未確認範囲を、現行条件に補完しない</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function WindsurfConnectionsAdoption({children}){
 return <IdeFigure diagram="windsurf-connections-adoption" title="接続と第三者契約を、移行期の採用条件へつなぐ"
  scene={s=><IdeCanvas diagram="windsurf-connections-adoption" {...s}>{f=><>
   <Text y={35}>{['サーバーとツールの有効化・実行前承認を確認','ACPの他社Agentと、Devin cloudを分ける','プラン統合と、提供範囲・課金の未確認を分ける','管制の価値と、移行の依存を照合する'][f.stage]}</Text>
   {f.stage===0?<>
    {['Marketplace・設定・OAuth','使うツールをon／off','Devin Localでは実行前承認'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={74} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${151+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={419} small>本文の100ツール上限等は、採用時の条件へ照合</Text>
   </>:f.stage===1?<>
    <Box x={78} y={73} width={484} height={80} title="同じDesktopから操作" tone="violet"/>
    <Wire id={s.id} d="M320 153V204H162V245" active phase={f.phase}/><Wire id={s.id} d="M320 204H478V245" active phase={f.phase}/>
    <Box x={32} y={253} width={260} height={141} title="ACPの他社Agent" lines={['第三者の課金・privacy','提供者の権限を確認']} tone="amber"/>
    <Box x={348} y={253} width={260} height={141} title="Devin Cloud" lines={['CI・GitHub自動化','委任後にPRをレビュー']} tone="teal"/>
   </>:f.stage===2?<>
    <Box x={74} y={73} width={492} height={94} title="全プランにDesktopを含む" lines={['Free・Pro・Max・Teams・Enterprise']} tone="violet"/>
    <Wire id={s.id} d="M320 167V218" active phase={f.phase}/>
    <Box x={32} y={226} width={260} height={151} title="チーム・企業の追加" lines={['集中請求・共有索引','SSO・管理・専用配備']} tone="teal"/>
    <Box x={348} y={226} width={260} height={151} title="課金の統合" lines={['旧creditとACUの関係','正確な換算は未確認']} tone="amber" data-credit-acu-conversion="unknown"/>
   </>:<>
    <Box x={32} y={105} width={260} height={177} title="得たい体験" lines={['localとcloudの往復','複数Agentの管制','既存IDEのPlugins']} tone="teal"/>
    <Box x={348} y={105} width={260} height={177} title="採用前に確かめる" lines={['新旧Agentの依存','Preview・パスの混在','契約・課金の鮮度']} tone="amber"/>
    <Text y={369} small>移行の発表と、実際の終了・GAを同じ時点にしない</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
