# 推論数値の文字間隔修正・ローカル証拠

初回の移管対象はコードレビューです。コード差分の判定は approved / low、must 0・should 0。実行・実寸画像・公開受入の判定ではありません。

- [コードレビュー](../inference-score-spacing-code-review.md) と [JSON](../inference-score-spacing-code-review.json) は元の判定・入力版・元パスを保持しています。
- [索引](index.json) に元ファイルと保存先の repository-relative path、元/保存 SHA256 と bytes を記載しています。gzip は元バイトへ復元できます。
- PR61 baseline identity と recorded-evidence-only の acceptance-before snapshot を保存しました。これらを新修正版の公開受入とは扱いません。

ブラウザー・画像検証の実行ログは完了通知後に追加します。実行中のログを最終証拠として保存していません。製品・gate・作業本記録・kit・Git はこの移管担当では変更していません。

## 完了した root 実行ログの追補

root から完了通知を受けた 6 ログを raw gzip で追加しました。初回 root check は unit 479 pass / 480、1 skip の後、未移管リンク 3 件で exit 1。後続は残りの lint / validate / links / todos / harness が exit 0 です。初回失敗ログはそのまま保持しています。

website unit は 360/360、local build は `5LJEBsyF5N8plxvpugTbv`、Edge は推論ファイル全 30 件、WebKit は sampling filters の 1 件が成功しました。WebKit 全 30 件を実行したという意味ではありません。独立 visual runner の最終証拠は下記の追補に保存しました。公開受入は未実施です。

## 最終の独立ローカル画像レビュー

[最終レビュー](../inference-score-spacing-review.md) は PUBLIC-V1 修正候補に限定した approved / low、must 0・should 0 です。正式記事と公開受入は別工程で、修正前公開の PUBLIC-V1 をここで解消扱いにしません。

[画像台帳](viewed-images.json) は実視認 36 枚（全図 32＋viewport 4）の元メタデータと保存先を対応付けます。候補 32 観測 / 64 生成画像、失敗・診断込み 128 生成画像を区別しています。元 Edge failed の 66 ERR_ABORTED、v2 と時刻診断の全件 fetch audit、競合で既に修正後だった before CSS/inputs と正しい PR61 baseline provenance は raw gzip のまま保存しました。これらを成功へ書き換えていません。

公開受入は未実施です。ローカルの HTML/BUILD/画像を公開証拠として転用しません。
