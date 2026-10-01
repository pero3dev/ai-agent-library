'use client'
import { useState } from 'react'
import { ProductFigure,ProductCanvas,Text,Box,Wire,Select } from './coding-products-primitives'
import { codexCommandNetwork } from '../../lib/coding-products-model.mjs'
export function CodexSurfacesRuntime({children}){
 return <ProductFigure diagram="codex-surfaces-runtime" title="製品の入口と作業空間を、実行の段階へつなぐ"
  scene={s=><ProductCanvas diagram="codex-surfaces-runtime" {...s}>{f=><>
   <Text y={35}>{['コード生成モデルの名前と、Agent製品群を分ける','操作する入口から、コマンドの実行先を追う','cloudのセットアップと、Agent実行を分ける','階層指示と探索で、必要なコードを読む','Gitと差分を使い、実行の境界を確認する'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={111} width={260} height={147} title="2021年のモデル" lines={['古いコード生成の名称','現行Agentと別物']} tone="violet"/><Box x={348} y={111} width={260} height={147} title="2025年以降の製品群" lines={['CLI・IDE・アプリ等','同じAgentの複数の面']} tone="teal"/><Text y={351} small>古いモデルの説明から、現行製品の機能を推論しない</Text>
   </>:f.stage===1?<>
    {['CLI・IDE・アプリ','cloud・PRレビュー','CI・SDK等'].map((t,i)=><g key={t}><Box x={32} y={80+i*98} width={260} height={74} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${117+i*98}H340`} active phase={f.phase}/><Box x={348} y={80+i*98} width={260} height={74} title={['手元・worktree','隔離コンテナ','ランナー・組込先'][i]} tone={i===1?'amber':'teal'}/></g>)}
    <Text y={417} small>Chrome・App Server等も、入口と処理先を照合</Text>
   </>:f.stage===2?<>
    <Box x={32} y={107} width={260} height={151} title="セットアップ" lines={['依存取得の通信','初期化スクリプト']} tone="violet"/>
    <Wire id={s.id} d="M292 182H340" active phase={f.phase}/><Box x={348} y={107} width={260} height={151} title="Agentフェーズ" lines={['通信は別に許可を確認','本文の既定と時点']} tone="amber"/>
    <Text y={351} small>準備で通信できても、後の処理へ自動で引き継がない</Text>
   </>:f.stage===3?<>
    {['グローバル指示','Gitルート→開始cwd','必要な対象を探索'].map((t,i)=><g key={t}><Box x={70} y={79+i*104} width={500} height={72} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${151+i*104}V${175+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={416} small>読込上限は連結後の合計。索引方式の推測を断定しない</Text>
   </>:<>
    <Box x={32} y={103} width={260} height={145} title="diff・Git・worktree" lines={['作業空間と差分を確認','再開・reviewの入口']} tone="violet"/><Wire id={s.id} d="M292 176H340" active phase={f.phase}/><Box x={348} y={103} width={260} height={145} title="権限内で実行・検証" lines={['非対話モードも確認','外部作用は別に復旧']} tone="teal"/><Text y={351} small>Gitの復元へ、外部送信の取消しを補完しない</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function CodexConfigPermission({children}){
 const [network,setNetwork]=useState('off'),[proxy,setProxy]=useState('on')
 const boundary=codexCommandNetwork({network:network==='on',proxy:proxy==='on'})
 return <ProductFigure diagram="codex-config-permission" title="指示・承認・通信の境界を、別々に照合する"
  controls={({stage,ready})=>stage===3?<><Select label="ローカルコマンドの通信" value={network} onChange={setNetwork} ready={ready}><option value="off">network.enabled = false</option><option value="on">network.enabled = true</option></Select><Select label="ドメイン規則のプロキシ" value={proxy} onChange={setProxy} ready={ready}><option value="on">network_proxy = true</option><option value="off">network_proxy = false</option></Select></>:null}
  scene={s=><ProductCanvas diagram="codex-config-permission" {...s}>{f=><>
   <Text y={35}>{['指示の階層、信頼済み設定、組織強制を分ける','操作の境界と、承認要求を出す条件を分ける','旧設定の優先と、管理強制の例外を確認','通信許可だけでは、ドメイン規則は強制されない','Auto-reviewは、発生した承認要求を判断する','ローカルの境界を、別の機能へ拡張しない'][f.stage]}</Text>
   {f.stage===0?<>
    {['AGENTS.mdの階層','信頼済みconfig.toml','requirements.toml'].map((t,i)=><g key={t}><Box x={32} y={84+i*100} width={260} height={71} title={t} tone="violet"/><Wire id={s.id} d={`M292 ${119+i*100}H340`} active phase={f.phase}/><Box x={348} y={84+i*100} width={260} height={71} title={['指示・override・上限','設定・拡張・agents','組織の制限を強制'][i]} tone={i===2?'amber':'teal'}/></g>)}
   </>:f.stage===1?<>
    <Box x={32} y={105} width={260} height={150} title="ファイルと通信の境界" lines={['read-only／workspace等','アクセス範囲を定める']} tone="teal"/><Box x={348} y={105} width={260} height={150} title="承認要求の条件" lines={['untrusted／on-request等','要求しないneverもある']} tone="violet"/><Text y={351} small>承認を要求しない設定から、操作の安全を推論しない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={91} width={260} height={129} title="通常の混在設定" lines={['旧モードが優先する','単純に合成しない']} tone="violet"/><Box x={348} y={91} width={260} height={129} title="管理者の指定" lines={['許可profileで強制','本文のbeta条件を確認']} tone="amber"/>
    <Wire id={s.id} d="M162 220V259H320V279" active phase={f.phase}/><Wire id={s.id} d="M478 220V259H320V279" active phase={f.phase}/><Box x={88} y={287} width={464} height={94} title="版・旧設定・実効設定を照合" lines={['旧設定の除去と組織の混在版を確認']} tone="teal"/>
   </>:f.stage===3?<>
    <Box x={32} y={93} width={260} height={124} title="ローカルコマンド" lines={[boundary.commandsCanConnect?'通信を有効にした':'外部通信は無効',proxy==='on'?'プロキシは有効':'プロキシは無効']} tone="violet" data-commands-connect={String(boundary.commandsCanConnect)}/>
    <Wire id={s.id} d="M292 155H340" active={boundary.commandsCanConnect} phase={f.phase}/><Box x={348} y={93} width={260} height={124} title={boundary.domainRulesEnforced?'ドメイン規則を強制':boundary.commandsCanConnect?'直接の通信が可能':'通信を開始しない'} lines={[boundary.domainRulesEnforced?'許可・拒否へ照合':'規則だけでは強制せず']} tone={boundary.domainRulesEnforced?'teal':'amber'} data-domain-rules-enforced={String(boundary.domainRulesEnforced)}/>
    <Box x={77} y={282} width={486} height={93} title="MCP・ブラウザ・cloud等は別制御" lines={['このスイッチは各機能へ適用されない']} tone="amber" data-controls-other-surfaces="false"/>
   </>:f.stage===4?<>
    <Box x={32} y={88} width={260} height={112} title="境界を越える要求" lines={['on-request等で発生']} tone="violet"/><Wire id={s.id} d="M292 144H340" active phase={f.phase}/><Box x={348} y={88} width={260} height={112} title="レビュアーが判断" lines={['承認要求を審査']} tone="teal"/>
    <Box x={77} y={271} width={486} height={100} title="通常の許可済み操作は毎回審査しない" lines={['neverやfull accessへ安全保証を加えない']} tone="amber" data-auto-review-all-operations="false"/>
   </>:<>
    {['ローカルのOS隔離','MCP・ブラウザ等','契約とデータ設定','別製品のSecurity'].map((t,i)=><Box key={t} x={32+i%2*316} y={91+Math.floor(i/2)*132} width={260} height={103} title={t} tone={i===2?'amber':'violet'}/>)}
    <Text y={405} small>機能ごとの制御と、個人・組織の学習利用条件を確認</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
export function CodexIntegrationsAdoption({children}){
 return <ProductFigure diagram="codex-integrations-adoption" title="認証と機能の範囲を、組織の採用条件へ照合する"
  scene={s=><ProductCanvas diagram="codex-integrations-adoption" {...s}>{f=><>
   <Text y={35}>{['接続する面と、MCP・review・SDKを照合する','認証の経路ごとに、モデルと請求を確認する','ChatGPT側の退役を、APIへ一律に適用しない','枠と追加消費、集中管理と監査を分ける','既存契約と共通規約を、実行条件へ照合'][f.stage]}</Text>
   {f.stage===0?<>
    {['CLI・IDEのMCP','PRのreview・Action','SDK・再開'].map((t,i)=><Box key={t} x={77} y={80+i*104} width={486} height={74} title={t} tone={i===0?'teal':'violet'}/>)}
    <Text y={417} small>cloudのMCP未確認を、対応済みへ補完しない</Text>
   </>:f.stage===1||f.stage===2?<>
    <Box x={32} y={104} width={260} height={154} title="ChatGPT認証" lines={f.stage===1?['契約と提供モデル','保存済みモデルID']:['本文の退役告知','対象の日付を確認']} tone="violet"/><Box x={348} y={104} width={260} height={154} title="APIキー・提供者" lines={f.stage===1?['従量とAPI互換','モデル設定を確認']:['ChatGPT退役の対象外','API設定を一律変更せず']} tone={f.stage===2?'amber':'teal'}/>
    <Text y={352} small>{f.stage===1?'元記事のモデル一覧の時点を保ち、最新の順位を作らない':'退役や置換を、認証方式とモデルIDごとに確認する'}</Text>
   </>:f.stage===3?<>
    <Box x={32} y={90} width={260} height={130} title="枠とAPI従量" lines={['契約の窓・クレジット','現在の条件を確認']} tone="violet"/><Box x={348} y={90} width={260} height={130} title="利用する面の許可" lines={['Local／cloudの管理','requirementsを確認']} tone="amber"/>
    <Box x={77} y={287} width={486} height={93} title="AnalyticsとCompliance" lines={['使用量の分析と、ログ・タスクの追跡']} tone="teal"/>
   </>:<>
    <Box x={32} y={104} width={260} height={155} title="既存契約・共通規約" lines={['保守・移行・理解','OSSの挙動を検証']} tone="teal"/><Box x={348} y={104} width={260} height={155} title="実行面の条件" lines={['cloudの接続前提','個人データ・機能互換']} tone="amber"/><Text y={352} small>便利な入口だけで、認証・送信先・権限の条件を省かない</Text>
   </>}
  </>}</ProductCanvas>}>{children}</ProductFigure>
}
