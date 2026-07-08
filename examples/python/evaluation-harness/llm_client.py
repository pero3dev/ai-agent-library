"""LLM 呼び出しを隔離するモジュール(evaluation-harness 用)。

`--mock` ではダミー応答(API キー不要)、実 API では Anthropic SDK を使います。
プロバイダー依存部分をこのモジュールに閉じ込めています。
"""
from __future__ import annotations

MODEL = "claude-opus-4-8"


class MockLLM:
    """入力ごとに固定の応答を返すダミー LLM(キーは入力文字列の部分一致で引く)。"""

    def __init__(self, table: dict[str, str], default: str = "その他") -> None:
        self._table = table
        self._default = default

    def complete(self, prompt: str) -> str:
        for key, value in self._table.items():
            if key in prompt:
                return value
        return self._default


class AnthropicLLM:
    def __init__(self) -> None:
        import anthropic  # 遅延 import

        self._client = anthropic.Anthropic()

    def complete(self, prompt: str) -> str:
        message = self._client.messages.create(
            model=MODEL,
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")
