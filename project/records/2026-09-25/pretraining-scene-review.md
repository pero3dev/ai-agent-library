# C2 事前学習: 独立コード・実画像ローカルレビュー

判定 **approved / low**。未解決 must 0、should 0。レビュー担当 `/root/pretraining_visual_review` は製品・数値モデル・概念図・共通kit・root統合の作者ではありません。編集したのはTEMPの検査補助コード・画像・この記録だけです。確認日時 2026-09-29T17:00:43.085Z。

## 対象と同一性

最終 BUILD_ID **RuEOJ2GbDzXcNrG4UDMh4**。C2の5図23整数stage、19 READ、29動的論点と16静的論点を対象としました。開始・終了とレビュー確定時で8記事のinputDigest、8HTML SHA-256、BUILD_IDを照合しました。最終8件は同名JSONの identities が正本です。C2入力は `sha256:0fa344cb9b3ec838864fb9c0f7b6e4f2532751e8535a43e057cd53f41f7a18b6`、HTMLは `4d991b862a75f764e22bfcc4785ffd5b95edb1737716b0715d2e1b7dc1c624cc`。

## 検査結果と修正履歴

| 実行 | 成功 / 全数 | BUILD | 留保 |
| --- | --- | --- | --- |
| 初回 Edge | 13 / 20 | iLekWQhd6OAV88q9PsICA | loss S2の線と文字の安全余白判定で7失敗。原記録を保持 |
| 初回 WebKit | 20 / 20 | iLekWQhd6OAV88q9PsICA | 全5図を完走 |
| 最終 Edge | 20 / 20 | RuEOJ2GbDzXcNrG4UDMh4 | 6profile×23段階、11control/31選択肢、35stage-option操作、108境界往復、19READ往復、modal、nativeplay、noJS、print |
| 最終 WebKit 限定再検査 | 7 / 7 | RuEOJ2GbDzXcNrG4UDMh4 | loss5段階×6profile＋loss選択・意味・24境界。残り4図は最終で再走していない |

Kaplanの初期N重視が動的表示から抜けた指摘は作者がS3ラベルとdetailへ反映し、実画像で確認済みです。loss S2はSVGパス終点をy231→220に短縮しました。前後の製品差分がこの1箇所だけで他byte同一である証明を保存しています。別途helperの初回stage0スクロールのみcenterへ変わり、全assertion不変・逆変換hash一致を独立確認しました。最終WebKit20件を再実行したとは扱いません。

5モデルの独立unitは38/38、skip0。自然対数の平均とPPL、比較条件、損失残差と全体、固定予算と予算拡大、資料4件/8位置/12出現、同じ6入力の閾値以上判定、compute面積と寸法線、未知の実コスト、各READの留保をコードと画像で突合しました。

## 実際に見た画像

**117枚**（初回42、最終C2 58、旧図17）をview_imageで確認しました。生成PNG総数 **1020枚** と実視認数を区別しています。全ファイル名・SHA-256・engine/profile・viewport/full-scene分類は3つの `pretraining-scene-viewed-*.json` にあります。

最終Edge1440lightは全23段階、1280×720は5図代表、最終lossはWebKit全6条件、例B・比較留保・予算4倍・閾値50/70・compute組合せなどを確認しました。初回WebKitは960×540 DSF2の5図と390light/dark代表を含みます。noJS/printとmodalも直接確認しました。

最終Edgeのbbox候補13件（data S0の2組×6条件、metrics S3の1280条件1組）はすべて該当実画像を見ました。文字枠が最大約1.7 SVG単位重なる箇所でも、字形の描画は分離しており、文字衝突や意味欠落はありません。wireText候補は最終0。

低い画面ではパネル全体が一度に収まらずスクロールします。full-scene画像はCSSを書き換えず同じviewportでSVGを視野内へスクロールして採取し、元の位置に復帰しています。viewport画像と混同しません。最小実表示文字は1440で約17.62px、1280で約14.94px、960で約17.04px、390で約10.01pxです。390での見切れはありませんが、物理スマートフォンで快適に読む検証は行っていません。

旧7記事はEdge1440lightで17図100整数stageの操作を実行し、17枚の代表S2画像を確認しました。ページエラー0、入力・HTML・BUILD前後一致。この結果は旧記事全試験の複数engine受入を置き換えるものではありません。

## ローカル性能

rootのbrowser検査終了後、Edge 154.0.4258.37 headless、Windows、1440×1000 DSF1、loopback静的HTTP、CPU/通信制限なしで測りました。P0採択の共通100KiB/記事75KiB、CLS0.05、応答200ms、rAF P95 32msを基準にしています。

- C2記事固有chunk gzip **44778bytes**、共通entry chunk **21808bytes**。共通コードを含むscene chunk全体を数える上限測定です。旧7記事へC2sceneは配信されず、対照記事の重いsceneは0でした。
- 新旧8記事＋無図対照の各cold contextで無操作5秒、全ページCLS **0**。非入力shift総和を使用し、session-window CLSの上限値として記録しました。
- 5図のclick捕捉から最初のrange更新観測 **10.5–15.9ms**。native約5.5秒のrAF P95 **7.1–7.2ms**。すべて基準内。GPUの実描画時間や実機端末の性能保証ではありません。

個々のchunk/計測値/機材/時刻はJSON performance、原記録は `pretraining-scene-performance/result.json` です。

## 証拠と対象外

原case結果、失敗、画像hash、helper差分、製品1行差分、入力束縛、補助scriptのファイル名とSHA-256をJSON evidenceへ固定しました。原runnerの `independentVisualReview: pending` は自己承認へ書き換えず、この別の独立レビューを根拠とします。

この判定はローカルコード・画面の受入です。正式frozen-tree記事レビュー、公開CI/Pages受入は別工程です。実スクリーンリーダー、物理iPhone/Safari、物理印刷、実モデル学習、GPU tracing、ネットワーク制限下の携帯性能は未実施です。

追補: 最終C2の正規化入力束（58パス、記事AST・割当・registry込み）でloss JSXのhashだけを保存した初回bytesへ差し戻すと、初回inputDigestを完全再現しました。他7記事のinputDigestも初回/最終で同一です。証明は `pretraining-entire-input-delta-proof.json`。これにより限定WebKit再検査の差分範囲を、作者申告だけでなく全入力digestでも確認しています。
