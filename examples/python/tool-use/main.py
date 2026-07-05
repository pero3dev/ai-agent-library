"""ツール使用(tool use)の最小 Agent ループ。

docs/01-concepts/agent-loop.md と docs/01-concepts/tool-use.md、
docs/03-implementation/tool-definition-design.md の内容を
そのまま実装した学習用サンプルです。

- ツールは経費精算のモック検索(search_expenses)1 つだけ
- 停止条件はモデル任せにせず、MAX_STEPS で上限を切る
- ツールの失敗は例外で落とさず、観測としてモデルに返す

実行方法は同じディレクトリの README.md を参照してください。
"""

import json
import sys

import anthropic

MODEL = "claude-opus-4-8"
MAX_STEPS = 10  # 停止条件をモデル任せにしない(agent-loop.md 参照)

SYSTEM_PROMPT = (
    "あなたは社内の経費精算アシスタントです。"
    "ツールで取得した事実だけに基づいて回答し、"
    "データにないことは推測せず「分かりません」と答えてください。"
    "金額は日本円で、内訳が分かる形で報告してください。"
)

# --- ツール定義(tool-definition-design.md の設計原則に従う) ---
TOOLS = [
    {
        "name": "search_expenses",
        "description": (
            "社員の経費精算履歴を検索します。"
            "精算の状況・金額・日付についての質問を受けたときに使ってください。"
            "経費の新規申請・修正・削除はできません(照会専用)。"
            "月をまたぐ質問は月ごとに複数回呼び出してください。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "employee_id": {
                    "type": "string",
                    "description": "社員 ID(例: E12345)",
                },
                "month": {
                    "type": "string",
                    "description": "対象月。YYYY-MM 形式(例: 2026-06)",
                },
            },
            "required": ["employee_id", "month"],
        },
    }
]

# モックデータ(実際のシステムでは社内 API・DB への問い合わせに置き換える)
EXPENSE_DB = {
    ("E12345", "2026-05"): [
        {"date": "2026-05-12", "amount": 28400, "category": "出張宿泊費", "status": "精算済み"},
    ],
    ("E12345", "2026-06"): [
        {"date": "2026-06-03", "amount": 12800, "category": "出張交通費", "status": "精算済み"},
        {"date": "2026-06-17", "amount": 4500, "category": "書籍", "status": "承認待ち"},
    ],
}


def execute_tool(name: str, tool_input: dict) -> str:
    """ツールを実行する。実行はモデルではなくアプリ側の責務(tool-use.md 参照)。"""
    if name != "search_expenses":
        raise ValueError(f"未知のツールです: {name}")

    month = tool_input.get("month", "")
    if len(month) != 7 or month[4] != "-":
        # エラーメッセージは actionable に。モデルはこれを読んで引数を直す
        raise ValueError("month は YYYY-MM 形式で指定してください(例: 2026-06)")

    records = EXPENSE_DB.get((tool_input.get("employee_id", ""), month), [])
    # 成功結果は判断に必要なフィールドに絞って返す
    return json.dumps({"count": len(records), "records": records}, ensure_ascii=False)


def run_agent(task: str) -> str:
    """観測 → 思考 → 行動の最小ループ(agent-loop.md の擬似コードの実装)。"""
    client = anthropic.Anthropic()  # 認証情報は環境変数 ANTHROPIC_API_KEY 等から解決される
    history = [{"role": "user", "content": task}]

    for step in range(1, MAX_STEPS + 1):
        response = client.messages.create(
            model=MODEL,
            max_tokens=16000,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=history,
        )
        history.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            # 最終応答(正常完了)。tool_use 以外の停止理由は警告として表示する
            if response.stop_reason != "end_turn":
                print(f"[warn] stop_reason={response.stop_reason}", file=sys.stderr)
            return next((b.text for b in response.content if b.type == "text"), "")

        # ツール呼び出し要求(行動)。結果は 1 つの user メッセージにまとめて返す
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            print(f"[step {step}] tool: {block.name} input: {block.input}", file=sys.stderr)
            try:
                result = execute_tool(block.name, block.input)
                is_error = False
            except Exception as e:
                # 失敗も観測としてモデルに返す(ループを落とさない)
                result, is_error = f"ツールエラー: {e}", True
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                    "is_error": is_error,
                }
            )
        history.append({"role": "user", "content": tool_results})

    raise RuntimeError(f"最大ステップ数({MAX_STEPS})に達しました。途中経過: {len(history)} メッセージ")


if __name__ == "__main__":
    question = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "社員 E12345 の 2026 年 5 月と 6 月の経費精算の状況を教えてください。"
    )
    print(run_agent(question))
