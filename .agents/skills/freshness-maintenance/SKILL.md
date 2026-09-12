---
name: freshness-maintenance
description: Codex の定期タスクから既存記事の鮮度を確認し、本文更新・独立レビュー・PR・CI・公開確認を進める。AI Agent Library の定期最新化と中断再開に使う。
---

# 記事の定期最新化

このリポジトリの最新化を ChatGPT 契約内の Codex で実行します。最初に対象の正本 [ROADMAP](../../../ROADMAP.md)、[運用手順](../../../freshness-automation.md)、[Git 操作規約](../../../harness/git-rules.md)を読みます。ブランチ・コミット・PR・squash の形式と検証は Git 操作規約に従います。API キーや個人認証ファイルを GitHub Actions に渡しません。

## このタスクの許可範囲

ユーザーは 2026-09-10 に、定期最新化の構築と継続運用、および必要なブランチ・コミット・push・PR・マージを許可しました。対象はこのリポジトリの既存記事と関連資料です。既存の GitHub 認証を使い、コミットと squash 本文に `Co-authored-by: Codex <codex@openai.com>` を残します。公開条件を満たす通常更新に毎回の承認を求める必要はありません。

新規記事、実装・依存の更新、ワークフローやスキル自体の変更、法的・ライセンス適用判断、セキュリティ推奨の実質変更は通常の自動マージに含めません。必要なものを保留用 PR または残件に分け、独立した通常更新を続けます。保護ルール・権限・利用制限は迂回しません。

## 開始・再開

1. `git status --short --branch` と `git remote -v` を確認します。作業中の変更は引き継ぎ対象か判定し、他者の作業を消しません。
2. `git fetch origin main` の後、`node scripts/freshness-run.mjs status` を実行します。既存 PR の URL・未完了 checkpoint を先に確認します。
3. `node scripts/freshness-run.mjs prepare --mode auto` を実行します。定期プロンプトで指定された mode があればそれを使います。`weekly_focus` はモデル・coding、`rotation` は古い観測を優先します。対象未指定でユーザーへ選択を求めません。
4. `nothing_due` なら観測不要と報告して終了します。lock が生きているなら別実行と競合するため、その回は書き込まず終了します。
5. 出力された `checkpoint`・`run_id`・`attempt_id`・`base_sha`・`branch`・`targets` を使います。`resuming: true` なら同じ記録と PR を引き継ぎます。既存 PR がマージ済みなら本文編集を繰り返さず、公開確認へ進みます。
6. 新規実行では、アプリの独立 worktree で指定された `automation/freshness-<run_id>` ブランチを origin/main から作ります。再開では先に既存ブランチ・PR head・checkpoint の `snapshot_commit` を比較します。元 worktree がなく、保存した差分がまだブランチにない場合は、きれいな worktree で `git merge --ff-only --no-overwrite-ignore <snapshot_commit>` を使うか、そのコミットから同名ブランチを復元します。無視対象ファイルとの衝突も上書きせず停止します。共通祖先・他の worktree での使用を確認し、他者の変更を上書きしません。保存対象と復元方法は運用手順を参照します。
7. `base_sha` と取得済みの `origin/main` が異なる場合は、復元した作業を最新 main へ統合します。競合を解消して checkpoint の `base_sha` と evidence の `base_sha` を新しい main の SHA に合わせます。以前のレビューを無効にし、根拠・差分 digest・独立レビュー・CI を取り直します。共有 main の作業ディレクトリを切り替えたりリセットしません。

## 調査と編集

各回は 1〜3 系統です。各系統の [quarterly-maintenance](../quarterly-maintenance/SKILL.md) の調査手順を、ここで確定した対象 ID を渡して使います。対象候補全体を確認済みとせず、実際に読んだ記事・見出し・確認範囲を記録します。

