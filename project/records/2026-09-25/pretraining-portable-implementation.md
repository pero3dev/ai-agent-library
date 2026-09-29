# C2 portable 公開検証キット実装

旧71ケースの名前・順序と旧3検査module本文を保持し、事前学習5図の20ケースを追加しました。artifact照合は8記事、全91ケースです。C1承認済みの24行stage-0安定待機をtrusted click前に移植し、4つの既存assertを保持しました。

変更所有は scripts/diagram-release/** と tests/unit/diagram-release-portable.test.mjs のみ。製品、Git、build、公開操作はしていません。新しい flat sidecar は3入口をC1全文へ逆変換し、従来の保護区間/来歴検査をその復元本文へ適用します。旧manifest全文を再帰的に埋め込みません。

オフラインunitは25/25成功。prepで8routes、91cases、旧71の順序、5図23段階19READ、6画面、11controls31値、旧本文復元を確認しました。初回prepはinventory不足、続いて修正時の括弧1つで失敗し、両方修正後に成功しています。これは公開または図の視覚承認ではありません。

各図の独立fixture、全selector、108中点往復訪問、全READ/manual-only、状態分離、modal/focus、実時間play/pause/replay/end、noJS/printを新20件で検査します。viewportと完全scene画像の両方を記録し、BBox候補と画像を紐付けます。

TEMP/pretraining-local-adapter.mjs はlocal20の予行専用で構文確認済み。rootのbuildReady待ちです。4208 loopback serverは既存serve-exportの出力rootとportだけを変えたTEMPコピー。公開runnerの共通helperとassertを共有し、8inputDigest/8HTML/BUILD_ID/sourcehashの開始終了一致を保存します。公開入口にskip-oldは追加していません。

全ファイルhash、レビュー観点、未実施項目、adapter来歴は同名JSONにあります。独立レビュー、local実行、PR/CI/Pages/public91と公開画像承認は未了です。
