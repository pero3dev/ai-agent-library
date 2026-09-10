# 定期最新化の導入記録

確認日: 2026-09-10

## 構築状態

| 項目 | 状態 |
| --- | --- |
| ChatGPT 契約内でのローカル実行 | 採用。API キーを使わない |
| 16 系統・全 199 記事の対象対応 | 実装済み |
| 観測状態・残件・中断再開・排他 | 実装済み。21 件の回帰検証成功。未コミット差分もローカル ref に保存 |
| 独立レビューと PR 差分のチェック | 実装済み。policy 33 件の回帰検証成功 |
| main の必須チェック・マージ保護 | 設定済み。6 必須チェック、最新 main への追随、管理者にも適用、force push・削除禁止 |
| 構築 PR の CI・マージ・公開 | [PR #11](https://github.com/pero3dev/ai-agent-library/pull/11)をマージ。main の CI・Pages 公開成功 |
| アプリの定期タスク 2 件登録 | ACTIVE で登録済み。アプリが DB に取り込み、次回予定を生成したことを確認 |
| アプリのスケジューラによる起動試験 | 実行成功。独立 worktree・ChatGPT 認証・台帳・GitHub・公式資料の読取を確認 |
| 実記事更新の PR・必須 CI・自動マージ・公開 | [PR #12](https://github.com/pero3dev/ai-agent-library/pull/12)で全経路を確認。自動マージと更新本文の公開成功 |

## アプリ登録の方法と確認結果

このセッションの有効ツールには Scheduled / automation の作成・一覧・更新機能がなく、Codex CLI 0.141.0 にも管理コマンドがありません。公式資料の操作入口はアプリまたは Web の Scheduled です。[公式資料](https://learn.chatgpt.com/docs/automations)(アクセス日: 2026-09-10)

インストール済みデスクトップアプリ 26.903.8094.0 の通常処理が `automations/<id>/automation.toml` を読み込むことを確認し、[登録スクリプト](scripts/register-freshness-tasks.ps1)でこのタスク専用の設定 2 件を新規作成しました。アプリ自身が DB に登録した結果を読み取り確認しています。DB への直接書込・未公開 IPC 呼出し・認証ファイルのコピーは行っていません。このファイル形式は公開 API としての保証ではなく、当該ビルドでの実測です。

| タスク ID | 状態 | 初回登録時にアプリが算出した次回予定(JST) |
| --- | --- | --- |
| ai-agent-library-weekly-focus | ACTIVE / worktree / gpt-6-astra | 2026-09-14 07:24:14 |
| ai-agent-library-rotation | ACTIVE / worktree / gpt-6-astra | 2026-09-17 07:24:04 |

設定は月曜・木曜 07:23 で、当該アプリは 0〜119 秒の待ち時間を加えて予定を計算します。登録時の `last_run_at` は未実行でした。モデルはローカルで設定済みの gpt-6-astra を引き継ぎ、`codex login status` で ChatGPT 認証を確認しました。

## 検証結果

`npm run check` は 79 テスト、Markdown lint、215 ファイルの規約、相対リンク検証を通過しました。構築 PR の初回検査で actionlint の取得先が一度 HTTP 500 を返しましたが、失敗ジョブの再実行で成功しています。[構築 PR の CI](https://github.com/pero3dev/ai-agent-library/actions/runs/34440273250)、[main の CI・Pages 公開](https://github.com/pero3dev/ai-agent-library/actions/runs/34440493622)

### ネイティブ定期起動

試験専用タスク `ai-agent-library-acceptance-20260910` を当日 14:21 JST に設定し、アプリの通常スケジューラが 14:21:51 頃に起動しました。実行スレッドは `01a089c3-f154-7ae2-a9a7-247111b44075`、結果は 14:23:08 JST に保存され、実行状態が `PENDING_REVIEW` へ移りました。試験タスクは完了後に設定を `PAUSED` にし、翌日以降の試験起動を停止しました。

- 実行場所: `C:\Users\81906\.codex\worktrees\3da0\ai-agent-library`。起点は構築のマージ SHA `bf6b607cd679a23afb9273b79f563c5bf0b9c806`
- 成功: registry 検証、対象選定の dry-run、ChatGPT ログイン確認、GitHub リポジトリ読取、公式 Scheduled ページ本文の取得
- 証拠: Git common directory 配下の `freshness/native-smoke.json`。試験はこのファイルだけを書き込み、記事・ブランチ・PRを変更しなかったことを確認
- 補助的な `.md` URL 取得はツールの content-type 制約で失敗しましたが、指定した HTML URL の本文は取得できています

この試験はネイティブの定期起動と実行環境の確認です。週次タスクの自然な巡回を既に完了したという意味ではありません。記事の編集から公開までの経路は、次の実記事更新で別に確認しました。

### PR に対する検証と保護

PR #12 は、Codex の非対話認証・定期タスク・CI 分担について既存 2 記事と research を更新した実際の最新化です。出典・時刻・独立レビュー結果は [実行記録](research/freshness-runs/20260910t051816467z-aff02e28.json)に保存しました。初回レビューの改善提案 2 件を反映し、再レビューは `approved / low`、指摘 0 件です。

`pull_request_target` の [freshness-policy 実行](https://github.com/pero3dev/ai-agent-library/actions/runs/34441363243/job/102756902513)が base 側の検査コードを使い、2 記事・4 ファイルを検証しました。check の `head_sha` は実際の PR head `57b5c3c6f9793b84d51f936a2c09cd594f713daa` と一致し、PR の必須チェックとして認識されています。候補 PR のコードを実行するための権限追加は不要でした。

main は `lint`・`actionlint`・`docs`・`examples`・`build`・`freshness-policy` を GitHub Actions(App ID 15368)からの必須チェックとし、strict な最新 base への追随を要求します。PR 経由・線形履歴・会話解決を要求し、管理者にも保護を適用しています。GitHub 上の人の承認数は 0 とし、通常更新の独立レビューはスキルと差分記録で実施します。これは人による内容承認を取得済みという意味ではありません。

14:32:06 JST に `gh pr merge --auto --squash` を設定した時点では、build 待ちのため PR は `OPEN / BLOCKED` でした。Co-authored-by を含む squash 本文を登録し、必須検査を迂回せず完了を待つ動作を確認しました。

全必須検査の成功後、14:33:05 JST に自動マージされました。マージ SHA は `0a065114697f6f69b4267ca634c4a711e6e32027` です。[main の CI・Pages 実行](https://github.com/pero3dev/ai-agent-library/actions/runs/34441520072)を追跡し、14:35:30 JST に [Codex 実践ガイド](https://pero3dev.github.io/ai-agent-library/docs/coding-agents/openai-codex-in-practice.html)と[自動化パターン](https://pero3dev.github.io/ai-agent-library/docs/coding-agents/coding-agent-automation-patterns.html)の HTTP 200 と更新本文を確認しました。

### 文書検証の依存と取得の安定性

構築時の `npm audit` で、文書検証ツールの依存に high 3 件を検出しました。`brace-expansion` を 5.0.9、`js-yaml` を 5.2.3、`smol-toml` を 1.7.2 へ lockfile 内で更新し、監査は全重大度 0 件です。Markdown lint も成功しています。CI の lint ジョブには high 以上を検出する監査を追加し、actionlint の固定バイナリ取得には回数・時間を限定したリトライを加えました。

YAML / TOML parser は記事中の設定コメントからも到達するため、影響対象は記事を扱う CI・ローカル lint です。短時間・メモリ制限付きの子プロセスで、旧版のタイムアウトと更新後の正常終了を確認しました。[brace-expansion advisory](https://github.com/advisories/GHSA-rgw5-rvv9-x895)、[js-yaml advisory](https://github.com/advisories/GHSA-pm4m-ph32-ghv5)、[smol-toml advisory](https://github.com/advisories/GHSA-7w5x-hrqm-74c2)
