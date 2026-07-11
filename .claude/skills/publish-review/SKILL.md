---
name: publish-review
description: draft のドキュメントをフェーズレビュー(ROADMAP の X-R タスク相当)して published に昇格する。機械チェック 3 種と doc-reviewer サブエージェントによる意味的レビューを行う。ユーザーがレビュー・公開・published 化を依頼したときに使う。
argument-hint: "[対象ファイル。省略時は draft 全件]"
---

# フェーズレビューと公開(draft → published)

## 手順

1. **対象確定**: 引数のファイル群。省略時は `grep -rl 'status: "draft"' docs` で draft 一覧を出し、ユーザーに確認する
2. **機械チェック**(すべて green になるまで次へ進まない):
   - `node scripts/validate-docs.mjs --all` — front matter / 固定 H2 / TODO(要確認) 書式
   - `node scripts/check-links.mjs` — リンク切れ / セクション README 収録表
   - `npx --yes markdownlint-cli "**/*.md" -p .markdownlintignore`
3. **意味的レビュー**: **doc-reviewer サブエージェント**に対象ファイルを渡し、must/should の指摘表と総合判定を受け取る
4. **修正**: must 指摘を修正し、機械チェックを再実行する(should は妥当なものだけ対応し、見送りは理由を報告)
5. **公開処理**(CLAUDE.md のステータス対応表に従い、必ず両方更新する):
   - front matter `status` を `"published"` にする
   - ROADMAP.md の対応タスクを「完了」にする
   - レビュー修正が実質変更(事実・推奨・コード)だった docs のみ `last_updated` を更新する(誤字・リンク修正のみなら更新しない)
6. **同期漏れの最終確認**(4 点): セクション README のリンク化 / ROADMAP ステータス / GLOSSARY / `status`・`last_updated`
