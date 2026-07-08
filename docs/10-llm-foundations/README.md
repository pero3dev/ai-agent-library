# 10-llm-foundations — LLM 基礎

「LLM 自体がなぜそう振る舞うのか」を、実務の設計・デバッグの判断に効く範囲で扱うセクションです。数式や実装の詳細には踏み込まず、挙動の由来を直感として理解し、各記事の末尾で既存の実務記事へ接続します(設計は [SUPPLEMENTARY-PLAN.md](../../SUPPLEMENTARY-PLAN.md))。

- **置くもの**: 生成・トークン・注意機構・学習工程・能力限界の「なぜ」。実務記事への接続
- **置かないもの**: 数式による理論解説(→ 外部教材)、Agent の概念(→ 01-concepts)、個別モデルの情報(→ 03-implementation のモデルガイド)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [how-llms-generate-text.md](how-llms-generate-text.md) | LLM はどうやってテキストを生成するか(次トークン予測・サンプリング・非決定性の由来) |
| [tokenization.md](tokenization.md) | トークナイザとトークン経済(課金・コンテキスト・多言語効率の単位) |
| [attention-and-context.md](attention-and-context.md) | 注意機構とコンテキストウィンドウの仕組み(KV キャッシュ・長文の品質劣化) |
| [llm-training-pipeline.md](llm-training-pipeline.md) | LLM の学習パイプライン(事前学習 → SFT → 選好調整と、幻覚・迎合の由来) |
| [capabilities-and-limits.md](capabilities-and-limits.md) | LLM の能力と限界の由来(得意・不得意の構造とツールによる補完) |
| [reasoning-models.md](reasoning-models.md) | 推論モデル(考える時間を使う LLM。仕組みの直感・向き不向き・思考量制御・overthinking・評価) |

読む順序はこの表の並びを推奨します(生成の仕組み → トークン → 注意機構 → 学習 → 能力 → 推論モデルの順で積み上がります)。
