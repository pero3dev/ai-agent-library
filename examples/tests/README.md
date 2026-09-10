# Python サンプルの境界回帰テスト

Python 3.11 以降で、リポジトリ直下から実行します。固定 SDK の通信形式まで確認するため依存の導入が必要です。実 LLM API は呼ばず、API キーも不要です。

```bash
python -m pip install -r examples/tests/requirements.txt
python -X utf8 -B -m unittest discover -s examples/tests -v
```

確認するのは、分類ラベルの否定・余分な説明の誤合格、生成の打ち切りと拒否、ツール結果の成功・失敗と ID の対応、継続回数上限、無効な年月、計画の空・欠落・重複、取得失敗時の部分結果、MCP の業務エラー分類です。通常の 6 件のモック実行も含みます。

Anthropic は `httpx2.MockTransport` を使い、実 SDK の応答解析と要求生成を通します。MCP は `Client` と `MCPServer` をローカル stdio で接続し、`mode="auto"` の 2026-07-28 と `mode="legacy"` の 2025-11-25 の両方式を検証します。Python の `is_error` と JSON の `isError` の対応も確認します。実サービスの品質・可用性・費用、認証・認可の受入検査は対象外です。

実行結果は 17 テスト成功です(モック実行 6 件は 1 テスト内のサブテスト)。

動作確認日: 2026-09-10(Python 3.11.3、anthropic 1.4.0、httpx2 2.12.0、mcp 2.2.0)。

対象サンプル: [ツール使用](../python/tool-use/README.md) / [構造化出力](../python/structured-output/README.md) / [評価ハーネス](../python/evaluation-harness/README.md) / [RAG](../python/rag-basics/README.md) / [MCP](../python/mcp-server/README.md) / [マルチエージェント](../python/multi-agent/README.md)

## SDK 更新時の確認

Anthropic 1.0 以降は HTTP クライアントが `httpx2` です。旧 `httpx` のパッチやモックは SDK 通信を捕捉しないため、クライアント・レスポンス・MockTransport を一緒に変更します。サンプルは Messages API を使い、削除されたサンプリング引数や Text Completions API は使っていません。MCP 2 系も `httpx2` を使用します。

- [Anthropic Python SDK 移行ガイド](https://github.com/anthropics/anthropic-sdk-python/blob/v1.4.0/MIGRATION.md)(アクセス日: 2026-09-10)
- [MCP Python SDK 移行ガイド](https://py.sdk.modelcontextprotocol.io/migration/)(アクセス日: 2026-09-10)

HTTP モックは TLS 接続を検証しません。`httpx2` は OS の証明書ストアを使うため、社内 CA や最小コンテナーを使う実環境では信頼ストアの設定も確認してください。
