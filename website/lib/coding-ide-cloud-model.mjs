import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const IDE_CLOUD_STAGES=Object.freeze({
 'cursor-runtime-data':rows([
  ['入口の広がり','専用IDEから、CLI・cloud・PRレビューへ操作面が広がる。','Tab・インライン編集・Agentとマルチモデルの価値を、元記事の提供表と確認時点に沿って読みます。'],
  ['実行の場所','ローカル、管理VM、自社ホストを分ける。','Cloud Agentsの環境定義とself-hostedの追加時点を保持します。自社ホストでもモデル通信のオンプレミス化を意味しません。'],
  ['索引の保存','現行の端末内索引と、旧方式・一時キャッシュ・checkoutを分ける。','2026-10-01のSearchは検索用埋め込みを保存しないと明記。検索で開いた内容の推論送信と、Data Useの一時キャッシュは別です。'],
  ['編集と復元','差分とチェックポイントで、ファイルの変更を確かめる。','Gitと独立したチェックポイントを保持します。外部API・送信等の作用をファイル復元で取り消したとは扱いません。'],
  ['実行の判断','Run Modesと、cloudの自律実行を分ける。','Auto-reviewの許可リスト・隔離または分類器、Allowlist、Run Everythingを比較します。cloudにコマンド単位の承認を足しません。']
 ]),
 'cursor-rules-security':rows([
  ['規約の優先','Team・Project・Userの優先と、階層の規約を確認する。','Team強制、MDCの4適用モード、AGENTSの深い階層を保持します。自然文の規約をアクセス拒否と同一視しません。'],
  ['機能別の設定','Bugbot・CLI・hook・社内配布を、使う機能へ対応付ける。','配置した設定と、実際の読込・発火・強制を分けて確認します。'],
  ['隔離の境界','許可・分類の判断と、OSサンドボックスを分ける。','本文のmacOS・Linux・Windows未確認と通信制約を保ちます。ベストエフォートのガードレールはハードな境界を保証しません。'],
  ['送信と学習','Privacy ModeとBYOKを変えても、backend経由の推論送信は残る。','学習不使用、通常時のZDR、安全調査・非ZDRモデルの保持例外を分けます。個人の初期値を図で確定しません。'],
  ['組織の要件','Privacy Modeの組織強制と、契約・認証条件を照合する。','SOC 2・DPA・BAA・CMEK等の公表は、個別用途の適合保証とは別です。元記事と採用時の条件を確認します。']
 ]),
 'cursor-connections-adoption':rows([
  ['接続の承認','MCPの接続とツール利用で、認証・権限を確認する。','通信方式・OAuth・projectとglobal設定を保持し、接続の出所と利用範囲を確認します。'],
  ['開始と再開','SCM接続前の開始と、監視による再開を分ける。','Origin、subscriptions、メンション・API・CLI・Automations・SDKの入口を保持します。図は監視・起動・送信を実行しません。'],
  ['枠と従量','シート・含有枠・追加従量と支出上限を分ける。','cloud・Bugbotの消費と、オンデマンドの明示的有効化を確認します。価格の現在値を生成しません。'],
  ['集中管理','組織の認証・監査・リポジトリ・モデル制御を確認する。','SSO・SCIM・MDM・Admin APIと、チーム優先のRun Modes・隔離規則を元記事の提供条件に照合します。'],
  ['移行の判断','IDEの統合体験を、移行とデータの要件へ照合する。','大規模探索・モデル選択の価値と、標準IDE・索引・キャッシュ・保持例外の制約を並べます。採用順位を作りません。']
 ]),
 'windsurf-runtime-migration':rows([
  ['名称と時点','Codeium・WindsurfからCognitionのDevinファミリーへ。','買収・改名の発表と、CascadeからDevin Localへの移行を読みます。GA宣言と実際のCascade終了は元記事でも未確認です。'],
  ['操作と委任','同じ画面から、ローカル・cloud・他社Agentを扱う。','Desktop・CLI・Plugins・cloudの提供表を保持します。ACPの他社Agentはプライバシーと課金の契約が別です。'],
  ['探索と索引','ローカル索引、共有埋め込み、実行時の探索を分ける。','Teams／Enterpriseのremote索引は埋め込み後にコード削除。Fast ContextとSWE-grep、ignoreを保ち、後の推論送信がないとは扱いません。'],
  ['差分と復元','hunkごとの承認と、Cascadeの巻戻しを区別する。','プロンプト単位の巻戻しは取り消せません。旧機構をDevin Localへ一律に適用しません。'],
  ['権限の移行','旧4段階の自動実行と、新しい規則の組合せを分ける。','CascadeのDisabled／Allowlist Only／Auto／Turboと、Devin LocalのDeny／Ask／Allow×操作スコープ×階層を同じ設定としません。']
 ]),
 'windsurf-rules-security':rows([
  ['設定の移行','推奨パスと、旧パスの互換・混在を確認する。','AGENTSのrootと下位、4適用モード、globalの規約を保持します。名称が変わっても同じ機能が永続化されるとは限りません。'],
  ['記憶の共有','CascadeのMemoriesと、Devin LocalのSkillsを分ける。','Cascadeのローカル記憶は規約へ転記して共有。元記事時点のLocalの非永続化を、現在の仕様へ固定しません。'],
  ['隔離と統制','OSのファイル隔離と通信フィルタを、組織設定へ照合する。','管理者の隔離強制、コマンド規則、MCP／ACP registry、MDM・発行者・テレメトリを元記事の条件で確認します。'],
  ['データ条件','有料opt-out、管理者の操作、ZDRの例外を分ける。','旧個人規約を引き継がず、現行契約版・プラン・個別Enterprise契約を照合します。安全・法的保持は別の条件です。'],
  ['契約の適用','更新日と適用日、プラン別の認証・管理を確認する。','本文の重大変更に関する30日条件と、SOC 2・SSO・RBACを保持します。個別契約への適用とFreeの範囲は補完しません。']
 ]),
 'windsurf-connections-adoption':rows([
  ['MCPの制御','接続・OAuth・ツールの有効化と実行前承認を確認する。','Marketplace・合計100ツール上限等は本文の確認時点の条件です。現在の上限へ固定しません。'],
  ['第三者とcloud','ACPの他社契約と、Devin cloudのCIを分ける。','同じエディタから操作しても契約と実行環境は同一ではありません。外部Agentの設定と提供者を確認します。'],
  ['プランの統合','Devinのプランと、チーム・企業の追加管理を照合する。','Desktop含有、Teamsの共有索引、Enterpriseの管理を保持します。旧creditとACUの正確な換算は未確認のままです。'],
  ['採用の条件','管制と委任の価値を、移行期の依存と鮮度へ照合する。','既存IDEのPlugins経路、ACP集約、Devinとの往復を保ち、旧仕様・Preview・設定パス・課金の混在を確認します。']
 ]),
 'devin-delegation-runtime':rows([
  ['委任の形','完了基準を付けて委任し、自律実行後にレビューする。','事前のコマンド承認はありません。3時間は目安で、成功保証ではありません。'],
  ['クリーンな環境','スナップショットやBlueprintsから、毎回クリーンなVMを起動する。','Linuxと限定Windows、対応SCM、顧客専用VPCを保ちます。Devboxの配置をモデル推論のオンプレミス化とは扱いません。'],
  ['起動と並列','独立したタスクを、別々のセッションへ分ける。','Web・チャット・Issue・PR・API・CLI・scheduleの入口を保持します。図は起動・予約・送信をしません。'],
  ['理解と介入','事前索引・DeepWiki／Askと、VM内の探索を組み合わせる。','Progress Tabで追跡し、停止してIDEを引き継げます。成果物はブランチとPRへ提出し、通常のGit手段でレビューします。'],
  ['モデルの条件','SWE系モデルの追加と、Fusionのハイブリッドを区別する。','SWE-1.7の発表は1.6の終了を意味しません。Fusionの35%→最大60%は元記事の公表条件であり、図の測定値ではありません。']
 ]),
 'devin-teaching-security':rows([
  ['教える対象','規約・ヒント・手順・環境・秘密を別の機構へ渡す。','AGENTS、Knowledgeの適用条件と提案、Playbooks、Blueprints、Secretsを区別します。知識の提案を承認済み規約とはしません。'],
  ['共有と差','APIの配布と、CLIの機能差を確認する。','Knowledge／Playbooks等の組織管理と、元記事時点のCLI未対応を保持します。Secretsの保存暗号化とモデルへのマスクは別です。'],
  ['人の介入','事前の基準、途中の停止、事後のPRを設計する。','cloudにコマンド単位の承認を足しません。必須CI・ブランチ保護・人のレビューをマージ前の境界として維持します。'],
  ['Guardrails','記録・警告・メッセージ遮断と、旧セッション終了を分ける。','2026-10-01のEnterprise設定ではkill_sessionは新規指定できず、過去の記録に残る値です。現行のblock_messageはセッションを終了しません。'],
  ['契約とデータ','セルフサーブとEnterpriseの学習条件を分ける。','有料tierのopt-out、Teams管理者、Enterpriseの書面同意とZDRの保持例外を保持します。コンプライアンスの公表も採用条件へ照合します。']
 ]),
 'devin-connections-adoption':rows([
  ['MCPの管理','管理者による追加と、企業配布・組織の上書きを分ける。','接続方式とMarketplaceを保ち、専用デプロイのprivate tunnel・OAuth・CAを全プランの機能とはしません。'],
  ['呼び出す側','MCPサーバーとしての公開と、API v3の管理を分ける。','他のAgentからのDevin呼出し、セッション・知識・秘密・監査・利用メトリクス・Enterprise管理を区別します。'],
  ['世代と提供','モデル名・モード・プランを個別に確認する。','SWE-1.7の追加時点、旧世代の継続未確認とFusion previewの条件を消しません。最新モデルの順位を生成しません。'],
  ['消費の制御','クォータ・credits・EnterpriseのACUと、停止条件を分ける。','自動スリープとReviewのPR上限、SSO・SCIM・RBAC・監査・IP・階層管理を確認します。未定義のACUを回数や金額へ換算しません。'],
  ['仕事の適性','独立性と検証可能な完了基準を、委任の単位へ合わせる。','移行・保守・定期処理等の用途を保ちます。曖昧な依頼の消費、事前承認の要件、学習の既定を採用前に確認します。']
 ])
})
export function ideCloudFrame(id,phase){
 if(!Object.hasOwn(IDE_CLOUD_STAGES,id))throw new RangeError('Unknown IDE/cloud diagram')
 const stages=IDE_CLOUD_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function cursorDataBoundary({privacy,byok}){
 if(typeof privacy!=='boolean'||typeof byok!=='boolean')throw new TypeError('Identify privacy and authentication explicitly')
 return {backendUsed:true,inferenceSent:true,trainingMayOccur:!privacy,retentionExceptions:true}
}
export function cursorRunBoundary(surface,mode){
 if(!['local','cloud'].includes(surface)||!['review','allowlist','everything'].includes(mode))throw new RangeError('Unknown Cursor execution policy')
 return {localModeApplies:surface==='local',approvalCanBeRequested:surface==='local'&&mode!=='everything',hardBoundaryGuaranteed:false}
}
export function desktopContract(agent){
 if(!['local','cloud','external'].includes(agent))throw new RangeError('Unknown Desktop agent')
 return {devinTermsApply:agent!=='external',thirdPartyBilling:agent==='external',cloudExecution:agent==='cloud'}
}
export function devinGuardrail(action){
 if(!['log','warn','block','kill_session'].includes(action))throw new RangeError('Unknown Guardrail action')
 return {recorded:true,warns:action==='warn',messageBlocked:action==='block',sessionEnded:action==='kill_session',currentlyConfigurable:action!=='kill_session',perCommandApproval:false}
}
