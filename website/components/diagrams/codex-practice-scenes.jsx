'use client'
import { useState } from 'react'
import { PracticeFigure,PracticeCanvas,Text,Box,Wire,Select } from './coding-practice-primitives'
import { practiceScheduled } from '../../lib/coding-practice-model.mjs'
export function CodexPracticeSurfacesConfig({children}){
 const [surface,setSurface]=useState('ide'),uses={ide:['IDE：探索','開いたfileと選択範囲','ローカルで前提を整理'],cli:['CLI：再現のループ','パスを添付し、実行と修正','小さく回して結果を確認'],cloud:['Cloud：長い委任','長時間・並列・別デバイス','結果のdiffを人が確認'],app:['App：並列の管制','Local・Worktree・Cloud','場所と担当を選ぶ']},choice=uses[surface]
 return <PracticeFigure diagram="codex-practice-surfaces-config" title="作業の面と、能力を導入する順序"
  controls={({stage,ready})=>stage===0?<Select label="作業する面" value={surface} onChange={setSurface} ready={ready}>{Object.entries(uses).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><PracticeCanvas diagram="codex-practice-surfaces-config" {...s}>{f=><>
   <Text y={35}>{['用途へ、作業する面を合わせる','計画の文脈と、実装の成果を引き継ぐ','規約から始め、必要な能力を順に加える','繰り返す失敗を、適した機構へ戻す','ノイズの分離と消費の両方を見る'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={82} width={506} height={142} title={choice[0]} lines={choice.slice(1)} tone="violet" data-practice-surface={surface}/>
    <Box x={67} y={290} width={506} height={107} title="実行場所と権限も確認" lines={['worktreeはGitの作業分離','OSの隔離や外部接続の制限とは別']} tone="teal"/>
   </>:f.stage===1?<>
    {['Local：対話で計画を固める','Cloud：文脈を引き継いで委任','Local：結果のdiffを適用して仕上げ'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={76} title={t} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M320 ${153+i*104}V${173+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>他者の未保存変更と、結果の適用先を確認する</Text>
   </>:f.stage===2?<>
    {['AGENTS：共通規約と検査','Skills：反復する手順','MCP：必要な外部能力','Subagents：専門作業の委任'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone={i===0?'teal':'violet'}/>)}
    <Text y={419} small>定期実行は、安定した手順と面・設定の起動条件へ</Text>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={166} title="何度も起こる失敗" lines={['繰り返す指摘 → AGENTS','反復する仕事 → skill','必要な処理 → hook']} tone="violet"/>
    <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={166} title="実際の適用を確かめる" lines={['descriptionで起動を試す','読んだ規約を確認','イベントと実発火を確認']} tone="teal"/>
    <Text y={357} small>配置・リンクだけで、読込や強制を確認済みとしない</Text>
   </>:<>
    <Box x={32} y={82} width={260} height={170} title="専門作業を分ける" lines={['担当と必要な文脈','別Agentのモデル・推論','主会話のノイズを減らす']} tone="violet"/>
    <Box x={348} y={82} width={260} height={170} title="消費と接続を管理" lines={['並列でも消費は増え得る','不要なMCPを外す','必要な能力から加える']} tone="amber"/>
    <Text y={357} small>本文の提供面と設定に沿って、委任の起動根拠を確認</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
export function CodexPracticeBudgetContext({children}){
 const [cwd,setCwd]=useState('root'),[auth,setAuth]=useState('account')
 return <PracticeFigure diagram="codex-practice-budget-context" title="共有枠、読込経路、認証別の費用を分ける"
  controls={({stage,ready})=>stage===2?<Select label="開始するcwd" value={cwd} onChange={setCwd} ready={ready}><option value="root">project root</option><option value="payments">services/payments</option></Select>:stage===3?<Select label="費用を読む認証" value={auth} onChange={setAuth} ready={ready}><option value="account">ChatGPT認証</option><option value="api">APIキー</option></Select>:null}
  scene={s=><PracticeCanvas diagram="codex-practice-budget-context" {...s}>{f=><>
   <Text y={35}>{['同じ共有枠と、別の制限を重ねて読む','必要な文脈と、適した実行へ絞る','開始cwdまでの経路と、実読込は対応する','速度・credit・API料金を混ぜない','実際の残量と、残す文脈を管理する'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={81} width={260} height={116} title="Localのメッセージ" tone="violet"/><Box x={348} y={81} width={260} height={116} title="Cloudのタスク" tone="violet"/>
    <Wire id={s.id} d="M162 197V236H320V270M478 197V236H320" active phase={f.phase}/><Box x={67} y={279} width={506} height={113} title="本文時点の共有5時間枠" lines={['tokenベースのcreditで消費','週次制限も別に適用']} tone="teal"/>
   </>:f.stage===1?<>
    {['入力：短い規約・必要な文脈','能力：不要なMCPを外す','実行：モデル・推論量を合わせる','会話：タスク単位で分ける'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone="violet"/>)}
    <Text y={419} small>cacheの利点と文脈の肥大化を合わせて判断する</Text>
   </>:f.stage===2?<>
    <Box x={67} y={78} width={506} height={80} title="root / AGENTS.md" tone="teal"/>
    <Wire id={s.id} d="M320 158V205" active={cwd==='payments'} phase={f.phase}/><Box x={67} y={214} width={506} height={119} title="services/payments / AGENTS.md" lines={[cwd==='payments'?'開始cwdへの経路上：読込対象':'root起動の経路外：自動探索しない','必要なら対象cwdか、明示して読み確認']} tone={cwd==='payments'?'teal':'amber'} data-lower-agents-loaded={String(cwd==='payments')}/>
    <Text y={414} small>階層の優先・サイズ上限は別。リンクだけは注入保証でない</Text>
   </>:f.stage===3?<>
    <Box x={67} y={82} width={506} height={152} title={auth==='account'?'ChatGPT：契約のcredit':'APIキー：token料金'} lines={auth==='account'?['本文時点のFast・モデル別倍率','退役済みのモデルは利用可能性と区別']:['ChatGPTのcredit倍率を適用しない','API Priorityは別の料金体系']} tone="violet" data-billing-system={auth}/>
    <Box x={67} y={290} width={506} height={105} title="モデル・認証・確認日へ照合" lines={['Astraへ同じ速度倍率を補わない','未確認の絶対上限・現在料金を作らない']} tone="amber"/>
   </>:<>
    <Box x={32} y={83} width={260} height={163} title="残量を読む" lines={['CLI：status','Web：使用量dashboard','実際の枠とreset']} tone="teal"/>
    <Box x={348} y={83} width={260} height={163} title="文脈を整える" lines={['手動・自動compact','残す要点と新タスク','cacheと用途を考える']} tone="violet"/>
    <Text y={352} small>見込みの節約と、実際に測った消費を分ける</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
export function CodexPracticeAutomationQuality({children}){
 const [surface,setSurface]=useState('local'),[auth,setAuth]=useState('account'),[running,setRunning]=useState('yes'),state=practiceScheduled({surface,auth,computer:running==='yes',app:running==='yes'})
 return <PracticeFigure diagram="codex-practice-automation-quality" title="出力、権限、稼働条件、完了条件をつなぐ"
  controls={({stage,ready})=>stage===3?<><Select label="定期タスクの実行場所" value={surface} onChange={setSurface} ready={ready}><option value="local">Local</option><option value="worktree">Worktree</option><option value="web">Web</option></Select><Select label="定期実行の認証" value={auth} onChange={setAuth} ready={ready}><option value="account">ChatGPT認証</option><option value="api">APIキー</option></Select><Select label="PCとappの稼働" value={running} onChange={setRunning} ready={ready}><option value="yes">両方起動中</option><option value="no">停止している</option></Select></>:null}
  scene={s=><PracticeCanvas diagram="codex-practice-automation-quality" {...s}>{f=><>
   <Text y={35}>{['非対話の出力と、与える権限を分ける','信頼する入力と、レビューの観点を定める','会話の文脈とIssueの条件から委任','PCの資料を使える場所と、課金を分ける','編集する場所と、公開する仕組みを分ける','完了条件に、実行できる検証を置く'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={82} width={260} height={170} title="出力の経路" lines={['進捗：stderr','最終：stdout','JSONL・schemaで構造化']} tone="violet"/>
    <Box x={348} y={82} width={260} height={170} title="権限と認証" lines={['read-onlyが既定','必要な範囲だけ書込','キーと未信頼コードを分離']} tone="amber"/>
    <Text y={351} small>保存済み認証と、CODEX_API_KEYの対応範囲は本文へ</Text>
    <Text y={401} small>未確認の終了コードを、図で成功判定へ補わない</Text>
   </>:f.stage===1?<>
    {['Action：drop-sudo・信頼入力','Trigger：信頼できる起点に制限','Review：近いAGENTSの観点'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===1?'amber':'violet'}/>)}
    <Text y={418} small>Actionの最終step、GitHubレビューの別枠を照合する</Text>
   </>:f.stage===2?<>
    <Box x={32} y={83} width={260} height={169} title="Slackのスレッド" lines={['会話の文脈を参照','再説明の手間を減らす','必要な対象を委任']} tone="violet"/>
    <Box x={348} y={83} width={260} height={169} title="Linearのトリアージ" lines={['条件に合うIssue','ルールで自動アサイン','受入条件を明確にする']} tone="teal"/>
    <Text y={354} small>連携先・権限・起動条件は、本文と運用へ照合</Text>
   </>:f.stage===3?<>
    <Box x={67} y={82} width={506} height={137} title={state.canUsePcFolder?'PCのフォルダーを使える条件':'PCフォルダーを直接操作できない'} lines={[surface==='web'?'Web：アップロード資料・接続ツール':'Local／Worktree：PCとappが必要',state.canUsePcFolder?'起動中。利用資格と制限は別に確認':'停止かWeb。実行場所を確認']} tone={state.canUsePcFolder?'teal':'amber'} data-can-use-pc-folder={String(state.canUsePcFolder)}/>
    <Box x={67} y={282} width={506} height={108} title={auth==='account'?'ChatGPTの契約枠':'PlatformのAPI料金'} lines={['認証方式で課金を分ける','CLIに管理画面なし・未知の資格は保留']} tone="violet" data-scheduled-billing={auth}/>
   </>:f.stage===4?<>
    <Box x={32} y={83} width={260} height={169} title="Localの定期タスク" lines={['一次情報の調査と編集','レビューと通常PR','通常threadで手順を試す']} tone="violet"/>
    <Wire id={s.id} d="M292 170H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={169} title="GitHub Actions" lines={['文書とビルドの検証','マージ後に公開','モデルAPIキーとは別']} tone="teal"/>
    <Text y={358} small>元記事の設計例。公開・マージ条件は運用に従う</Text>
   </>:<>
    {['Goal：達成したいこと','Context：必要な前提','Constraints：守る境界','Done when：検証できる条件'].map((t,i)=><Box key={t} x={67} y={76+i*81} width={506} height={62} title={t} tone={i===3?'teal':'violet'}/>)}
    <Text y={419} small>計画・test・lint・reviewを、作業と権限へ合わせる</Text>
   </>}
  </>}</PracticeCanvas>}>{children}</PracticeFigure>
}
