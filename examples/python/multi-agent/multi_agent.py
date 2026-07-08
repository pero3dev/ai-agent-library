"""最小のオーケストレーション(計画役 + 実行役の 2 エージェント)。

対応するドキュメント:
- docs/02-architecture/orchestration-patterns.md
- docs/01-concepts/single-vs-multi-agent.md

構成:
- 計画役(planner): タスクを小さなサブタスク(調べる都市の一覧)に分解する。
- 実行役(executor): 各サブタスクを、ツール(get_temperature)を使って実行する。
- オーケストレータ: 計画 → 各ステップを実行役へ渡す → 結果を集約(平均を計算)。

要点:
- 2 つの役は**独立した LLM クライアント(別コンテキスト)**を持ちます。計画の詳細で
  実行役のコンテキストを汚さないのがマルチエージェントの利点です。
- 決定的な計算(平均)は LLM ではなくコードで行います(確実性が要る処理は LLM に溶かさない)。

実行:
    python multi_agent.py --mock   # API キー不要(ダミー応答 + モックツール)
    python multi_agent.py          # 実 API(要 ANTHROPIC_API_KEY)
"""
from __future__ import annotations

import argparse
import re
import sys

from llm_client import AnthropicLLM, MockLLM

TASK = "東京・大阪・札幌の気温を調べて、平均気温を求める"

# --- ツール(標準ライブラリのみ。実運用では実データ源に置き換える) ---
_MOCK_TEMPS = {"東京": 28, "大阪": 30, "札幌": 24}


def get_temperature(city: str) -> int:
    """指定した都市の気温を返すモックツール。"""
    return _MOCK_TEMPS.get(city, -999)


# --- 計画役エージェント ---
def plan(planner_llm, task: str) -> list[str]:
    prompt = (
        "あなたは計画役です。次のタスクを、1 行に 1 つずつの調査対象(都市名だけ)に分解してください。\n"
        f"タスク: {task}"
    )
    raw = planner_llm.complete(prompt)
    steps = []
    for line in raw.splitlines():
        # 箇条書き記号と「1. 」「2) 」等の番号プレフィックスを落として都市名だけにする。
        cleaned = re.sub(r"^\s*\d+[.)]\s*", "", line).strip("-・ 　")
        if cleaned:
            steps.append(cleaned)
    return steps


# --- 実行役エージェント ---
def execute(executor_llm, city: str) -> dict:
    temp = get_temperature(city)  # ツール呼び出し(実行役の行動)
    prompt = (
        "あなたは実行役です。ツールで取得した気温を 1 文で報告してください。\n"
        f"都市: {city} / 取得した気温: {temp} 度"
    )
    text = executor_llm.complete(prompt)
    return {"city": city, "temp": temp, "text": text}


def orchestrate(planner_llm, executor_llm, task: str) -> None:
    print(f"タスク: {task}")

    subtasks = plan(planner_llm, task)
    print("=== 計画役の分解 ===")
    for i, st in enumerate(subtasks, 1):
        print(f"  {i}. {st}")

    print("=== 実行役の実行 ===")
    results = []
    for st in subtasks:
        r = execute(executor_llm, st)
        results.append(r)
        print(f"  - {r['text']}(気温={r['temp']})")

    # 集約(決定的な計算はコードで)
    temps = [r["temp"] for r in results if r["temp"] != -999]
    avg = sum(temps) / len(temps) if temps else 0.0
    print("=== 集約 ===")
    print(f"  平均気温: {avg:.1f} 度({len(temps)} 都市)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mock", action="store_true", help="API キー不要のダミー応答で実行")
    args = parser.parse_args()

    if args.mock:
        planner_llm = MockLLM(table={"気温を調べて": "東京\n大阪\n札幌"})
        executor_llm = MockLLM(
            table={
                "都市: 東京": "東京の気温は 28 度でした。",
                "都市: 大阪": "大阪の気温は 30 度でした。",
                "都市: 札幌": "札幌の気温は 24 度でした。",
            },
            default="(実行役)気温を取得しました。",
        )
    else:
        planner_llm = AnthropicLLM()
        executor_llm = AnthropicLLM()

    orchestrate(planner_llm, executor_llm, TASK)
    return 0


if __name__ == "__main__":
    sys.exit(main())
