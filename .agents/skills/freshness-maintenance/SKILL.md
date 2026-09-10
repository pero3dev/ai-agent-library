---
name: freshness-maintenance
description: Codex の定期タスクから既存記事の鮮度を確認し、本文更新・独立レビュー・PR・CI・公開確認を進める。AI Agent Library の定期最新化と中断再開に使う。
---

# 記事の定期最新化

このリポジトリの最新化を ChatGPT 契約内の Codex で実行します。対象の正本は [ROADMAP](../../../ROADMAP.md)、操作契約は [運用手順](../../../freshness-automation.md)です。最初に両方を読みます。API キーや個人認証ファイルを GitHub Actions に渡しません。

## このタスクの許可範囲

ユーザーは 2026-09-10 に、定期最新化の構築と継続運用、および必要なブランチ・コミット・push・PR・マージを許可しました。対象はこのリポジトリの既存記事と関連資料です。既存の GitHub 認証を使い、コミットと squash 本文に `Co-authored-by: Codex <codex@openai.com>` を残します。公開条件を満たす通常更新に毎回の承認を求める必要はありません。

新規記事、実装・依存の更新、ワークフローやスキル自体の変更、法的・ライセンス適用判断、セキュリティ推奨の実質変更は通常の自動マージに含めません。必要なものを保留用 PR または残件に分け、独立した通常更新を続けます。保護ルール・権限・利用制限は迂回しません。

## 開始・再開

1. `git status --short --branch` と `git remote -v` を確認します。作業中の変更は引き継ぎ対象か判定し、他者の作業を消しません。
2. `git fetch origin main` の後、`node scripts/freshness-run.mjs status` を実行します。既存 PR の URL・未完了 checkpoint を先に確認します。
3. `node scripts/freshness-run.mjs prepare --mode auto` を実行します。定期プロンプトで指定された mode があればそれを使います。`weekly_focus` はモデル・coding、`rotation` は古い観測を優先します。対象未指定でユーザーへ選択を求めません。
4. `nothing_due` なら観測不要と報告して終了します。lock が生きているなら別実行と競合するため、その回は書き込まず終了します。
5. 出力された `checkpoint`・`run_id`・`attempt_id`・`base_sha`・`branch`・`targets` を使います。`resuming: true` なら同じ記録と PR を引き継ぎます。既存 PR がマージ済みなら本文編集を繰り返さず、公開確認へ進みます。
6. 新規実行では、アプリの独立 worktree で指定された `automation/freshness-<run_id>` ブランチを origin/main から作ります。再開では先に既存ブランチ・PR head・checkpoint の `snapshot_commit` を比較します。元 worktree がなく、保存した差分がまだブランチにない場合は、きれいな worktree で snapshot のコミットへ fast-forward するか、そのコミットから同名ブランチを復元します。共通祖先・他の worktree での使用を確認し、他者の変更を上書きしません。保存対象と復元方法は運用手順を参照します。
7. `base_sha` と取得済みの `origin/main` が異なる場合は、復元した作業を最新 main へ統合します。競合を解消して checkpoint の `base_sha` と evidence の `base_sha` を新しい main の SHA に合わせます。以前のレビューを無効にし、根拠・差分 digest・独立レビュー・CI を取り直します。共有 main の作業ディレクトリを切り替えたりリセットしません。

## 調査と編集

各回は 1〜3 系統です。各系統の [quarterly-maintenance](../quarterly-maintenance/SKILL.md) の調査手順を、ここで確定した対象 ID を渡して使います。対象候補全体を確認済みとせず、実際に読んだ記事・見出し・確認範囲を記録します。

- `freshness-checker` に対象記事・research 起点・注目事項を渡し、一次情報を Web で検索して本文を開かせます。価格・提供条件・仕様・予定日は実行日の資料で確認します。
- 各項目を `changed / unchanged / unverifiable / failed` に分類します。取得失敗や裏付け不足を unchanged にしません。将来の終了予定は、日付が過ぎただけでは実停止と断定しません。
- 根拠が揃う内容を既存記事へ反映します。記事の実質変更時だけ `last_updated` を実行日の日本時間の日付へ更新し、status は維持します。参考資料・research・用語集・比較表を必要な範囲で同期します。
- 調査結果の JSON は [結果スキーマ](../../../scripts/schemas/freshness-result.schema.json) に従います。`writer_run_id` に現在の実行 ID、`observations` に根拠、`changes` に evidence 自身を除く変更ファイルを過不足なく記録します。`sources.accessed_at` は実際の確認時刻を UTC の ISO 8601 形式で記録します。
- 独立レビューへ渡す本文は目安 5 記事までに分けます。同期が不可欠な変更は同じ一群として扱います。対象範囲を広げるために検証スクリプトを書き換えません。

