"""依存最小の RAG(小さな文書集合 + 純 Python のベクトル検索。ベクトル DB 不使用)。

対応するドキュメント: docs/03-implementation/rag-implementation-patterns.md

RAG の骨格「取り込み → 検索 → 根拠付き生成」を、外部依存なしで示します。
- 埋め込み: 実運用では埋め込みモデルを使いますが、ここでは依存を増やさないため
  **文字 bigram の出現頻度ベクトル**で代用します(純 Python・数値計算のみ)。日本語を
  トークナイザなしで扱えます。考え方(ベクトル化して近さで引く)は本物と同じです。
- 検索: コサイン類似度で上位 k 件を取り出します(ベクトル DB は使いません)。
- 生成: 取り出した文書だけを根拠に回答します(根拠に出典 id を付ける)。

実行:
    python rag.py --mock "経費の締切はいつ?"   # API キー不要
    python rag.py "経費の締切はいつ?"          # 実 API(要 ANTHROPIC_API_KEY)
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys
from collections import Counter

from llm_client import AnthropicLLM, MockLLM

DOCS_PATH = pathlib.Path(__file__).with_name("docs.json")
TOP_K = 2


def bigrams(text: str) -> list[str]:
    """空白を除いた文字列の 2-gram を返す(日本語を含む素朴なトークン化)。"""
    chars = [c for c in text if not c.isspace()]
    if len(chars) < 2:
        return chars
    return ["".join(chars[i : i + 2]) for i in range(len(chars) - 1)]


def vectorize(text: str) -> Counter:
    return Counter(bigrams(text))


def cosine(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def retrieve(query: str, docs: list[dict], k: int = TOP_K) -> list[dict]:
    """検索: クエリと各文書のコサイン類似度で上位 k 件を返す。"""
    qv = vectorize(query)
    scored = [(cosine(qv, vectorize(d["text"])), d) for d in docs]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [{"score": round(score, 3), **doc} for score, doc in scored[:k]]


def build_prompt(query: str, contexts: list[dict]) -> str:
    sources = "\n".join(f"[{c['id']}] {c['text']}" for c in contexts)
    return (
        "次の資料だけを根拠に、質問へ簡潔に答えてください。"
        "資料にない場合は「資料からは分かりません」と答え、使った資料の id を [ ] で示してください。\n\n"
        f"# 資料\n{sources}\n\n# 質問\n{query}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mock", action="store_true", help="API キー不要のダミー生成で実行")
    parser.add_argument("query", nargs="?", default="経費の申請締切はいつですか?", help="質問")
    args = parser.parse_args()

    docs = json.loads(DOCS_PATH.read_text(encoding="utf-8"))
    contexts = retrieve(args.query, docs)

    print(f"質問: {args.query}")
    print("=== 検索結果(上位) ===")
    for c in contexts:
        print(f"  [{c['id']}] score={c['score']} : {c['text']}")

    if args.mock:
        # 生成はダミー。検索最上位の文書をそのまま根拠に据えるので、どのクエリでも
        # 「回答本文 = 検索された資料 / 出典 id」が一致します(検索の正しさは上の出力で確認可)。
        if contexts:
            top = contexts[0]
            canned = f"(モック生成)資料によると: {top['text']} [{top['id']}]"
        else:
            canned = "(モック生成)資料からは分かりません。"
        llm = MockLLM(canned)
    else:
        llm = AnthropicLLM()

    answer = llm.complete(build_prompt(args.query, contexts))
    print("=== 回答 ===")
    print(answer)
    return 0


if __name__ == "__main__":
    sys.exit(main())
