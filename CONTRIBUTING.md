# コントリビューションガイド

このリポジトリは、日本語話者のソフトウェアエンジニア向けの AI Agent 学習ドキュメントライブラリです。
成果物は Markdown ドキュメント(`docs/`)で、`examples/` に動くサンプルコード、`website/` に公開サイト(Nextra)があります。

## まず読むもの

- **[CLAUDE.md](CLAUDE.md)** — 執筆ルールの正本(文体・命名規約・テンプレート準拠・同期更新の義務)。人が書く場合も同じルールに従ってください
- **[templates/doc-template.md](templates/doc-template.md)** — 新規ドキュメントは必ずこれをベースに作成します(固定 H2 セクションの削除・改名は不可)
- **[ROADMAP.md](ROADMAP.md)** — フェーズと担当タスク、定期メンテナンスの一覧

## ドキュメントを追加・変更するとき

1. `docs/<NN-section>/` にケバブケースの英語ファイル名で作成(本文は日本語)
2. テンプレートの固定 8 セクションをすべて残す
3. 変化の速い情報(モデル名・料金・最新 API・ベンチマーク)は断定せず `TODO(要確認)` を残す(書式は CLAUDE.md 参照)
4. 同期更新を同じ変更でまとめて行う: セクション README のリンク化 / ROADMAP のステータス / GLOSSARY / front matter の `status`・`last_updated`

## 提出前のセルフチェック

ルート直下で以下を実行できます(依存ゼロ、`node` のみ):

```bash
npm run check      # validate-docs + check-links + todo-report をまとめて実行
```

個別に実行する場合:

```bash
node scripts/validate-docs.mjs --all   # front matter / 固定 H2 / TODO(要確認) 書式
node scripts/check-links.mjs           # 相対リンク切れ + セクション README 収録表の漏れ
node scripts/todo-report.mjs           # TODO(要確認) の棚卸し
```

`docs/` の `.md` を編集するとフックが `validate-docs` を自動実行します。CI(`.github/workflows/ci.yml`)でも同じ検証とサイトビルドが走ります。

## サイト(website/)を変更するとき

- 正本は `docs/`。`website/content/` `website/generated/` `website/out/` は生成物です(直接編集しない)
- 手書き上書きページのみ `website/content-src/` に置きます
- ローカル確認: `cd website && npm ci && npm run dev`
- 公開相当のビルド: `cd website && npm run build:clean`(`sync` → クリーンビルド → Pagefind → ルート網羅チェック)

## サンプルコード(examples/)を変更するとき

- 各サンプルは自己完結。`README.md`(実行方法・**動作確認日**)と依存固定ファイルを必ず含めます
- API キーはコードに書かず環境変数参照。`--mock` 対応サンプルは API キーなしで動作確認できます

## ライセンス

コントリビューションは、ドキュメントは CC BY 4.0、コードは MIT([LICENSE](LICENSE))で受け入れられます。
