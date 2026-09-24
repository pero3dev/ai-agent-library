# 別PC公開確認キット・最終独立レビュー

判定: **approved / low**。must 0、should 0。時刻: 2026-09-24T15:00:13.309Z。
対象manifest: `4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507`。対象13ファイルの現SHA256はJSONのfilesに保存。

## 指摘の解消

KIT-CAPTURE-1を解消。viewport原画像を保持し、同じ画面寸法・DSFのまま実スクロールで図を固定headerの下へ移動して補助PNGを保存する。整数clipで全領域を含め、PNG寸法を完全一致で検査し、finallyで元のスクロールへ戻す。CSS・viewport寸法の変更、重なり判定のしきい値緩和はない。
新960×540画像はChromium/WebKitとも見出し・上部カード・下端が写る。Chromiumの候補24組は全8scene PNGでglyph分離を実見。全16画像の対象・SHA256・寸法・所見をJSONへ保存。

## 検証

- 自身で最終4359候補のunitを再実行: 19/19 pass、fail/skip 0、exit 0、12155.1563 ms。
- 自身で最終準備検査を実行: 旧58＋新13=71、固定7route、旧B/PR58/ラベル中間版/9fbへの全逆適用が成功。captureの3対象ファイルは実9fb snapshotとのバイト一致を別途確認。
- 最終12ファイルはimmutable snapshotと一致し、harness/verification.jsonを含め対象13ファイルのhashを記録。collector、artifact期待値、旧case/fixtureの条件は前回レビューから保持。
- Producerの最終ローカルChromium/WebKitは各13/13、各138PNG（68viewport＋70scene）、外部request 0。build IDはGpM7J_g8lnbvEy6H7i7nO。両result/adapter hashと実helper一致を独立照合。
- 各66geometry観測の画像ペア対応、全276PNGの存在、補助PNGのclip×DSFと実寸の一致を独立照合。noJS/printも両実行で成功し、画像を実見。
- 旧9fb changes_requestedはtraining-portable-review-9fb0fb0.md/jsonへ保全。74d18b/5abの失敗・中断原証拠を成功扱いにしない。

## 範囲

- No new public 71-case browser/HTTP audit or live GitHub API/artifact collection was executed by this reviewer.
- No browser session was launched by this reviewer; producer local runs were independently inspected and all stored screenshot dimensions/path mappings were verified.
- No Linux/other-PC run or physical iPhone Safari acceptance.
- No independent approval of C1 product scenes/models; the reviewer authored their initial implementation. This approval is limited to release-kit code and capture evidence readiness.

この承認は公開確認キットのコードと撮影証拠の準備に限定する。最終公開71ケース、公開PNGの独立受入、製品sceneの独立意味レビューを代行しない。
