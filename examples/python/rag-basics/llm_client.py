"""生成(回答文の作成)の LLM 呼び出しを隔離するモジュール(rag-basics 用)。

検索(retrieval)は純 Python で行い、この LLM は「検索結果を根拠に回答する」生成段だけを担います。
`--mock` ではダミー応答(API キー不要)、実 API では Anthropic SDK を使います。
"""
from __future__ import annotations

MODEL = "claude-opus-4-8"


class MockLLM:
    """固定の回答文を返すダミー LLM(検索の正しさは retrieval 側で確認します)。"""

    def __init__(self, canned: str) -> None:
        self._canned = canned

    def complete(self, prompt: str) -> str:
        return self._canned


class AnthropicLLM:
    def __init__(self) -> None:
        import anthropic  # 遅延 import

        self._client = anthropic.Anthropic()

    def complete(self, prompt: str) -> str:
        message = self._client.messages.create(
            model=MODEL,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")
