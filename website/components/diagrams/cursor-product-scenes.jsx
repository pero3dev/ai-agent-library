'use client'
import { useState } from 'react'
import { IdeFigure,IdeCanvas,Text,Box,Wire,Select } from './coding-ide-cloud-primitives'
import { cursorDataBoundary,cursorRunBoundary } from '../../lib/coding-ide-cloud-model.mjs'
export function CursorRuntimeData({children}){
 const [runtime,setRuntime]=useState('self'),[index,setIndex]=useState('current'),[surface,setSurface]=useState('local'),[mode,setMode]=useState('review')
 const boundary=cursorRunBoundary(surface,mode)
 return <IdeFigure diagram="cursor-runtime-data" title="入口、索引の保存、実行の判断を追う"
  controls={({stage,ready})=>stage===1?<Select label="ツールの実行先" value={runtime} onChange={setRuntime} ready={ready}><option value="local">手元のIDE・CLI</option><option value="managed">Cursor管理VM</option><option value="self">self-hosted machines</option></Select>:stage===2?<Select label="検索方式の時点" value={index} onChange={setIndex} ready={ready}><option value="current">2026-10-01：Instant Grep</option><option value="old">2026-08：サーバー埋め込み</option></Select>:stage===4?<><Select label="実行する面" value={surface} onChange={setSurface} ready={ready}><option value="local">ローカル</option><option value="cloud">Cloud Agents</option></Select><Select label="ローカルのRun Mode" value={mode} onChange={setMode} ready={ready}><option value="review">Auto-review</option><option value="allowlist">Allowlist</option><option value="everything">Run Everything</option></Select></>:null}
  scene={s=><IdeCanvas diagram="cursor-runtime-data" {...s}>{f=><>
   <Text y={35}>{['専用IDEを中核に、操作面とモデルが広がる','コードを実行する場所と、推論の場所を分ける','索引の方式が変わっても、推論の送信は別','差分の承認と、戻せる範囲を確認する','ローカルのRun Modesを、cloudへ当てはめない'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={95} y={75} width={450} height={90} title="専用IDE：補完・編集・Agent" lines={['複数のモデルを選ぶ']} tone="violet"/>
    {['CLI・CI','Cloud Agents','Bugbot・SDK'].map((t,i)=><g key={t}><Wire id={s.id} d={`M320 165V213H${123+i*197}V252`} active phase={f.phase}/><Box x={32+i*197} y={260} width={182} height={99} title={t} tone={i===1?'teal':'violet'}/></g>)}
    <Text y={409} small>元記事の面と、機能別の提供条件を確認</Text>
   </>:f.stage===1?<>
    <Box x={97} y={77} width={446} height={81} title="IDE・Web・モバイル等で操作" tone="violet"/>
    <Wire id={s.id} d="M320 158V191H162V225" active phase={f.phase}/>
    <Box x={32} y={233} width={260} height={124} title={{local:'手元で実行',managed:'管理VMで実行',self:'自社ホストで実行'}[runtime]} lines={[runtime==='managed'?'環境定義・隔離VM':runtime==='self'?'My Machines・pool':'ローカルの作業環境']} tone="teal" data-cursor-execution={runtime}/>
    <Wire id={s.id} d="M292 295H340" active phase={f.phase}/><Box x={348} y={233} width={260} height={124} title="外部の推論" lines={['モデルへ内容を送信','自社実行でも別の場所']} tone="amber" data-inference-on-premise="false"/>
    <Text y={414} small>ツール実行の配置だけで、外部送信をなくしたとはしない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={72} width={260} height={127} title={index==='current'?'端末内の索引':'旧方式のサーバー索引'} lines={index==='current'?['検索用埋め込みは保存せず','コード・パスを索引送信せず']:['埋め込み・ハッシュ・パス','処理中の平文は恒久保存せず']} tone="teal" data-index-server={String(index==='old')}/>
    <Wire id={s.id} d="M292 135H340" active phase={f.phase}/><Box x={348} y={72} width={260} height={127} title="開いた内容の推論" lines={['索引の保存とは別','要求へ内容を含め得る']} tone="violet" data-inference-sent="true"/>
    <Box x={32} y={263} width={260} height={127} title="暗号化一時キャッシュ" lines={['サーバーで一時保存','鍵は要求の間のみ']} tone="amber"/>
    <Box x={348} y={263} width={260} height={127} title="Cloud Agents" lines={['作業用チェックアウト','索引とは別の保存']} tone="amber"/>
    <Text y={425} small>ignoreによる対象選択と、全操作のアクセス制御は別</Text>
   </>:f.stage===3?<>
    {['複数ファイルを変更','diffで確認','チェックポイントへ復元'].map((t,i)=><g key={t}><Box x={32} y={72+i*100} width={260} height={70} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M162 ${142+i*100}V${164+i*100}`} active phase={f.phase}/>}</g>)}
    <Box x={348} y={155} width={260} height={151} title="外部API・送信・DB" lines={['ファイル復元の対象外','別の復旧手順が必要']} tone="amber" data-rewind-external="false"/><Text y={415} small>チェックポイントはGitと独立した機構</Text>
   </>:<>
    <Box x={83} y={77} width={474} height={88} title={surface==='cloud'?'Cloud Agentsの自律実行':{review:'Auto-review',allowlist:'Allowlist',everything:'Run Everything'}[mode]} lines={[surface==='cloud'?'ローカルのRun Modeは適用しない':mode==='review'?'許可リストは即実行。その他は隔離または分類':'設定の適用範囲と実効性を確認']} tone="violet" data-local-mode-applies={String(boundary.localModeApplies)}/>
    <Wire id={s.id} d="M320 165V215" active phase={f.phase}/>
    <Box x={83} y={223} width={474} height={115} title={surface==='cloud'?'コマンド単位の承認なし':mode==='everything'?'全自動で実行':mode==='allowlist'?'許可リスト外は確認':'隔離可能なら隔離、その他は分類判断'} lines={[surface==='cloud'?'成果物のCI・レビューを設計':'分類器・許可リストだけで強い境界を保証しない']} tone="amber" data-approval-possible={String(boundary.approvalCanBeRequested)} data-hard-boundary="false"/>
    <Text y={401} small>{surface==='cloud'?'実行環境の条件と、マージ前の責任を確認':'OS隔離は別の設定。読み取り・検索と状態変更を区別'}</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function CursorRulesSecurity({children}){
 const [privacy,setPrivacy]=useState('on'),[byok,setByok]=useState('yes'),boundary=cursorDataBoundary({privacy:privacy==='on',byok:byok==='yes'})
 return <IdeFigure diagram="cursor-rules-security" title="規約の優先と、隔離・データ条件を分ける"
  controls={({stage,ready})=>stage===3?<><Select label="Privacy Mode" value={privacy} onChange={setPrivacy} ready={ready}><option value="on">有効</option><option value="off">無効</option></Select><Select label="APIキーの経路" value={byok} onChange={setByok} ready={ready}><option value="yes">BYOK</option><option value="no">通常の認証経路</option></Select></>:null}
  scene={s=><IdeCanvas diagram="cursor-rules-security" {...s}>{f=><>
   <Text y={35}>{['Teamを優先し、階層と適用モードを確認','機能ごとの設定を、実際の動作へ対応付ける','判断の仕組みと、OSで隔離する層を分ける','PrivacyとBYOKは、送信経路を消さない','公表された認証と、採用条件の適合を照合'][f.stage]}</Text>
   {f.stage===0?<>
    {['Team Rules','Project Rules','User Rules'].map((t,i)=><g key={t}><Box x={32} y={78+i*100} width={260} height={72} title={t} tone={i===0?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M162 ${150+i*100}V${170+i*100}`} active phase={f.phase}/>}</g>)}
    <Box x={348} y={122} width={260} height={181} title="プロジェクトの規約" lines={['MDCの4適用モード','AGENTSの深い階層','自然文と権限は別']} tone="violet"/>
    <Text y={410} small>Teamの強制と、下位規約の適用を両方確認</Text>
   </>:f.stage===1?<>
    {['Bugbot：BUGBOT.md','CLI：設定・権限','hook：観測・制御','社内配布：規約・Skills'].map((t,i)=><Box key={t} x={67} y={73+i*80} width={506} height={63} title={t} tone={i===2?'amber':'violet'}/>)}
    <Text y={420} small>配置だけで、読込・発火・ブロックを検証済みにしない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={93} width={260} height={135} title="許可・分類・規約" lines={['ベストエフォート','強い境界の保証なし']} tone="amber" data-guardrail-hard-boundary="false"/>
    <Box x={348} y={93} width={260} height={135} title="OSサンドボックス" lines={['macOS／Linuxの方式','Windowsは本文で未確認']} tone="teal"/>
    <Box x={72} y={294} width={496} height={90} title="書込範囲・保護ファイル・通信条件" lines={['設定と対応OSによる実効性を確認']} tone="violet"/>
   </>:f.stage===3?<>
    <Box x={32} y={76} width={260} height={80} title="端末からの要求" lines={[byok==='yes'?'自分のAPIキーを利用':'通常の認証を利用']} tone="violet"/>
    <Wire id={s.id} d="M292 116H340" active phase={f.phase}/><Box x={348} y={76} width={260} height={80} title="Cursor backend" lines={['最終promptを組み立てる']} tone="amber" data-backend-used={String(boundary.backendUsed)}/>
    <Wire id={s.id} d="M478 156V211H320V244" active phase={f.phase}/>
    <Box x={79} y={252} width={482} height={130} title={privacy==='on'?'Privacy Mode有効：Cursorの学習に不使用':'Privacy Mode無効：学習・改善に利用し得る'} lines={['推論送信はあり。学習と保持の条件を別に確認','通常のZDRと、安全調査・非ZDRモデルの例外']} tone={privacy==='on'?'teal':'amber'} data-training-may-occur={String(boundary.trainingMayOccur)} data-inference-sent="true" data-retention-exceptions="true"/>
    <Text y={419} small>個人の新規初期値と、モデルごとの保持は本文でも未確認</Text>
   </>:<>
    <Box x={74} y={81} width={492} height={100} title="組織がPrivacy Modeを強制" lines={['無効化の禁止・モデルの利用条件']} tone="teal"/>
    <Wire id={s.id} d="M320 181V234" active phase={f.phase}/><Box x={74} y={242} width={492} height={117} title="DPA・BAA・CMEK等の条件" lines={['提供プラン・契約・用途への照合','認証の公表だけで用途の適合を保証しない']} tone="violet"/>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
export function CursorConnectionsAdoption({children}){
 return <IdeFigure diagram="cursor-connections-adoption" title="接続の承認から、監視・支出・組織管理へ"
  scene={s=><IdeCanvas diagram="cursor-connections-adoption" {...s}>{f=><>
   <Text y={35}>{['接続の承認と、ツールを使う承認を分ける','起動・再開の条件と、終了・レビューを対にする','契約枠と追加消費、上限を確認する','組織の設定が、個人の設定に優先する','統合体験と、移行・送信の制約を並べる'][f.stage]}</Text>
   {f.stage===0?<>
    {['設定：project／global','接続：出所・OAuth・権限','ツール利用：承認して呼ぶ'].map((t,i)=><g key={t}><Box x={75} y={77+i*104} width={490} height={72} title={t} tone={i===1?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${149+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={417} small>stdio・SSE・HTTPは通信形式。安全の判定とは別</Text>
   </>:f.stage===1?<>
    <Box x={32} y={78} width={260} height={123} title="開始の入口" lines={['OriginはSCM接続前も可','メンション・API・CLI']} tone="violet"/>
    <Box x={348} y={78} width={260} height={123} title="監視から再開" lines={['PR・Slack・schedule','subscriptions・自動化']} tone="amber"/>
    <Wire id={s.id} d="M162 201V244H320V274" active phase={f.phase}/><Wire id={s.id} d="M478 201V244H320" active phase={f.phase}/>
    <Box x={83} y={282} width={474} height={102} title="終了条件・CI・人のレビュー" lines={['SDKで組み込む場合も責任を設計']} tone="teal"/>
   </>:f.stage===2?<>
    {['シート＋含有利用枠','超過の従量を明示的に有効化','支出上限と、cloud・Bugbotの消費'].map((t,i)=><g key={t}><Box x={67} y={78+i*107} width={506} height={77} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${155+i*107}V${177+i*107}`} active phase={f.phase}/>}</g>)}
   </>:f.stage===3?<>
    <Box x={75} y={75} width={490} height={98} title="組織の認証・監査・アクセス" lines={['SSO・SCIM・MDM・Admin API']} tone="violet"/>
    <Wire id={s.id} d="M320 173V219" active phase={f.phase}/><Box x={75} y={227} width={490} height={125} title="チーム設定を優先して配布" lines={['Run Modes・隔離・リポジトリ・モデル','各機能の提供プランと実効性を確認']} tone="teal"/>
   </>:<>
    <Box x={32} y={105} width={260} height={176} title="得たい体験" lines={['補完・編集・Agentの統合','複数モデル・大規模探索','段階的な委任']} tone="teal"/>
    <Box x={348} y={105} width={260} height={176} title="照合する条件" lines={['専用IDEへの移行','推論送信・cache・checkout','保持例外と組織ポリシー']} tone="amber"/>
    <Text y={363} small>機能の価値と、標準IDE・データ要件を一緒に評価</Text>
   </>}
  </>}</IdeCanvas>}>{children}</IdeFigure>
}
