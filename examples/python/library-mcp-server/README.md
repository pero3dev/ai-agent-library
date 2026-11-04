# library-mcp-server — ライブラリ検索MCPサーバー

AI Agent Libraryの公開索引から、必要な記事・チェックリスト・節・用語を取得する読み取り専用のPythonサンプルです。[ツール接続標準](../../../docs/03-implementation/mcp-and-tool-protocols.md)の実装例として、標準ライブラリのツール本体とMCP登録を分けています。

## 使えるツール

| ツール | 入力 | 結果 |
| --- | --- | --- |
| `search_articles` | `query`, `limit`（1〜10、既定5） | slug・タイトル・説明・最終更新日・URL。記事本文は含まない |
| `get_checklist` | `slug`, `offset`（既定0） | チェックリストと出典。長い場合は続きの取得方法 |
| `get_section` | `slug`, `heading`, `offset`（既定0） | 指定した見出しから次の同等以上の見出しまでのMarkdown |
| `lookup_glossary` | `term` | 用語の定義とURL |

slugは `concepts/tool-use` のように検索結果の値を使います。節の見出しは記事の表記を使い、重複して曖昧な場合はエラーになります。未知のslug・見出し・用語や不正な入力は、MCPの `isError=true`（SDKの `ToolError`）で返します。

各結果は、内容を資料として扱う前置き、出典URL、最終更新日、CC BY 4.0の表示と著作者、キャッシュの状態を含みます。用語の個別更新日は索引にないため不明と表示します。取得日時を記事の最終更新日へ置き換えません。記事には攻撃文の例も含まれます。ホスト側でも取得内容を命令として実行しない設計にしてください。

## 起動

Python 3.11以降を使います。ツール本体・自己テスト・検索評価は標準ライブラリだけで動き、APIキーは不要です。実stdio起動だけ、既存の最小MCPサンプルと同じ `mcp==2.2.0`（`MCPServer`）を使います。

```bash
cd examples/python/library-mcp-server
python -m venv .venv
# Windows: .venv\Scripts\python.exe、macOS/Linux: .venv/bin/python を以下のpythonに使う
python -m pip install -r requirements.txt
python mcp_server.py --mock
python mcp_server.py
```

`--mock` は固定fixtureを使う自己テストです。SDKも通信も使いません。通常起動はstdioで待ち受けるため、単体で起動した端末には結果を表示しません。診断はstderr、プロトコルだけをstdoutへ出します。

```bash
python mcp_server.py --cache-dir /absolute/path/to/cache
python mcp_server.py --cache-dir /absolute/path/to/cache --offline
python -m unittest discover -s . -p test_library.py -v
```

## 取得とキャッシュ

同梱スナップショットは初回オフラインで使える一方、記事の更新を二重管理します。このサンプルは公開済みの `https://pero3dev.github.io/ai-agent-library/library-index.json` と、索引で検証した同じサイトの `/docs/<chapter>/<article>.md` だけをHTTPS取得する方式です。任意URL・リダイレクトは受け付けません。検索語などの利用者の入力は外部送信しません。通信のタイムアウトは10秒、取得上限は索引4 MiB・記事1 MiBです。

索引と取得した記事を24時間キャッシュします。既定の保存先はWindowsで `%LOCALAPPDATA%/ai-agent-library/mcp`、macOS/Linuxで `${XDG_CACHE_HOME:-~/.cache}/ai-agent-library/mcp`、CLIの `--cache-dir` でも明示できます。索引は `library-index.json`、記事は取得URLのSHA256に `.json` を付けたファイルに保存し、書き込みは一時ファイルから置き換えます。期限が切れたら再取得し、通信できないときは検証済みの保存内容を鮮度状態付きで使います。初回や、必要な記事をまだ取得していない状態では、通信失敗・`--offline` は明示エラーです。破損キャッシュや未知のスキーマ版は使いません。キャッシュは利用者のローカルデータであり、署名や発行者真正性の検証を提供するものではありません。

