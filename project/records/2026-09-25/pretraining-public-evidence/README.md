# PR61 公開証拠（修正前）

**公開全体は未受入です。** 公開画像レビューは changes_requested / medium、PUBLIC-V1 must 1・should 0。旧推論図の WebKit 数値衝突を保持した履歴です。Edge / WebKit 各 91 件の機械成功は画像承認を意味しません。

merge `ca3c09eebd1b549564f874f3304d23ae25328194`、BUILD_ID `UWZD5odlVHV_TyUNH3jZ0`、main run `36606841286`。

- [公開レビュー](pretraining-public-review.md) と [JSON](pretraining-public-review.json) は元判定・元パスを保持しています。
- [保存索引](index.json) は元パス、元 SHA256 / bytes、保存先の repository-relative path、保存 SHA256 / bytes を対応付けます。gzip は元バイトへ復元できます。元の public-raw-file-index.json の pending 欄は当時の記録として変更していません。
- [実視認画像台帳](viewed-images.json) は元 90 エントリを全文保持し、保存 PNG へ対応付けます。Edge 67、WebKit runner 22、独立公開診断 scene 1。生成 1,339 枚すべてを視認したという意味ではありません。
- 診断 viewport は生成済み・未視認です。diagnostic-viewport.png.gz として保存し、実視認 90 枚へ含めません。
- 上位の pretraining-article-final-review.md/json は PR 前の正式記事レビューです。その approved 判定を公開画像受入へ読み替えません。

gzip 展開後の raw JSON には元 PC の絶対パスが残ります。別 PC では index.json / viewed-images.json の保存先を使用してください。元パスを raw report 内で書き換えていません。閲覧・コピーによる資料保全だけで、再実行・再レビュー・新たな受入は行っていません。
