# C2 center scroll 限定差分の独立レビュー

判定: **approved / low、must 0 / should 0**。作成者 /root/pretraining_numeric、変更作者は root。対象は stage0 の事前スクロールを置き換えた local spec・公開 helper と、その README・sidecar・manifest 同期だけです。旧15ファイルの独立レビューは履歴として保存し、旧判定を新しい hash へ書き換えていません。

## 確認結果

- local/public の変更は `scrollIntoViewIfNeeded` から標準 `scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })` への1行。既存待機ブロックの残りは生文字列一致です。厳密な inView、3 rAFのstage/scroll/rect一致、通常click、公開4assert/local3assertを保持します。タイムアウト・許容値・assertは緩めていません。
- scroll行を戻すと public全文が従前レビュー hash、local全文がKaplan追補時 hashに完全復元します。旧71ケースの順序・本文・固定fixtureと追加20ケースの条件は不変です。
- sidecar逆適用後の3入口と旧5module、計8全文を実Git旧base517dc8bと現在HEADa9f4364の両方へ独立照合し、一致しました。自己申告のhash一致だけではありません。
- 旧24行待機の承認履歴を残し、successorScrollを別記。sidecar変更はafter内1行・理由・successor metadataのみ、manifestは3SHAのみです。inventory14件すべて一致、循環する自己/current-manifest hashなし。READMEは根拠のある1段落追加だけです。
- 4209の独立診断で、1000.40625pxの下端が通常scroll3回で動かない失敗を再現済み。標準center後は下端519.40625px、同じinView+stable3が成功し、通常clickと元assertも通過しました。

## 今回の変更ファイル

- `scripts/diagram-release/c2-predecessor-proof.json`: `a464b808ad76f33ec36df3a3e305b3847aeb056c32b58a5cfb62aa5e4ef77cea`
- `scripts/diagram-release/README.md`: `db5d8580d8930465d9a832f5c55a49d4be5e3cdb83757468e462de2ba9f62832`
- `scripts/diagram-release/source-mapping.json`: `caa2a618c84e6277b9fd6d60698765787a4667f4b73253fe26f86f6ec147544b`
- `scripts/diagram-release/verify-public.mjs`: `71aae210985ff432dee0a986a4bea167fea4dc01768c6081c8c7dc49bbb46085`
- `website/tests/browser/pretraining.spec.mjs`: `8b809690808dc2e1ef2b3c3a1cdec7fadf79f4890bd63bf3cbaa4f4e52f5da65`

独立照合 proof: `TEMP/pretraining-center-scroll-independent-proof-20260930.json`、SHA256 `ad9260b3f7d135c5b5407ba2d6a9ae64df20d722a11ab5066679bc0a67aba836`。

旧レビュー: `TEMP/pretraining-portable-review.md` (`f957bf526a273fa46959bd0b1bf6ef914c51cf42128c29e9c955e5c74a95dd85`) / JSON (`db301aa54aedc16df11fc5ec27684879b2ff1774a3f49b2946163527d4636bff`) は保持。

## 範囲と残件

今回の独立実行は差分・実Git復元・inventoryの照合です。診断の限定Edge実行と、従前の独立offline25/25・prep成功を区別しました。rootが実施する新unit/prepを独立実行したとは記録しません。自己数値図、製品矢印、最終本文全体、全viewport、公開受入はこの判定に含みません。影響するstage0の最終browser再確認と各受入はroot側で継続してください。sidecar判定状態やmanifestを後で変えた場合も、最終hashの追補が必要です。今回の書込はTEMPだけです。
