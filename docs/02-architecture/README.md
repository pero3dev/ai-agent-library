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
| [orchestration-patterns.md](orchestration-patterns.md) | オーケストレーションパターン(直列・並列・階層・ルーター。外部エージェント連携・A2A 等の標準プロトコルの概観を含む) |
| [human-in-the-loop.md](human-in-the-loop.md) | Human-in-the-Loop 設計(承認・介入ポイントの置き方) |
| [error-handling-and-retries.md](error-handling-and-retries.md) | エラー処理・リトライ・フォールバック設計 |
