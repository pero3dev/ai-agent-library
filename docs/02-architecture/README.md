# 02-architecture — 設計・アーキテクチャパターン

「どう作るべきか」の設計判断を扱うセクションです。判断基準・トレードオフ・アンチパターンを中心に構成し、コード片は最小限にとどめます。

- **置くもの**: 設計判断の基準、アーキテクチャパターン、トレードオフ表、アンチパターン
- **置かないもの**: 概念の入門解説(→ 01-concepts)、具体的な実装手順(→ 03-implementation)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [workflow-vs-agent.md](workflow-vs-agent.md) | Workflow 型 vs Agent 型の使い分け(過剰な Agent 化を防ぐ) |
| [context-engineering.md](context-engineering.md) | コンテキストエンジニアリング(何を・いつ・どれだけ渡すか) |
| [context-engineering-patterns.md](context-engineering-patterns.md) | コンテキスト設計の実践パターン(レイアウト・予算・取得戦略・前処理・統合・計測) |
| [context-compaction-and-isolation.md](context-compaction-and-isolation.md) | コンテキストの圧縮と隔離(トリガ設計・残すもの・外部化・サブエージェント隔離・仕切り直し) |
| [orchestration-patterns.md](orchestration-patterns.md) | オーケストレーションパターン(直列・並列・階層・ルーター。外部エージェント連携・A2A 等の標準プロトコルの概観を含む) |
| [human-in-the-loop.md](human-in-the-loop.md) | Human-in-the-Loop 設計(承認・介入ポイントの置き方) |
| [error-handling-and-retries.md](error-handling-and-retries.md) | エラー処理・リトライ・フォールバック設計 |
| [harness-engineering.md](harness-engineering.md) | ハーネスエンジニアリング(モデルの外側=ループ・ツール・フィードバック・環境を一級の設計対象にする全体設計論) |
| [loop-engineering.md](loop-engineering.md) | ループエンジニアリング(ループの型・停止条件の詳解・再計画・迷走の検知と介入・バックトラック・入れ子) |
| [async-and-durable-agents.md](async-and-durable-agents.md) | 非同期・長時間タスクの設計(チェックポイント・冪等性・承認待ちの永続化・耐久実行) |
| [multi-tenancy-and-isolation.md](multi-tenancy-and-isolation.md) | マルチテナント設計(データ・設定・レート・コストの 4 軸分離、ノイジーネイバー対策) |
| [agent-api-design.md](agent-api-design.md) | エージェントの API 設計(ジョブ型 API・ステータスモデル・冪等キー・部分結果・メータリング) |
