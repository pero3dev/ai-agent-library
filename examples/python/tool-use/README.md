# tool-use — ツール使用の最小 Agent ループ(Python)

経費精算のモック検索ツール 1 つを持つ、最小構成の Agent ループのサンプルです。次のドキュメントの内容をそのまま実装しています。

- [Agent ループ](../../../docs/01-concepts/agent-loop.md) — 観測 → 思考 → 行動のループ、停止条件、エラーを観測として返す原則
- [ツール使用](../../../docs/01-concepts/tool-use.md) — ツール定義と「モデルは実行しない」構造
- [ツール定義の設計](../../../docs/03-implementation/tool-definition-design.md) — 説明文・スキーマ・エラーメッセージの設計
- [経費精算 Agent の設計事例](../../../docs/07-case-studies/case-study-expense-agent.md) — このサンプルを使った段階的な設計・検証

## 前提

- Python 3.11 以降
- `pip install -r requirements.txt`(モック実行も SDK と `httpx2` を使います)
- 実 API 実行時のみ: Anthropic API キー(環境変数 `ANTHROPIC_API_KEY`)

## セットアップと実行

```bash
# 仮想環境の作成と依存のインストール
python -m venv .venv
source .venv/bin/activate        # Windows (PowerShell) は .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 固定の質問を HTTP モックで実行(API キー不要・外部通信なし)
python main.py --mock

# API キーの設定
export ANTHROPIC_API_KEY="sk-ant-..."   # Windows (PowerShell) は $env:ANTHROPIC_API_KEY="sk-ant-..."

# 実行(引数なしはデフォルトの質問)
python main.py

# 質問を指定して実行
python main.py "社員 E12345 の 2026 年 6 月の承認待ちの経費はいくらですか?"
```

## 期待される動き

`--mock` は既定の 5 月・6 月の質問を使い、SDK の要求生成 → 2 件のツール実行 → 結果に基づく集計を確認します。質問を変えた際のモデルの判断は検証しません。stdout の期待値は次のとおりです。

```text
2026-05: 28400 円、2026-06: 17300 円(モック応答)
```

stderr にツール呼び出しのトレースが、stdout に最終回答が出力されます。

```text
[step 1] tool: search_expenses input: {'employee_id': 'E12345', 'month': '2026-05'}
[step 1] tool: search_expenses input: {'employee_id': 'E12345', 'month': '2026-06'}
(最終回答: 5 月と 6 月の経費の内訳と状況の要約)
```

実 API では、モデルが「2 つの月 = 2 回のツール呼び出しが必要」と自分で判断する点、引数の形式を間違えた場合にエラーメッセージを読んで自分で直す点が観察ポイントです。モックの呼び出し順序は固定です。

年月は `YYYY-MM` の数字と月範囲を検証し、不正入力をツールエラーとしてモデルへ返します。存在しない月の検索結果 0 件と入力不正を区別します。

`end_turn` の有効な最終応答だけを stdout に返します。生成上限・拒否・未知の停止理由は `AgentStopped` として未完了理由と途中出力を保持し、CLI は stderr へ報告して終了コード 1 を返します。`pause_turn` は履歴を保って再開しますが、再開も最大ステップ数に含まれます。

API キーなしでこれらの境界条件と、複数テキストブロックの保持を確認する方法は [回帰テスト](../../tests/README.md) にあります。

## 学習のための改造アイデア

- `EXPENSE_DB` にデータを足し、集計が必要な質問を投げてみる
- `execute_tool` のエラーメッセージから形式例を削り、モデルの回復力がどう変わるか観察する
- `MAX_STEPS = 1` にして、上限による強制終了の挙動を確認する

## 動作確認日

- **モック実行・SDK 回帰テスト**: 2026-09-10 に確認(Python 3.11.3、anthropic 1.4.0、httpx2 2.12.0 の HTTP モック)。`--mock` の集計と、正常応答・打ち切り・拒否・継続上限・ツールエラーを確認しました
- **実 API 実行**: 未確認。SDK の要求生成と応答解析を確認した結果であり、実モデルの動作確認ではありません

## 関連ドキュメント

- [docs/01-concepts/agent-loop.md](../../../docs/01-concepts/agent-loop.md)
- [docs/01-concepts/tool-use.md](../../../docs/01-concepts/tool-use.md)
- [docs/03-implementation/tool-definition-design.md](../../../docs/03-implementation/tool-definition-design.md)
