# mcp-server — 最小の MCP サーバー(Python)

MCP(Model Context Protocol)で 2 つのツールを公開する最小のサーバーです。**読み取り専用ツール**と**書き込み(実行)ツール**を並べ、権限・上限の考え方をコードとコメントで示します。次のドキュメントの内容を実装しています。

- [ツール接続標準(MCP とエコシステム)](../../../docs/03-implementation/mcp-and-tool-protocols.md) — MCP の位置づけと接続の実務

関連する権限設計:

- [ツール権限設計とサンドボックス](../../../docs/06-security/tool-permissions-and-sandboxing.md) — ツール側で認可を強制する
- [エージェントの認証・認可](../../../docs/06-security/agent-identity-and-auth.md) — 誰の権限で実行するか

## このサンプルの要点

- **権限はツール実装側で強制**: `submit_expense` は金額上限を実装側でチェックし、高額は自動提出せず承認が必要と返します。実際の承認フローへの登録は実装していません
- **読み取りと書き込みを分ける**: `get_expense_policy`(副作用なし)と `submit_expense`(実行)を別ツールにしています
- **自己テストで検証可能**: `--mock` は mcp パッケージなしでツール関数を直接呼び、上限チェックの動作を確認します
- **業務エラーもプロトコルで区別**: 不正な金額は本体で `ValueError` を発生させ、MCP の登録関数が `ToolError` に変換します。クライアントは `isError=true` として受け取り、通常の受理・承認待ちの結果と区別できます

## 前提

- Python 3.11 以降(`--mock` の自己テストは追加依存なし・標準ライブラリのみで動きます)
- 実サーバー起動時のみ: `pip install -r requirements.txt`(`mcp` パッケージ)と、接続する MCP クライアント

固定 SDK は `mcp==2.2.0` です。サーバーは `MCPServer` を使い、2026-07-28 の要求方式と 2025-11-25 の初期化方式を扱います。Python 側の結果は `is_error`、通信の JSON は `isError` です。v1 の `FastMCP` からの差分は [公式移行ガイド](https://py.sdk.modelcontextprotocol.io/migration/) を参照してください(アクセス日: 2026-09-10)。

## 実行

```bash
# 自己テスト(mcp パッケージ不要・API キー不要): ツール動作と上限チェックを確認
python mcp_server.py --mock

# 実 MCP サーバーとして起動(stdio。MCP クライアントから接続する)
pip install -r requirements.txt
python mcp_server.py
```

## 動作確認日

- **自己テスト(`--mock`)**: 2026-09-10 に確認(Python 3.11.3、追加依存なし)
- **実 MCP サーバー起動(クライアント接続)**: 2026-09-10 に確認(Python 3.11.3、mcp 2.2.0、ローカル stdio)。`Client(mode="auto")` の server/discover(2026-07-28)、`Client(mode="legacy")` の initialize(2025-11-25)、両方式の list_tools・call_tool と、不正金額の `isError=true`、通常受理・高額の承認案内を確認([実行手順](../../tests/README.md))

## TODO・未確認事項

> **TODO(要確認):** MCP 仕様・`mcp` SDK は更新が速いため、SDK 更新時に公式の Tools 仕様と MCPServer / Client API を確認し、stdio 回帰テストを再実行する。接続先ホストの権限設定と利用者別の認証・認可は別途確認する(最終確認: 2026-09)