確認不能は checkpoint の `pending` に `{id, system_id, reason, next_retry_at}` を保存します。ID は再実行でも維持します。完了した未解決項目の ID だけを `resolved_pending_ids` に入れます。対象外系統の残件を削除しません。

中断に備え、系統・記事ごとの作業が一区切りするたびに checkpoint の notes と確認範囲を追記し、`node scripts/freshness-run.mjs checkpoint --run <checkpoint> --attempt-id <prepare で取得した attempt_id>` を実行します。この処理は対象の記事・research・索引の未コミット差分もローカルの Git ref に保存します。保存した JSON を読み直してから追記します。

## 独立レビューと PR

本文の変更がなければ空 PR を作りません。確認日時だけを進めるコミットも不要です。完了範囲を checkpoint に記録し、`finish --outcome observed` で終了します。この非対話運用では、quarterly-maintenance の「変更なしの TODO 確認月更新」は実行台帳への記録で代替します。

1. `npm ci` が必要なら実行し、`npm run check` を通します。
2. 変更したファイルだけを stage し、`git write-tree` で候補の tree SHA を得ます。
3. `node scripts/freshness-policy.mjs --base <base_sha> --head <tree_sha> --branch <branch> --print-digest` で本文差分の digest を取得します。
4. **別の doc-reviewer サブエージェント**へ元記事・変更後・一次資料・digest を渡し、[レビュー指示](references/review.md)に従う独立レビューを依頼します。サブエージェントを使えない回はレビュー待ちで保留し、自分の編集を独立レビュー済みと記録しません。
5. 指摘を修正したら digest を再計算し、別実行で再レビューします。最大 2 往復で解決しなければ保留します。
6. `review` に結果と別実行 ID、`risk`、時刻、確認した digest を記録します。evidence を `research/freshness-runs/<run_id>.json` に保存し、全変更を stage して policy を再実行します。完成時刻は調査・レビュー時刻より後にします。
7. `git diff --cached --check` と stage 内容を確認してコミットします。push の直前に `node scripts/freshness-run.mjs assert-lock --run-id <run_id> --attempt-id <prepare で取得した attempt_id>`、main の SHA、既存 PR head を再確認します。
8. `gh pr list --head <branch>` で重複を避け、現在の GitHub 認証で push・PR 作成または更新します。PR 本文は一時ファイルを使い `--body-file` で渡します。対象・変更・出典・レビュー・検証・残件を簡潔に記録します。

## マージ・公開と終了

`automation/freshness-*` の PR は、独立レビューで `approved`・`risk: low`、freshness-policy と既存 CI が成功した場合だけマージします。`gh pr checks` で実際の head の結果を確認し、`gh pr merge --auto --squash --body-file <commit-body>` で必須チェックを満たすマージを予約できます。`--admin` は使いません。

予約だけで完了にせず、PR のマージ SHA と main の CI・Pages deployment を追跡します。変更ページの公開 URL と内容を確認し、checkpoint に `pr_url`・`merge_sha`・`publication` を保存します。公開失敗時は次の自動マージを止めて復旧を優先します。

PR・レビュー・CI・公開確認を次回へ継続する場合は、`node scripts/freshness-run.mjs suspend --run <checkpoint> --attempt-id <prepare で取得した attempt_id>` で差分と記録を保存して lock を解放します。run は `in_progress` のまま残り、次回同じ PR を再開します。

継続作業がない場合は `node scripts/freshness-run.mjs finish --run <checkpoint> --attempt-id <prepare で取得した attempt_id> --outcome <observed|merged|held|failed>` を実行し、状態保存と lock 解放を行います。`held` は当該 PR の自動継続を終え、残件だけを将来の観測へ渡す場合に使います。`completed_systems` は宣言した確認範囲に未確認・未処理項目がない系統だけにします。系統の全主張や実 API を検証したと解釈できる書き方は避けます。

利用上限では現在の checkpoint・差分・PR URL を保存して終了し、API キーへの切替やクレジット購入は行いません。各回の報告は、確認範囲、変更・未確認、PR、CI、公開結果、次回の残件を含めます。
