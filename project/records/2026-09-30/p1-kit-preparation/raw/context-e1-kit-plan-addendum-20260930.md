# E1 公開検査計画の表示・読み込み失敗追補

2026-09-30作成、独立レビュー待ち。元計画と既存判定は上書きしない。E1の実装・公開受入ではなく、D2公開後に使う検証計画の追補である。

## PC・タブレット幅の追加確認

既存6 profiles・新14ケース・全135ケース・11 routesは維持する。最終local static buildのE1記事について、1920×1080と768×1024、light/dark、DSF 1をEdge/WebKitの両方で補足検査する。各profileで2図の全11段階を既存の意味・geometry検査で確認し、各engine 44段階、両engine 88段階となる。公開kitの登録数には加えない。

viewportと全sceneのPNG、生成枚数と実際に視認した画像の台帳、実視認画像のhash・出所、前後のinputDigest・BUILD_ID・記事HTML hashを保存し、最終local受入へ結び付ける。native browser zoom 200%は別条件とし、DSF 2・CSS transform・画像拡大を代用としない。実施しなければ未検証と明記する。

## 2図それぞれの読み込み失敗

元のnoJSケース名・登録位置を維持し、そのcallback内で既存noJS検査に続けて2つのfresh contextを使う。causal-costとcache-qualityの実際のlazy chunkをそれぞれ単独遮断し、遮断したURL/hash・request発火・対応するfallback statusを確認する。同時遮断だけで両図の確認に代用しない。

noJS時は元本文・8 H3・1表・11段階の静止説明を確認する。chunk失敗時は本文・8 H3・1表・h1・対応statusを確認し、failed sceneが所有する静止説明の数は要求しない。成功したscene側の静止説明を失敗側のものとして数えない。原文の全AST復元、表示された元本文・表と見出しの保持も既存検査に従う。

遮断requestが発生しない、片側だけの検査、別chunkの誤遮断、対象statusなし、本文・表・見出しの欠落は失敗させる。対象requestの意図した失敗と、その他のcritical script/style/documentの失敗を区別し、無差別なnetwork例外を加えない。0静止説明でも原文が読める正例と、必要本文が欠ける負例を分ける。

## 維持する境界

旧121の本文・名前・順序・proofと同一artifact条件は維持する。E1の意味fixture、段階、selector、READ、数値・価格・効果を捏造しない条件も変更しない。D2の正式公開受入後、実merge/tree・kit・全callbackを再凍結し、差分があれば独立確認してから実装を始める。
