'use client'
import {useId,useState} from 'react'
import {IntegrationCanvas,IntegrationFigure,IntegrationPair,IntegrationThree,Text,Box,Wire,Select,Tokens} from './model-mcp-evaluation-primitives'
import {mcpConnectionGate,mcpReplicaGate} from '../../lib/model-mcp-evaluation-model.mjs'
export function McpConnectionVersions({children}){
 const id=useId(),[connection,setConnection]=useState('new'),[missing,setMissing]=useState('key')
 const replica=mcpReplicaGate({legacySessionRequired:true,sessionManaged:missing!=='session',signedStateRequired:true,keyShared:missing!=='key',notificationsRequired:true,notificationsShared:missing!=='notifications'})
 return <IntegrationFigure diagram="mcp-connection-versions" title="接続の共通化と、仕様・搬送・状態の条件" scene={({phase})=><IntegrationCanvas diagram="mcp-connection-versions" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['個別の接続実装を、対応する標準へ寄せる','host・client・serverで、責任を分ける','SDKの版と、相手への仕様版を記録する','新旧の方式を、それぞれの条件で使う','不足入力へ回答し、状態を付けて再要求','搬送・認可・共有する状態を別に確認する'][stage]}</Text>
  {stage===0?<>
   <Box x={32} y={87} width={260} height={121} title="アプリA／アプリB" lines={['各接続に対応するclient','共通の接続実装を利用']} tone="violet"/>
   <Box x={348} y={87} width={260} height={121} title="サービスX／サービスY" lines={['対応するserverの入口','公開する機能を発見']} tone="teal"/>
   <Wire id={id} d="M292 147H340" active phase={phase}/>
   <Box x={64} y={252} width={512} height={112} title="共通化するのは、接続の実装" lines={['必要な接続本数がN+Mになる保証ではない','対応する仕様・搬送・機能を照合する']} tone="amber"/>
  </>:stage===1?<>
   <IntegrationThree columns={[
    ['host','Agentのアプリ','利用者の承認','接続を管理'],
    ['client','接続ごとに置く','形式と往復','仕様を扱う'],
    ['server','tools等を公開','resources','promptsも公開']
   ]}/>
   <Text y={330} small>接続の標準だけで、選択と業務の認可は決まらない</Text>
  </>:stage===2?<IntegrationPair id={id} phase={phase} arrow={false} left={['SDKの版','原文: Python 2.2.0','実装する機能と非対応','ライブラリの採用を記録']} right={['プロトコルの版','原文: 2026-07-28','相手と要求の仕様を照合','SDKの版番号とは別']}/>:stage===3?<>
   <IntegrationPair id={id} phase={phase} arrow={false} left={connection==='new'?['新方式の入口','discoverで発見','要求単位のmeta','対応機能を確認']:['旧方式の入口','initializeで開始','sessionの管理','旧clientの条件']} right={['方式を明示して照合','autoのfallbackを確認','legacyの明示と区分','APIへの接続は行わず']}/>
  </>:stage===4?<>
   <IntegrationThree columns={[
    ['不足入力','要求を受ける','回答を求める','対応を確認'],
    ['clientの回答','resolverで処理','権限を照合','封印状態を保持'],
    ['再要求','回答と状態を添付','同じ処理へ戻る','旧方式と区分']
   ]}/>
   <Text y={330} small>MRTRの往復を、旧backchannelのそのままの移植にしない</Text>
  </>:<>
   <Tokens labels={['stdio','HTTP','利用者認可']} y={94} selected={[0,1,2]}/>
   <Box x={64} y={228} width={512} height={144} title={replica.reviewCandidate?'共有条件を照合した候補':'共有する状態の不足を保持'} lines={['旧session・封印状態の鍵・通知を点検','新方式のsession不要と、別の責任','図は配置や認証を実行しない']} tone={replica.reviewCandidate?'teal':'amber'} data-mcp-replica-candidate={String(replica.reviewCandidate)} data-mcp-replica-deployed="false"/>
  </>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===3?<Select label="照合する接続方式" value={connection} onChange={setConnection} ready={ready}><option value="new">新方式の条件</option><option value="legacy">旧方式の条件</option></Select>:stage===5?<Select label="配置時の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="session">旧sessionの管理</option><option value="key">封印状態の鍵の共有</option><option value="notifications">通知の共有</option><option value="none">必要条件を照合</option></Select>:null}>{children}</IntegrationFigure>
}
const design={core:['自前のtool語彙','業務の語彙と型を作る','接続の標準と分担','モデルへ全件は提示せず'],generic:['MCPで汎用の接続','対応するserverへ接続','版と機能を照合','採用する権限を絞る'],wrapper:['wrapperで入口を絞る','必要なtoolだけを公開','認可と業務の境界','元の供給元を記録'],internal:['社内の機能を再利用','既存の能力を公開','利用者と権限を照合','再利用と信頼は別']}
export function McpToolAuthority({children}){
 const id=useId(),[choice,setChoice]=useState('wrapper'),[missing,setMissing]=useState('approval')
 const gate=mcpConnectionGate({versionCompatible:missing!=='version',transportCompatible:missing!=='transport',featureSupported:missing!=='feature',userAuthorized:missing!=='user',hostApproved:missing!=='approval'})
 return <IntegrationFigure diagram="mcp-tool-authority" title="toolの責任・検証面・供給元と、接続の認可" scene={({phase})=><IntegrationCanvas diagram="mcp-tool-authority" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['エラーの層を分け、失敗を成功にしない','mock・stdio・HTTP認可は別の確認','採用SDKの実装範囲を、原文の時点へ戻す','業務の語彙・接続・公開範囲を分担する','外部のコード・説明・結果を点検する','版・搬送・機能・利用者権限と承認を合わせる'][stage]}</Text>
  {stage===0?<IntegrationPair id={id} phase={phase} arrow={false} left={['業務のToolError','Python: is_error','wire: isError','正常な成果として渡さず']} right={['通信のMCPError','プロトコルの失敗','toolの結果とは別の層','失敗原因を保持する']}/>:stage===1?<>
   <IntegrationThree columns={[
    ['mock','実装の回帰','局所の検証','実業務へ接続せず'],
    ['stdio','別プロセス','実際の往復','HTTP認可とは別'],
    ['HTTPの認可','対象利用者','権限と認証','別途の受入確認']
   ]}/>
   <Text y={330} small>模式図はサンプル実行やHTTP認可の受入結果を作らない</Text>
  </>:stage===2?<>
   <Tokens labels={['Tasks','DPoP','JWT']} y={102} selected={[0,1,2]}/>
   <Box x={64} y={234} width={512} height={130} title="元記事で未実装の拡張を保持" lines={['原文のSDK 2.2.0と確認日へ戻る','今日の全SDKの状態へ広げない','必要な機能は採用する版で確認']} tone="amber"/>
  </>:stage===3?<Box x={64} y={100} width={512} height={206} title={design[choice][0]} lines={design[choice].slice(1)} tone="violet"/>:stage===4?<>
   <Tokens labels={['実装コード','toolの説明','返る内容']} y={96} selected={[0,1,2]}/>
   <Box x={64} y={230} width={512} height={139} title="供給元・過剰権限・結果経由の指示を点検" lines={['説明と返る内容を実行権限にしない','必要な機能と権限に絞る','更新の供給元と版を記録する']} tone="amber"/>
  </>:<Box x={64} y={104} width={512} height={206} title={gate.reviewCandidate?'接続を検討する候補':'不足条件を残して照合へ戻る'} lines={['版・搬送・機能を照合','利用者の認可とhostの承認','接続や業務の操作は実行しない']} tone={gate.reviewCandidate?'teal':'amber'} data-mcp-connection-candidate={String(gate.reviewCandidate)} data-mcp-network-connected="false"/>}
 </>}</IntegrationCanvas>} controls={({stage,ready})=>stage===3?<Select label="toolと接続の分担" value={choice} onChange={setChoice} ready={ready}><option value="core">自前のtool語彙</option><option value="generic">汎用の接続</option><option value="wrapper">wrapperで入口を絞る</option><option value="internal">社内機能の再利用</option></Select>:stage===5?<Select label="MCP接続の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="version">仕様の版</option><option value="transport">搬送方式</option><option value="feature">必要な機能</option><option value="user">利用者の権限</option><option value="approval">hostの承認</option><option value="none">必要条件を照合</option></Select>:null}>{children}</IntegrationFigure>
}
