# tool-use — ツール使用の最小 Agent ループ(Python)

経費精算のモック検索ツール 1 つを持つ、最小構成の Agent ループのサンプルです。次のドキュメントの内容をそのまま実装しています。

- [Agent ループ](../../../docs/01-concepts/agent-loop.md) — 観測 → 思考 → 行動のループ、停止条件、エラーを観測として返す原則
- [ツール使用](../../../docs/01-concepts/tool-use.md) — ツール定義と「モデルは実行しない」構造
- [ツール定義の設計](../../../docs/03-implementation/tool-definition-design.md) — 説明文・スキーマ・エラーメッセージの設計

## 前提

- Python 3.11 以降
- Anthropic API キー(環境変数 `ANTHROPIC_API_KEY`)

## セットアップと実行

```bash
# 仮想環境の作成と依存のインストール
python -m venv .venv
source .venv/bin/activate        # Windows (PowerShell) は .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# API キーの設定
export ANTHROPIC_API_KEY="sk-ant-..."   # Windows (PowerShell) は $env:ANTHROPIC_API_KEY="sk-ant-..."

# 実行(引数なしはデフォルトの質問)
python main.py

# 質問を指定して実行
python main.py "社員 E12345 の 2026 年 6 月の承認待ちの経費はいくらですか?"
```

## 期待される動き

stderr にツール呼び出しのトレースが、stdout に最終回答が出力されます。

```text
[step 1] tool: search_expenses input: {'employee_id': 'E12345', 'month': '2026-05'}
[step 1] tool: search_expenses input: {'employee_id': 'E12345', 'month': '2026-06'}
(最終回答: 5 月と 6 月の経費の内訳と状況の要約)
```

モデルが「2 つの月 = 2 回のツール呼び出しが必要」と自分で判断する点、引数の形式を間違えた場合にエラーメッセージを読んで自分で直す点が観察ポイントです。

## 学習のための改造アイデア

- `EXPENSE_DB` にデータを足し、集計が必要な質問を投げてみる
- `execute_tool` のエラーメッセージから形式例を削り、モデルの回復力がどう変わるか観察する
- `MAX_STEPS = 1` にして、上限による強制終了の挙動を確認する

## 動作確認日

- 2026-07-05(構文チェックのみ実施。API 呼び出しを含む実行確認は未実施 — 実行確認後にこの日付を更新してください)

## 関連ドキュメント

- [docs/01-concepts/agent-loop.md](../../../docs/01-concepts/agent-loop.md)
- [docs/01-concepts/tool-use.md](../../../docs/01-concepts/tool-use.md)
- [docs/03-implementation/tool-definition-design.md](../../../docs/03-implementation/tool-definition-design.md)
