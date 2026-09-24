# C1 browser注記assert 限定独立レビュー

**判定: approved / low。must 0、should 0。**

対象: `website/tests/browser/training.spec.mjs:125` からの追加4行。現SHA256: `7a5e7bad5bccc26600a1f3e144fb0adc4b1a435dfb48a3b419e542cae9b9e56e`。

前回承認した15ファイル中14ファイルは生バイトhash不変。変更したbrowserから追加4行だけを除くと、前回承認hash `a13950bc089dd443eb67864201077ddd4f520c7a0fadaee83a11543e30da2da9` に一致する。他のassertion、selector loop、case名・件数は変更なし。

第2ケースは新しいpageで開始し、追加箇所までtrait selectorを変更していない。stage 2へ明示seekし、hallucination既定値を確認した上でruntime panel内のrefusal-factors注記の可視性と完全一致テキストを検査する。別図や非表示modalの要素で代用しない。期待値は要求の固定文であり、製品model/scene/runtimeから取り込んだ正解ではない。

独立検証: Node構文成功、Playwright --listは20件（ブラウザー未実行）。追加4行そのものをstubで実行し、正常1条件が成功、focus違い・非表示・文言違いの3条件が失敗することを確認。これはオフラインのassertion境界確認であり、実表示の受入ではない。

この判定はbrowser追加4行と残り14ファイルの保持に限定する。製品2ファイルの意味・画像は別担当、公開kitは別担当。新build・実ブラウザー・公開受入を承認しない。repo書込み・Git操作なし。全現hashと前回記録hashは同名JSONへ保存。
