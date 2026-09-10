# AI Agent Library

エンジニアが **AI Agent の概念・設計・実装・評価・運用・セキュリティ** を体系的に学ぶための Markdown ドキュメントライブラリです。

単なる用語集ではなく、実務でそのまま使える **設計判断の基準・アンチパターン・チェックリスト・実装例** を含むことを目指します。

> 📖 **ドキュメントサイト**: <https://pero3dev.github.io/ai-agent-library/> — `docs/` を正本として自動ビルド・公開しています(検索・依存マップ・用語集付き)

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
6. **LLM の挙動を仕組みから理解したい人**: [docs/10-llm-foundations/](docs/10-llm-foundations/) を上から順に読む(01 と並行して読めます)
7. **用語を調べたい人**: [GLOSSARY.md](GLOSSARY.md) から該当ドキュメントへ辿る

## ディレクトリ構成

```text
ai-agent-library/
├── README.md / CONTRIBUTING.md / SECURITY.md / LICENSE
├── AGENTS.md / CLAUDE.md      # 共通契約の正本と生成する互換入口
├── ROADMAP.md / GLOSSARY.md  # 執筆・定点観測の台帳と用語集
├── freshness-automation.md  # 定期最新化の現行運用入口
├── docs/                    # 全 16 章の学習記事と章索引
├── examples/                # 自己完結の Python サンプルと横断試験
├── website/                 # 公開サイト。記事の正本を取り込んで生成
├── project/
│   ├── README.md            # 計画・実施記録の索引
│   ├── plans/              # content / maintenance / engineering
│   └── records/            # 日付別の監査・修正・導入・受入記録
├── research/                # 出典・取得時点・主張・適用結果。README が入口
├── harness/                 # 詳細規約、作業 profile、検証一覧
├── automation/              # 定期タスク登録用プロンプト
├── scripts/                 # 検証・保守 CLI、共通実装、schema
├── tests/                   # 単体試験・試験 helper・不活性な固定課題
├── templates/               # 記事・ツール別ページ・比較表のテンプレート
├── assets/diagrams/         # 図のエクスポート。正本は記事中の Mermaid
└── .agents/ / .claude/ / .codex/ / .github/  # 製品別入口・設定・CI
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
| [docs/10-llm-foundations/](docs/10-llm-foundations/) | 「LLM 自体がなぜそう振る舞うか」の基礎 | 生成・トークン・注意機構・学習工程・能力限界の直感。数式による理論解説、Agent の概念(→ 01 章)は置かない |
| [docs/11-llm-internals/](docs/11-llm-internals/) | LLM の内部構造を数式と原論文で(10 章の学術的下層) | Transformer の数式・注意の変種・MoE 内部・スケーリング則・アラインメント理論・推論機構・解釈可能性。線形代数の教材化、分散学習の実装は置かない |
| [docs/12-multimodal/](docs/12-multimodal/) | テキスト以外のモダリティの理解と生成の実務 | 文書構造化・画像読解・マルチモーダル RAG・画像/動画/音声の生成・リアルタイム観測。生成モデルの理論・制作技法論は置かない |
| [docs/13-domain-agents/](docs/13-domain-agents/) | 応用ドメインごとのエージェント設計判断 | ドメイン特性分析・定番アーキテクチャの型・固有の落とし穴・評価設計。ドメイン非依存の作り方は 01〜06 章、業務知識そのものは置かない |
| [docs/14-ux-and-product/](docs/14-ux-and-product/) | 非決定的な AI システムの体験設計 | UX パターン・会話設計・チャット以外の UI・プロアクティブ性・アクセシビリティ。実装は 03 章、ビジュアル/ブランドデザインの一般論は置かない |
| [docs/15-human-ai/](docs/15-human-ai/) | AI と協働する個人の認知と技能 | オートメーションバイアス・検証習慣・キャリア戦略・リテラシー研修設計。承認/レビューの仕組み(→ 02・08 章)、組織のスキル戦略(→ 09 章)、雇用予測は置かない |
| [templates/](templates/) | 執筆の一貫性を担保する | ドキュメントテンプレート。本文コンテンツは置かない |
| [examples/](examples/) | 動くサンプルコード | docs から参照される最小構成のコード。ドキュメント本文は置かない |
| [research/](research/README.md) | 調査・観測・適用結果 | 出典 URL・確認日・主張の範囲と変更台帳。学習記事テンプレートは適用しない |
| [project/](project/README.md) | プロジェクトの計画と実施履歴 | 採択計画・監査・修正・受入の記録。現行手順は入口文書へ接続する |
| [website/](website/) | ドキュメントサイトの実装 | Nextra ベースのサイト。docs/ が正本で、sync スクリプトが取り込む(設計は [website.md](project/plans/engineering/website.md)) |
| [assets/](assets/) | 図版のエクスポート画像置き場 | 画像出力が必要になった図のみ。図の正本は各ドキュメント本文の Mermaid コードブロック |

## ドキュメントの探し方

- **ファイル名は英語ケバブケース**(例: `prompt-injection.md`)、**本文は日本語** です。ファイル名で `grep` / 検索してください
- 各ドキュメントは共通テンプレート([templates/doc-template.md](templates/doc-template.md))に従い、必ず「目的 / 対象読者 / 前提知識 / 本文 / 実務での注意点 / 関連トピック / 参考資料 / TODO・未確認事項」の 8 セクションを含みます
- 未確認・要更新の情報には `TODO(要確認)` タグが付いています。`TODO(要確認)` で全文検索すると要確認箇所を一覧できます

## コントリビューション(執筆ルール)

作業の入口と共通契約は [AGENTS.md](AGENTS.md)、執筆・命名・同期更新の詳細は [harness/writing-rules.md](harness/writing-rules.md) が正本です。人が書く場合も同じ規約を使います。準備と検証は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。Claude Code 向けの入口と共通スキルは正本から生成します。

記事タスクと定点観測は [ROADMAP.md](ROADMAP.md)、プロジェクトの計画と実施履歴は [project/README.md](project/README.md) を参照してください。

## ステータス

- 初版と [記事拡張計画](project/README.md#完了した記事拡張計画) は完了しています。全 16 章に 199 記事を公開し、[GLOSSARY.md](GLOSSARY.md) から用語を横断して辿れます。タスクごとの成果物と完了日は [ROADMAP.md](ROADMAP.md) が正本です。
- [Python サンプル](examples/README.md) は 6 件を収録し、すべて API キー不要の `--mock` に対応しています。実 API の確認条件は各サンプルの README を参照してください。
- サイトは [GitHub Pages](https://pero3dev.github.io/ai-agent-library/) で公開済みです。以後の保守は [定期メンテナンス](ROADMAP.md#定期メンテナンスフェーズ完了後も継続) と [定期最新化の運用](freshness-automation.md) に従います。構造・運用の変更は [計画と実施記録](project/README.md#構造運用の計画) で追跡します。
