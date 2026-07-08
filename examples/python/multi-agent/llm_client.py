"""LLM 呼び出しを隔離するモジュール(multi-agent 用)。

計画役・実行役の 2 つのエージェントが、それぞれ独立した LLM クライアントを持ちます
(独立したコンテキストで動く = マルチエージェントの要点)。
`--mock` ではダミー応答(API キー不要)、実 API では Anthropic SDK を使います。
"""
from __future__ import annotations

MODEL = "claude-opus-4-8"


class MockLLM:
    """プロンプトの部分一致で固定応答を返すダミー LLM(役ごとに別テーブルを渡す)。"""

    def __init__(self, table: dict[str, str], default: str = "") -> None:
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
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")
