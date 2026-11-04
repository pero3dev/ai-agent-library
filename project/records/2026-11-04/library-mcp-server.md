# 読み取り専用ライブラリ MCP サーバー

## 作業契約

- 目的: Issue [#334](https://github.com/pero3dev/ai-agent-library/issues/334) の4ツールを実装し、検索評価・実stdio回帰・CIを経てmain反映とcompleted Closeまで完了する。
- 入口: このworktreeの `AGENTS.md`、`ROADMAP.md` の継続作業入口、`CONTRIBUTING.md` のサンプル・提出前・ハーネス規約、`harness/writing-rules.md` のサンプル規約、`harness/structure.json`、`harness/git-rules.md` を適用する。
- 元HEAD: `59411bdd24be38abada80f0a8b569d4f6d7bc993`。専用worktree `.local/library-mcp`、ブランチ `feat/library-mcp-server`。元worktreeの未保存変更は保持する。
- 所有範囲: `examples/python/library-mcp-server/`、`examples/tests/` の追加回帰と関連設定、必要なCI/配置検査、サンプル索引と対応記事の逆リンク、本記録とproject索引。
- 許可根拠: ユーザーの「#334のIssueも同様に」と、先行依頼のbranch・commit・push・PR・merge・Closeまでの明示許可。Issue本文のmerge保守者判断には、このセッションの許可を適用する。
- 範囲外: リモート公開、PyPI・Registry・MCPB配布、認証、書き込みツール、有料API、後続#335。
- 必要な検証: 依存準備、標準ライブラリのみのmock、キャッシュ/入力/上限/節抽出の単体試験、SDK2.2.0で2026-07-28と2025-11-25の実stdio、約30問の検索評価、`npm run check`、独立レビュー、PR必須CIとmain反映・必要な公開確認。
- 終了条件: 4ツール・README・評価結果・CI統合が揃い、最終treeのレビューと検証、PRマージ、main CI、証拠コメントとIssue CloseのGET再確認を完了する。

## 配置と取得方式

自己完結した学習用の実装として `examples/python/library-mcp-server/` に置く。新しいトップレベルディレクトリや配布パッケージは作らない。MCP登録と標準ライブラリの本体を分け、既存サンプルの `mcp==2.2.0` を維持する。

索引を同梱する方式は初回オフラインで使える反面、199記事と用語の更新を二重管理する。固定HTTPSの公開索引を取得し、検証した索引と要求された記事だけをキャッシュする方式を採用する。初回の通信失敗は明示エラー、取得済みキャッシュがある場合は鮮度状態を表示して利用できる設計にする。任意URLやリダイレクト先からは取得しない。

## 検証結果

2026-11-04、Windows・Python 3.12.14、SDK `mcp==2.2.0` で実行する。`python -S mcp_server.py --mock` と標準ライブラリの単体31件が成功。ローカル実stdioは2026-07-28と2025-11-25の両方式で、4ツールのlist/call、業務エラー・型不正・必須引数欠落・未知ツールの `isError`、出典付き応答、12,000文字上限を確認した。JSON-RPC要求自体のプロトコルエラーとツール結果を区別する。

固定HTTPSを使うツール本体の実通信では4ツールすべてが成功し、保存後の完全オフライン結果と資料部分が一致した（実取得日時: `2026-11-04T01:20:09.330656Z`）。用語更新日は索引にないためnullを維持する。Claude Code・Claude Desktopの実接続、LLMによるツール選択・回答品質は未実施。有料APIは使用していない。

索引と記事は10秒の通信タイムアウト、4 MiB/1 MiBの取得上限、24時間TTL。Windowsの `%LOCALAPPDATA%/ai-agent-library/mcp`、その他のXDG cache（未指定時 `~/.cache`）配下が既定。`--cache-dir` と `--offline` を用意した。すべての取得先は固定サイトの検証済みURLで、リダイレクトは拒否する。既存キャッシュは型・URL・版・サイズを再検証し、失敗時は利用可否と鮮度を応答に示す。

Python依存の `pip_audit --strict` は既知脆弱性なしで成功。CIは既存 `examples` ジョブのunittest discoverに新旧stdio・mock・標準ライブラリ試験を統合した。配置契約内の追加なので `harness/structure.json` とCIのコマンドは変更不要。

Python横断試験は最終52件（既存17、標準ライブラリ31、新旧stdio2、SDK無効のmock1、エラーメタデータ保持1）がすべて成功。`npm ci` で依存を準備し、`npm run check` が成功した。WindowsのNode単体は1,579件中1,475成功・104 skip・失敗0で、POSIX/権限が必要な未実施を成功扱いしない。サイト単体110件も成功した。公開相当の `build:clean` は231ルート・233 HTML・AI出力219ファイルを検査し、ルート網羅とCSP・metadata検査が成功した。

## 検索評価と残件

[初回の全30問の結果](library-mcp-search-evaluation.json)を保存した。実測は `2026-11-04T01:18:15.302646Z`、公開199記事、索引canonical SHA256 `bc8b419be7b640ab9e3646738f78880c118709f3dfe816425bbbc326e71c1008`。Top5包含率は29/30（96.67%）、Top1は24/30（80%）、MRR@5は0.87222。development20/20、holdout9/10。質問・期待slug・採択理由・質問類型はサンプルの `evaluation.json` で固定した。

未達はsearch-27「AIの答えを鵜呑みにせず裏付けを確認する」→ `human-ai/verifying-ai-outputs`。holdout測定後にラベルや重みを合わせず、そのまま残す。今後は実利用で生じた失敗を収集し、新たな未見セットで言い換えへの対応を比較する。現30問は設計者のシナリオで、母集団を代表する標本、実Agent品質、本文の事実確認の成績ではない。

任意の学習ルート取得、埋め込み検索、署名付き配布・厳密な同一版への固定、HTTP認可・配布登録は実装しない。今回の終了条件に含まれない。

独立コードレビューのshouldとして、HTMLコメント・HTMLブロック内の見出し風行を簡易節パーサーが区別しない制約をREADMEに明記した。現199記事の見出し例では影響が確認されず、ATX/Setext・コードフェンスの範囲を維持する。将来その表記を採用する場合は回帰例と解析を拡張する。

同レビューでpublished全199記事の一意な3,522見出しについてmarkdown-it ASTとの節境界一致を独立確認した。別のshouldだったSDKエラー応答の `_meta` 破棄は、元応答のコピーへcontentだけを置き換える方法で対応し、modelとwire dictの両方で保持する回帰を追加した。