- `freshness-checker` に対象記事・research 起点・注目事項を渡し、一次情報を Web で検索して本文を開かせます。価格・提供条件・仕様・予定日は実行日の資料で確認します。
- 各項目を `changed / unchanged / unverifiable / failed` に分類します。取得失敗や裏付け不足を unchanged にしません。将来の終了予定は、日付が過ぎただけでは実停止と断定しません。
- 根拠が揃う内容を既存記事へ反映します。記事の実質変更時だけ `last_updated` を実行日の日本時間の日付へ更新し、status は維持します。参考資料・research・用語集・比較表を必要な範囲で同期します。
- 調査結果の JSON は [結果スキーマ](../../../scripts/schemas/freshness-result.schema.json) の `schema_version: 2` に従います。`writer_run_id` に現在の実行 ID、`observations` に根拠、`changes` に evidence 自身を除く変更ファイルを過不足なく記録します。`sources.accessed_at` は実際の確認時刻を UTC の ISO 8601 形式で記録し、レビュー以前の取得であることを確認します。実取得時刻を得られない場合は再取得し、日付から時刻を補完しません。
- 独立レビューへ渡す本文は目安 5 記事までに分けます。同期が不可欠な変更は同じ一群として扱います。対象範囲を広げるために検証スクリプトを書き換えません。

確認不能は checkpoint の `pending` に `{id, system_id, reason, next_retry_at}` を保存します。ID は再実行でも維持します。完了した未解決項目の ID だけを `resolved_pending_ids` に入れます。対象外系統の残件を削除しません。

中断に備え、系統・記事ごとの作業が一区切りするたびに checkpoint の notes と確認範囲を追記し、`node scripts/freshness-run.mjs checkpoint --run <checkpoint> --attempt-id <prepare で取得した attempt_id>` を実行します。この処理は対象の記事・research・索引の未コミット差分もローカルの Git ref に保存します。保存した JSON を読み直してから追記します。

## 独立レビューと PR

本文の変更がなければ空 PR を作りません。確認日時だけを進めるコミットも不要です。完了範囲を checkpoint に記録し、`finish --outcome observed` で終了します。この非対話運用では、quarterly-maintenance の「変更なしの TODO 確認月更新」は実行台帳への記録で代替します。

1. `npm ci` が必要なら実行し、`npm run check` を通します。
2. 本文と根拠・変更分類を確定し、evidence を `research/freshness-runs/<run_id>.json` に保存します。レビュー前は暫定の `review: {"verdict":"changes_requested"}` とし、未取得のレビュアー ID・時刻を作りません。この段階は完全な結果スキーマを満たす必要がなく、`--print-digest` のみを実行できます。変更したファイルと evidence を stage し、`git write-tree` で候補の tree SHA を得ます。
3. `node scripts/freshness-policy.mjs --base <base_sha> --head <tree_sha> --branch <branch> --print-digest` で本文差分と正規化した根拠の digest を取得します。レビュー結果自身と開始・完了時刻は digest に含みません。
4. **別の doc-reviewer サブエージェント**へリポジトリ、base SHA、候補 tree SHA、branch、evidence path、変更パス、digest を渡し、[レビュー指示](references/review.md)に従う独立レビューを依頼します。レビュアーは `git show <SHA>:<path>` で不変の本文・manifest を読み、digest を自分で再計算して一致を確認します。作業ディレクトリの未 stage 本文で代替しません。サブエージェントを使えない回はレビュー待ちで保留し、自分の編集を独立レビュー済みと記録しません。
5. 本文・根拠・変更分類を修正したら stage と digest 計算をやり直し、別実行で再レビューします。最大 2 往復で解決しなければ保留します。
6. `review` に結果と別実行 ID、`risk`、時刻、確認した digest を記録します。完成時刻を調査・レビュー時刻より後にして evidence を保存し、全変更を stage します。**`git write-tree` をもう一度実行して最終候補の tree SHA を取得**し、その SHA を `--head` に渡して policy を再実行します。レビュー前の tree SHA を使い回しません。
7. `git diff --cached --check` と stage 内容を確認します。Git 操作規約のコミットテンプレートを一時ファイルに記入し、`node scripts/check-git-conventions.mjs --message-file <message-file> --agent codex` を通して `git commit -F <message-file>` でコミットします。checkpoint 復元で含まれた未公開の旧形式コミットは運用手順に従って整え、公開済み履歴は書き換えません。
8. `gh pr list --head <branch>` で重複を避け、PR テンプレートに対象・変更・出典・レビュー・検証・残件を記録します。予定する title・body・branch を JSON ファイルに保存し、`node scripts/check-git-conventions.mjs --base <base_sha> --head <head_sha> --pr-file <pr-json>` で提出する全コミットと PR を確認します。push の直前に `node scripts/freshness-run.mjs assert-lock --run-id <run_id> --attempt-id <prepare で取得した attempt_id>`、main の SHA、既存 PR head を再確認します。現在の GitHub 認証で push・PR 作成または更新し、本文は `--body-file` で渡します。実際の PR 情報も Git 操作規約のコマンドで再取得・検証します。

