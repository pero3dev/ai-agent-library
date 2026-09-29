# C2 portable キット独立コードレビュー

判定: **approved / low、必須修正0、推奨修正0**。レビュアー: `/root/pretraining_numeric`。作者 `/root/pretraining_portable` とは別担当。

対象は `scripts/diagram-release/**` と `tests/unit/diagram-release-portable.test.mjs` のコード・オフライン受入。現15ファイルのhashは同名JSONに固定した。manifest SHA-256は `16281221cfbde2091b6814c0d6e3c43622fba0263f50cf4d0b94257faa1820b9`。

## 独立確認の結果

- オフラインunitを実行し25/25成功、失敗0、skip0、35.267秒、exit0。loss/PPL、入力ID、閾値ちょうど、FLOPs積、未知値、旧本文改変、逆変換差分の欠落・重複・順序改変を拒否する負例を含む。
- preparationを別のTEMP出力先で実行し成功。全8記事・旧71＋新20＝91ケース、5図23段階・19 READ・6画面・11 controls/31宣言値を確認した。現ファイルのmanifest hashと旧保護区間の逆変換照合が成功した。
- sidecarが復元した8ファイルを、宣言されたhashだけでなく**実Git base `517dc8b5166bd7b0c85baef3800d7fe57bac7b31` の全文**と直接比較し、一致した。旧inference/foundations/training検査本文、固定観測、path helperは同一。旧71ケース名の順序hashは `82b7e9d9f2964b0e2a8771792683357603ec450a37de522b4c8b9ab8f5ca1092` のまま。
- stage helperはリポジトリに保存されたC1承認候補gzipを解凍し、関数外側の境界改行を除いて現コードと完全一致した。trusted click前の24行安定待機だけが追加され、元のpressed/stage/manual/sliderの4assertを保持する。強制clickやassert緩和はない。
- C2のoracle・control・label・READ段階リストを承認済み `training-storyboards.json` と直接比較し、全一致。製品modelのimportや公開実測から期待値を作る処理はない。数値はdata属性だけでなく可視値・列のID・同一座標・caveatも検査する。
- collector/extractor/runnerは同じ固定8routeを要求する。期待値は成功したmain CIの正確なrun/attempt/build/deploy/artifactから取り、公開HTML/FlightのBUILD_IDとHTML byte hashを照合する。公開ページやlocal buildを期待値の根拠にしない。無図対照のheavy chunkゼロも保持し、次のalignment制作前に別対照へ明示移管する境界を残す。
- 完全scene撮影は既存の承認済みhelperを保持し、viewport原画像に加えてSVGを実スクロールで固定ナビ下へ収める。CSSとviewportを変更せず、整数clipとPNG×DSF寸法を検証し、scrollを戻す。可読性の独立レビューはpendingのままで、機械幾何成功を画像承認にしない。
- path制約はrepo/kit/root内出力、symlink/junction、出力先外evidence/archiveを拒否し、実行時のPlaywrightはwebsite lockfileへ結び付く。公開入口のskip-oldオプションはない。flat sidecarは自分自身・現manifestのhashを持たず、旧manifest本文も埋め込まないため循環しない。

## 証拠と範囲

独立unit log: `TEMP/pretraining-portable-independent-unit.txt`、SHA-256 `ecb4c17d93e5ccf1c66b37cd36a226642f34fb4f9689c82b31c20f5d99a5620e`。

独立prep JSON: `TEMP/pretraining-portable-independent-prep.json`、SHA-256 `c04203d61f0fb0124376105beb9f5b5340564372ef23550cfd46d15e0e534088`。

実Git・承認候補・絵コンテとの独立照合: `TEMP/pretraining-portable-independent-provenance.json`、SHA-256 `b60d2185a3a248229d153c20c25e3b15849678ef55a3a9f886a25b37d65b79b4`。

本判定はキットコードとオフライン検査に限定する。レビュアーが作成した数値3図、他の製品scene、画像、local adapter実行、GitHub API・artifact取得・公開91件の成功、実機Safari、読み上げを承認したものではない。最終buildのlocal実行、画像の独立確認、実公開identityによる全91件は後続ゲートで必要。リポジトリの編集・Git操作・build・外部通信は行っていない。
