# Git操作の規約整備

更新日: 2026-09-12(JST)

## 目的・範囲・許可

AI AgentによるGit操作の形式を統一します。対象は共通規約、commit/PRテンプレート、機械検査、既存の中断再開と定期最新化への接続です。記事本文、公開URL、個人のGit設定・認証、既存の定期タスク登録は変更しません。

ユーザーの「ルール類を徹底的に整備してください」と、セッション内のブランチ作成・commit・push・PR・マージまで自律的に行う許可に基づきます。開始時のmainは `3d6e8897436640b091d48bb5ee0e8cf74dba9b9d`、作業ツリーはclean、originは公開リポジトリ `pero3dev/ai-agent-library` です。作業ブランチは `chore/git-conventions` です。

## 作業と担当

| 工程 | 所有範囲 | 完了条件 | 状態 |
| --- | --- | --- | --- |
| G1 調査と規約 | 親担当: AGENTS、CONTRIBUTING、harnessのGit規約・テンプレート、project記録 | 現行の書式と例外を整理し、正本から参照できる | 完了 |
| G2 検査 | 実装担当: Git形式のJSON契約、共通formatter、CLI、専用試験 | 不正な件名・本文・名義・branch・PRを検出する | 完了 |
| G3 実行面への接続 | 接続担当: snapshot・評価fixture・作業context・スキル | 中断再開とCodex/Claudeの入口が共通規約に従う | 完了 |
| G4 CIと受入 | 親担当: check:harness、既存trusted-base CI、統合・独立レビュー | 9必須チェックと権限を維持し、導入後のPRで実CIを確認 | 実施中 |

## 判断

- 英語のtype/scopeと日本語要約を固定し、通常commit・PR・squash・内部snapshotを明確に区分します。
- 過去の履歴は書き換えません。既存の `automation/freshness-` prefixは定期更新policyの境界として維持します。
- Git authorやグローバル設定は変更せず、Agentの関与は明示するtrailerと実際の共同編集者で記録します。生成ツールの内部commitは実Agentの著作と混同しません。
- PR metadataはイベントJSONから読み、shellへ埋め込みません。CIはtrusted baseの検査コードで候補のGitデータだけを読みます。
- 登録済み定期タスクは共通スキルを実行時に読むため、その入口を更新します。登録用promptの変更だけで既存タスクを更新したとは扱いません。

## 検証と再開

`npm ci`、`npm run check`、Windows重点試験、offline eval、隔離Gitでのcommit/range/event検査、スキル同期と変更スキルの検査を実施します。実GitHub CI・マージ・公開照合はローカル試験と分けて記録します。原ログはcommon Git directoryの `git-conventions/` に保存します。

中断時はこの表と検証結果を更新し、所有範囲の差分・ブランチ・PRを確認して同じ作業から再開します。既存の完了記録を再実行の成功として使いません。

## 実装とレビュー

件名を `type(scope): 日本語の要約`、本文を理由・検証・影響、PRを変更内容・検証・影響と残件へ統一しました。末尾のAgentと共同編集者の整合、内部生成名義、branch、全新規commit、PR metadata、squashへの変換を同じ検査へ接続しています。7作業profileへ規約本文を渡し、共通スキルと生成されたClaude入口を同期しました。

規約担当とコード担当による独立レビューで、公開済みの不正commitを追加commitでは直せない行き止まり、隠された必須節、コード例内のAgent行の誤判定、squash時のfence破壊を修正しました。履歴を保持した代替PRと、定期runをcheckpoint・held・新runへ引き継ぐ手順も規約へ残しています。

最終 `npm run check` は304試験・skip 0で成功し、文書215件・リンク対象283ファイルを検査しました。専用16試験の独立実行、Windows重点試験111件、offline eval 242件、変更スキル3本の検査、生成同期も成功しました。Windowsの大小文字別名・hardlink経由でsquash出力が入力を壊さない回帰も含みます。規約・実装の独立レビューは必須指摘0件です。

実Gitの隔離評価準備では内部commitの書式・機械処理名義・clean状態を確認しています。実Agentの起動・実クライアントhookの再試験は今回実施していません。専用Python環境へスキル検査用のPyYAML 6.0.3を追加し、グローバル環境は変更していません。最終検査は `git-conventions/check-final.log`、Windowsは `windows.log`、offlineは `offline-eval.log`、隔離評価準備はcommon Git直下の `git-conventions-eval-acceptance.json` に保存しています。

導入PRはbaseに新検査がまだないため、ローカル検証と独立レビューで採択します。導入後に別の受入PRを作り、意図したPR title違反でtrusted-baseの必須checkが失敗し、同じheadのtitle修正で成功することを実GitHubで確認します。負例を残したままマージ予約は行いません。最終的にsquash後の実message、9必須check、main CIと公開を照合します。
