# 第3回総合レビューの全Issue解決

## 作業契約

- 目的: 開始時のopen Issue 43件（親#170〜175、子#176〜212）を、各完了条件・検証・main反映・必要な公開証拠を照合して解決します。
- 許可根拠: このセッションのユーザーの「GithubのIssueのすべて自律的にCloseに向けて進めてください」。修正・検証・独立レビュー・通常のPR提出とマージ・必要な公開確認・Issueの根拠付き更新を到達点とします。有料API利用・他者への連絡・履歴の書き換えは含めません。
- 開始HEAD: `f3af9b045c3703a6540b68301f6ef25dd2690d9c`。GitHubのpublicリポジトリ `pero3dev/ai-agent-library`、取得済みmainと一致、開始時既存差分・open PRなし。専用branchは `fix/all-open-issue-resolution`。
- 所有: 記事担当#176〜188、サイト担当#189〜194・202・209・210、ハーネス担当#195〜200・203・204・211。統合担当#201・205〜208・212、project索引、共通検証・manifest・GitHub操作。共有ファイルは担当間で調整します。
- 必須検証: root `npm ci` / `npm run check`、対象の単体試験、サイトの公開相当ビルド・ブラウザー・アクセシビリティ・性能確認、機械検査後の固定treeによる独立記事レビュー、Git形式・policy、PRの11必須チェック、merge SHA・main CI・必要な公開内容。
- 終了条件: 子Issueごとの成果物と証拠をmainに接続してCloseし、親は配下全件が完了した後にCloseします。未確認は成功と区別します。判断材料の作成Issueは方針採択を終了条件にしません。
- 範囲外: 他worktree、既存未公開音声制作、動的図解バックアップ、グローバルGit設定、過去公開履歴の改変。

## 判断が必要な部分

制作開示に記載する人の関与範囲（#210）、既存大型証跡の保持またはHEADからの除去（#207）、旧IssueのClose理由の訂正（#205）をユーザーへ照会しました。他の許可済み修正は並行して進めます。

2026-10-03のユーザー回答: 人は「方針決定と公開判断を担当し、記事の人による全件レビューは行っていない」。既存証跡は「保持し、パスとSHAを固定して新規追加を制限する」。README・aboutと公開記録契約へ反映します。旧Issueは「移管先がある旧Issueは理由をnot_plannedへ訂正する」と回答しました。再オープンせず状態理由を訂正し、[実API結果](old-issue-state-correction.json)を記録します。

## 実施状況

2026-10-03（日本時間）にIssue一覧と本文、main、公開範囲、既存PRを実GitHubで確認し、3担当へ所有範囲を割り当てました。後続の成果物・検証・外部状態をこの記録から追跡します。

作業は2026-10-04（日本時間）へ継続しました。記録ディレクトリの10-03は開始日です。一次資料の実取得UTC時刻を保持し、記事の実質変更の最終更新日と最終試験日は10-04として区別します。

## 先行するROADMAP読取対応

