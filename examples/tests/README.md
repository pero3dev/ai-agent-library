# Python サンプルの境界回帰テスト

Python 3.11 以降で、リポジトリ直下から実行します。固定 SDK の通信形式まで確認するため依存の導入が必要です。実 LLM API は呼ばず、API キーも不要です。

```bash
python -m pip install -r examples/tests/requirements.txt
python -X utf8 -B -m unittest discover -s examples/tests -v
```

確認するのは、分類ラベルの否定・余分な説明の誤合格、生成の打ち切りと拒否、ツール結果の成功・失敗と ID の対応、継続回数上限、無効な年月、計画の空・欠落・重複、取得失敗時の部分結果、MCP の業務エラー分類です。通常の 5 件のモック実行も含みます。

Anthropic は `httpx.MockTransport` を使い、実 SDK の応答解析と要求生成を通します。MCP は実 SDK のクライアントとサーバーをローカル stdio で接続します。実サービスの品質・可用性・費用、認証・認可の受入検査は対象外です。

動作確認日: 2026-09-10(Python 3.11.3、anthropic 0.116.0、mcp 1.28.1)。

対象サンプル: [ツール使用](../python/tool-use/README.md) / [構造化出力](../python/structured-output/README.md) / [評価ハーネス](../python/evaluation-harness/README.md) / [RAG](../python/rag-basics/README.md) / [MCP](../python/mcp-server/README.md) / [マルチエージェント](../python/multi-agent/README.md)