## マージ・公開と終了

`automation/freshness-*` の PR は、独立レビューで `approved`・`risk: low`、freshness-policy と既存 CI が成功した場合だけマージします。`gh pr checks` で実際の head の結果を確認し、最新の PR 情報を JSON へ再取得します。`node scripts/check-git-conventions.mjs --squash-file <pr-json> --body-file <commit-body>` で squash 本文と件名を生成し、出力された件名を明示して `gh pr merge <pr-url> --auto --squash --match-head-commit <head_sha> --subject <生成した件名> --body-file <commit-body>` を実行します。GitHub の自動生成本文に任せず、最終の共同編集者表記も保ちます。`--admin` は使いません。

予約だけで完了にせず、PR のマージ SHA と main の CI・Pages deployment を追跡します。checkpoint に `pr_url`、レビュー・CI対象の40桁の `head_sha`、変更ページの `publication_urls` を保存します。本文を更新したページは `{url, includes}`(公開本文の必須文字列)で指定します。URL文字列だけの確認はHTTP到達性のみであり、本文の反映確認と区別します。`finish --outcome merged` はGitHubを再取得し、PR head・必須チェックのApp/workflow/event・merge SHA・deployment・指定した公開URLを照合します。保存済みの成功フラグだけでは完了しません。後続mainが公開済みなら元の公開成功と現在の配信を区別します。公開失敗時は復旧を優先します。

PR・レビュー・CI・公開確認を次回へ継続する場合は、`node scripts/freshness-run.mjs suspend --run <checkpoint> --attempt-id <prepare で取得した attempt_id> --wait-until <次回照合UTC時刻> --wait-reason <待機理由>` で差分と記録を保存して lock を解放します。run は `in_progress` のまま待ち行列に残り、期限到来後に同じ PR を再開します。待機中は別の実行可能な仕事を選べます。判断待ちは checkpoint の `queue_state: needs_decision` として記録します。

継続作業がない場合は `node scripts/freshness-run.mjs finish --run <checkpoint> --attempt-id <prepare で取得した attempt_id> --outcome <observed|merged|held|failed>` を実行し、状態保存と lock 解放を行います。`held` は当該 PR の自動継続を終え、残件だけを将来の観測へ渡す場合に使います。`completed_systems` は宣言した確認範囲に未確認・未処理項目がない系統だけにします。系統の全主張や実 API を検証したと解釈できる書き方は避けます。

利用上限では `suspend --usage-limit` と開始時のrun/attemptで checkpoint・差分・PR URL を保存して終了し、API キーへの切替やクレジット購入は行いません。時間上限の保存余裕に達した場合も新しい調査を始めず保存します。各回の報告は、確認範囲、変更・未確認、PR、CI、公開結果、次回の残件を含めます。
