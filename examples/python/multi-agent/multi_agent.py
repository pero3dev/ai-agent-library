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
EXPECTED_CITIES = ("東京", "大阪", "札幌")  # このサンプルの入力契約。自由文から対象を推測しない。

# --- ツール(標準ライブラリのみ。実運用では実データ源に置き換える) ---
_MOCK_TEMPS = {"東京": 28, "大阪": 30, "札幌": 24}


def get_temperature(city: str) -> int:
    """指定した都市の気温を返すモックツール。"""
    if city not in _MOCK_TEMPS:
        raise LookupError(f"{city} の気温を取得できませんでした")
    return _MOCK_TEMPS[city]


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


def validate_plan(subtasks: list[str], expected_cities: tuple[str, ...]) -> None:
    """計画を独立した対象一覧に照合し、欠落・余分な対象・重複を実行前に拒否する。"""
    if not subtasks:
        raise ValueError("計画が空です。調査対象の都市を指定してください。")
    if len(subtasks) != len(set(subtasks)):
        raise ValueError("計画に重複した都市があります。各都市は 1 回だけ指定してください。")
    missing = sorted(set(expected_cities) - set(subtasks))
    unexpected = sorted(set(subtasks) - set(expected_cities))
    if missing or unexpected:
        raise ValueError(f"計画の対象が一致しません: 欠落={missing}, 対象外={unexpected}")


# --- 実行役エージェント ---
def execute(executor_llm, city: str) -> dict:
    temp = get_temperature(city)  # ツール呼び出し(実行役の行動)
    prompt = (
        "あなたは実行役です。ツールで取得した気温を 1 文で報告してください。\n"
        f"都市: {city} / 取得した気温: {temp} 度"
    )
    text = executor_llm.complete(prompt)
    return {"city": city, "temp": temp, "text": text}


def orchestrate(planner_llm, executor_llm, task: str, *, expected_cities=EXPECTED_CITIES) -> dict:
    print(f"タスク: {task}")

    subtasks = plan(planner_llm, task)
    validate_plan(subtasks, expected_cities)
    print("=== 計画役の分解 ===")
    for i, st in enumerate(subtasks, 1):
        print(f"  {i}. {st}")

    print("=== 実行役の実行 ===")
    results = []
    failures = []
    for st in subtasks:
        try:
            r = execute(executor_llm, st)
        except (LookupError, RuntimeError) as error:
            failures.append({"city": st, "error": str(error)})
            print(f"  - {st}: 取得・報告失敗({error})")
            continue
        results.append(r)
        print(f"  - {r['text']}(気温={r['temp']})")

    # 集約(決定的な計算はコードで)
    temps = [r["temp"] for r in results]
    avg = sum(temps) / len(temps) if temps else None
    status = "complete" if not failures else "partial" if results else "failed"
    print("=== 集約 ===")
    if avg is None:
        print("  失敗: 有効な結果が 0 件のため平均を計算できません。")
    elif failures:
        print(f"  部分結果: 取得済み {len(temps)}/{len(subtasks)} 都市の平均は {avg:.1f} 度です。")
        print("  全対象の平均は未確定です。未取得: " + "、".join(r["city"] for r in failures))
    else:
        print(f"  平均気温: {avg:.1f} 度({len(temps)} 都市)")
    return {"status": status, "average": avg, "results": results, "failures": failures}


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

    try:
        result = orchestrate(planner_llm, executor_llm, TASK)
    except ValueError as error:
        print(f"計画エラー: {error}", file=sys.stderr)
        return 1
    return 0 if result["status"] == "complete" else 1


if __name__ == "__main__":
    sys.exit(main())
