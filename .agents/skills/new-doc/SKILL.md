---
name: new-doc
description: docs/ に新規ドキュメントをテンプレートから作成し、同期更新(セクション README・ROADMAP・GLOSSARY・examples 双方向リンク)まで一括で行う。ユーザーが新規記事の執筆を依頼したときに使う。
---

# 新規ドキュメント作成

引数はセクションとトピックです(例: `03-implementation retry-design`)。

## 事前確認

1. [ROADMAP.md](../../../ROADMAP.md) の対応タスクと、[執筆規約](../../../harness/writing-rules.md) を確認する。新設が依頼から明らかな場合は対応タスクを加える。対象や方針の判断が必要な場合だけ、その論点を確認する
2. ファイル名(英語ケバブケースの名詞句・連番なし)が **docs/ 全体で一意**か Glob で確認する(セクション横断の一意性が規約)
3. 新規学習記事は 1 作業単位で原則 1〜3 本に分ける。既存記事の編集・索引等の同期ファイル数とは区別し、大きな依頼は次の作業単位へ継続する

## 作成手順

1. [templates/doc-template.md](../../../templates/doc-template.md) をコピーして `docs/<NN-section>/<topic>.md` を作る
   - 記入ガイドの HTML コメント(`<!-- -->`)はすべて削除する
   - **固定 H2 の削除・改名は不可**。該当しないセクションは「該当なし(理由を 1 行)」と書いて残す
2. front matter:
   - `status: "draft"`(このスキルでは published にしない)
   - `category` は所属ディレクトリ名(`NN-` を除いた部分)と一致させる
   - `tags` は新規タグを作る前に既存タグを grep して再利用する(同義語の揺れを作らない。例: `tools` と `tool-use`)
3. 執筆規約の要点(詳細は [執筆規約](../../../harness/writing-rules.md)):
   - です・ます調 / 技術用語の初出は「日本語訳(英語)」/ コードブロックに言語指定
   - 図は Mermaid を本文埋め込み(本文が正本)
   - 相対時間表現を避け「2026 年時点では」等の絶対表現
   - 変化の速い情報は作業日の一次情報で確認し、出典・アクセス日・条件を明記。裏付けがない主張は `TODO(要確認)` に残す
4. **同期更新一式(同じセッション内で必須)**:
   - 所属セクション README の収録表でファイル名をリンク化する
   - ROADMAP.md の対応タスクは全成果物が draft で揃ったら「レビュー待ち」にする。一部だけなら「執筆中」と残件を記す
   - 新しい用語を導入した場合は [GLOSSARY.md](../../../GLOSSARY.md)(五十音順)に追加する
   - examples/ に対応サンプルがある場合は docs ↔ examples の双方向リンクを張る
5. 検証: `node scripts/validate-docs.mjs <新規ファイル>` → `node scripts/check-links.mjs` を実行し、指摘があれば修正する
6. PR を提出する場合は [通常記事の変更記録](../publish-review/SKILL.md#通常記事の変更記録)を作り、候補 tree に対する `harness-policy` を通す。draft 作成だけなら `review: null` とし、公開レビューの結果を作らない

## 公開について

published 化(フェーズレビュー)はこのスキルでは行わない。執筆完了後に /publish-review を使う。
