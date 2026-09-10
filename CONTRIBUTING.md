# コントリビューションガイド

このリポジトリは、日本語話者のソフトウェアエンジニア向けの AI Agent 学習ドキュメントライブラリです。
成果物は Markdown ドキュメント(`docs/`)で、`examples/` に動くサンプルコード、`website/` に公開サイト(Nextra)があります。

## まず読むもの

- **[AGENTS.md](AGENTS.md)** — 作業の入口と共通契約の正本。人が書く場合も同じ規約を使います
- **[harness/writing-rules.md](harness/writing-rules.md)** — 文体・命名・状態・同期更新・サンプルの詳細規約
- **[templates/doc-template.md](templates/doc-template.md)** — docs の新規学習記事を作るベースです(固定 H2 セクションの削除・改名は不可)
- **[ROADMAP.md](ROADMAP.md)** — フェーズと担当タスク、定期メンテナンスの一覧

## ドキュメントを追加・変更するとき

1. `docs/<NN-section>/` にケバブケースの英語ファイル名で作成(本文は日本語)
2. テンプレートの固定 8 セクションをすべて残す
3. 変化の速い情報(モデル名・料金・最新 API・ベンチマーク)は作業日の一次情報で確認し、出典・アクセス日・条件を明記する。裏付けのない内容を `TODO(要確認)` に残す(書式は執筆規約を参照)
4. 同期更新を同じ変更でまとめて行う: セクション README のリンク化 / ROADMAP のステータス / GLOSSARY / front matter の `status`・`last_updated`

## 提出前のセルフチェック

Node.js と npm を準備し、ルート直下で lockfile の依存をインストールしてから実行します。CI の Node.js 版は [.github/workflows/ci.yml](.github/workflows/ci.yml) が正本です。

```bash
npm ci
npm run check      # 単体試験、Markdown lint、記事規約、相対リンク、TODO 棚卸し
```

個別に実行する場合:

```bash
node scripts/validate-docs.mjs --all   # front matter / 固定 H2 / TODO(要確認) 書式
node scripts/check-links.mjs           # 相対リンク切れ + セクション README 収録表の漏れ
node scripts/todo-report.mjs           # TODO(要確認) の棚卸し
```

`npm run check` の構成は [package.json](package.json) が正本です。これは CI 全体や有料 API の実行を意味しません。CI はこれに加えて依存監査、Actionlint、Python サンプル検証、サイトビルド・ブラウザー試験などを実行します。サイト、依存、サンプル、CI を変更した場合は、対応する CI ジョブと各 README の検証も行ってください。

`docs/` の `.md` 編集フックは `validate-docs` を呼ぶ補助です。クライアントの設定・信頼・実行面によって発火しない場合があるため、提出前の明示実行を省略しません。フック単体試験の成功と実クライアントでの発火確認は区別して報告します。

## サイト(website/)を変更するとき

- 正本は `docs/`。`website/content/` `website/generated/` `website/out/` は生成物です(直接編集しない)
- 手書き上書きページのみ `website/content-src/` に置きます
- ローカル確認: `cd website && npm ci && npm run dev`
- 公開相当のビルド: `cd website && npm run build:clean`(`sync` → クリーンビルド → Pagefind → ルート網羅チェック)

## サンプルコード(examples/)を変更するとき

- 各サンプルは自己完結。`README.md`(実行方法・**動作確認日**)と依存固定ファイルを必ず含めます
- API キーはコードに書かず環境変数参照。`--mock` 対応サンプルは API キーなしで動作確認できます

## ハーネスを変更するとき

共通契約は `AGENTS.md`、詳細執筆規約は `harness/writing-rules.md`、共通スキルは `.agents/skills/` が正本です。`CLAUDE.md` と対応する `.claude/skills/` の 4 スキルは決定生成します。Codex 専用の定期最新化スキルは複製しません。

```bash
node scripts/sync-harness.mjs --write  # 正本から Claude 互換入口を更新
node scripts/sync-harness.mjs --check  # 不一致・未管理の互換ファイルを検出
node --test scripts/sync-harness.test.mjs
```

生成先は手修正しません。共通規約や手順を変更したら正本を編集して再生成します。未管理の互換ファイルは自動削除せず、所有者と必要な互換性を確認します。製品固有の hooks・agents・権限設定は各製品のディレクトリで保守します。

新しい規約を、その変更自身の承認根拠に使いません。静的・単体・モック試験で確認した範囲と、実 Agent・GitHub・公開先で確認した範囲を分けます。教材用の自動認識される設定は `.example` 等で保存し、動作試験時だけ所有する隔離ディレクトリへ展開します。

## ライセンス

コントリビューションは、ドキュメントは CC BY 4.0、コードは MIT([LICENSE](LICENSE))で受け入れられます。
