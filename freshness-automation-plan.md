# 記事最新化の構築方針と実装状況

更新日: 2026-09-10

## 採用した構成

ユーザーの指定により、**ChatGPT 契約内の Codex 定期タスク + GitHub Actions** で構築します。実装・登録内容・復旧手順の正本は [運用手順](freshness-automation.md)、実測結果と残件は [導入記録](freshness-automation-setup.md)です。

- 月曜 07:23 JST: モデル・コーディングと直近期日の 1〜3 系統。
- 木曜 07:23 JST: 観測が古い 1〜3 系統。全 16 系統の 6 週間以内の巡回を目標とします。
- Codex はローカルの独立 worktree で一次情報を確認し、本文・関連資料を修正します。
- 別の doc-reviewer 実行が内容と根拠をレビューし、差分に結び付いた結果を残します。
- ローカルの既存 GitHub 認証で PR を作成し、Actions が許可差分・証拠の形式・既存 CI を検証します。
- 必須チェックを満たしてマージし、main CI と Pages 公開を確認します。

API キーや GitHub App 秘密鍵を Actions に渡す構成は採用しません。ChatGPT 認証のローカル実行は契約枠を使います。[公式認証仕様](https://learn.chatgpt.com/docs/auth)(アクセス日: 2026-09-10)

## 実装するもの

| 項目 | 実装先 |
| --- | --- |
| 系統・対象の正本 | ROADMAP の定期メンテナンス表 |
| 対象選定と網羅検証 | scripts/freshness-registry.mjs |
| 観測台帳・中断復元・排他 | scripts/freshness-run.mjs |
| 自動更新の差分・根拠・レビュー記録の検査 | scripts/freshness-policy.mjs |
| 信頼する main 側の差分検査 workflow | .github/workflows/freshness-policy.yml |
| 非対話実行の手順 | .agents/skills/freshness-maintenance/SKILL.md |
| 定期タスク 2 件のプロンプト | automation/freshness-weekly-focus.txt / freshness-rotation.txt |

過去の監査・実装台帳は履歴として保持します。本文の変更日と観測日、観測完了と公開成功を分けます。確認不能や利用制限では、確認済み項目と残件を保存して再開します。変更なしの回は PR を作りません。

## 導入順と受入条件

1. 全記事の対象対応、公平な巡回、残件と中断復元を回帰テストで確認します。
2. 構築 PR で文書・スクリプト・workflow・サイトの既存 CI を通します。
3. main に導入後、実際の自動更新用 PR で freshness-policy と PR head の対応を確認します。
4. main の必須チェックと自動マージを設定し、マージから Pages 公開まで確認します。
5. アプリに定期タスク 2 件を登録し、設定・次回日時・実行を確認します。

ローカル定期タスクには実行時の PC とアプリの起動が必要です。契約枠の消費と実行時間を初期の実行から測り、対象数と周期を調整します。[定期タスク](https://learn.chatgpt.com/docs/automations)、[利用上限](https://learn.chatgpt.com/docs/pricing)(アクセス日: 2026-09-10)

新規記事や実装・依存変更、判断が必要な事項を通常の自動更新へ混ぜません。証拠の真偽や独立レビューの実施そのものを CI が証明すると扱わず、実行記録と一次資料で追跡します。定期起動・実 API・実機など未実施の検証を完了として記録しません。
