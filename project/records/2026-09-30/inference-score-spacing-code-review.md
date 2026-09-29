# 推論ロジット値の文字間隔修正・独立コードレビュー

判定: **approved / low、must 0・should 0**。レビュー時刻 2026-09-29T18:30:43.152Z。対象は ca3c09eebd1b549564f874f3304d23ae25328194 から作業ツリーのCSSとブラウザー試験の2ファイルだけ。コード差分の承認であり、実寸画像・ブラウザー実行・公開受入の承認ではない。

## 対象版

- website/components/diagrams/inference-sampling.css
  - base SHA256: c5ca9367c57f623eeb7cb2a62ff011db921a207f86a063a6209b3b4b33bcbae7
  - working SHA256: 3ecb21f0ac5557b161d107b4669d356796bce43ca5bdb536793bd1d0fc88b4c9
- website/tests/browser/inference.spec.mjs
  - base SHA256: da88e0523a7d4b3c6ad46730df59627375e12971a25eff6a9312d9ac172a7a99
  - working SHA256: b73f4657b5aa6ab8f203c2cf3217779c8c0e79ac567d794d320b41761bfabf0a

## 確認結果

CSSはstage6のlogit比較配下の.is-scoreだけを22pxから18pxへ変更する1行。新行を除去すると元CSSへ完全復元した。draw比較の確率、見出し、他の数値や段階は変更しない。scene JSXとsampling/generationモデルをbaseと照合し不変を確認。toFixed(6)、左右1.000001/0.999999と他候補、A/Bの選択差を保持する。

試験は既存のlogit分岐だけを拡張し、元の棒ラベル検査を残している。追加部を戻すと試験全文がbaseへ一致した。2行×4値の実テキストを6桁で固定し、各行3か所の隣接getBBox間隔が正であることを検査するため、要素欠落や空配列で成功しない。対象textはtransformのない同じSVG座標系（x=222+tokenId*106）で、bboxの差は妥当。font-sizeを直接期待せず実際の文字領域を比較する意味のある回帰検査である。font読込と表示切替も待つ。

公開kitとportable unitはbaseから差分なし。キット変更、数値丸め、図の値変更で問題を隠す修正はない。

## 記事別入力版

基準はTEMP/pretraining-pr61-main-local-identity.json（SHA256 66dc50e6bba661e230322acec4fd6d0aef150603d3c0737f59d8a76617a2ff90）。8件を再計算し、変更は推論内部1件だけ。

- 推論旧: sha256:44c59ad4bbb41ed623e89e0446c0a617f050ba0d416e87a3462eab2381e88b09
- 推論新: sha256:e7b10bba12334b71d3eb0b5b469344d2d7e0451c42f52814693d955dd165ab82
- 他7記事: 同一digest
- 8記事のassignmentCurrent / diagramsCurrent: true
- 推論のreview/local/public: 現入力版では未受入

ブラウザー試験ファイルはruntime入力digestの対象外、変更CSSは推論内部のみに含まれる。

## 判定の限界

本レビューは実ブラウザーやbuildを実行していない。更新試験の実行成功、他の画面幅での読みやすさ、今回の公開版は実施担当の検査・独立画像レビューで確認する。getBBoxは文字領域の幾何検査であり、字形の可読性や全ラベル間の検査を代替しない。旧7記事のhash維持も新しい公開配信の確認とは区別する。

リポジトリ・Gitは変更せず、このレビューMD/JSONのみTEMPへ保存した。
