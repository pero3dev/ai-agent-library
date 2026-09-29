# C2 ローカル scene review の保存証拠

このフォルダーは最終レビューの原資料を保存したものです。新しい承認や試験結果を追加しません。[レビュー本文](../../pretraining-scene-review.md)と[レビュー JSON](../../pretraining-scene-review.json)は改行だけを LF・末尾1改行に正規化しています。元の2ファイルも gzip で保存しました。

[保存索引](index.json)にレビューの original/stored SHA256・bytes、宣言された31証拠の original→gzip 対応を記録しています。raw の全33 gzip（31証拠＋レビュー原本2）は解凍すると元bytesへ完全復元します。原レポート内のパス・内容は変更していません。

[実視認画像の対応表](viewed-images.json)は、元の3台帳の全項目・metadataを保持し、保存先をリポジトリ相対パスで指定します。実際に見た画像 **117枚** のみをコピーしています。

| 台帳 | 枚数 | 意味 |
| --- | --- | --- |
| initial | 42 | 初回・診断の視認画像 |
| final | 58 | 最終 C2 の視認画像 |
| old | 17 | 旧図の代表視認画像 |

生成総数1020枚を視認済みとは扱わず、117枚すべてを最終C2画像とも扱いません。viewport と supplemental full-scene の分類、engine/profile、各版のbuild情報は元台帳のまま対応表に保存しています。PNGは元bytesそのままです。

保存担当は /root/pretraining_numeric、レビュー担当は /root/pretraining_visual_review です。保存担当による製品・画像の再承認ではありません。検証結果は[保存照合記録](archive-verification.json)にあります。
