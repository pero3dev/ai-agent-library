---
name: examples-check
description: examples/python の全サンプルを実行確認し、各 README の「動作確認日」を更新する。四半期メンテナンス・依存更新後・Python バージョン変更後の確認で使う。
argument-hint: "[サンプル名(例: rag-basics)。省略時は全件]"
---

# examples 動作確認

## 実行方式の対応表(2026-07 時点)

各サンプルの README の記載が正本。乖離があれば README に従い、この表を更新する。

| サンプル | 確認コマンド(ディレクトリ内で実行) | 備考 |
| --- | --- | --- |
| structured-output | `python structured_output.py --mock` | API キー不要・追加依存なし |
| evaluation-harness | `python eval_harness.py --mock` | 同上 |
| rag-basics | `python rag.py --mock "経費の申請締切はいつですか?"` | 引数つき |
| multi-agent | `python multi_agent.py --mock` | 同上 |
| mcp-server | `python mcp_server.py --mock` | mcp パッケージなしの自己テスト |
| tool-use | `python -m py_compile main.py` | `--mock` 非対応(構文チェックのみ) |

## 手順

1. 各サンプルのディレクトリでコマンドを実行し、stdout/stderr を README の「期待される動き」と突き合わせる
2. 成功したサンプルの README「動作確認日」を既存の書式のまま更新する(日付・Python バージョン・確認方式を明記。例: 「モック実行(`--mock`): YYYY-MM-DD に確認(Python 3.x、追加依存なし)」)
3. 失敗したら原因を調査して修正 → 再実行する。修正内容は変更サマリで必ず報告する
4. `node scripts/check-links.mjs` で docs ↔ examples の双方向リンクを確認する
5. **実 API での実行確認は任意**: `ANTHROPIC_API_KEY` 等が設定されている場合のみ、実行前にユーザーへ明示確認する(API コストが発生するため勝手に実行しない)

## 注意

- 依存を更新した場合は `requirements.txt` のバージョン固定を維持する(規約: 依存バージョン固定ファイル必須)
- サンプルの修正が docs 側のコード例と食い違わないか、対応する docs(各 README にリンクあり)を確認する
