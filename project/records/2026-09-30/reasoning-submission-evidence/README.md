# D2 提出前の追補証拠

基点はPR63の `b6686c92dbb678ea8b94eb12df37a33207c4c84b`、ローカルBUILD_IDは `ay8Xdd-uRIpIwdWdgy70j`。[既存ローカル受入](../reasoning-local-evidence/README.md)を上書きせず、1920×1080・768×1024のlight表示をEdge/WebKitで追加確認した。4ケースで全9段階が成功し、72生成画像のうち44枚（全36 sceneと8 viewport）を独立実視認した。[独立判定](width-review.json)は2026-09-30T12:48:48.371Z、approved / low / must 0 / should 0。

[索引](index.json)は58原本（gzip14件・PNG44件）の原SHA256・保存SHA256・相対pathと復元一致を持つ。索引SHA256は `706cf71bb129d1fd213a2d1d07a250d3e90b535c23a8d71a4c6dea7e77f21a6d`。[実視認台帳](viewed-images.json)の元pathから索引の `storedPath` へ辿れる。10記事のinputDigest・本文HTML・BUILDは測定前後と既存最終判定で一致し、8製品ファイルも不変。元122枚と追加44枚で合計166枚となるが、元のfailed print診断1枚という区別は維持する。

提出前のroot `npm run check`は490件中489成功・既存音声1 skipと文書・リンク・ハーネス検査が成功。最初の提出前実行は単体検査が成功した後、一時PR本文の拡張子`.md`が記事lintに混入して終了1となった。本文を提出用`.txt`へ改名して全体検査を再実行し、成功した。両原ログを保存し、製品不具合や検査除外の追加とは扱わない。

補足helperは元のprofile callbackとassertionを変更せず、このプロセス内だけ2幅を登録したローカル検査である。公開kitは全121ケースのまま。補足2幅のdark、native 200% zoom、物理端末を検証済みとは主張しない。公開受入は未完了で、実main CI・Pages・artifactと公開HTML一致・公開ブラウザーと画像の受入は次工程となる。

提出前の追加差分レビュー、提案PR本文・commit文、実行helperも原本としてgzip保存している。旧PCのTEMPは実行依存ではない。再実行の入口は[現行kit](https://github.com/pero3dev/ai-agent-library/blob/b321a0bf94aa2db6d19d6e1ceffb2f0a2cc46d2b/scripts/diagram-release/README.md)、全体状態は[制作記録](../reasoning-reading-diagrams.md)を確認する。
