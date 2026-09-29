# C2 再開追補（2026-09-30）

作成者: /root/pretraining_numeric。既存の実装・統合・portable レビューを保持する追補です。HEAD は `a9f4364f0a8adcbdaa873a16d012ab7c2a0516a0`、前回基準は `517dc8b5166bd7b0c85baef3800d7fe57bac7b31`。今回の書込は TEMP の追補のみです。

## 数値図の最終確認

Kaplan S3 表示「初期の N 重視」と、初期則のパラメータ重視を明示した説明を 2 ファイルで再確認しました。「すべての条件での推奨にはしません」という限定もあります。数値計算、control/stage、fixture は変更されていません。旧実装記録の残り 10 ファイルは hash 一致です。

- `website/lib/pretraining-scaling-model.mjs`: `0f5445d32ab5491dfd2409e105462dc66c482179ff87263dca0aa40b13798572`
- `website/components/diagrams/pretraining-scaling-walkthrough.jsx`: `27755634eaeb89b32b7f710acb5b24772afa449f5cf0206f56ab061313e5123b`

数値 unit は再開後に 25/25 passed、fail 0、skip 0、exit 0（130.9859 ms）。ログは `TEMP/pretraining-numeric-final-20260930-unit.txt`、SHA256 `eb6d3468a59d4fc995cf1d5e375049d9137074ac339c908df29cb60a4ab17834`。自己実装確認であり、数値図の独立製品・画像承認ではありません。

## 共通統合レビューの追補

判定: approved / low、must 0 / should 0（共通統合の限定範囲）。新旧 base の対象記事は完全一致し、現在記事は承認済み 6 訂正と日付変更を適用した内容に完全一致します。前回レビューから記事側の追加差分は last_updated の 2026-09-25 → 2026-09-30 だけです。本文訂正と参照日 2 件の 2026-09-24 は維持されます。記事 SHA256 は `4385c84ea1a6f0c126ea8477b93f3777b08a5acc8317b90917a3b2ddf83557c2`。詳細は `TEMP/pretraining-resume-20260930-integration-proof.json`。

この照合後、root が browser spec に 1 行を追加しました。stage 3 の seek 直後に Kaplan の実 SVG node の表示文言「初期の N 重視」を assert しています。追加行を除いた全文が既存レビューの hash と完全一致し、従前 assert の変更はありません。この限定差分を独立コードレビューの approved に含めます。最終 spec SHA256 は `c40c42fee0def38e69cf8f186725604fd42a23fb52d6610bf121d928f65f368f`。記事と spec 以外の 13 統合ファイルも hash 一致です。従前の独立 79/79 unit は今回再実行していません。browser 実行をこのレビューでは主張しません。whole-article / 最終 frozen-tree 公開承認は別途です。

## Portable kit レビューの保存状態

従前の独立レビューは approved / low、must 0 / should 0。対象 15 ファイルすべてが保存済みレビューと hash 一致し、source-mapping.json は `16281221cfbde2091b6814c0d6e3c43622fba0263f50cf4d0b94257faa1820b9` です。旧 71 件の順序・本文・assert、承認済み stage wait、8 routes の artifact→public 同一性、追加 20 件の固定 oracle と complete-scene capture、循環しない sidecar、path 制約を対象としたレビューです。独立 offline unit 25/25 と preparation 成功（全 91 cases）の従前記録を保持しました。今回それらは再実行していません。

- `TEMP/pretraining-portable-review.md`: `f957bf526a273fa46959bd0b1bf6ef914c51cf42128c29e9c955e5c74a95dd85`
- `TEMP/pretraining-portable-review.json`: `db301aa54aedc16df11fc5ec27684879b2ff1774a3f49b2946163527d4636bff`

## 未実施・境界

今回の追補は build、browser、画像、CI、公開サイト、実機の受入を含みません。自己担当の数値図や記事全体の公開を承認しません。最終 rebuild、独立画像・記事レビュー、CI・公開確認、P1 完了時の停止と別 PC 引継ぎは root が担当します。関連証拠の SHA256 と全対象の現行照合一覧は JSON に保存しました。
