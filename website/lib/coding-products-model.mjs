import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CODING_PRODUCT_STAGES=Object.freeze({
  'claude-surfaces-runtime':rows([
    ['同じエンジン','CLIを起点に、複数の操作面から同じエンジンへ接続する。','元記事の提供表と確認時点を保持します。入口と実際にコマンドを実行する場所は別です。'],
    ['遠隔の操作','Remote Controlは手元の実行を、遠隔から操作する。','操作端末が変わっても、ローカルの処理が管理VMへ移ったとは扱いません。'],
    ['自社runner','自社のホストで実行しても、推論と制御の通信は外へ。','リポジトリと生成物の配置、runnerのOSと条件、推論・履歴・キューの管理を分けて確認します。'],
    ['調査から実行','オンデマンドの検索・LSP、編集と承認した実行をつなぐ。','大きなリポジトリでは下位規約・パス限定規則・別の探索文脈を設計します。図は検索や委譲を実行しません。'],
    ['戻せる範囲','ファイルのチェックポイントと、外部の副作用を分ける。','巻戻しは外部API・DB・送信を取り消しません。Gitと独立した機構の範囲を確認します。']
  ]),
  'claude-config-permission':rows([
    ['指示の共有','CLAUDE.mdの階層・分割と、AGENTS.mdの共有経路を確認する。','元記事のimport・リンク・トピックとパス限定規約を保持します。配置だけで読込済みとしません。'],
    ['規約と強制','行動指針の文脈と、managed settingsの強制を分ける。','自然文の禁止だけでファイル・通信のアクセス権は変わりません。'],
    ['承認の条件','モード・認証・版・組織設定による確認位置を確認する。','既定を全認証方式へ固定しません。deny・ask・allowと、承認省略を実効的な権限へ照合します。'],
    ['隔離と通信','サンドボックスの対応OS・有効化と、ネットワークの限界を確認する。','権限システムとOS隔離は別です。広いドメインの許可だけでは強い持出し防止を保証しません。'],
    ['秘密とデータ','認証情報・外部入力と、契約ごとのデータ取扱いを確認する。','ConsumerとCommercialの条件、保持・学習利用・組織の設定を、元記事の時点と採用時の資料へ照合します。']
  ]),
  'claude-integrations-adoption':rows([
    ['接続の設定','MCPの接続・OAuth・スコープと初回承認を確認する。','元記事のトランスポート表現を保持し、出所と必要権限を確認します。'],
    ['拡張とCI','フック・CI・Agent SDKで、同じループを別の環境へ組み込む。','hookで実処理が起きることと、設定を配置したことを分けて検証します。'],
    ['契約と枠','サブスクリプション・API・提供者経由の条件を分ける。','シート・枠・追加消費の構造を元記事の時点で読み、最新の額を図で生成しません。'],
    ['組織の統制','managed policy・アクセス・監査・メトリクス・上限を確認する。','危険モードの禁止や設定配布の実効性、クラウドへの適用を照合します。'],
    ['用途へ照合','端末中心の仕事と拡張・統制の要件を、OSとモデルの制約へ照合する。','本文の用途と注意点を保持し、順位や採用の推薦を生成しません。']
  ]),
  'codex-surfaces-runtime':rows([
    ['製品とモデル','古いコード生成モデルと、現行のAgent製品群を区別する。','CLI・IDE・アプリ・cloud・review・CI等の元記事の面を保持します。'],
    ['面と実行','操作の入口と、ローカル・cloud・CIの実行先を分ける。','アプリのworktreeと、クラウドの隔離コンテナは別の作業空間です。'],
    ['cloudの段階','セットアップの通信と、Agent実行の通信を分ける。','本文の2フェーズと確認時点を保持します。依存取得が可能でもAgentフェーズの通信許可を保証しません。'],
    ['調査と指示','探索と階層指示を組み合わせ、合計の読込上限を確認する。','索引方式の断定は元記事でも公式からの推測です。合計上限を一ファイルごとの上限にしません。'],
    ['差分と実行','diff・git・worktreeを使って変更を確認し、権限内で実行する。','非対話・再開・reviewの入口を保持します。専用巻戻しを補完せず、外部作用をGitだけで戻しません。']
  ]),
  'codex-config-permission':rows([
    ['設定の範囲','階層AGENTS・信頼済み設定・requirementsの範囲を確認する。','近い指示、override、合計読込上限と組織の強制を分け、拡張機構も元記事どおり保持します。'],
    ['二つの軸','ファイル・通信の境界と、いつ承認要求を出すかを分ける。','承認を要求しない設定でも、アクセスが安全になったと判定しません。'],
    ['旧設定とprofile','旧sandbox設定とpermission profileの優先・管理強制を確認する。','設定を単純に合成しません。元記事のbeta・版の時点を保持し、組織の混在設定を確認します。'],
    ['通信とproxy','通信の有効化と、ドメイン規則を強制するproxyを分ける。','proxyなしの通信にドメイン規則が強制されるとは扱いません。図は設定を変更しません。'],
    ['審査の対象','Auto-reviewは発生した承認要求の判断に働く。','許可済み操作の毎回検査や、full accessで外した境界の安全保証にしません。'],
    ['機能別の境界','ローカルコマンドの制御と、MCP・ブラウザ・cloudの制御を分ける。','OSの実装・秘密と学習利用・別製品のSecurityを区別します。個人と組織のデータ条件も採用時に確認します。']
  ]),
  'codex-integrations-adoption':rows([
    ['MCPとSDK','CLI・IDEの接続と、review・SDKの入口を区別する。','元記事のcloud MCP未確認を補完せず、設定と利用する機能の対応を確認します。'],
    ['認証とモデル','ChatGPT認証と、APIキー・カスタム提供者の設定を分ける。','提供モデル・保存設定・API互換を確認します。図に最新モデルの順位を加えません。'],
    ['退役の範囲','ChatGPT側の退役を、APIとAPIキー設定へ一律に適用しない。','元記事の対象と日付を保持し、採用時のモデルIDを確認します。'],
    ['枠と管理','契約枠とAPI従量、Local／cloudの許可と集中管理を照合する。','Analytics・Complianceとrequirementsを区別し、料金や枠の現況値を生成しません。'],
    ['用途と制約','既存契約・マルチツール規約・OSS性を、実行面の条件へ照合する。','本文の用途を保ち、cloudの接続前提・個人データ設定と未確認事項を消しません。']
  ]),
  'google-products-runtime':rows([
    ['独立した製品','CLI・Code Assist・Julesは、入口と契約の違う製品。','CLIとCode Assistの関係を保ちつつ、Julesを同じライセンスの機能差として扱いません。'],
    ['再編の経路','本文の個人向け終了と、Antigravityへの案内を読む。','確認時点の再編・Organization経路を保持します。古い無料枠を採用時の条件としません。'],
    ['実行の場所','手元のCLI／IDEと、Julesの短命VMを分ける。','GitHub PRレビューのサービスと、IDEのローカル操作は別です。preview・完了日未確認を保持します。'],
    ['理解の方式','オンデマンド探索、組織コードの適応、計画承認を分ける。','Code Assistの組織索引の提供条件と、CLIの探索・チェックポイントを保持します。'],
    ['Julesの流れ','計画を人が承認してから、VMで変更・diff・PRへ。','セットアップと環境再利用を保持します。実承認やタスクの投入は実行しません。']
  ]),
  'google-config-data':rows([
    ['ルールの違い','製品ごとのGEMINI.md／AGENTS.mdと互換設定を確認する。','同じ提供者でも名称・読込範囲は同一ではありません。同期方法を設計します。'],
    ['設定と承認','CLIのユーザー／workspace設定と、承認方式を確認する。','設定・拡張とYOLOの指定方法を元記事の時点で読み、現在の既定値へ固定しません。'],
    ['隔離の実効性','サンドボックスの選択肢と、IDEの自動承認を区別する。','OS・コンテナ・プロキシ等の方式と実効範囲を確認し、名称だけで隔離を保証しません。'],
    ['認証の経路','Code Assistのライセンス・APIキー・Vertex・Julesを分ける。','データ取扱いの根拠資料が変わります。OSSであることだけで送信先と学習利用を判定しません。'],
    ['PaidとUnpaid','Gemini APIのデータ条件は、課金設定・地域等で変わる。','請求がゼロだけでUnpaidとしません。Paidの学習利用条件と、安全・法的目的の保持を分けます。'],
    ['契約へ照合','秘密・組織データを、利用する製品と契約の条件へ照合する。','無料経路へ機密を送らず、元記事の地域例外とJulesの未確認事項を保ちます。']
  ]),
  'google-integrations-adoption':rows([
    ['MCPの対応','CLI・Code AssistのMCPと、製品ごとの未対応・未確認を分ける。','トランスポート・信頼・フィルタ・OAuthを元記事の時点で保持します。'],
    ['起動の入口','CLIのActionsと、JulesのAPI／Toolsによるタスク投入を区別する。','alpha・未確認事項を保ち、図からタスク・コメント・通知を送信しません。'],
    ['組織の経路','Code AssistとAntigravityの契約・管理条件を個別に確認する。','Editionとクォータ、Organizationの提供時点と対象顧客への展開を同一視しません。'],
    ['Julesの制約','本文のGitHub・個人向け・チーム提供の確認時点を保つ。','未確認のSSO・監査・秘密の対応を補完せず、組織の要件へ照合します。'],
    ['用途へ照合','Cloud契約・OSSの拡張・組織の提案適応を、製品別に選ぶ。','独立したルール・契約・実行場所の併用管理も評価します。図に推薦順位や最新額を作りません。']
  ])
})
export function codingProductFrame(id,phase){
  if(!Object.hasOwn(CODING_PRODUCT_STAGES,id))throw new RangeError('Unknown coding product diagram')
  const stages=CODING_PRODUCT_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
  return {...stages[stage],stage,phase:bounded}
}
export function claudeRuntimeBoundary(location){
  if(!['local','managed','self'].includes(location))throw new RangeError('Unknown Claude runtime location')
  return {executionOnOwnHost:location!=='managed',inferenceOnOwnHost:false,remoteControlMovesExecution:false}
}
export function codexCommandNetwork({network,proxy}){
  return {commandsCanConnect:network===true,domainRulesEnforced:network===true&&proxy===true,controlsOtherSurfaces:false}
}
export function geminiApiDataClass({paidService,europeanException}){
  if(typeof paidService!=='boolean'||typeof europeanException!=='boolean')throw new TypeError('Data conditions must be identified explicitly')
  const paidConditions=paidService===true||europeanException===true
  return {paidDataConditions:paidConditions,productImprovementUse:!paidConditions,noRetentionGuaranteed:false}
}
