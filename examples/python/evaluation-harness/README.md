# evaluation-harness — 最小の評価ハーネス(Python)

**データセット・実行・判定・レポート**という評価ハーネスの 4 部品を、最小の形で示すサンプルです。分類タスクを題材に、合格率と失敗ケースを出し、閾値割れなら異常終了(CI 組み込み可)します。次のドキュメントの内容を実装しています。

- [Agent 評価の基礎](../../../docs/04-evaluation/agent-evaluation-basics.md) — 評価ハーネスの 4 部品
- [回帰テストと CI 組み込み](../../../docs/04-evaluation/regression-testing.md) — 閾値割れで異常終了させ CI に組み込む

## このサンプルの要点

- **4 部品を分けて設計する**: データセット(`dataset.json`)/ 実行系(`run_case`)/ 採点系(`judge`)/ レポート(`report`)を分離しています
- **許容ラベルとの完全一致**: 前後の空白だけを除き、ラベル 1 語と完全一致した場合に採点します。「請求ではありません」のような説明・否定・複数ラベルは不合格です。生の応答はレポートに保持します
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

- **モック実行(`--mock`)**: 2026-09-10 に確認(Python 3.11.3、追加依存なし)
- **回帰テスト**: 2026-09-10 に確認。否定された正解ラベルの誤合格防止と、anthropic 1.4.0 / httpx2 2.12.0 の HTTP モックで生成打ち切りの拒否を確認([実行手順](../../tests/README.md))
- **実 API 実行**: 未確認(各自の環境で確認し、この欄に日付を追記してください)

## TODO・未確認事項

> **TODO(要確認):** 実 API 利用前に Anthropic 公式ドキュメントでモデル ID・SDK の互換性を確認し、実モデルの分類結果を検証する。固定 SDK の HTTP モック確認は実 API の品質確認を含まない(最終確認: 2026-09)
