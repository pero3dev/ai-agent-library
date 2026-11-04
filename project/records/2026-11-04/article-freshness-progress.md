# 記事単位の確認進捗と記事ヘッダー

## 作業契約

- 目的: [#343](https://github.com/pero3dev/ai-agent-library/issues/343) の記事単位coverageと集計を実装し、[#345](https://github.com/pero3dev/ai-agent-library/issues/345) で記事から確認状況と未確認事項へ辿れるようにします。
- 入口: 専用worktreeの `AGENTS.md`、`ROADMAP.md` の定期メンテナンス台帳、`CONTRIBUTING.md` のハーネス・サイト節、`harness/writing-rules.md`、[運用手順](../../../freshness-automation.md) を適用します。
- 元HEAD: `e617bcac093681aebdf935fe60ef586bb56f0e9b`。専用worktree `.local/issue-343-349`、branch `feat/library-maintenance-followups`。元checkoutの未保存変更は対象外です。
- 所有: freshness観測のschema・型・policy・公開export・集計・試験、ROADMAPの生成集計区画、運用手順と共通スキル正本、サイトの同期・確認状況ページ・記事ヘッダー・TODO装飾と試験、本記録。
- 許可根拠: ユーザーの「#343〜#349をすべてCloseするまで自律的に作業」。PR・マージ・公開確認・Issue更新は統合担当が実施します。
- 検証: 集計・schema・policy・公開exportの単体試験、台帳所属検査、サイト単体・型・静的ビルド・ブラウザーとアクセシビリティ、root `npm run check`、最終差分の独立レビュー。
- 終了条件: 記事進捗の同一集計がROADMAP・#220・`/freshness`へ届き、全published記事の所属・TODO件数・静的表示を検証し、PR・main・公開確認の証拠をIssueへ接続します。
- 範囲外: 記事の鮮度観測そのもの、過去記録への確認日の補完、定期タスクの新規登録・設定変更。

## ローカル定期実行の切り分け

2026-11-04に、この端末で読み取りだけの診断を行いました。

| 確認対象 | 結果 | 解釈 |
| --- | --- | --- |
| common Git内のfreshness state/checkpoint | 1run。開始2026-10-07T17:31:32.543Z、終了2026-10-08T03:15:54.258Z、merged、completed_systemsは空、pending12件、保存snapshotあり | 公開した部分観測以降の新しいrun証拠はありません |
| 登録済みworktree 18個の `research/freshness-runs/`・`research/freshness-observations/` | host側Git statusで未commitの観測記録0件 | この2か所に未公開記録が取り残されているという仮説は支持されません |
| Codexの既定 `automations/*/automation.toml` | 保存ディレクトリなし | 現在の既定保存先に登録証拠がありません。過去の登録や別端末の状態までは断定しません |
| Windows Scheduled Tasks | Codex/freshness/ai-agentに該当するタスクなし | Codexアプリ自身のschedulerの実行・停止の証明とは分けます |
| TaskScheduler Operationalログ | sandboxでは権限拒否。host側再確認ではログが無効 | 10/08以降の実行履歴をこのログから復元できません |

確認できる結論は「10/08以降の実観測の公開・未commit証拠は見つからず、現在の既定保存先に定期タスクがない」です。停止時刻や停止理由は確定しません。未実行を推定して観測日を進めず、定期登録の復旧は別の実施証拠で確認します。認証・ローカルnotes・個人情報は記録へ転記しません。

## coverageと集計の判断

既存の `declared-system` を維持し、`declared-article` を同じschemaへ加えます。記事行には `system_id`・`doc`・`verified_on`・確認範囲のdescription・主張のclaims・一次情報sourcesが必要です。policyは所属範囲、実観測、取得日時、独立レビューdigestとの結合も検査します。変更なしの公開exportは部分完了でも記事行を保持します。

台帳から全199記事の所属を解決し、複数系統への所属も保持します。系統ごとの最新記事日付を重複なく選び、周期内の記事だけを n/m に数えます。全記事が1周期内に揃ったときだけ系統完了へ集計し、最古の記事日付を基準にするため、1記事の新しい日付で他の記事を延命しません。modelsは同じ周期の3社vendor_checks完了も従来どおり必要とし、その日がさらに古ければ期日の基準にします。既存の系統coverageから記事確認件数は作りません。

実観測を追加していないため、今回の生成結果は全16系統が確認完了記録なし、記事確認はすべて0/mです。観測済みという表示には変更しません。#220の本文は同じtrackingBody出力で更新します。

## 表示の判断

記事ヘッダーは警告色を加えず、「一次情報の確認記録: 系統名 記録なし」という中立的な文言を採用します。記録なしは記事が誤りであることを意味せず、一次情報で確認した範囲の記録がない状態を示すためです。日付がある場合は「この記事」「系統の宣言範囲」を添え、各所属系統の `/freshness#system-…` へ静的リンクを置きます。本文改訂の「更新」と分けて表示します。

未確認事項の件数は文字列のgrepではなく、本文ASTから実際に `TodoCallout` へ変換した数を使います。コードフェンス内の例は数えません。各calloutへ `article-todo-N` の一意なアンカーを付け、件数から最初のcalloutへ移動できます。JavaScriptの実行を必要としません。生成物は同期スクリプトで作り、正本記事へ装飾や確認日を手書きしません。

## 検証結果

- Node.js 24.22.1、Windowsで実施。依存はroot・websiteともlockfileから `npm ci` で準備しました。
- 集計・従来policy・公開exportの67試験がhost側で成功しました。sandbox内は使い捨てGit/symlink作成の権限制限で失敗したため、同じ試験をhost側で再実行しました。
- サイト同期でpublished199記事・全所属を生成し、MDX安全性と所属/優先日付の18試験が成功しました。
- 静的ビルド・ブラウザー・全体検証・PR/公開の最終結果は、統合PRとIssueの完了証拠へ接続します。実観測や実クライアントのScheduled起動を成功扱いにしません。
