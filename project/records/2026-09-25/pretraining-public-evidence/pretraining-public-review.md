# PR61 公開版の独立画像レビュー

**changes_requested / medium**。must **1**、should **0**。公開全体の受入は保留です。C2事前学習の5図には追加指摘がありません。確認日時 2026-09-29T18:21:43.952Z。

## 公開版と範囲

merge `ca3c09eebd1b549564f874f3304d23ae25328194`、BUILD_ID `UWZD5odlVHV_TyUNH3jZ0`。main CI 36606841286、build job109537925933、Pages job109543224688のcollectorと、完了済みEdge/WebKit各91件を照合しました。両engineとも91/91成功、資産72件、各89回の公開記事確認が8記事のCI artifact HTML SHA256と一致しています。機械成功と画像の受入は分けます。

**実視認90枚**（Edge67、WebKit22、独立公開再現1）。機械生成はEdge671＋WebKit668＝1339枚、補助診断は2枚生成のうちscene1枚のみ視認。全選択画像の絶対path・SHA256・engine・profile・viewport/full-scene分類は `pretraining-public-viewed-images.json` です。ローカル画像は混ぜていません。

C2全23整数段階をEdge1440lightで確認し、loss例Bと比較条件、予算4倍、data重点、閾値50/70、compute積、modal、noJS、printを確認。1280×720では両engineの5図、960×540 DSF2と390darkではWebKitの5図、390lightの代表も確認しました。操作境界108・11control31選択肢・19READ往復・native再生は両engineの完了した機械結果に基づきます。

旧7記事は各記事の代表公開画像を確認しました。全bbox候補を該当画像と照合し、Edge49候補（C2 13、学習24、推論12）、WebKit2候補（推論）を判定しています。

## Must: PUBLIC-V1 — WebKitの推論S6で数値が衝突

対象は旧記事 `docs/11-llm-internals/inference-internals.md` の `inference-sampling`、S6「再現性」から「スコアだけを変更」を選んだ状態です。WebKit26.6、1440×1000lightで、上下2行ともC列 `0.000000` の末尾0とD列 `-1.000000` の負号が横重なりし、数値が連結して見えます。説明対象の微小差を読み分けにくいためmustです。Edge同条件は字形が分離します。

- 原画像: `pretraining-pr61-public/public-webkit-2026-09-29T17-58-37-867Z/inference-sampling-semantic-final.png`
- 独立再現: `pretraining-public-inference-diagnostic/scene.png`
- 原bbox: 各行6.234375 SVG単位（実6.103435 CSSpx）の横重複。実画像でも字形衝突を確認。
- コード位置: `inference-sampling-walkthrough.jsx:96`、`inference-sampling.css:5`。6桁を保ち、logit表示の文字幅または配置を調整してください。

追加の公開補助採取は製品を変えずに実施し、8HTML/BUILDの前後一致と36配信資産のhash一致を確認しました。他のbbox候補では実字形の衝突はありません。

## 留保と次の確認

公開全体の判定はこの1件の修正・検証まで保留します。原結果・このレビューは修正前証拠として保持してください。修正版の最終BUILDで該当数値の全profile・draw/logit・両engineと必要な共通影響範囲を再確認します。

Edgeのraw network failures7件は全てnoJS文脈のscript CSP拒否で、expectedBlockedScriptsと完全一致。通常のconsole/page/asset失敗は0です。WebKitはこれらも0。PNG数の差3枚はengineごとの推論bbox候補採取差であり、必要な選択画像の欠落はありません。

viewport画像とSVG全体の補助画像を区別しています。低い画面でパネル全体が一度に収まるとは主張しません。390幅での無見切れと実機の快適性は別です。物理Safari/iPhone、実スクリーンリーダー、物理印刷、GPU描画性能は未実施。JSONに8入力digest、公開8HTML、原結果hash、全候補判定、実視認台帳のhashを収録し、rawのpending欄は変更していません。