ツールが返すJSONテキスト全体を12,000 Unicode文字以内に制限し、切り詰めた結果には `truncated` と `continuation` が付きます。`get_section` のoffsetは節内のUnicode文字数、`get_checklist` は項目番号で、返されたoffsetで続きを取得します。単一項目自体が大きい場合や用語定義の全文は出典URLで確認します。検索結果が省略された場合は条件を絞ってください。

検索はタイトル・タグ・slug・説明・見出しの得点と、任意の`search_sections`に含まれる見出し単位の本文BM25（日本語bigram・英語語単位）を組み合わせます。各得点を最大値で正規化して同じ重みで加え、本文は最も合う節の得点を使います。検索結果に返すのは記事メタデータだけです。旧索引で`search_sections`がなければ従来の方式に戻ります。索引は引き続き`schema_version: 1`で、既存フィールドの意味は変わりません。

## Claude Codeへの接続

依存を入れたPythonとスクリプトの絶対パスを指定します。次は手元で実行する設定例です。

```bash
claude mcp add --transport stdio --scope local ai-agent-library -- /absolute/path/to/.venv/bin/python -X utf8 /absolute/path/to/library-mcp-server/mcp_server.py
claude mcp get ai-agent-library
claude mcp list
```

Windowsでは実行ファイルを `C:/path/to/.venv/Scripts/python.exe`、スクリプトを `C:/path/to/library-mcp-server/mcp_server.py` に置き換えます。起動後に `/mcp` で4ツールの接続状態と説明を確認し、「ツール使用に関する記事を検索し、上位の記事のチェックリストを取得して」と依頼します。設定を外すときは `claude mcp remove ai-agent-library --scope local` を使います。

## Claude Desktopへの接続

Settings → Developer → Edit Configで開いた `claude_desktop_config.json` の既存 `mcpServers` に次の項目を追加し、アプリを完全終了して起動し直します。既存の設定を置き換えないでください。

```json
{
  "mcpServers": {
    "ai-agent-library": {
      "command": "C:/path/to/.venv/Scripts/python.exe",
      "args": ["-X", "utf8", "C:/path/to/library-mcp-server/mcp_server.py"],
      "env": { "PYTHONIOENCODING": "utf-8" }
    }
  }
}
```

macOS/Linuxでは `command` をvenvのPython、`args` のスクリプトを実際の絶対パスにします。コネクター一覧から4ツールを確認します。キャッシュ場所を固定する場合は `args` の末尾に `"--cache-dir", "/absolute/path/to/cache"` を追加します。

