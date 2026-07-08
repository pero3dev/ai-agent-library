# multi-agent — 最小のオーケストレーション(Python)

**計画役 + 実行役**の 2 エージェントで、タスクを分解して実行する最小のオーケストレーションを示すサンプルです。次のドキュメントの内容を実装しています。

- [オーケストレーションパターン](../../../docs/02-architecture/orchestration-patterns.md) — 複数エージェントの実行順序とデータの流れ
- [シングルエージェントとマルチエージェント](../../../docs/01-concepts/single-vs-multi-agent.md) — 分担・独立コンテキストの考え方

## このサンプルの要点

- **2 役は独立したコンテキスト**: 計画役(`llm_client.py` の別インスタンス)と実行役を分け、計画の詳細で実行役のコンテキストを汚しません
- **実行役はツールを使う**: 実行役は `get_temperature`(モックツール)を呼んで各サブタスクを実行します
- **決定的な計算はコードで**: 平均の計算は LLM ではなくコードで行います(確実性が要る処理を LLM に溶かさない)

## 前提

- Python 3.11 以降(`--mock` は追加依存なし・標準ライブラリのみで動きます)
- 実 API 実行時のみ: Anthropic API キー(環境変数 `ANTHROPIC_API_KEY`)と `pip install -r requirements.txt`

## 実行

```bash
# モック実行(API キー不要・依存インストール不要)
python multi_agent.py --mock

# 実 API 実行(要 ANTHROPIC_API_KEY)
pip install -r requirements.txt
python multi_agent.py
```

計画役の分解 → 実行役の実行(ツール呼び出し)→ 集約(平均計算)の流れが表示されます。

## 動作確認日

- **モック実行(`--mock`)**: 2026-07-09 に確認(Python 3.10、追加依存なし)
- **実 API 実行**: 未確認(各自の環境で確認し、この欄に日付を追記してください)

## TODO・未確認事項

> **TODO(要確認):** `anthropic` SDK の現行版を実行時に確認する。本サンプルは実 API 動作未確認(モック実行のみ検証済み)(最終確認: 2026-07)
