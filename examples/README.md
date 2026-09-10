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
