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
4. **Claude Code などのコーディングエージェントを使いたい人**: [docs/08-coding-agents/](docs/08-coding-agents/) の分類と全体像から読み始める
5. **Agent 導入を企画・推進する人**: [docs/09-business/](docs/09-business/) のユースケース発見から読み始める
6. **用語を調べたい人**: [GLOSSARY.md](GLOSSARY.md) から該当ドキュメントへ辿る

## ディレクトリ構成

```text
ai-agent-library/
├── README.md                 # 本ファイル。プロジェクト概要と全体構成
├── CLAUDE.md                 # Claude(AI アシスタント)向けの執筆ルール・規約
├── ROADMAP.md                # 執筆計画・トピック一覧・タスク分割
├── CODING-AGENTS-PLAN.md     # AI コーディングエージェント章(docs/08)の追加計画
├── EXPANSION-PLAN.md         # プロフェッショナル化拡張(docs/09 ほか 24 本)の追加計画
├── SUPPLEMENTARY-PLAN.md     # 拡張計画で除外した領域の別冊計画(LLM 基礎ほか)
├── WEBSITE-PLAN.md           # ドキュメントサイト(website/)の設計・進行状況
├── GLOSSARY.md               # 用語集(各ドキュメントへの横断インデックス)
├── templates/
│   ├── doc-template.md       # 全ドキュメント共通の Markdown テンプレート
│   ├── tool-doc-template.md  # コーディングエージェント「ツール別ページ」用テンプレート
│   └── tool-comparison-template.md  # ツール比較表のテンプレート
├── docs/
│   ├── 00-overview/          # 全体像・学習ロードマップ・このライブラリの読み方
│   ├── 01-concepts/          # 基礎概念(Agent とは何か、Agent ループ、ツール使用、メモリ 等)
│   ├── 02-architecture/      # 設計・アーキテクチャパターン(Workflow vs Agent、マルチエージェント 等)
│   ├── 03-implementation/    # 実装ガイド(プロンプト設計、ツール定義、構造化出力 等)
│   ├── 04-evaluation/        # 評価・テスト(評価設計、LLM-as-a-Judge、回帰テスト 等)
│   ├── 05-operations/        # 運用・監視(可観測性、コスト管理、バージョニング 等)
│   ├── 06-security/          # セキュリティ(プロンプトインジェクション、権限設計 等)
│   ├── 07-case-studies/      # ケーススタディ・アンチパターン詳解
│   ├── 08-coding-agents/     # AI コーディングエージェント(選定・設定・セキュリティ・ツール別)
│   └── 09-business/          # ビジネス実務(ユースケース選定・PoC → 本番・ROI)
├── examples/
│   ├── python/               # Python サンプルコード(tool-use を収録)
│   └── typescript/           # TypeScript サンプルコード(将来追加)
├── research/
│   ├── coding-agents/        # 執筆前の公式情報調査メモ(docs 規約の対象外)
│   ├── models/               # モデルガイド(docs/03)の調査メモ
│   └── professional/         # プロフェッショナル化拡張(Phase D〜I)の調査メモ
├── website/                  # ドキュメントサイト(Nextra。docs/ を正本として sync で取り込み)
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
| [docs/08-coding-agents/](docs/08-coding-agents/) | AI コーディングエージェントを実務で使う | 選定基準、設定・依頼設計、セキュリティ、チーム導入、ツール別リファレンス。Agent を「作る」側の話は 02・03 章へ |
| [docs/09-business/](docs/09-business/) | Agent 案件を企画から本番まで推進する | ユースケース選定、要件定義、PoC → 本番、ROI。技術的な設計判断は 02 章、稼働後の運用は 05 章へ |
| [templates/](templates/) | 執筆の一貫性を担保する | ドキュメントテンプレート。本文コンテンツは置かない |
| [examples/](examples/) | 動くサンプルコード | docs から参照される最小構成のコード。ドキュメント本文は置かない |
| [research/](research/coding-agents/) | 執筆前の公式情報調査メモ | 出典 URL・確認日付きの調査記録。docs の執筆規約は適用しない |
| [website/](website/) | ドキュメントサイトの実装 | Nextra ベースのサイト。docs/ が正本で、sync スクリプトが取り込む(設計は [WEBSITE-PLAN.md](WEBSITE-PLAN.md)) |
| [assets/](assets/) | 図版のエクスポート画像置き場 | 画像出力が必要になった図のみ。図の正本は各ドキュメント本文の Mermaid コードブロック |

## ドキュメントの探し方

- **ファイル名は英語ケバブケース**(例: `prompt-injection.md`)、**本文は日本語** です。ファイル名で `grep` / 検索してください
- 各ドキュメントは共通テンプレート([templates/doc-template.md](templates/doc-template.md))に従い、必ず「目的 / 対象読者 / 前提知識 / 本文 / 実務での注意点 / 関連トピック / 参考資料 / TODO・未確認事項」の 8 セクションを含みます
- 未確認・要更新の情報には `TODO(要確認)` タグが付いています。`TODO(要確認)` で全文検索すると要確認箇所を一覧できます

## コントリビューション(執筆ルール)

執筆ルール・命名規約・テンプレートの使い方は [CLAUDE.md](CLAUDE.md) に集約しています。人間が書く場合も同じルールに従ってください。

執筆計画と着手順は [ROADMAP.md](ROADMAP.md) を参照してください。

## ステータス

- 現在: **Phase 0〜8 + Phase A〜I(コーディングエージェント章・モデルガイド・ビジネス実務新設・プロフェッショナル化拡張の全 24 タスク)完了(2026-07-07 時点)**。全 10 セクションで **83 本**を公開しています — [00-overview](docs/00-overview/README.md) 2 本、[01-concepts](docs/01-concepts/README.md) 8 本、[02-architecture](docs/02-architecture/README.md) 8 本、[03-implementation](docs/03-implementation/README.md) 14 本、[04-evaluation](docs/04-evaluation/README.md) 7 本、[05-operations](docs/05-operations/README.md) 7 本、[06-security](docs/06-security/README.md) 8 本、[07-case-studies](docs/07-case-studies/README.md) 5 本、[08-coding-agents](docs/08-coding-agents/README.md) 21 本、[09-business](docs/09-business/README.md) 3 本、および最初の [Python サンプル](examples/python/tool-use/README.md)。用語は [GLOSSARY.md](GLOSSARY.md)(58 エントリ)から横断的に辿れます
- 次のステップ: ドキュメントサイトの公開準備(Phase W5、[WEBSITE-PLAN.md](WEBSITE-PLAN.md))と、拡張計画で除外した領域の別冊計画([SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md)、未着手)。並行して [ROADMAP.md](ROADMAP.md) の「定期メンテナンス」(`TODO(要確認)` の棚卸し — 特に 08 章のツール情報・モデルガイド・エージェント認証の標準動向・規制動向・音声/FT 提供状況・ベンチマーク動向は変化が速いため四半期ごと必須、`examples/` の実行確認)を継続します
