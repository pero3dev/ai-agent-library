# PUBLIC-V1 修正候補の独立ローカルレビュー

判定: **approved / low、must 0・should 0**。対象は inference-sampling S6 の数値間隔修正だけ。正式記事レビューと公開受入は別工程。

BUILD_ID: `5LJEBsyF5N8plxvpugTbv`。推論 inputDigest: `sha256:e7b10bba12334b71d3eb0b5b469344d2d7e0451c42f52814693d955dd165ab82`。実行前後・最終確認で8入力、8HTML、配信HTMLとstatic export、CSSの同一性を確認。

## 確認範囲

Edge 154.0.4258.37 と Playwright WebKit 26.6。通常6条件（1440×1000明暗、1280×720明、390×844明暗、960×540 DSF2明）と拡大2条件（1440明・390暗）で、draw/logit双方を検査。各16、計32観測が成功。候補64PNGのうち**実視認36枚（図全体32・viewport4）**。失敗原走行と時刻診断を含む総生成128枚とは区別する。

1.000001 / 0.999999 / 0.000000 / -1.000000 の6桁と負号を保持し、A/B選択と棒の意味を確認。drawは22、logitのみ18 SVG単位。C/Dの連結は両エンジン全条件で解消。WebKit最小余白 14.171875 SVG単位、Edge 24.091675。WebKit数値の実寸はPC通常14.94〜17.62 CSS px、1440拡大23.01 px、390通常10.01 px・拡大9.84 px。狭幅の小ささをPC中心の今回の範囲で明示し、モバイル可読性全般の改善とは扱わない。

viewport4枚のうち低画面PC2枚は操作後のscroll位置のため図上部が画面外。無加工の図全体captureを別に取得・実視認しており、viewportだけで全図が見えると主張しない。

## ソースと旧証拠

PR61 merge ca3c09eebd1b549564f874f3304d23ae25328194 のGit blobを旧CSS正本とした。挿入1行を除くCSSの正規化後bytesは同一。56入力束のCSSを旧hashへ戻すと旧推論inputDigestを再構成し、他7入力は不変。レビュー開始時の before.css / before-inputs は並行編集との競合により既に修正後だったため、そのまま保持して旧証拠から除外。baseline-provenance.json に明記。

## ネットワーク記録の扱い

初回Edgeは描画16条件すべて成功したが、66件のERR_ABORTEDを一律に集計したためraw status=failed。変更せず保持。v2は同一の意味・幾何・同一性assertionを保ち、全requestfailedを記録しつつdocument/script/stylesheet/fontを必須とした。さらに独立auditで除外対象を実在するHTMLページfetch、またはRSC/prefetchヘッダ付きNext navigation payloadだけに限定照合。通常の図解asset失敗を除外していない。v2は66ページfetch、時刻診断は66ページfetch＋1明示RSC prefetch、未知/asset失敗0。

追加時刻診断67件はnavigation62・modal観測5、全件contextClosing=false。context.closeによる中断とは説明しない。元結果に欠けるtype/時刻は補完せず、URL集合の一致と別診断の時刻・phase・context終了記録をnetwork-audit.jsonへ保存。元WebKit passedとv2Edge passedだけを候補32観測として対応付けた。

## 引き継ぎと制限

公開版のPUBLIC-V1はこのローカル承認では解消扱いにしない。公開先URL、CI期待BUILD/8HTML、公開から再取得したCSS/JS/font資産hashへ安全に置き換えて同じfocused runnerを再実行する。ローカル画像やoutを公開証拠へ転用しない。rootの公開全91×2と新公開画像レビューが必要。

他7は入力不変証明だけで、このfocused候補では再視認していない。物理iPhone/Safari、実スクリーンリーダー、性能/CLSの再計測も対象外。製品・kit・Gitは変更していない。

## 生証拠

- 完全JSON: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review.json
- 実視認台帳（絶対path/hash/engine/profile/capture/actuallyViewed）: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-viewed-images.json
- ネットワーク全件分類と時刻: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-network-audit.json
- exact source/input proof: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-proof.json
- 元Edge failed: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-chromium\result.json
- 候補Edge passed: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-chromium-v2\result.json
- 候補WebKit passed: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-webkit\result.json
- 時刻診断: C:\Users\81906\AppData\Local\Temp\inference-score-spacing-review-chromium-network-diagnostic\result.json

上記および再利用helper、旧baselineのsha256は完全JSONのevidence配列に保存。
