# 03-implementation — 実装ガイド

「どう書くか」を扱うセクションです。実装パターン・コード例・フレームワークの比較を提供します。概念の説明は 01-concepts へのリンクで済ませ、重複解説しません。

- **置くもの**: 実装パターン、コード例(または `examples/` への参照)、ツール接続、ユーザー向け応答の実装パターン(ストリーミング・進捗提示・中断)、フレームワーク選定ガイド
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
