# D1 公開 archive の独立保存レビュー

判定: **approved / low、must 0・should 0**。レビュー日時: 2026-09-30T11:22:49Z。
reviewer_run_id: `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review`

対象 index SHA256: `64c692ccbfb0559ff4c179d2b05bec037c9fb227ca5b4fdd0e9961607923e956`。
公開レビュー自体の判定日時は 2026-09-30T11:18:33.154Z で、本保存レビューとは別です。

266原本（gzip 129件・PNG 137件）の元/保存SHA256・bytesを独立再計算し、復元後の原本バイト一致を確認しました。保存量は16,218,486 bytesです。canonical final-review.json、viewed-images.json、gzipの公開レビューMD、final-identity.jsonもOS TEMP原本と一致します。

| 実行 | 成功/実行 | 原status |
| --- | --- | --- |
| Edge初回 | 107/107 | passed |
| WebKit初回 | 106/107 | failed |
| WebKit限定再実行 | 2/2 | passed |

3 raw は同じ merge `b6686c92dbb678ea8b94eb12df37a33207c4c84b`、run `36702086701`、artifact `11090349965`、BUILD_ID `Iytr-Mx-iwwzxrZ8pUUHR` に一致します。両fullのcase名・順序も一致し、再実行は両full終了後です。最終レビューに記録された原raw hashと一致します。

137枚すべてについてPNG実バイトのhash、台帳、元rawの画像登録、sourceCaseSnapshotのhashと確定case全内容を照合しました。対応snapshotは41件です。記録に寸法がある135枚はPNG IHDRとも一致し、残る2枚は初回失敗の診断画像として明示されています。元case状態はpassed由来135枚・failed由来2枚です。このレビューで137枚を再視認したという意味ではありません。

README/indexの15相対参照は到達可能です。最終レビューが参照する旧4根拠も、隣接する既存archiveの原本hashと一致し、索引・READMEのリンクから辿れます。巨大tarの除外、tar hash/member一覧/9 HTMLと取得手順の保持も明示されています。

index.json、README.md、final-review.json、viewed-images.json、および266原本: **問題なし**。

失敗した初回rawと3 raw内のpending視認ラベルは不改変です。別の確定公開レビューで合成受入を記録し、READMEは同じ入力版9記事の範囲、P1全15記事は未完了、初回timeout原因は未確定と明記しています。

実施したのは保存・参照整合性の確認です。browser/HTTPの再実行、画像実視認のやり直し、製品・kit・gate・Git変更は行っていません。
