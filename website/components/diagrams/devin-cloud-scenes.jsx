'use client'
import { useState } from 'react'
import { IdeFigure,IdeCanvas,Text,Box,Wire,Select } from './coding-ide-cloud-primitives'
import { devinGuardrail } from '../../lib/coding-ide-cloud-model.mjs'
export function DevinDelegationRuntime({children}){
 return <IdeFigure diagram="devin-delegation-runtime" title="委任から、独立したVMと事後レビューへ"
  scene={s=><IdeCanvas diagram="devin-delegation-runtime" {...s}>{f=><>
   <Text y={35}>{['委任し、実行後に成果物をレビューする','毎回、検証した環境のクリーンなコピーで開始','独立したタスクを、独立したセッションへ','事前の索引と、実行時の探索・介入を分ける','モデルの世代と、ハーネスの構成を分ける'][f.stage]}</Text>
   {f.stage===0?<>
    {['完了基準を付けて委任','VMで自律的に編集・実行','ブランチ・PRを事後レビュー'].map((t,i)=><g key={t}><Box x={68} y={76+i*104} width={504} height={74} title={t} tone={i===1?'amber':'teal'}/>{i<2&&<Wire id={s.id} d={`M320 ${150+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={419} small>コマンド単位の事前承認なし。3時間の目安は成功保証ではない</Text>
   </>:f.stage===1?<>
    <Box x={80} y={74} width={480} height={84} title="snapshot／Blueprints YAML" lines={['検証した実行環境の定義']} tone="violet"/>
    <Wire id={s.id} d="M320 158V203H162V237" active phase={f.phase}/><Wire id={s.id} d="M320 203H478V237" active phase={f.phase}/>
    <Box x={32} y={245} width={260} height={139} title="セッションAのVM" lines={['コードをclone・実行','この変更は元環境に残さず']} tone="teal" data-session-mutates-template="false"/>
    <Box x={348} y={245} width={260} height={139} title="セッションBのVM" lines={['クリーンなコピー','専用VPCは実行先の配置']} tone="teal" data-inference-on-premise="false"/>
    <Text y={424} small>Linux・限定Windowsと、SCMの対応を本文の条件で確認</Text>
   </>:f.stage===2?<>
    <Box x={82} y={75} width={476} height={109} title="Web・チャット・Issue・PR・API" lines={['CLI・scheduleも起動の入口','図は実タスクを投入しません']} tone="violet"/>
    {['タスクA','タスクB','タスクC'].map((t,i)=><g key={t}><Wire id={s.id} d={`M320 184V228H${123+i*197}V267`} active phase={f.phase}/><Box x={32+i*197} y={275} width={182} height={99} title={t} lines={['独立のsession']} tone="teal"/></g>)}
    <Text y={422} small>同じ成果物への競合を調整し、大きな仕事は分割</Text>
   </>:f.stage===3?<>
    <Box x={32} y={72} width={260} height={128} title="組織の事前索引" lines={['DeepWikiの図・出典','Ask Devinで方針確認']} tone="violet"/>
    <Wire id={s.id} d="M292 136H340" active phase={f.phase}/><Box x={348} y={72} width={260} height={128} title="VM内の探索と実行" lines={['clone・shell・browser','Progress Tabへ記録']} tone="teal"/>
    <Wire id={s.id} d="M478 200V246H320V278" active phase={f.phase}/><Box x={82} y={286} width={476} height={102} title="停止してIDEを引き継ぐ／PRへ" lines={['編集を追跡し、Gitの通常手段でレビュー']} tone="amber"/>
   </>:<>
    <Box x={32} y={88} width={260} height={144} title="SWE系モデル" lines={['SWE-1.7の追加を確認','1.6の終了は未確認']} tone="violet"/>
    <Box x={348} y={88} width={260} height={144} title="Fusion preview" lines={['frontierの主Agent','低コストsidekickを併用']} tone="teal"/>
    <Box x={75} y={296} width={490} height={92} title="削減率は本文の公表条件" lines={['35% → 最大60%：図で測定・保証しない']} tone="amber"/>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function DevinTeachingSecurity({children}){
 const [action,setAction]=useState('block'),guard=devinGuardrail(action)
 return <IdeFigure diagram="devin-teaching-security" title="教え込み、人の介入、追加の防御を分ける"
  controls={({stage,ready})=>stage===3?<Select label="検知後の対応" value={action} onChange={setAction} ready={ready}><option value="log">Log only：記録して継続</option><option value="warn">Warn user：警告して処理</option><option value="block">Block message：メッセージ遮断</option><option value="kill_session">旧kill_session：過去の違反記録</option></Select>:null}
  scene={s=><IdeCanvas diagram="devin-teaching-security" {...s}>{f=><>
   <Text y={35}>{['何を教えるかに応じて、機構を選ぶ','組織の配布と、CLIの機能差を確認する','人が関与する時点と、マージの境界を設計','記録・警告・遮断は、違う対応','契約・opt-outと、保持例外を確認する'][f.stage]}</Text>
   {f.stage===0?<>
    {['AGENTS.md：リポジトリの規約','Knowledge：条件付きヒント・追加の提案','Playbooks：再利用する手順','Blueprints：VMの環境','Secrets：暗号化し環境変数へ'].map((t,i)=><Box key={t} x={67} y={70+i*65} width={506} height={50} title={t} tone={i===4?'amber':i===1?'teal':'violet'}/>)}
    <Text y={423} small>ヒントの提案だけで、承認済みの規約へ昇格させない</Text>
   </>:f.stage===1?<>
    <Box x={32} y={92} width={260} height={156} title="APIでチームへ配布" lines={['Knowledge・Playbooks','組織横断の標準を管理']} tone="teal"/>
    <Box x={348} y={92} width={260} height={156} title="CLIの機能差" lines={['本文時点で3機構未対応','採用時に差を再確認']} tone="amber"/>
    <Box x={81} y={302} width={478} height={89} title="Secretsの保存暗号化と、注入の範囲" lines={['モデルに対するマスキングは本文でも未確認']} tone="violet"/>
   </>:f.stage===2?<>
    {['事前：方針・完了基準・制約','途中：追跡・停止・IDEの引継ぎ','事後：PRレビュー・必須CI・保護'].map((t,i)=><g key={t}><Box x={67} y={75+i*105} width={506} height={77} title={t} tone={i===2?'teal':'violet'} data-per-command-approval="false"/>{i<2&&<Wire id={s.id} d={`M320 ${152+i*105}V${172+i*105}`} active phase={f.phase}/>}</g>)}
    <Text y={420} small>事前の方針確認は、全コマンドの事前承認ではない</Text>
   </>:f.stage===3?<>
    <Box x={76} y={72} width={488} height={88} title="届いたメッセージを検知" lines={['Enterpriseの追加層。操作ごとの承認ではない']} tone="violet"/>
    <Wire id={s.id} d="M320 160V205" active phase={f.phase}/>
    <Box x={76} y={213} width={488} height={131} title={{log:'記録して、処理を継続',warn:'警告を表示し、処理を継続',block:'メッセージを遮断、sessionは継続',kill_session:'旧仕様：セッションを終了'}[action]} lines={[guard.currentlyConfigurable?'2026-10-01の設定で選択可能':'現在は設定不可。過去の違反記録に残る','監査ログ・APIへ違反を記録']} tone={guard.messageBlocked||guard.sessionEnded?'amber':'teal'} data-guard-message-blocked={String(guard.messageBlocked)} data-guard-session-ended={String(guard.sessionEnded)} data-guard-configurable={String(guard.currentlyConfigurable)} data-per-command-approval="false"/>
    <Text y={409} small>block_messageはメッセージを止め、セッションを終了しない</Text>
   </>:<>
    <Box x={32} y={77} width={260} height={151} title="セルフサーブ" lines={['有料でも既定は学習可','opt-out。Teamsは管理者']} tone="amber"/>
    <Box x={348} y={77} width={260} height={151} title="Enterprise" lines={['書面同意なしに学習せず','個別契約と管理を確認']} tone="teal"/>
    <Box x={70} y={292} width={500} height={105} title="学習の条件と、安全・法的保持を分ける" lines={['ZDRの例外、App権限、SOC 2等も要件へ照合']} tone="violet"/>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function DevinConnectionsAdoption({children}){
 return <IdeFigure diagram="devin-connections-adoption" title="管理者の接続と、消費・委任の条件を照合する"
  scene={s=><IdeCanvas diagram="devin-connections-adoption" {...s}>{f=><>
   <Text y={35}>{['接続の管理者ゲートと、提供範囲を確認する','他Agentからの呼出しと、APIの管理を分ける','モデル名・モード・提供プランを分けて確認','消費と停止条件を、契約の管理へ照合','検証できる仕事を、独立した単位へ分ける'][f.stage]}</Text>
   {f.stage===0?<>
    {['管理者がカスタムMCPを追加','企業で配布 → 組織の設定で上書き','専用配備：private tunnel・OAuth・CA'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={76} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${153+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={421} small>通信形式と、誰が追加・利用できるかを別に確認</Text>
   </>:f.stage===1?<>
    <Box x={32} y={100} width={260} height={177} title="MCPサーバー" lines={['Devin・DeepWikiを公開','他のAgentから呼ぶ','呼出す側の権限も確認']} tone="teal"/>
    <Box x={348} y={100} width={260} height={177} title="API v3" lines={['session・知識・秘密','監査・消費メトリクス','Enterpriseの横断管理']} tone="violet"/>
    <Text y={365} small>図から接続・session作成・秘密の注入は実行しない</Text>
   </>:f.stage===2?<>
    <Box x={75} y={80} width={490} height={97} title="モデル名 × モード × プラン" lines={['SWE-1.7の発表・pricing掲載を確認']} tone="violet"/>
    <Wire id={s.id} d="M320 177V231" active phase={f.phase}/><Box x={75} y={239} width={490} height={130} title="旧世代の終了と、Fusionの条件は別" lines={['1.6の終了を補完しない','preview・削減率は本文の公表条件']} tone="amber"/>
   </>:f.stage===3?<>
    <Box x={32} y={70} width={260} height={146} title="契約の消費単位" lines={['quota＋on-demand credits','EnterpriseのみACU','厳密な回数換算は未確認']} tone="violet" data-acu-conversion="unknown"/>
    <Box x={348} y={70} width={260} height={146} title="消費の停止・上限" lines={['非活動で自動スリープ','ReviewのPR支出上限','監視して設定を確認']} tone="teal"/>
    <Box x={72} y={279} width={496} height={112} title="認証・役割・監査・IP・組織階層" lines={['Desktop・CLI・cloudを横断する枠と提供条件','Secretsの個人・組織スコープも確認']} tone="amber"/>
   </>:<>
    <Box x={32} y={98} width={260} height={183} title="委任に合う単位" lines={['独立した修正・移行・保守','テスト・CIで完了を判定','大きな仕事は分割']} tone="teal"/>
    <Box x={348} y={98} width={260} height={183} title="先に照合する条件" lines={['全操作の事前承認の要件','学習の既定・契約','曖昧な依頼の追加消費']} tone="amber"/>
    <Text y={369} small>対話的なペア作業は、Desktop・CLIの面も評価</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
