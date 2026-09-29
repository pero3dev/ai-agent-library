# Metrics 初回 stage2 click 失敗の独立診断と限定レビュー

作成者 /root/pretraining_numeric。製品・検査コード・公開kitは変更せず、保存traceとlocalhost4209だけで確認しました。後半はrootが修正したlocal helper差分の独立レビューです。

## 第二失敗の原因

今回の停止は最初のstage2 clickです。stage0のcenter修正と閾値semantic assertには未到達。元traceにはclickが1件だけあり、call@2061が45秒のtest timeoutまで retryしています。81回の「visible/enabled/stable」と自動scroll成功の後、aw-detail41回・aw-timeline40回がpointerをinterceptしました。

通常clickの自動scrollがREADを進め、段階によってpanel高が変わったため、click座標を決めた後にボタンが移動しています。独立再現ではreadingのまま0/2/3とscroll位置が繰り返し切り替わりました。stage2のpanel高797.234375px、stage0/3の755.453125pxの差は41.78125pxです。同じscrollY5196でもボタンyは512.4375→554.21875へ動きます。

これは前回のstage2/manualで下端が0.40625pxはみ出していたstage0待機失敗とは別です。

## 再現と候補の確認

traceなし4回は通常clickが成功しました。trace有効の1回目は31回の状態/座標変化とinterceptを再現し、6秒の診断用click timeoutで止めました。元traceの45秒失敗はそのまま保存し、製品試験のtimeoutを変えたとは扱いません。

同じ失敗ページでstage2ボタンに標準center scrollと既存のstrict inView＋3rAF安定待機を適用すると、stage3/reading・scrollY5237・y471.4375で安定。続く通常clickとmanual/stage2/slider2の元assertがすべて通りました。force click、DOM click、状態書換、CSS変更は使っていません。

## Local helper 差分の独立判定

**approved / low、must 0 / should 0**。対象は `website/tests/browser/pretraining.spec.mjs` の全stage事前待機だけです。

- 最新SHA256: `be1354ae42a5aa2a8a67bff57fd390c1293813c1f993209a02f49fde9e3409f1`。
- 取り除かれた `if (stage === 0)` の境界2行と2spaceインデントだけを戻すと、前回承認版 `8b809690808dc2e1ef2b3c3a1cdec7fadf79f4890bd63bf3cbaa4f4e52f5da65` に全文一致します。
- center操作、strict inView、3rAFのstage/scroll/rect一致、poll設定、通常click、元3assert、semantic fixture、Kaplan assertは完全保持です。
- 公開kit15ファイルは前回限定レビューのhashと全一致。manifest `caa2a618c84e6277b9fd6d60698765787a4667f4b73253fe26f86f6ec147544b`。走行中の公開kitを変更したものではありません。

最終pretrainingファイル全件のbrowser再検査はrootが担当します。この判定は自己数値図、製品矢印、記事全体、全viewport、公開受入を含みません。元trace、診断コード/ログ、candidate回復、厳密な差分復元証拠とhashは同名JSONに保存しています。4209は終了済みです。
