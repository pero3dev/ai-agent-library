# 01-concepts — 基礎概念

実装やフレームワークに依存しない、AI Agent の基礎概念を解説するセクションです。ここのドキュメントは他の全セクションから前提知識として参照されます。

- **置くもの**: 概念の定義・分類・動作原理・歴史的経緯
- **置かないもの**: 特定フレームワークの API 解説(→ 03-implementation)、設計判断のトレードオフ詳細(→ 02-architecture)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [what-is-an-ai-agent.md](what-is-an-ai-agent.md) | AI Agent とは何か(定義・分類: 会話型・ツール実行型・コンピュータ操作型) |
| [agent-loop.md](agent-loop.md) | Agent ループ(観測・思考・行動のサイクル) |
| [tool-use.md](tool-use.md) | ツール使用(Tool Use / Function Calling。自前実装と MCP 等の標準プロトコルの関係を含む) |
| [memory-and-state.md](memory-and-state.md) | メモリと状態管理(短期・長期・外部記憶、セッション管理と履歴圧縮を含む) |
| [planning-and-reasoning.md](planning-and-reasoning.md) | プランニングと推論 |
| [rag-vs-agent.md](rag-vs-agent.md) | RAG と Agent の関係・使い分け |
| [single-vs-multi-agent.md](single-vs-multi-agent.md) | シングルエージェントとマルチエージェント |
| [computer-use-and-multimodal-agents.md](computer-use-and-multimodal-agents.md) | コンピュータ操作型・マルチモーダル Agent(画面観測ループの特性とリスク) |
