# 別PC公開確認キット・独立レビュー

判定: **changes_requested** / risk medium。must 1、should 0。記録時刻: 2026-09-24T14:32:55.656Z。
対象manifest: `9fb0fb0d951d7ba52728b080b86948efc5bcfd6acf3288d5d044c13f6612c6a3`。対象13ファイルのSHA256はJSONのexecuted.independentSourceProof.filesに保存。

## 必須修正

- KIT-CAPTURE-1: training-checks.mjs:186 の段階画像は verify-public.mjs:277 の viewport-only 撮影を使う。960×540 DSF2 の S2 PNGで上部3カードが画像外になり、当該条件のBBox候補3組を実見できない。既存viewport画像を保持し、同一条件・状態のSVG全体／対象領域PNGを各段階・候補観測へ対応付けて追加する。しきい値緩和は不要。

## 確認済み

- 自身でunit 19/19 pass、skip 0、exit 0（27716.9705 ms）。準備検査も旧58＋新13=71名、7route、全逆適用でpass。
- 保管された旧原本8ファイルのraw/LF正規化hash、PR58元inference、ラベル中間版の3entrypointへのバイト単位の逆適用を別のread-only比較で確認。旧公開gzの58case名・順序も一致。
- CI成功run/attempt、同SHA、artifact、deployment job/status、取得前後の再照会と、7記事HTML/BUILD_IDの独立期待値を確認。新規fixtureは製品modelをimportしない。
- CLI、出力先、junction/短縮パス、依存lockの境界、harness prerequisiteと実unit参加を確認。実行した検査に外部通信はない。
- Producerの旧Chromium ab739版とWebKit 9fb版のresult/adapter hashを確認。両方13/13・68画像・外部request 0。FCghSEE6NdR0foJwlZB7gの旧ローカル予行であり、公開・新build受入ではない。
- Chromiumの候補対応8 PNGを原画像で表示。24組中21組はglyphが分離。960×540の3組は対象が撮れていないため未判定。

## 実見画像

- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-1440x1000-light-dsf1.png
  - SHA256 25decfc4f44247de4bb13c5fb8db5ffbcb14b8f6c916213d64b120a686aec3d8
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-1440x1000-dark-dsf1.png
  - SHA256 18ff5028fbfa6e14d47fc9cd32cb881601d68aff7db806daf71869c3cc7a889e
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-1280x720-light-dsf1.png
  - SHA256 0d31c1049ce1f9b75915b99a74a1d7adf21cabf0ec77e793eea76537a4d9ccfd
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-390x844-light-dsf1.png
  - SHA256 9ade1e89315b27814305c59ba8f1445c4c1fd63f6b871244999d926788c5d796
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-390x844-dark-dsf1.png
  - SHA256 d157f6c9dc1410c9ce995e676e5aa87e95d0e88dd55dfebc0f0f261f0390c9a6
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-stage-2-960x540-light-dsf2.png
  - SHA256 115e35edab32d305647ed0da12cd565da269791e27fddc985f41cbf5569f0ba0
  - Upper three knowledge cards are outside the captured viewport; all three recorded BBox candidates cannot be assessed in this PNG.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-knowledge-focus-selected.png
  - SHA256 b27b51d78002b0f704c23dd8e677fa633c5ecf39248f6ff5cd9a900949afc750
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.
- C:\Users\81906\AppData\Local\Temp\training-portable-local-chromium-2026-09-24T14-17-44-967Z\training-stages-expanded.png
  - SHA256 1a90ead05e4b7452bc576314eadce2d1a81a609091a71bb2ec23909c23b68b81
  - All three recorded adjacent-line BBox candidates have visibly separated glyphs; no text collision observed in the captured area.

## 範囲の制限

- No new browser run by this reviewer; two producer local runs were read and hashed.
- No live GitHub API, download, public HTTP/browser or 71-case public execution.
- No Linux/other-PC execution or physical iPhone Safari.
- No independent C1 scene/model product approval; no acceptance of the parent upcoming revised product build.

C1 sceneの元作者として、図本体の独立承認は行っていない。本判定は撮影・証拠・キットの受入条件に限定する。製品・Git・既存raw結果は変更していない。
