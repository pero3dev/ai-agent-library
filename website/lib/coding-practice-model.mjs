import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CODING_PRACTICE_STAGES=Object.freeze({
 'claude-practice-mechanisms':rows([
  ['機構の選択','繰り返す手順、検索のノイズ、必ず行う処理を分ける。','元表の9機構は、使いどきの判断です。スキル・サブエージェント・hook・pluginを同じ機能とは扱いません。'],
  ['文脈の分岐','同じ文脈のforkと、専門作業の別Agentを分ける。','forkは同じ文脈を引き継ぎ、cacheを再利用し得ます。専門作業の別Agentでは、文脈・モデル・消費を管理します。'],
  ['規約と学習','人の規約、Agentの記憶、共有配布を分ける。','CLAUDE.mdとauto memory、試作とplugin化を別の管理として示します。記憶を承認済み規約へ自動昇格しません。'],
  ['試行と復元','不確かな変更の計画、試行、追跡範囲内の復元を選ぶ。','本文の小さなdiffの不使用基準を保ちます。rewindはbash経由の変更や外部作用の完全取消ではなく、恒久履歴はGitへ残します。'],
  ['起動と継続','descriptionで起動を選び、採用した手順は文脈へ残る。','手動専用・Claude専用設定、500行以下と補助ファイルの元記事の目安を保ちます。必要な詳細だけを適切なタイミングへ分けます。']
 ]),
 'claude-practice-context-cache':rows([
  ['削減のレバー','不要な文脈と定義を減らし、モデルと思考を作業へ合わせる。','元記事の7策とteamsの条件付き倍率を保持します。本文の過去数値を全構成の保証値へしません。'],
  ['管理する状態','clear・compact・rewind・resumeを目的に合わせる。','別の仕事、残す要点、捨てる経路、再開する名前を分けます。安定したprefixと必要な文脈の両方を管理します。'],
  ['TTLの条件','主会話と補助要求、認証と利用枠でTTLを分ける。','本文のsubscription主会話1h、API等5m、補助原則5mの確認時点と例外を保持します。読取・書込単価と利用可否は提供者で確認します。'],
  ['設定の優先','強制5m、対象の環境変数、設定、旧互換を順に照合する。','主会話とsubagentの設定名・版・experimentalの条件は本文を保ちます。旧変数を廃止済みとしません。'],
  ['失効の条件','モデル切替、effortの例外、版更新後の再開を分ける。','元記事のv2.1.260以降Fable 5.1と認証・provider・HIPAA等の条件を保持します。有効なcacheが残る前提で切替の関係を示し、現在全モデルへ一般化しません。'],
  ['計測と判断','usage・context・telemetryで、内訳と品質を照合する。','skill・agent・MCPの帰属、headlessの呼出し単位の集計を保持します。見込みの節約を実測結果として出しません。']
 ]),
 'claude-practice-automation-quality':rows([
  ['小さく自動化','headlessの構造化出力と、限定した依存を用意する。','claude -p、JSON/schema、bareの明示注入、小さな2〜3ファイルの試行からfanoutする元記事の型を追います。'],
  ['CIの三上限','反復・時間・同時実行の上限を別に指定する。','max-turnsは未指定なら無制限。例10は既定値ではありません。Secrets／OIDCとGitLab betaの提供条件も照合します。'],
  ['Routinesの境界','起動の成功、インフラの正常、タスクの成功を分ける。','research previewとself-hosted beta、外部推論、承認なし・push／networkの範囲・ZDR等の対象外を保持します。greenだけはタスク成功ではありません。'],
  ['検証できる依頼','Explore・Plan・Implement・Commitに、検証手段を置く。','難しい作業と小さな修正を区別し、主張より実行結果を渡します。再現、テスト、lint、画像等はその変更に適した手段を選びます。'],
  ['早い軌道修正','失敗経路を止め、仕様と実装、WriterとReviewerを分ける。','インタビューと新会話、正しさに影響する指摘、5つの失敗を本文の運用として追います。この図自体は別Agentやレビューを起動しません。']
 ]),
 'codex-practice-surfaces-config':rows([
  ['四つの面','探索・再現ループ・長い委任・並列の管制を分ける。','IDE・CLI・cloud・appの元記事の用途と、Local／Worktree／Cloudを保持します。worktreeの分離はOS sandboxとは別です。'],
  ['引き継ぎ','ローカルで計画し、委任の結果をdiffで仕上げる。','元記事の文脈の引継ぎと、cloud→localの結果適用を追います。図は別threadを作成・移動せず、未保存の他者変更を上書きしません。'],
  ['機構と導入順','規約、反復手順、外部能力、専門委任、定期実行を分ける。','AGENTS→skills→MCP→subagentsの元記事の順序と、面・設定別の起動根拠を保ちます。無許可の委任を図で実行しません。'],
  ['失敗を反映','繰り返す指摘を規約へ、反復する作業をskillへ寄せる。','descriptionの起動精度と実読込、hookのイベント・発火を確認します。配置だけで強制や発火を確認済みとしません。'],
  ['必要な能力だけ','担当、文脈、外部接続、消費を用途へ合わせる。','サブエージェントのノイズ分離の便益と消費を照合し、使わないMCPを外します。すべての能力を最初から有効にしません。']
 ]),
 'codex-practice-budget-context':rows([
  ['枠の構造','localとcloudの共有枠と、週次制限を分ける。','5時間・token credit・cacheの相対レートは本文時点です。未知の絶対上限・モデル別料金を生成しません。'],
  ['五つのレバー','文脈、MCP、モデル、推論量、スレッドの単位を整える。','軽量モデルの認証別退役、会話の切替とcacheの関係を保ちます。並列化の便益だけで消費が減るとしません。'],
  ['cwdと規約','ルートから開始cwdまでの経路を、実読込へ照合する。','経路外の下位規約は起動だけでは探索されません。対象cwdで起動するか明示して読み、読込結果を確認します。リンクだけで自動注入されるとはしません。'],
  ['Fastと認証','速度、ChatGPT credit、API Priorityを別の体系で見る。','本文のモデル・認証・退役日を保持します。Astraに同じ速度倍率を足さず、ChatGPTの倍率をAPI料金へ転用しません。'],
  ['残量と状態','status・dashboardで残量を確かめ、文脈を整理する。','手動／自動compactと設定を保持します。タスク単位の分離とcacheを併せて考え、実際の枠とresetを確認します。']
 ]),
 'codex-practice-automation-quality':rows([
  ['非対話の出力','進捗stderr、最終stdout、JSONL／schemaを分ける。','execのread-only既定・保存済み認証・CODEX_API_KEYの対応範囲とキー分離を保持します。未確認の終了コードを補完しません。'],
  ['CIとレビュー','Actionの権限・入力・トリガーと、レビューの観点を設計する。','drop-sudo、最終step、信頼入力、最も近いAGENTSのReview guidelines、GitHubレビュー別枠を元記事時点で追います。'],
  ['委任の入口','チャットの文脈と、Issueの条件から委任する。','Slackの文脈、Linearのトリアージを元記事の仕組みとして示します。図は他者へ送信・自動アサインしません。'],
  ['定期の場所','local／worktreeの稼働条件と、Webの資料・接続を分ける。','PCとappの起動、WebからPCフォルダーは操作不可、CLIの管理UIなしを保持します。認証別の課金と未知の利用資格を分けます。'],
  ['公開との分担','ローカルの編集と、GitHub Actionsの検証・公開を分ける。','元記事の設計例です。ChatGPT認証のlocal実行とAPI課金を混ぜず、通常threadで手順を試してからscheduleします。'],
  ['完了を定義','Goal・Context・Constraints・Done whenと検証を用意する。','計画・インタビュー・reviewと、権限を与える順序、worktreeと安定した手順を本文へ照合します。成功を自己申告だけで確定しません。']
 ]),
 'copilot-practice-functions-config':rows([
  ['機能と制御','作業フェーズと、人が制御する細かさを合わせる。','Chat・補完・edit・agent・cloud・reviewを元表で確認し、同じ承認位置を全機能へ付けません。'],
  ['委任する条件','明確な小さいIssueと、委任に向かない仕事を分ける。','リポジトリ横断・本番critical・曖昧な要件・学習目的という元記事の4条件と、CLIのplan／delegateを保持します。'],
  ['指示の対応','指示を読む提供面と、reviewのbase側を確認する。','全体／パス別／互換、prompt files／skills／custom agentsを元記事の対応へ照合します。PR内の指示変更がそのPRのreviewへ即適用されるとはしません。'],
  ['添付の違い','Spacesのrepository検索と、fileの全文注入を分ける。','大規模と常時参照の少数fileという用途を追い、投入する量と情報の必要性を確かめます。'],
  ['記憶と共有','Memoryの事実と嗜好、保持と提供面を確認する。','preview・JetBrains追加・28日の本文時点と未再確認を保ちます。記憶を永続保証や組織規約と同一視しません。']
 ]),
 'copilot-practice-budget-cache':rows([
  ['消費の構造','Creditsはtokenとモデル単価、cloud等にはActions分もある。','旧premiumの乗数を現行へ適用しません。補完／Next editの扱い、元記事の割引・cache比率を保持します。現在の額は公式で確認します。'],
  ['削減のレバー','計画と実装、会話とモデルを区切り、必要なツールだけ使う。','context衛生、instructions、setup stepsで探索と環境試行を減らします。品質を測ってモデルを合わせます。'],
  ['cacheを保つ','モデル・reasoning・tool構成・長い放置の失効を区別する。','元記事時点の条件です。新しいタスクでは会話を分けてからモデルを切り替え、比率は採用時のレートで確認します。'],
  ['付与と予算','base／flex、組織pool、4階層の残枠を分ける。','繰越なし・UTC月初とULBのhard stop、最少残枠が先に効く元記事のルールを示します。図の残枠は説明用の架空値です。'],
  ['測る系統','請求のusageと、導入効果のmetricsを混ぜずに見る。','AI usage dashboard・CSV・課金APIとusage metrics APIを分けます。個人割当ではない組織poolの管理へ戻します。']
 ]),
 'copilot-practice-automation':rows([
  ['Issueと修正依頼','問題・受入条件・対象を明確にし、review修正をまとめる。','APIのプラン／token条件、custom agent・modelの元記事の対応を保持し、未知の範囲を補完しません。'],
  ['起動と消費帰属','automationの作成者と、reviewのPR作成者を分ける。','private／internal・イベント権限と無権限起点の既定無視、ruleset・draft・effortの条件を保ちます。図は予約や起動を行いません。'],
  ['評価と承認','assessment、管理者の有効化、承認の失効を分ける。','previewの対象path・保護規則・人の承認方針と、新commitでの失効を保持します。評価だけは承認数へ算入しません。'],
  ['safe outputs','Agentic Workflowsのread-onlyと、宣言した出力を分ける。','preview、Markdownの定義、選べるengine、実行あたり上限は本文の確認時点です。素のCLI自動化へ同じ防御を一般化しません。']
 ])
})
export function codingPracticeFrame(id,phase){
 if(!Object.hasOwn(CODING_PRACTICE_STAGES,id))throw new RangeError('Unknown coding practice diagram')
 const stages=CODING_PRACTICE_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function claudeCacheChange(change,effortException){
 if(!['model','effort','rewind','upgrade-resume'].includes(change)||typeof effortException!=='boolean')throw new TypeError('Identify the change and dated effort exception')
 return {prefixCanStay:change==='rewind'||change==='effort'&&effortException,externalEffectsUndone:false,priceGuaranteed:false}
}
export function practiceScheduled({surface,auth,computer,app}){
 if(!['local','worktree','web'].includes(surface)||!['account','api'].includes(auth)||typeof computer!=='boolean'||typeof app!=='boolean')throw new TypeError('Identify execution location authentication and running state')
 return {canUsePcFolder:surface!=='web'&&computer&&app,localNeedsRunning:surface!=='web',billing:auth,unknownEligibilityResolved:false}
}
export function copilotBudgetMinimum(values){
 const keys=['user','cost','organization','enterprise']
 if(!values||Object.keys(values).length!==keys.length||keys.some(key=>!Object.hasOwn(values,key)||!Number.isFinite(values[key])||values[key]<0))throw new TypeError('Explicit nonnegative remaining budgets are required')
 const minimum=Math.min(...keys.map(key=>values[key]))
 return {minimum,firstBudgets:keys.filter(key=>values[key]===minimum),userHardStop:values.user===0,realCreditsCalculated:false}
}
