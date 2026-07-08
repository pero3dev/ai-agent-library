"""構造化出力とバリデーション・リトライの最小実装。

対応するドキュメント: docs/03-implementation/structured-output.md

やること:
1. LLM に「JSON で答えて」と指示する
2. 返ってきた文字列を JSON としてパースし、スキーマ(必須キー・型・許容値)を検証する
3. 検証に失敗したら、エラー内容を添えて 1 回だけ作り直させる(リトライ)

ポイント: 「形式が正しい」ことはコードで検証できます。LLM の出力を後続のコードで
使う(分類・抽出・スコア)なら、この検証とリトライを構造に組み込みます。

実行:
    python structured_output.py --mock   # API キー不要(ダミー応答)
    python structured_output.py          # 実 API(要 ANTHROPIC_API_KEY・pip install -r requirements.txt)
"""
from __future__ import annotations

import argparse
import json
import sys

from llm_client import AnthropicLLM, MockLLM

# 取り出したい構造(サポート問い合わせの分類)。
ALLOWED_CATEGORIES = ["請求", "技術", "解約", "その他"]
ALLOWED_PRIORITIES = ["低", "中", "高"]

PROMPT_TEMPLATE = """\
次の問い合わせを分類し、JSON だけを返してください(前後に説明を付けない)。
スキーマ: {{"category": <{categories} のいずれか>, "priority": <{priorities} のいずれか>, "summary": <30 字以内の要約>}}

問い合わせ:
{inquiry}
{feedback}"""


def build_prompt(inquiry: str, feedback: str = "") -> str:
    return PROMPT_TEMPLATE.format(
        categories="/".join(ALLOWED_CATEGORIES),
        priorities="/".join(ALLOWED_PRIORITIES),
        inquiry=inquiry,
        feedback=("\n前回の出力は次の理由で不正でした。直してください: " + feedback) if feedback else "",
    )


def validate(data: object) -> list[str]:
    """スキーマ違反の理由を列挙する(空リストなら合格)。"""
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["トップレベルがオブジェクトではありません"]
    if data.get("category") not in ALLOWED_CATEGORIES:
        errors.append(f"category は {ALLOWED_CATEGORIES} のいずれか(実際: {data.get('category')!r})")
    if data.get("priority") not in ALLOWED_PRIORITIES:
        errors.append(f"priority は {ALLOWED_PRIORITIES} のいずれか(実際: {data.get('priority')!r})")
    summary = data.get("summary")
    if not isinstance(summary, str) or not summary:
        errors.append("summary は空でない文字列")
    elif len(summary) > 30:
        errors.append(f"summary は 30 字以内(実際: {len(summary)} 字)")
    return errors


def extract_json(text: str) -> object:
    """本文から JSON 部分を取り出してパースする(前後の余分な文字に頑健に)。"""
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("JSON オブジェクトが見つかりません")
    return json.loads(text[start : end + 1])


def run(llm, inquiry: str, max_attempts: int = 2) -> dict:
    feedback = ""
    for attempt in range(1, max_attempts + 1):
        raw = llm.complete(build_prompt(inquiry, feedback))
        try:
            data = extract_json(raw)
            errors = validate(data)
        except ValueError as exc:
            errors = [str(exc)]
            data = None
        if not errors:
            print(f"[試行 {attempt}] 検証 OK: {json.dumps(data, ensure_ascii=False)}")
            return data  # type: ignore[return-value]
        feedback = "; ".join(errors)
        print(f"[試行 {attempt}] 検証 NG: {feedback}")
    raise RuntimeError(f"{max_attempts} 回試行しても検証を通りませんでした")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mock", action="store_true", help="API キー不要のダミー応答で実行")
    args = parser.parse_args()

    inquiry = "先月の請求額が二重に引き落とされています。至急確認してください。"

    if args.mock:
        # 1 回目はわざと不正(priority が許容外)、2 回目で修正される様子を示す。
        llm = MockLLM(
            responses=[
                '{"category": "請求", "priority": "至急", "summary": "二重引き落としの確認依頼"}',
                '{"category": "請求", "priority": "高", "summary": "二重引き落としの確認依頼"}',
            ]
        )
    else:
        llm = AnthropicLLM()

    result = run(llm, inquiry)
    print("最終結果:", json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
