"""意味的な失敗の回帰検査。HTTP はモック、MCP はローカル stdio。実 LLM API は呼ばない。"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import pathlib
import subprocess
import sys
import unittest
from unittest.mock import patch

import anthropic
import anyio
import httpx2
from mcp import Client, StdioServerParameters

ROOT = pathlib.Path(__file__).resolve().parents[1] / "python"


def load(folder, filename):
    # 各サンプルは自己完結。同名 llm_client をサンプル間で取り違えない。
    sys.modules.pop("llm_client", None)
    sys.path.insert(0, str(ROOT / folder))
    try:
        spec = importlib.util.spec_from_file_location(folder.replace("-", "_"), ROOT / folder / filename)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.path.pop(0)


class FixedLLM:
    def __init__(self, text):
        self.text = text
        self.calls = 0

    def complete(self, prompt):
        self.calls += 1
        return self.text


@contextlib.contextmanager
def mock_sdk(responses):
    """固定 SDK の JSON 変換も通し、通信は MockTransport 内だけに限定する。"""
    requests = []

    def handler(request):
        requests.append(json.loads(request.content))
        reason, blocks = responses[len(requests) - 1]
        return httpx2.Response(200, json={
            "id": "msg-test", "type": "message", "role": "assistant", "model": "test-model",
            "content": blocks, "stop_reason": reason, "stop_sequence": None,
            "usage": {"input_tokens": 10, "output_tokens": 10},
        })

    with anthropic.Anthropic(
        api_key="test-key-not-a-secret", max_retries=0,
        http_client=httpx2.Client(transport=httpx2.MockTransport(handler)),
    ) as client:
        yield client, requests


def texts(*values):
    return [{"type": "text", "text": value} for value in values]


class EvaluationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load("evaluation-harness", "eval_harness.py")

    def test_denied_expected_labels_never_pass(self):
        for case in self.module.load_dataset():
            raw = case["expected"] + "ではありません。判定できません。"
            with self.subTest(case=case["id"]):
                predicted = self.module.run_case(FixedLLM(raw), case)
                self.assertEqual(predicted, raw)  # 失敗の原因を解析できる生の応答
                self.assertFalse(self.module.judge(predicted, case["expected"]))

    def test_only_exact_allowed_label_after_outer_whitespace(self):
        self.assertTrue(self.module.judge(" \n請求\t", "請求"))
        for invalid in ("", "請求、その他", "分類: 請求", "請 求", "unknown"):
            with self.subTest(invalid=invalid):
                self.assertFalse(self.module.judge(invalid, "請求"))
        self.assertFalse(self.module.judge("unknown", "unknown"))


class ToolUseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load("tool-use", "main.py")

    def test_month_validation_separates_invalid_from_empty_search(self):
        for month in ("abcd-ef", "2026-13", "2026-00", "0000-01", "2026-1", "２０２６-01", None, 202601):
            with self.subTest(month=month), self.assertRaises(ValueError):
                self.module.execute_tool("search_expenses", {"employee_id": "E12345", "month": month})
        for month, count in (("2026-06", 2), ("2026-01", 0), ("2026-12", 0)):
            result = json.loads(self.module.execute_tool("search_expenses", {"employee_id": "E12345", "month": month}))
            self.assertEqual(result["count"], count)

    def test_truncation_refusal_and_unknown_reason_are_not_success(self):
        for reason in ("max_tokens", "model_context_window_exceeded", "refusal", "stop_sequence", "future_reason"):
            with self.subTest(reason=reason), mock_sdk([(reason, texts("途中", "出力"))]) as (client, requests):
                with self.assertRaises(self.module.AgentStopped) as caught:
                    self.module.run_agent("test", client=client)
                self.assertEqual(caught.exception.reason, reason)
                self.assertEqual(caught.exception.partial_text, "途中出力")
                self.assertEqual(len(requests), 1)

    def test_final_answer_keeps_all_text_blocks(self):
        with mock_sdk([("end_turn", texts("first", "second"))]) as (client, _):
            self.assertEqual(self.module.run_agent("test", client=client), "firstsecond")

    def test_empty_final_and_missing_tool_calls_are_not_success(self):
        for reason, blocks in (("end_turn", []), ("tool_use", texts("呼び出す予定"))):
            with self.subTest(reason=reason), mock_sdk([(reason, blocks)]) as (client, _):
                with self.assertRaises(self.module.AgentStopped):
                    self.module.run_agent("test", client=client)

    def test_tool_results_preserve_success_error_and_call_id(self):
        calls = [
            {"type": "tool_use", "id": "valid", "name": "search_expenses", "input": {"employee_id": "E12345", "month": "2026-06"}},
            {"type": "tool_use", "id": "invalid", "name": "search_expenses", "input": {"employee_id": "E12345", "month": "2026-13"}},
        ]
        with mock_sdk([("tool_use", calls), ("end_turn", texts("完了"))]) as (client, requests):
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(self.module.run_agent("test", client=client), "完了")
            results = requests[1]["messages"][-1]["content"]
            self.assertEqual([r["tool_use_id"] for r in results], ["valid", "invalid"])
            self.assertEqual([r["is_error"] for r in results], [False, True])
            self.assertEqual(json.loads(results[0]["content"])["count"], 2)
            self.assertIn("YYYY-MM", results[1]["content"])

    def test_truncated_tool_request_is_never_executed(self):
        blocks = [{"type": "tool_use", "id": "truncated", "name": "search_expenses", "input": {}}]
        with mock_sdk([("max_tokens", blocks)]) as (client, _), patch.object(self.module, "execute_tool") as execute:
            with self.assertRaises(self.module.AgentStopped):
                self.module.run_agent("test", client=client)
            execute.assert_not_called()

    def test_pause_continues_with_history_and_is_bounded(self):
        with mock_sdk([("pause_turn", texts("継続中")), ("end_turn", texts("完了"))]) as (client, requests):
            self.assertEqual(self.module.run_agent("test", client=client), "完了")
            self.assertEqual(requests[1]["messages"][-1]["content"], texts("継続中"))
        with patch.object(self.module, "MAX_STEPS", 2), mock_sdk([("pause_turn", [])] * 2) as (client, requests):
            with self.assertRaisesRegex(RuntimeError, "最大ステップ数"):
                self.module.run_agent("test", client=client)
            self.assertEqual(len(requests), 2)


class MultiAgentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load("multi-agent", "multi_agent.py")

    def run_plan(self, value):
        with contextlib.redirect_stdout(io.StringIO()) as output:
            result = self.module.orchestrate(FixedLLM(value), FixedLLM("報告"), self.module.TASK)
        return result, output.getvalue()

    def test_invalid_plans_stop_before_executor(self):
        for value in ("", "東京\n大阪", "東京\n大阪\n北海道札幌市", "東京\n大阪\n札幌\n東京"):
            executor = FixedLLM("呼ばない")
            with self.subTest(plan=value), contextlib.redirect_stdout(io.StringIO()), self.assertRaises(ValueError):
                self.module.orchestrate(FixedLLM(value), executor, self.module.TASK)
            self.assertEqual(executor.calls, 0)

    def test_complete_plan_and_numbered_city_names(self):
        result, _ = self.run_plan("1. 東京\n2) 大阪\n- 札幌")
        self.assertEqual(result["status"], "complete")
        self.assertAlmostEqual(result["average"], 82 / 3)
        self.assertEqual(result["failures"], [])

    def test_missing_observation_is_explicit_partial_result(self):
        with patch.dict(self.module._MOCK_TEMPS, {"東京": 28, "大阪": 30}, clear=True):
            result, output = self.run_plan("東京\n大阪\n札幌")
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["average"], 29)
        self.assertEqual(result["failures"][0]["city"], "札幌")
        self.assertIn("全対象の平均は未確定", output)

    def test_no_observations_does_not_invent_zero_degree_average(self):
        with patch.dict(self.module._MOCK_TEMPS, {}, clear=True):
            result, output = self.run_plan("東京\n大阪\n札幌")
        self.assertEqual(result["status"], "failed")
        self.assertIsNone(result["average"])
        self.assertIn("平均を計算できません", output)


class OtherClientTests(unittest.TestCase):
    def test_all_text_clients_reject_incomplete_output(self):
        for folder in ("structured-output", "evaluation-harness", "rag-basics", "multi-agent"):
            module = load(folder, "llm_client.py")
            for reason in ("max_tokens", "model_context_window_exceeded", "refusal"):
                with self.subTest(folder=folder, reason=reason), mock_sdk([(reason, texts("請求"))]) as (client, _):
                    llm = module.AnthropicLLM.__new__(module.AnthropicLLM)
                    llm._client = client
                    with self.assertRaisesRegex(RuntimeError, reason):
                        llm.complete("test")
            with mock_sdk([("end_turn", texts("a", "b"))]) as (client, _):
                llm = module.AnthropicLLM.__new__(module.AnthropicLLM)
                llm._client = client
                self.assertEqual(llm.complete("test"), "ab")


class McpTests(unittest.TestCase):
    def check_stdio(self, mode, expected_version):
        async def check():
            params = StdioServerParameters(
                command=sys.executable, args=["-X", "utf8", "-B", str(ROOT / "mcp-server" / "mcp_server.py")],
                env={"PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1"},
            )
            with anyio.fail_after(30):
                async with Client(params, mode=mode, read_timeout_seconds=10) as client:
                    self.assertEqual(client.protocol_version, expected_version)
                    self.assertEqual(client.server_info.name, "expense-tools")
                    listed = await client.list_tools()
                    self.assertEqual({tool.name for tool in listed.tools}, {"get_expense_policy", "submit_expense"})
                    for tool in listed.tools:
                        self.assertEqual(tool.input_schema["type"], "object")
                    policy = await client.call_tool("get_expense_policy", {"topic": "締切"})
                    self.assertFalse(policy.is_error)
                    self.assertIn("毎月末日", "".join(block.text for block in policy.content if block.type == "text"))
                    for amount, is_error, marker in ((-1, True, "0 以上"), (1.5, True, ""), (True, True, ""), ("3000", True, ""), (0, False, "受理"), (49999, False, "受理"), (50000, False, "承認が必要")):
                        with self.subTest(amount=amount):
                            result = await client.call_tool("submit_expense", arguments={"amount": amount, "memo": "test"})
                            self.assertEqual(result.is_error, is_error)
                            self.assertEqual(result.model_dump(by_alias=True)["isError"], is_error)
                            self.assertIn(marker, "".join(block.text for block in result.content if block.type == "text"))
        anyio.run(check)

    def test_modern_stdio_discovers_and_keeps_business_error_boundaries(self):
        self.check_stdio("auto", "2026-07-28")

    def test_legacy_stdio_initializes_and_keeps_business_error_boundaries(self):
        self.check_stdio("legacy", "2025-11-25")


class SmokeTests(unittest.TestCase):
    def test_all_default_mock_examples(self):
        examples = (
            ("tool-use", "main.py", []),
            ("structured-output", "structured_output.py", []),
            ("evaluation-harness", "eval_harness.py", []),
            ("rag-basics", "rag.py", ["経費の申請締切はいつですか?"]),
            ("multi-agent", "multi_agent.py", []),
            ("mcp-server", "mcp_server.py", []),
        )
        for folder, script, args in examples:
            with self.subTest(folder=folder):
                run = subprocess.run(
                    [sys.executable, "-X", "utf8", "-B", script, "--mock", *args],
                    cwd=ROOT / folder, capture_output=True, text=True, encoding="utf-8", timeout=15,
                )
                self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
                self.assertTrue(run.stdout.strip())


if __name__ == "__main__":
    unittest.main()
