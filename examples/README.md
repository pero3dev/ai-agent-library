# examples — サンプルコード

docs から参照される、自己完結のサンプルコードを置くディレクトリです。Python の 6 サンプルと横断試験を収録しています。TypeScript は将来の追加予定で、実サンプルを作るときにディレクトリを追加します。

## ルール(詳細は [サンプル規約](../harness/writing-rules.md#サンプルコードのルール))

- 配置: `examples/<言語>/<トピック名>/`(トピック名は対応する docs のファイル名と揃える)
- 各サンプルは自己完結とし、実行方法を書いた `README.md` を必ず含める
- **依存バージョンを固定するファイル(`requirements.txt` / `package.json` + ロックファイル等)を必ず含める**
- 各サンプルの `README.md` に **動作確認日** を記載し、実行確認のたびに更新する(四半期ごとの実行確認は [ROADMAP.md](../ROADMAP.md) の定期メンテナンス参照)
- Python 3.11+ / TypeScript 5.x+ を前提とする
- 秘密情報(API キー等)はコードに書かず環境変数で渡す
- docs ↔ examples は相互に相対リンクする

## 構成

```text
examples/
├── python/       # Python サンプル 6 件。各 README に実行方法・確認条件
└── tests/        # Python 横断試験・固定依存
```

## APIキーなしで始める

6サンプルは [ツール使用](python/tool-use/README.md)・[構造化出力](python/structured-output/README.md)・[RAG](python/rag-basics/README.md)・[MCPサーバー](python/mcp-server/README.md)・[マルチエージェント](python/multi-agent/README.md)・[評価ハーネス](python/evaluation-harness/README.md) です。各READMEの `--mock` 条件に従い、確認方式と依存を区別してください。構造化出力と評価ハーネスのmockはPython 3.11以降、追加依存なしで動きます。

[学習ロードマップのA/B/C小課題](../docs/00-overview/learning-roadmap.md#abcの最初の小課題と到達確認)は、構成メモ→設計メモ→実行記録という入口です。[スキルマップ](../docs/00-overview/skill-map.md)の実務到達の自己評価とは分けて使います。

リポジトリのルートからCの2つを試すには:

```bash
python -X utf8 examples/python/structured-output/structured_output.py --mock
python -X utf8 examples/python/evaluation-harness/eval_harness.py --mock
```

構造化出力は試行1 NG→試行2 OK、評価ハーネスはc4 NG・全体4/5=80%で閾値80%を満たします。どちらも終了コード0です。1ケースのNGと全体の閾値割れ(終了1)を区別して実行記録に残します。2026-10-03にPython 3.12.14でこの2つのmockを確認しました。mockは検証・再試行・採点コードの確認であり、実APIの品質・資格認定・本番適性を証明しません。実APIの準備と費用条件は各READMEを参照してください。
