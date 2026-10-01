import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CODING_OPTIONS_STAGES=Object.freeze({
 'copilot-surfaces-flow':rows([
  ['同じ名称の別機能','補完・対話・委任・レビュー・CLIの入口を分ける。','旧coding agent・プレミアムリクエスト・学習条件の変更を、元記事の時点に沿って読みます。'],
  ['対話と委任','IDEの対話と、Actions環境での非同期委任は別の操作。','Keep／Undoとcopilot/ブランチ・PR、起動経路・preview条件を元記事の提供表へ照合します。'],
  ['評価と承認','approval assessmentと、管理者が有効にした承認を分ける。','2026-09-01時点のpreview条件です。新commitで承認は失効し、assessmentだけは承認数へ算入しません。'],
  ['探索から成果物へ','探索・差分・コマンド実行の確認位置を追う。','索引、検索、IDEの巻戻しとcloudのPRを区別します。cloud内のテストと、push後のworkflow人手ゲートも別です。'],
  ['指摘を解決','再レビューの指摘解決は、マージ承認とは別の動作。','SDK shell tools・firewall・Lite effortの解析条件を本文時点で保持し、全欠陥の検出を保証しません。']
 ]),
 'copilot-policy-boundaries':rows([
  ['指示の適用','全体・パス別・階層の指示を、提供面へ対応付ける。','個人・リポジトリ・組織の指示順位と、管理者の強制制限を同じ優先規則とは扱いません。'],
  ['提供面の制御','IDE・CLI・app・cloudで、権限と除外の範囲を分ける。','元記事のGA／previewとcloudの未確認を保持します。提供面を変えるとコンテンツ除外の扱いが変わります。'],
  ['cloudのゲート','作成ブランチ・workflow・レビュー・保護規則を分ける。','copilot/へのpush、依頼者による自己承認不可、firewallと自動検査を本文時点で示します。'],
  ['データの条件','契約予定のプランで学習設定とコード一致を確認する。','個人プランのopt-outと組織プランの契約を区別し、Blockだけでcloudの一致コード生成を防ぐとは扱いません。'],
  ['接続の範囲','GitHubのMCP設定と、組織ポリシーの適用者を照合する。','GitHub側の設定と、他社アプリへの接続を分けます。組織の制御を全接続へ一般化しません。']
 ]),
 'copilot-adoption-budget':rows([
  ['管理と課金','シート、Credits、機能・モデルの管理を分ける。','補完の扱い、PR作成者へのreview消費帰属、Enterprise優先と予算制御を本文時点に照合します。価格を算出しません。'],
  ['廃止と移行','過去の廃止と、告知された今後の期限を分ける。','10月2日・19日の元記事の予定表を保持し、Copilot上の終了を提供元APIの退役に読み替えません。'],
  ['既定の適用','機能の既定値、preview、個別設定、適用日を分ける。','元記事の10月22日適用予定と例外を保持します。告知を既に適用中とせず、保存した個別設定を勝手に変更しません。'],
  ['選択と予算申請','Autoの選択方針と、管理者が決める予算を分ける。','選択されたモデルに沿う消費と、申請・承認を別の状態で示します。申請だけで予算は増えません。'],
  ['導入判断','GitHubの開発フローと管理条件へ用途を照合する。','Issue→PR、一次レビュー、CLIの価値と、SCM・除外・データ条件の制約を並べます。採用順位を生成しません。']
 ]),
 'oss-freedom-responsibility':rows([
  ['選べるもの','コード、モデル契約、接続経路を自分で選ぶ。','BYOKと拡張の自由を、完全ローカル・データ不送信の保証とは分けて扱います。'],
  ['引き受けるもの','モデル契約・費用・権限・存続性を自分で管理する。','ソフトウェアの無料と総運用費を同一視せず、自己運用の担当を置きます。'],
  ['形態の幅','CLI・拡張・実行基盤・汎用Agentを同じ既定で扱わない。','元記事の各ツールのライセンス・主体・提供面・承認モデルを、確認時点の表に沿って読みます。最新の推奨順位は生成しません。'],
  ['状態を読む','リリース、READMEの保守方針、アーカイブ属性は別の根拠。','ClineのreleaseをGA保証とせず、Continueの非アーカイブ属性を積極保守と読み替えません。将来の存続を断定しません。']
 ]),
 'oss-evaluation-controls':rows([
  ['四つの軸','存続性、安全度、総費用、互換性を分けて評価する。','ガバナンスの変更と、ツール別の既定を継続確認します。OSSという属性から安全を判定しません。'],
  ['承認の設計','人の明示実行、都度承認、リスク選別、全自動を区別する。','元記事のスナップショットを示し、採用時の既定は一次情報で再確認します。承認設定はOS隔離とは別です。'],
  ['費用の経路','ソフトウェア、推論、運用の費用を別に見積もる。','ローカルモデルでも計算資源と運用を要します。APIと組織キーには上限・監視を置き、金額を捏造しません。'],
  ['互換と乗換え','MCP・規約・モデル接続を、実際の対応範囲へ照合する。','AiderのMCP未確認やOpenHandsの未確認を残し、記載がないことを未対応の確証とはしません。代替候補と保守負担を確認します。'],
  ['チームの境界','隔離と組織統制を、自己運用の仕組みへ具体化する。','OpenHandsの実行基盤と他のローカル利用を分け、共有設定・キー・CI・監査の管理担当を置きます。OSS単体で統制完了とはしません。']
 ]),
 'comparison-matrix-meaning':rows([
  ['凡例を読む','提供の有無と、条件付き・未確認を区別する。','○／△／—／?は品質の点数ではありません。確認日・各製品の根拠と元記事の注記を保持します。'],
  ['入口を比較','CLI・拡張・専用IDE・cloud・PR・APIを別の軸で見る。','デスクトップアプリを専用IDEとせず、Code Assist契約とCLI製品も分けます。同じ○の深さは個別記事で確認します。'],
  ['境界を比較','実行先、隔離、承認、データ条件を独立に読む。','ローカル実行やBYOKだけで学習不使用を判断しません。各社のプラン・preview・OS・保持例外と本文時点を保ちます。'],
  ['契約を絞る','必須制約を満たすか、未確認かを先に確かめる。','未確認の制約は通過扱いにしません。候補は各ツール記事と一次情報へ戻し、○の数で勝者を決めません。']
 ]),
 'comparison-contract-use':rows([
  ['機能の中身','探索・巻戻し・MCP・規約・拡張を用途へ照合する。','索引と推論送信、ファイル巻戻しと外部副作用を分けます。Codex探索の推測、Code Assistの未確認等を残します。'],
  ['契約の中身','プラン、無料枠、管理、データ経路を個別に確かめる。','同梱・無料・OSSだけで決めず、公式料金と契約予定条件へ戻ります。現在価格を生成しません。'],
  ['用途を絞る','対話・PR・並列・機密・既存IDE・SCMへ条件を合わせる。','用途表は理由と注意条件の整理です。管理、機械検証できる完了基準、移行負担などを満たす候補へ絞ります。'],
  ['試用で決める','候補の一次情報と社内試用で、最後の判断を行う。','元表の鮮度・不明条件を再確認し、成功、レビュー負担、消費を測ります。模式図を評価結果や推薦順位として扱いません。']
 ])
})
export function codingOptionsFrame(id,phase){
 if(!Object.hasOwn(CODING_OPTIONS_STAGES,id))throw new RangeError('Unknown coding options diagram')
 const stages=CODING_OPTIONS_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function copilotApproval({enabled,newCommit}){
 if(typeof enabled!=='boolean'||typeof newCommit!=='boolean')throw new TypeError('Identify approval state')
 return {assessmentCounts:false,approvalCanCount:enabled&&!newCommit,approvalInvalidated:newCommit,mergesAutomatically:false}
}
export function copilotExclusion(surface){
 if(!['app-cli','ide-agent','cloud'].includes(surface))throw new RangeError('Unknown Copilot surface')
 return {status:surface==='app-cli'?'supported':surface==='ide-agent'?'unsupported':'unconfirmed',allSurfacesProtected:false}
}
export function candidateConstraint(state){
 if(!['met','violated','unknown'].includes(state))throw new RangeError('Unknown constraint evidence')
 return {canProceedToTrial:state==='met',qualityRanked:false,needsConfirmation:state==='unknown'}
}
