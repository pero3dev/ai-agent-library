---
name: new-doc
description: docs/ に新規ドキュメントをテンプレートから作成し、同期更新(セクション README・ROADMAP・GLOSSARY・examples 双方向リンク)まで一括で行う。ユーザーが新規記事の執筆を依頼したときに使う。
argument-hint: "[セクションとトピック(例: 03-implementation retry-design)]"
---

# 新規ドキュメント作成

## 事前確認

1. [ROADMAP.md](../../../ROADMAP.md) に対応するタスクがあるか確認する(なければ新設の意図をユーザーに確認)
2. ファイル名(英語ケバブケースの名詞句・連番なし)が **docs/ 全体で一意**か Glob で確認する(セクション横断の一意性が規約)
3. このセッションで新規作成した docs が 3 ファイル以内に収まるか確認する(超えるなら分割を提案)

## 作成手順

1. [templates/doc-template.md](../../../templates/doc-template.md) をコピーして `docs/<NN-section>/<topic>.md` を作る
   - 記入ガイドの HTML コメント(`<!-- -->`)はすべて削除する
   - **固定 H2 の削除・改名は不可**。該当しないセクションは「該当なし(理由を 1 行)」と書いて残す
2. front matter:
   - `status: "draft"`(このスキルでは published にしない)
   - `category` は所属ディレクトリ名(`NN-` を除いた部分)と一致させる
   - `tags` は新規タグを作る前に既存タグを grep して再利用する(同義語の揺れを作らない。例: `tools` と `tool-use`)
3. 執筆規約の要点(詳細は [CLAUDE.md](../../../CLAUDE.md)):
   - です・ます調 / 技術用語の初出は「日本語訳(英語)」/ コードブロックに言語指定
   - 図は Mermaid を本文埋め込み(本文が正本)
   - 相対時間表現を避け「2026 年時点では」等の絶対表現
   - 変化の速い情報は断定せず `TODO(要確認)` 書式で残す
4. **同期更新一式(同じセッション内で必須)**:
   - 所属セクション README の収録表でファイル名をリンク化する
   - ROADMAP.md の対応タスクを「レビュー待ち」にする
   - 新しい用語を導入した場合は [GLOSSARY.md](../../../GLOSSARY.md)(五十音順)に追加する
   - examples/ に対応サンプルがある場合は docs ↔ examples の双方向リンクを張る
5. 検証: `node scripts/validate-docs.mjs <新規ファイル>` → `node scripts/check-links.mjs` を実行し、指摘があれば修正する

## 公開について

published 化(フェーズレビュー)はこのスキルでは行わない。執筆完了後に /publish-review を使う。
