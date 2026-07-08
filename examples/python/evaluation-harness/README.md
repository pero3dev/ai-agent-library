# evaluation-harness — 最小の評価ハーネス(Python)

**データセット・実行・判定・レポート**という評価ハーネスの 4 部品を、最小の形で示すサンプルです。分類タスクを題材に、合格率と失敗ケースを出し、閾値割れなら異常終了(CI 組み込み可)します。次のドキュメントの内容を実装しています。

- [Agent 評価の基礎](../../../docs/04-evaluation/agent-evaluation-basics.md) — 評価ハーネスの 4 部品
- [回帰テストと CI 組み込み](../../../docs/04-evaluation/regression-testing.md) — 閾値割れで異常終了させ CI に組み込む

## このサンプルの要点

- **4 部品を分けて設計する**: データセット(`dataset.json`)/ 実行系(`run_case`)/ 採点系(`judge`)/ レポート(`report`)を分離しています
- **採点は差し替え可能**: ここでは完全一致ですが、開放的な出力なら LLM-as-a-Judge に差し替えます
- **CI に組み込める**: 合格率が閾値を下回ると終了コードが非ゼロになります(回帰テストの土台)

## 前提

- Python 3.11 以降(`--mock` は追加依存なし・標準ライブラリのみで動きます)
- 実 API 実行時のみ: Anthropic API キー(環境変数 `ANTHROPIC_API_KEY`)と `pip install -r requirements.txt`

## 実行

```bash
# モック実行(API キー不要・依存インストール不要)
python eval_harness.py --mock
echo "exit=$?"   # 合格率が閾値以上なら 0

# 実 API 実行(要 ANTHROPIC_API_KEY)
pip install -r requirements.txt
python eval_harness.py
```

モック実行では 1 ケース(領収書 = 請求)をわざと誤分類し、レポートに NG が 1 件出ます(合格率はちょうど閾値なので終了コードは 0)。**閾値割れ(終了コード 1)を確かめる**には、`eval_harness.py` の `PASS_THRESHOLD` を `0.9` に上げて再実行してください。

## 動作確認日

- **モック実行(`--mock`)**: 2026-07-09 に確認(Python 3.10、追加依存なし)
- **実 API 実行**: 未確認(各自の環境で確認し、この欄に日付を追記してください)

## TODO・未確認事項

> **TODO(要確認):** `anthropic` SDK の現行版を実行時に確認する。本サンプルは実 API 動作未確認(モック実行のみ検証済み)(最終確認: 2026-07)