接続手順の一次情報（2026-11-04確認）: [Claude Code MCP](https://code.claude.com/docs/en/mcp)、[ローカルサーバーの接続](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers)、[Python SDK](https://py.sdk.modelcontextprotocol.io/)、[MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)。これらの手順の参照と、実クライアントでの動作確認は別です。

## 検索評価

[Agent評価の基礎](../../../docs/04-evaluation/agent-evaluation-basics.md)に沿い、部品であるメタデータ検索を評価します。`evaluation.json` の30問は期待slugと採択理由を固定し、日本語・英語・言い換え・近接概念などに分けています。development 20問とholdout 10問を区別し、期待する記事の上位5件への包含率、top1、MRR@5、失敗したケースを出します。

```bash
python evaluate.py --output /absolute/path/to/evaluation-result.json
# 保存した索引なら通信なしで再現できる
python evaluate.py --index /absolute/path/to/library-index.json --output /absolute/path/to/evaluation-result.json
# 明示した下限を検査するときだけ失敗終了する
python evaluate.py --index /absolute/path/to/library-index.json --min-hit-rate 0.8
```

データセット・索引のSHA256と全ケースの順位を結果に保存します。[2026-11-04の初回結果](https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-11-04/library-mcp-search-evaluation.json)は、公開199記事に対しTop5が29/30（96.67%）、Top1が24/30（80%）、MRR@5が0.87222でした。developmentは20/20、holdoutは9/10です。「AIの答えを鵜呑みにせず裏付けを確認する」から `human-ai/verifying-ai-outputs` を見つける1問が未達で、期待ラベルと検索方式を変えず改善の残件としています。

30問は設計者が作ったシナリオで、実利用者の分布・本文の事実精度・実Agentのツール選択や回答品質の評価ではありません。holdoutも初回の結果確認後は既知になるため、その後の改善には新しい未見ケースが必要です。

Issue #349では、別担当の10件を含む`evaluation-unseen.json`の新30件を比較前のcommitで固定しました。既存development20件で選んだ本文BM25併用方式は、新30件のTop1が7/30→8/30、Top5が14/30→16/30、MRR@5が0.31667→0.36167となり採用しました。14件はなおTop5外です。新セットも測定後は既知で、質問・ラベル・方式をその結果で調整していません。[比較記録と全順位](https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-11-04/library-search-evaluation.md)に精度・索引増分・初回と継続検索の時間を記載しています。

`compare_search.py`は現行変更前の方式を固定した実験用baselineと、見出し重みの別案・本文BM25を比較します。まずdevelopmentだけで選択を保存し、続いて固定した未見セットを一度測ります。再現は通信なしで、同じ保存索引と記事正本を使ってください。実施済みの出力は上書きしません。再現の結果は追加の独立質問として数えません。

```bash
python compare_search.py --phase development --repo /path/to/repo --index /path/to/baseline-library-index.json --output /tmp/development.json
python compare_search.py --phase holdout --repo /path/to/repo --index /path/to/baseline-library-index.json --selection /tmp/development.json --output /tmp/holdout.json
```

## 動作確認日と制約

- 2026-11-04、Windows・Python 3.12.14: `python -S mcp_server.py --mock` が成功（追加依存・通信なし）。標準ライブラリの単体31試験が成功。
- 同日、`mcp==2.2.0` の実stdioで2026-07-28と2025-11-25の両方式を確認。4ツールの列挙・正常呼び出し・業務エラー・型不正と必須引数欠落の `isError`、出典付き応答、返却上限が成功。プロトコル自体が壊れた要求へのJSON-RPCエラーは、ツール結果の前置き・出典表示の対象外です。
- 同日、固定HTTPSの公開索引と記事で4ツールの直接呼び出しが成功し、取得済みキャッシュでの完全オフライン結果が一致。これはツール本体の実通信で、MCPホストでの呼び出しではありません。
- Claude Code・Claude Desktopでの実接続とLLMによるツール選択は未実施。上記のstdio回帰と区別します。
- 同日の検索改善後、標準ライブラリ単体36件、横断回帰全57件が成功。2026-07-28・2025-11-25の両stdioで本文だけの語から検索でき、本文を返さないことも確認しました。旧索引fallback、不正な本文配列、検索情報の更新、12,000文字上限の回帰を含みます。

横断試験の手順は [回帰試験README](../../tests/README.md)、設計判断と評価結果は [実施記録](https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-11-04/library-mcp-server.md)にまとめます。

ローカルstdio専用です。書き込みツール、利用者別の認証・認可、埋め込み検索、リモートHTTP公開、パッケージ配布は含みません。初回取得には通信が必要です。記事・索引の更新タイミングには差があり、キャッシュの内容を厳密に同一版へ固定する機能はありません。実クライアントの設定をこのサンプルから自動変更しません。

節抽出はATX（`## 見出し`）・Setext見出しとコードフェンスを扱う簡易パーサーです。CommonMark全体の解析ではなく、HTMLコメント・HTMLブロック内の見出し風の行を区別しません。現行記事での利用に加え、将来その表記が増える場合は原文と照合し、パーサーと回帰例を拡張してください。