履歴ファイルを初めて追加するPRでは、trusted baseの旧policyが移動後のタスク表を解決できません。そのため4ファイルの固定パス読取対応を [PR #213](https://github.com/pero3dev/ai-agent-library/pull/213) で先行提出しました。分離worktreeで `npm ci --ignore-scripts` と `npm run check` が成功（490件中487成功・3skip）、別担当の独立コードレビューはmust/shouldなしでした。

11必須チェックと3workflowの完了・成功・head・eventを照合し、実merge `c43ec979262bd1a430ec743d6525f74803482b70` を確認しました。squashメッセージを実Git objectから再検査して形式合格、同SHAのmain [CI 37130081772](https://github.com/pero3dev/ai-agent-library/actions/runs/37130081772) はsuccessです。共有作業ツリーの編集を保持したまま4ファイルのincoming indexを照合してfast-forwardし、以後の提出baseを同merge SHAとします。この先行PRだけで#208完了とは扱いません。

同SHAのPages deployment `6828927946` は2026-10-03T14:39:48Zにsuccess、環境URLは `https://pero3dev.github.io/ai-agent-library/` でした。実装用の分離worktreeは統合後にアーカイブしました。

## 統合担当の変更と証拠

- #201・207: [保持とパスの記録](public-records-retention.md)。14テキストの275箇所を置換し、digest参照された69テキストと圧縮証拠は理由・path・SHA固定で保持。新規容量・種類・絶対パスの回帰を追加しました。
- #205: 旧Issue #92〜119の28件すべてに、現状・既存証拠・再提起先をコメントし、APIで各1コメントを確認。[コメント一覧](old-issue-close-audit.json)とユーザー判断に沿う[状態理由の訂正](old-issue-state-correction.json)を保存します。
- #206: 正本の参照先、製品中立の依頼文、11必須チェック、計画状態を同期。main `d990973` / `42dcee2` のdeployment `6823843847` / `6822376321`のsuccessと公開先URLを実APIで確認しました。過去の実施記録の検証宣言は保持します。CLAUDEを一律禁止する文字列検査は、互換入口・教材の正しい言及を誤検知するため追加せず、具体的な対象の参照をレビューします。
- #208: 約90 KBのROADMAPを現在の入口と台帳へ整理し、[履歴](../../plans/content/roadmap-history.md)の214タスクの成果物・ステータスが移動前後で同じことをMap照合で確認。旧task `2-1`の解決と台帳の解析、リンク検査を確認しました。周期表の5列とregistry markerは維持しました。
- #212: [5つの問いの判断材料と3層試算](../../plans/maintenance/2026q4-decision-memo.md)を作成。70/113/16本、14/90/365日の案と年間観測枠、現行台帳の必要量・部分観測との比較限界を記録。採択と実装は行いません。

## 最終検証の実行条件

最終統合にはbundled Node v24.19.0を使います。`.node-version`は22.22.2を指定し、engines・診断・案内は `^22.22.2 || ^24.15.0 || >=26.0.0` と整合させます。Node版指定の追加を配置契約と試験へ同期し、ルートは16ファイルです。

記事の一次資料・取得できなかった範囲は[今回の調査](../../../research/reviews/2026-10-03-article-remediation.md)に残します。[3社の部分観測](../../../research/freshness-observations/2026-10-03-issue-remediation-models.json)は実取得UTCに対応した確認済み・未確認欄を持ち、系統の完了coverageは空です。過去の5runを全16系統の完了へ換算しません。新規の週次監視は、手動dry_runで実GitHubの集計経路を検証でき、通常scheduleでは欠測・周期超過の追跡Issueを更新します。

Windowsの隔離実行ユーザーでは、既存のAudioLearning wrapperから共通Gitディレクトリを参照する試験がownership境界で失敗しました。globalのsafe.directory・署名・ACLは変更せず、同じ許可済み試験を実ユーザーの実行面で確認します。複数Git fixtureとブラウザーの同時I/Oによるタイムアウトを避けるため、root unitのファイル並列度を4に制限します。対象試験は省きません。

公開記録・配置の局所回帰11件は、版指定の追加後に成功しました。最終統合の全検査、固定treeとdigestによる記事の独立レビュー、実GitHub CI・main・公開結果は、担当の実施記録、通常記事manifest、提出PRとIssueコメントに接続します。モック・SDKローカルtransport・実ブラウザー・実GitHubを、有料APIや実クライアントの検証へ換算しません。

パス置換がMarkdownの末尾区切りを消した箇所は元blobから復元し、コード・JSON・表の区切りを尊重する回帰を追加して14件の置換後hashを再計算しました。中間directory junctionから対象外を読まない反例も追加し、局所回帰は12件すべて成功・skip0です。

独立コードレビューは、公開記録・214タスク保持・199記事の試算を `/root/harness` が確認（2026-10-03T15:34:22Z、must0）。空白を含むユーザー名の汎用置換helperには追加改善の助言があり、今回のprofile名と成果物には該当せず、新規混入の拒否検査は先頭を検出するため受入漏れはないと確認しました。今回の置換結果は元blobと台帳で照合し、汎用helperの無確認な全自動置換へ一般化しません。

ハーネスは別担当 `/root/website` が独立レビュー（2026-10-03T15:39:22Z）。public exportのvendor根拠・時刻・実観測の必須化と、全CI jobの依存導入前auditを修正後に再確認し、must0/should0でした。実製品のhook発火・実Scheduled通知まで確認した判定ではありません。

記事の独立レビューで、Cursor の端末 sandbox と製品全体の制限の混同、正当性テストと characterization の説明の矛盾、Billing URL への取得日の誤付与を修正しました。関連トピック・文法・括弧・統計の半幅・本番分布と外挿の断定も同期しました。Cursor Run Modes は再取得後の実時計 2026-10-03T16:17:23Z で記録し、元の source を更新しています。固定候補を取り直して再レビューします。

独立レビューにより AWS Haiku 行の削除と Cyber の特定後継 ID の断定も訂正しました。AWS 直接取得の対象行と公式 OpenAI の一般的移行案内を確認し、Colorado のコメント期限と審理継続時の延長を部分更新。資料の実 UTC を更新し、実停止・改訂案共有実施の未確認は維持します。自動化の古典知見、RPA の実行保証、effort とトークン上限の表現も同期しました。

最終統合の root `npm ci --ignore-scripts` と `npm run check` は終了0でした。単体523件中520成功・3skip、177.961秒。lint・215文書・リンク・199記事405前提の逆転0・TODO棚卸し・52ハーネスファイル・配置16 root files・Git設定契約は成功です。途中の検査はCI commandの同期前に不一致で終了1でしたが、同期後に全検査を取り直しました。続く記事の独立レビュー訂正後にも、validate 215 files と links 466 files / 6066 links を終了0で確認しました。

サイトコードの独立レビューは統括 `/root` が2026-10-03T16:31:28Zまでに行い、must/should0です。strict SVGのXML検証・外部通信禁止・画像表示、MDXの許可境界、CSP exact hashと音声fixtureの分離、metadataとpostbuildの予算、依存図のキー操作・同じデータの一覧、Nextra adapterの上流変更時の失敗を読みました。実ブラウザーの別証拠はサイト担当記録へ接続し、このコードレビューを実native音声や物理端末の成功とは扱いません。
