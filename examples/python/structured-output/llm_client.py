"""LLM 呼び出しを隔離するモジュール。

- `--mock` 実行では、この MockLLM が事前に用意した応答を返します(API キー不要・標準ライブラリのみ)。
- 実 API 実行では AnthropicLLM が呼ばれます(`anthropic` パッケージと環境変数 ANTHROPIC_API_KEY が必要)。

このように「LLM 呼び出しを 1 モジュールに集約」しておくと、テスト・CI ではモック、
本番では実 API と差し替えられます(プロバイダー依存部分をここに閉じ込める)。
"""
from __future__ import annotations

# 実 API を使うときのモデル ID(必要に応じて変更してください)。
MODEL = "claude-opus-4-8"


class MockLLM:
    """事前に与えた応答を順に返すダミー LLM(API キー不要)。"""

    def __init__(self, responses: list[str]) -> None:
        self._responses = list(responses)

    def complete(self, prompt: str) -> str:
        if not self._responses:
            raise RuntimeError("MockLLM: 応答の在庫が尽きました(想定より多く呼ばれています)")
        return self._responses.pop(0)


class AnthropicLLM:
    """Anthropic API を使う実装(遅延 import なので --mock では読み込まれません)。"""

    def __init__(self) -> None:
        import anthropic  # 遅延 import: モック実行時は不要

        self._client = anthropic.Anthropic()  # 環境変数 ANTHROPIC_API_KEY を読む

    def complete(self, prompt: str) -> str:
        message = self._client.messages.create(
            model=MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")
