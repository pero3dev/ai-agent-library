# Metrics stage0 待機 timeout の独立診断

確認者: /root/pretraining_numeric。保存 trace と専用 localhost:4209 の一時再現だけを使用し、製品・helper・検査条件・Git は変更していません。

## 結論

stage2/manual で閾値 50/60/70 の意味検証を終え、stage0 ボタンをクリックする前の inView 判定が停止していました。独立再現ではボタン下端が **1000.40625 CSS px**、画面高が **1000 px**。0.40625 px のはみ出しにより厳密な inView が false です。scrollIntoViewIfNeeded は位置を変えず、追加で 3 回呼んでも同じ結果でした。poll 内へ同じ API を追加するだけでは今回の失敗を解消しません。

READ/layout 変化が必須原因という仮説は、この再現では支持されません。45 回の poll で stage2・manual・scrollY4788・rect は不変です。各回は initial.inView=false で戻るため、3 rAF の安定検査も stage0 click も到達していません。

## 保存 trace の停止点

- 環境: msedge / Playwright1.63.0、1440x1000、light、reduce。
- 最後の click: call@10702（stage2）。最終閾値70までの semantic assertions は完了。
- stage0 scroll: pw:api@85、445701.434 → 445739.476 ms。
- poll: expect@86、445739.888 → 450751.003 ms（約5011ms）。その後の click は0件。
- scroll 後の screencast 更新0枚。最後の画像でも stage2/threshold70 の状態。

trace は predicate 内の rect 値を保存していません。以下の座標は別途再現で直接測った値であり、元 trace に記録済みの座標として扱いません。

| 測定 | x | y | width | height | bottom | scrollY | inView |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 元の手順を再現 | 782.015625 | 962.21875 | 145.453125 | 38.1875 | 1000.40625 | 4788 | false |
| 通常scrollを追加3回 | 同じ | 同じ | 同じ | 同じ | 同じ | 同じ | false |
| 標準center scroll後 | 782.015625 | 481.21875 | 145.453125 | 38.1875 | 519.40625 | 5269 | true |

## 候補の確認

ブラウザ標準の `node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })` で余白のある位置へ移動します。stage0 poll の各反復で行う候補です。その後の厳密な inView・同じ stage/scroll/rect の 3 rAF 安定・通常 locator.click・manual/data-stage/slider assert は維持します。viewport 判定の許容値拡大、強制 click、DOM click、状態直接書換は使いません。

最初の自然再現は旧 gate が失敗しました。2回目の自然再現は初期scrollY5196で旧 gate も通過したため、これは失敗位置からの回復の証拠にしません。3回目は観測したscrollY4788へ通常ブラウザscrollを行って同じ境界失敗を再現し、center移動後は同一 predicate の stable3 が成功。続く通常stage0 clickと元の3 assert、stage1/3と閾値default60の assert も成功しました。

## 残る検証

この診断は1440x1000 Edgeだけの限定再現です。最終helper差分・portable provenance/hashの同期を独立レビューし、影響するブラウザ条件を再実行してください。ブラウザ内部のscroll APIがno-opになる実装理由までは断定していません。製品画像・公開受入・他viewport全件の成功は主張しません。一時server4209は各再現終了時に停止済みです。証拠とSHA256は同名JSONに保存しています。
