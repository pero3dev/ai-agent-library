# Python サンプルの境界回帰テスト

Python 3.11 以降で、リポジトリ直下から実行します。固定 SDK の通信形式まで確認するため依存の導入が必要です。実 LLM API は呼ばず、API キーも不要です。

```bash
python -m pip install -r examples/tests/requirements.txt
python -X utf8 -B -m unittest discover -s examples/tests -v
```

確認するのは、分類ラベルの否定・余分な説明の誤合格、生成の打ち切りと拒否、ツール結果の成功・失敗と ID の対応、継続回数上限、無効な年月、計画の空・欠落・重複、取得失敗時の部分結果、MCP の業務エラー分類です。7件のモック実行も含みます。

Anthropic は `httpx2.MockTransport` を使い、実 SDK の応答解析と要求生成を通します。MCP は `Client` と `MCPServer` をローカル stdio で接続し、`mode="auto"` の 2026-07-28 と `mode="legacy"` の 2025-11-25 の両方式を検証します。Python の `is_error` と JSON の `isError` の対応も確認します。実サービスの品質・可用性・費用、認証・認可の受入検査は対象外です。

2026-11-04の検索改善後の実行結果は57テスト成功です。既存17件と、ライブラリMCPの標準ライブラリ単体36件・stdio両方式2件・追加依存を無効にした`python -S --mock` 1件・SDKエラーメタデータ保持1件です。既存6サンプルのモックは1テスト内のサブテスト、新サンプルのモックは独立した1テストとして数えます。

動作確認日: 2026-11-04(Windows、Python 3.12.14、anthropic 1.4.0、httpx2 2.12.0、mcp 2.2.0)。実SDKとローカルstdioを確認した結果で、Claude Code・Claude Desktopなど実ホストの接続確認ではありません。

対象サンプル: [ツール使用](../python/tool-use/README.md) / [構造化出力](../python/structured-output/README.md) / [評価ハーネス](../python/evaluation-harness/README.md) / [RAG](../python/rag-basics/README.md) / [MCP](../python/mcp-server/README.md) / [マルチエージェント](../python/multi-agent/README.md) / [ライブラリMCP](../python/library-mcp-server/README.md)

## ライブラリMCPの検証範囲

`test_library_mcp.py`は一時ディレクトリに小さな索引・記事キャッシュを作り、サーバーを`--offline --cache-dir`で実プロセスとして起動します。公開サイトやLLM APIへの通信はありません。新旧両方式で4ツールの一覧・入力スキーマ・読み取り専用の注記、正常結果、未知slug・見出し・用語・不正な検索件数の`isError`を確認します。型不正・必須引数の欠落・未知ツールを含むエラーにも、資料の前置き・出典・更新日・ライセンスが付き、応答が12,000文字以内であることを照合します。

同サンプルの`test_library.py`は`load_tests`で既存のCIコマンドへ収集します。キャッシュの有効期限・通信失敗とオフライン・破損、固定URLと取得上限、節の境界とコード例中の偽見出し、重複見出し、返却の上限と続きの取得を標準ライブラリだけで検証します。検索評価の指標計算も小さなfixtureで確認し、30問を公開索引に対して採点する[評価スクリプト](../python/library-mcp-server/evaluate.py)の実測とは区別します。

検索改善の回帰には、任意の`search_sections`を持つ索引で本文だけの語を検索し、結果へ本文を返さないこと、旧索引のfallback、本文の変更後に得点情報を作り直すこと、不正な本文配列と応答上限を含めます。両方式の実stdioにも本文だけの検索を追加しました。新しい未見30件は比較前に固定し、単体試験では件数と出題者の区分だけを確認します。未見の検索採点をCIで反復して未見評価と扱いません。

## SDK 更新時の確認

Anthropic 1.0 以降は HTTP クライアントが `httpx2` です。旧 `httpx` のパッチやモックは SDK 通信を捕捉しないため、クライアント・レスポンス・MockTransport を一緒に変更します。サンプルは Messages API を使い、削除されたサンプリング引数や Text Completions API は使っていません。MCP 2 系も `httpx2` を使用します。

- [Anthropic Python SDK 移行ガイド](https://github.com/anthropics/anthropic-sdk-python/blob/v1.4.0/MIGRATION.md)(アクセス日: 2026-09-10)
- [MCP Python SDK 移行ガイド](https://py.sdk.modelcontextprotocol.io/migration/)(アクセス日: 2026-09-10)

HTTP モックは TLS 接続を検証しません。`httpx2` は OS の証明書ストアを使うため、社内 CA や最小コンテナーを使う実環境では信頼ストアの設定も確認してください。
