# structured-output — 構造化出力とバリデーション・リトライ(Python)

LLM に JSON で答えさせ、**スキーマ検証 → 失敗ならエラーを添えて作り直し**という最小の構造化出力パイプラインを示すサンプルです。次のドキュメントの内容を実装しています。

- [構造化出力](../../../docs/03-implementation/structured-output.md) — 出力を機械可読なスキーマに従わせ、後続処理で使う

## このサンプルの要点

- **形式はコードで検証できる**: 必須キー・型・許容値の検証を関数にし、通らなければリトライします
- **リトライにはエラー内容を添える**: 「なぜ不正だったか」を次のプロンプトに入れると、修正されやすくなります
- **LLM 呼び出しを 1 モジュールに隔離**: `llm_client.py` にまとめ、`--mock` ではダミー応答、実 API では Anthropic SDK と差し替えます

## 前提

- Python 3.11 以降(`--mock` は追加依存なし・標準ライブラリのみで動きます)
- 実 API 実行時のみ: Anthropic API キー(環境変数 `ANTHROPIC_API_KEY`)と `pip install -r requirements.txt`

## 実行

```bash
# モック実行(API キー不要・依存インストール不要)
python structured_output.py --mock

# 実 API 実行(要 ANTHROPIC_API_KEY)
python -m venv .venv && source .venv/bin/activate   # Windows は .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python structured_output.py
```

モック実行では、1 回目にわざと不正な出力(許容外の `priority`)を返し、検証で弾いて 2 回目で修正される様子が確認できます。

## 動作確認日

- **モック実行(`--mock`)**: 2026-07-09 に確認(Python 3.10、追加依存なし)
- **実 API 実行**: 未確認(各自の環境で `ANTHROPIC_API_KEY` を設定して確認し、この欄に日付を追記してください)

## TODO・未確認事項

> **TODO(要確認):** `anthropic` SDK の現行版と `messages.create` の引数(モデル ID 含む)を実行時に確認する。本サンプルは実 API 動作未確認(モック実行のみ検証済み)(最終確認: 2026-07)
