---
name: publish-review
description: draft のドキュメントをフェーズレビュー(ROADMAP の X-R タスク相当)して published に昇格する。機械チェック 3 種と doc-reviewer サブエージェントによる意味的レビューを行う。ユーザーがレビュー・公開・published 化を依頼したときに使う。
---

# フェーズレビューと公開(draft → published)

引数は対象ファイルです。省略時は依頼範囲に含まれる draft を対象にします。

## 手順

1. **対象確定**: 引数・依頼範囲に対応するファイル群と、[執筆規約](../../../harness/writing-rules.md#ステータス管理)・ROADMAP の対応タスク全成果物を確認する。全 draft の公開が許可されていれば `rg -l 'status: "draft"' docs` で対象を確定して進める。範囲が定まらない場合だけ確認する
2. **機械チェック**(すべて green になるまで次へ進まない):
   - `node scripts/validate-docs.mjs --all` — front matter / 固定 H2 / TODO(要確認) 書式
   - `node scripts/check-links.mjs` — リンク切れ / セクション README 収録表
   - 必要なら `npm ci` で lockfile の依存を準備し、`npm run lint:md`
3. **意味的レビュー**: 編集担当と別の **doc-reviewer サブエージェント**に対象の元記事・最終候補・一次資料・対応タスク全成果物を渡す。レビュー対象の commit/tree または digest、実行 ID、must/should の指摘表と総合判定を記録する。独立レビューが実行できない場合は draft のまま残す
4. **修正と最終再レビュー**: must を修正し、実質変更(事実・推奨・コード)があった記事の `last_updated` を更新して機械チェックを再実行する。should は妥当なものを対応し、見送り理由を記録する。記事または根拠を変更したら、予定する公開状態・タスク状態の遷移も含めて更新後の対象を独立レビューへ再提出し、未解決 must がなく最終候補が承認されたことを確認する。古い対象の判定は流用しない
5. **公開処理**([ステータス対応表](../../../harness/writing-rules.md#ステータス管理)に従い、両方を確認する):
   - front matter `status` を `"published"` にする
   - ROADMAP.md の対応タスク全成果物が published になった場合だけ「完了」にする。一部だけなら「執筆中」と未完了成果物を記す
   - `last_updated` は手順 4 で確認した値を維持する(誤字・リンク修正のみなら更新しない)
6. **同期漏れの最終確認**(4 点): セクション README のリンク化 / ROADMAP ステータス / GLOSSARY / `status`・`last_updated`。公開状態と対応タスクの遷移を含めて機械チェックを再実行する。予定していなかった本文・根拠の変更が必要になったら手順 4 に戻る
