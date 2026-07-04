# AI Agent Library

エンジニアが **AI Agent の概念・設計・実装・評価・運用・セキュリティ** を体系的に学ぶための Markdown ドキュメントライブラリです。

単なる用語集ではなく、実務でそのまま使える **設計判断の基準・アンチパターン・チェックリスト・実装例** を含むことを目指します。

## 対象読者

- AI Agent / LLM アプリケーションをこれから設計・実装するソフトウェアエンジニア
- すでに LLM API を使った経験があり、Agent 的な設計(ツール使用・自律ループ・マルチエージェント)に進みたい人
- Agent システムの評価・運用・セキュリティに責任を持つテックリード / SRE / セキュリティ担当者

## 読み方

1. **初学者**: [docs/00-overview/](docs/00-overview/) の学習ロードマップから始め、[docs/01-concepts/](docs/01-concepts/) を順に読む
2. **設計フェーズの人**: [docs/02-architecture/](docs/02-architecture/) の設計判断ガイドとアンチパターンを参照する
3. **運用・セキュリティ担当**: [docs/05-operations/](docs/05-operations/) と [docs/06-security/](docs/06-security/) を直接参照する
4. **用語を調べたい人**: [GLOSSARY.md](GLOSSARY.md) から該当ドキュメントへ辿る

## ディレクトリ構成

```text
ai-agent-library/
├── README.md                 # 本ファイル。プロジェクト概要と全体構成
├── CLAUDE.md                 # Claude(AI アシスタント)向けの執筆ルール・規約
├── ROADMAP.md                # 執筆計画・トピック一覧・タスク分割
├── GLOSSARY.md               # 用語集(各ドキュメントへの横断インデックス)
├── templates/
│   └── doc-template.md       # 全ドキュメント共通の Markdown テンプレート
├── docs/
│   ├── 00-overview/          # 全体像・学習ロードマップ・このライブラリの読み方
│   ├── 01-concepts/          # 基礎概念(Agent とは何か、Agent ループ、ツール使用、メモリ 等)
│   ├── 02-architecture/      # 設計・アーキテクチャパターン(Workflow vs Agent、マルチエージェント 等)
│   ├── 03-implementation/    # 実装ガイド(プロンプト設計、ツール定義、構造化出力 等)
│   ├── 04-evaluation/        # 評価・テスト(評価設計、LLM-as-a-Judge、回帰テスト 等)
│   ├── 05-operations/        # 運用・監視(可観測性、コスト管理、バージョニング 等)
│   ├── 06-security/          # セキュリティ(プロンプトインジェクション、権限設計 等)
│   └── 07-case-studies/      # ケーススタディ・アンチパターン詳解
├── examples/
│   ├── python/               # Python サンプルコード(将来追加)
│   └── typescript/           # TypeScript サンプルコード(将来追加)
└── assets/
    └── diagrams/             # 図版のエクスポート画像(図の正本は本文埋め込みの Mermaid)
```

## 各ディレクトリの目的

| ディレクトリ | 目的 | 置くもの / 置かないもの |
| --- | --- | --- |
| [docs/00-overview/](docs/00-overview/) | ライブラリ全体の地図。何をどの順で読むべきかを示す | 学習ロードマップ、章間の依存関係。個別トピックの詳細は置かない |
| [docs/01-concepts/](docs/01-concepts/) | 実装に依存しない基礎概念の解説 | 概念の定義・分類・歴史的経緯。特定フレームワークの API 解説は置かない |
| [docs/02-architecture/](docs/02-architecture/) | 「どう作るべきか」の設計判断 | 判断基準、トレードオフ表、アンチパターン。コード片は最小限 |
| [docs/03-implementation/](docs/03-implementation/) | 「どう書くか」の実装ガイド | 実装パターン、コード例、フレームワーク比較。概念の再説明はリンクで済ませる |
| [docs/04-evaluation/](docs/04-evaluation/) | Agent の品質をどう測るか | 評価設計、メトリクス、テスト戦略、評価ハーネスの作り方 |
| [docs/05-operations/](docs/05-operations/) | 本番運用の実務 | 可観測性、コスト、デプロイ、インシデント対応、モデル更新への追従 |
| [docs/06-security/](docs/06-security/) | Agent 固有の脅威と対策 | 脅威モデル、対策パターン、レビューチェックリスト |
| [docs/07-case-studies/](docs/07-case-studies/) | 具体事例から学ぶ | 成功・失敗事例の構造化された分析。一般論は他章へ |
| [templates/](templates/) | 執筆の一貫性を担保する | ドキュメントテンプレート。本文コンテンツは置かない |
| [examples/](examples/) | 動くサンプルコード | docs から参照される最小構成のコード。ドキュメント本文は置かない |
| [assets/](assets/) | 図版のエクスポート画像置き場 | 画像出力が必要になった図のみ。図の正本は各ドキュメント本文の Mermaid コードブロック |

## ドキュメントの探し方

- **ファイル名は英語ケバブケース**(例: `prompt-injection.md`)、**本文は日本語** です。ファイル名で `grep` / 検索してください
- 各ドキュメントは共通テンプレート([templates/doc-template.md](templates/doc-template.md))に従い、必ず「目的 / 対象読者 / 前提知識 / 本文 / 実務での注意点 / 関連トピック / 参考資料 / TODO・未確認事項」の 8 セクションを含みます
- 未確認・要更新の情報には `TODO(要確認)` タグが付いています。`TODO(要確認)` で全文検索すると要確認箇所を一覧できます

## コントリビューション(執筆ルール)

執筆ルール・命名規約・テンプレートの使い方は [CLAUDE.md](CLAUDE.md) に集約しています。人間が書く場合も同じルールに従ってください。

執筆計画と着手順は [ROADMAP.md](ROADMAP.md) を参照してください。

## ステータス

- 現在: **構造設計フェーズ完了、コンテンツ執筆前**
- 次のステップ: [ROADMAP.md](ROADMAP.md) の Phase 1 (概要 + 最重要概念) から執筆開始
