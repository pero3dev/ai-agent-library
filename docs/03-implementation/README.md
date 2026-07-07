# 03-implementation — 実装ガイド

「どう書くか」を扱うセクションです。実装パターン・コード例・フレームワークの比較を提供します。概念の説明は 01-concepts へのリンクで済ませ、重複解説しません。

- **置くもの**: 実装パターン、コード例(または `examples/` への参照)、ツール接続、ユーザー向け応答の実装パターン(ストリーミング・進捗提示・中断)、フレームワーク・モデルの選定ガイド
- **置かないもの**: 概念の再説明(→ 01-concepts)、動くコード一式(→ `examples/`)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [tool-definition-design.md](tool-definition-design.md) | ツール定義の設計(命名・スキーマ・説明文・エラー返却) |
| [agent-prompt-design.md](agent-prompt-design.md) | Agent 向けプロンプト設計(システムプロンプトの構造化) |
| [structured-output.md](structured-output.md) | 構造化出力(スキーマ強制・検証・リトライ) |
| [mcp-and-tool-protocols.md](mcp-and-tool-protocols.md) | ツール接続標準(MCP とエコシステム。自前ツールとの使い分け) |
| [streaming-and-agent-ux.md](streaming-and-agent-ux.md) | ストリーミングと Agent の UX 実装パターン(進捗提示・中断・軌道修正) |
| [framework-selection.md](framework-selection.md) | フレームワーク選定ガイド |
| [model-selection.md](model-selection.md) | モデル選定ガイド(判断軸・用途別の使い分け・ティア混在設計) |
| [llm-landscape.md](llm-landscape.md) | 主要 LLM の全体像(プロバイダー別カタログ。鮮度リスク集約ページ) |
| [rag-implementation-patterns.md](rag-implementation-patterns.md) | RAG 実装パターン(チャンキング・検索方式・リランキング・Agentic RAG・権限反映) |
| [long-term-memory-implementation.md](long-term-memory-implementation.md) | 長期記憶の実装(抽出・保存・想起・忘却・プライバシー) |
| [prompt-management.md](prompt-management.md) | プロンプト資産の管理とバージョニング(テンプレート化・変更フロー・実験の記録) |
| [computer-use-implementation.md](computer-use-implementation.md) | ブラウザ・コンピュータ操作の実装(要素特定・待機と検証・安全策) |
| [voice-agents.md](voice-agents.md) | 音声エージェントの実装(パイプライン vs speech-to-speech・会話制御・評価) |
| [fine-tuning-and-distillation.md](fine-tuning-and-distillation.md) | ファインチューニングと蒸留(選ぶ前の判断・手法概観・データ準備・運用) |
| [prompt-engineering-fundamentals.md](prompt-engineering-fundamentals.md) | プロンプトエンジニアリングの基礎技法(汎用技法カタログ。Agent 特化記事の前提) |
