# D2 local archive integrity review

**approved / low — must 0、should 0。保存検証として問題なし。**

Reviewed: 2026-09-30T12:35:30.606Z
Reviewer: 01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review

- 229原本すべてで原本/保存hash・bytes一致。gzip107件を復元し、元bytesと一致。保存計11,222,557 B。
- PNG122件、実視認台帳、元case raw、screenshots参照、寸法を照合。旧83/新39とfailed print診断1の区別を保持。再画像レビューは実施していない。
- final-review.jsonとviewed-images.jsonはレビュー原本とbyte一致。両engine最終raw・ログ・性能・参照レビューへ相対索引経由で到達できる。
- 10記事の現inputDigest・review/localの判定/日時/参照先が最終判定と一致。旧9publicはPR63の旧digest、D2publicはnullで、新版の公開受入へ昇格していない。
- READMEと制作記録は初期失敗・途中経過・最終ローカル受入・公開未完了を分け、画像/性能/端末の限界も明記。対象hashはJSONへ保存。

対象index SHA256: 46fffbc5ebce78ac777024f9d5f8b981480e1997e3d61b66802de105a467aeb6。公開承認・製品再レビュー・browser再実行は範囲外。
