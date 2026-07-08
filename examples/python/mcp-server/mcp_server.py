"""最小の MCP サーバー実装(ツール 2 つ・権限の考え方をコメントで示す)。

対応するドキュメント: docs/03-implementation/mcp-and-tool-protocols.md

MCP(Model Context Protocol)は、ツールやデータソースを LLM アプリに接続する標準です。
このサンプルは、経費まわりの 2 つのツールを公開する最小のサーバーです。

- get_expense_policy: 読み取り専用(副作用なし)。安全なツールの例。
- submit_expense    : 書き込み(実行)を伴う。権限・上限の考え方を示す。

【権限の考え方(重要)】
- ツールの「説明文」で権限をお願いするのではなく、**サーバー側の実装で強制**します。
  下の submit_expense は金額上限を実装側でチェックします(モデルが指示を無視しても効く)。
- 「誰が呼んでいるか(認可)」は、本来 MCP サーバー/ホスト側で認証情報から判断します。
  このサンプルは通信部分を持たないため、認可は擬似的にコメントで示すに留めます。
  実運用では docs/06-security/agent-identity-and-auth.md と tool-permissions-and-sandboxing.md を参照。

実行:
    python mcp_server.py --mock   # ツール関数を直接呼ぶ自己テスト(mcp パッケージ不要・API キー不要)
    python mcp_server.py          # 実 MCP サーバーとして stdio で起動(要 `pip install -r requirements.txt` + MCP クライアント)
"""
from __future__ import annotations

import argparse
import sys

# --- ツール本体(標準ライブラリのみ。MCP に依存しない) ---

_POLICY = {
    "締切": "経費の申請締切は毎月末日です。締切超過分は翌月扱いになります。",
    "上限": "5 万円以上の経費は事前申請と上長承認が必要です。",
    "領収書": "領収書は PDF・画像で添付できます(1 件 10 MB まで)。",
}

# submit_expense がサーバー側で強制する上限(この額以上は自動で差し戻す)。
APPROVAL_REQUIRED_THRESHOLD = 50_000


def get_expense_policy(topic: str) -> str:
    """経費規定を検索して返す(読み取り専用・副作用なし)。

    topic: 調べたい項目(例: 締切 / 上限 / 領収書)
    """
    for key, text in _POLICY.items():
        if key in topic:
            return text
    return "該当する規定が見つかりませんでした。項目例: 締切 / 上限 / 領収書"


def submit_expense(amount: int, memo: str) -> str:
    """経費申請を提出する(書き込み)。上限チェックをサーバー側で強制する。

    amount: 金額(円)
    memo:   用途メモ
    """
    # 権限の強制はプロンプトのお願いでなく、ここ(実装側)で行う。
    if amount < 0:
        return "エラー: 金額が不正です。"
    if amount >= APPROVAL_REQUIRED_THRESHOLD:
        # 高額は自動実行せず、承認フローへ回す(Human-in-the-Loop)。
        return (
            f"承認が必要: {amount} 円の申請は上長承認が必要です。"
            "承認ゲートに回しました(自動提出はしません)。"
        )
    # 実運用ではここで申請 API を呼ぶ。サンプルなので受理メッセージのみ返す。
    return f"受理: {amount} 円の経費申請を提出しました(用途: {memo})。"


def _register(mcp) -> None:
    """FastMCP にツールを登録する(サーバー起動時のみ呼ばれる)。"""
    mcp.tool()(get_expense_policy)
    mcp.tool()(submit_expense)


def selftest() -> int:
    """mcp パッケージなしで、ツール関数の動作だけを確認する自己テスト。"""
    print("get_expense_policy('締切') ->", get_expense_policy("締切"))
    print("get_expense_policy('謎') ->", get_expense_policy("謎"))
    print("submit_expense(3000, 'タクシー') ->", submit_expense(3000, "タクシー"))
    print("submit_expense(80000, 'PC') ->", submit_expense(80000, "PC"))
    assert "承認が必要" in submit_expense(80000, "PC"), "上限チェックが効いていません"
    assert "受理" in submit_expense(3000, "タクシー"), "通常提出が失敗しています"
    print("自己テスト OK: 上限チェックとツール動作を確認しました。")
    return 0


def serve() -> int:
    """実 MCP サーバーとして stdio で起動する(mcp パッケージが必要)。"""
    try:
        from mcp.server.fastmcp import FastMCP  # 遅延 import(--mock では不要)
    except ImportError:
        print(
            "mcp パッケージが見つかりません。`pip install -r requirements.txt` を実行するか、"
            "ツール動作だけ確認するなら `python mcp_server.py --mock` を使ってください。",
            file=sys.stderr,
        )
        return 1
    mcp = FastMCP("expense-tools")
    _register(mcp)
    mcp.run()  # stdio トランスポートで待ち受け(MCP クライアントから接続)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mock", action="store_true", help="ツール関数の自己テスト(mcp パッケージ不要)")
    args = parser.parse_args()
    return selftest() if args.mock else serve()


if __name__ == "__main__":
    sys.exit(main())
