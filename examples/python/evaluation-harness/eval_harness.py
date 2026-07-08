"""最小の評価ハーネス(データセット・実行・判定・レポートの 4 点)。

対応するドキュメント:
- docs/04-evaluation/agent-evaluation-basics.md
- docs/04-evaluation/regression-testing.md

評価ハーネスは次の 4 つの部品でできています。この 4 つを分けて設計するのが要点です。
1. データセット: 入力と期待結果(ここでは分類の正解ラベル)の集合  -> dataset.json
2. 実行系      : 評価対象(ここでは LLM 分類器)を各入力に走らせる  -> run_case()
3. 採点系      : 出力を正解と突き合わせて合否を出す                 -> judge()
4. レポート    : 合格率と失敗ケースをまとめ、閾値割れなら異常終了     -> report()

閾値割れで終了コードを非ゼロにすると、CI(回帰テスト)にそのまま組み込めます。

実行:
    python eval_harness.py --mock   # API キー不要(ダミー分類器)
    python eval_harness.py          # 実 API(要 ANTHROPIC_API_KEY)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

from llm_client import AnthropicLLM, MockLLM

CATEGORIES = ["請求", "技術", "解約", "その他"]
PASS_THRESHOLD = 0.8  # この合格率を下回ったら失敗(CI 用)
DATASET_PATH = pathlib.Path(__file__).with_name("dataset.json")


def load_dataset() -> list[dict]:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def classify_prompt(text: str) -> str:
    return (
        f"次の問い合わせを {CATEGORIES} のいずれか 1 語だけで分類してください。\n"
        f"問い合わせ: {text}"
    )


def run_case(llm, case: dict) -> str:
    """実行系: 評価対象を 1 ケースに走らせ、正規化した出力を返す。"""
    raw = llm.complete(classify_prompt(case["input"]))
    # 余分な語が付いても拾えるよう、CATEGORIES の並び順で最初に一致した語へ正規化する
    # (単純化のため、応答内での語の登場順は見ていない)。
    for category in CATEGORIES:
        if category in raw:
            return category
    return raw.strip()


def judge(predicted: str, expected: str) -> bool:
    """採点系: ここでは完全一致。開放的な出力なら LLM-as-a-Judge に差し替える。"""
    return predicted == expected


def report(results: list[dict]) -> float:
    """レポート: 合否一覧と合格率を出力し、合格率を返す。"""
    passed = sum(1 for r in results if r["ok"])
    total = len(results)
    print("=== ケース別結果 ===")
    for r in results:
        mark = "OK " if r["ok"] else "NG "
        print(f"  [{mark}] {r['id']}: 予測={r['predicted']!r} / 正解={r['expected']!r}")
    rate = passed / total if total else 0.0
    print(f"=== 合格率: {passed}/{total} = {rate:.0%}(閾値 {PASS_THRESHOLD:.0%})===")
    return rate


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mock", action="store_true", help="API キー不要のダミー分類器で実行")
    args = parser.parse_args()

    if args.mock:
        # c4(領収書=請求)をわざと「その他」に誤分類し、レポートで NG が出る様子を示す。
        llm = MockLLM(
            table={
                "二重に引き落とされ": "請求",
                "起動しません": "技術",
                "解約したい": "解約",
                "領収書": "その他",
                "落ちます": "技術",
            }
        )
    else:
        llm = AnthropicLLM()

    dataset = load_dataset()
    results = []
    for case in dataset:
        predicted = run_case(llm, case)
        results.append(
            {
                "id": case["id"],
                "predicted": predicted,
                "expected": case["expected"],
                "ok": judge(predicted, case["expected"]),
            }
        )

    rate = report(results)
    return 0 if rate >= PASS_THRESHOLD else 1  # 閾値割れは異常終了(CI で検知)


if __name__ == "__main__":
    sys.exit(main())
