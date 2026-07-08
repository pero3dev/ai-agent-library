# mcp-server — 最小の MCP サーバー(Python)

MCP(Model Context Protocol)で 2 つのツールを公開する最小のサーバーです。**読み取り専用ツール**と**書き込み(実行)ツール**を並べ、権限・上限の考え方をコードとコメントで示します。次のドキュメントの内容を実装しています。

- [ツール接続標準(MCP とエコシステム)](../../../docs/03-implementation/mcp-and-tool-protocols.md) — MCP の位置づけと接続の実務

関連する権限設計:

- [ツール権限設計とサンドボックス](../../../docs/06-security/tool-permissions-and-sandboxing.md) — ツール側で認可を強制する
- [エージェントの認証・認可](../../../docs/06-security/agent-identity-and-auth.md) — 誰の権限で実行するか

## このサンプルの要点

- **権限はツール実装側で強制**: `submit_expense` は金額上限を実装側でチェックし、高額は自動提出せず承認へ回します(プロンプトのお願いに頼らない)
- **読み取りと書き込みを分ける**: `get_expense_policy`(副作用なし)と `submit_expense`(実行)を別ツールにしています
- **自己テストで検証可能**: `--mock` は mcp パッケージなしでツール関数を直接呼び、上限チェックの動作を確認します

## 前提

- Python 3.11 以降(`--mock` の自己テストは追加依存なし・標準ライブラリのみで動きます)
- 実サーバー起動時のみ: `pip install -r requirements.txt`(`mcp` パッケージ)と、接続する MCP クライアント

## 実行

```bash
# 自己テスト(mcp パッケージ不要・API キー不要): ツール動作と上限チェックを確認
python mcp_server.py --mock

# 実 MCP サーバーとして起動(stdio。MCP クライアントから接続する)
pip install -r requirements.txt
python mcp_server.py
```

## 動作確認日

- **自己テスト(`--mock`)**: 2026-07-09 に確認(Python 3.10、追加依存なし)
- **実 MCP サーバー起動(クライアント接続)**: 未確認(`mcp` パッケージ導入と MCP クライアントでの接続を各自の環境で確認し、この欄に日付を追記してください)

## TODO・未確認事項

> **TODO(要確認):** MCP 仕様・`mcp` SDK(FastMCP の API)は更新が速い。実サーバー起動時に現行リビジョンと `from mcp.server.fastmcp import FastMCP` / `mcp.run()` の API を公式で確認する。本サンプルは自己テストのみ検証済み、実サーバー起動は未確認(最終確認: 2026-07)
