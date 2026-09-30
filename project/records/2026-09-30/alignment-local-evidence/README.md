# D1 ローカル証拠の保存入口

状態は独立ローカルレビュー approved / low / must 0 / should 0、証拠の保存完了です。判定日時は2026-09-30T09:15:22.545Zです。固定treeの記事レビューと公開受入は別工程で未完了です。基準commitは `5940334a6fd3aab8178cfeb8746a58c8b937d390`、ローカルBUILD_IDは `XJR9sUrJP0VbXQCKQiQ8F` です。[最終独立レビューの結合記録](final-independent-review.json)から原本と168枚の実視認画像を辿れます。

[索引](index.json)は元の場所、原本SHA256・bytes、保存先の相対パス、gzip自身のSHA256・bytes、証拠の種類を持ちます。[検証記録](verification.json)はgzip復元と画像のbyte一致を記録します。原本のstatus・エラー・絶対パスは来歴として保持し、後続の成功や新PCの場所に書き換えません。

## 現在の保存範囲

| 種類 | 保存した事実 | 判定の限界 |
| --- | --- | --- |
| raw 88件 | 作者kit記録、検査版の差分証明、統合・捕捉helper、完了済みログ、捕捉・診断結果、視認ledger、現行kit README/manifest、独立kitレビューと根拠、正式ブラウザー3実行、独立性能測定、初期・最終独立レビューと根拠helper | 原本のpending・失敗・実行版を保持 |
| サイト単体・build | 392試験成功、223 route・230 HTML | ローカル静的生成。main CI/Pagesではない |
| 装飾回帰 | 98試験成功 | 実画像の可読性を保証しない |
| 初期統合試験 | 43件中42成功・1失敗の原ログ | 後の成功で上書きしない。見出し変異入力の不備と製品を区別 |
| kit単体・準備 | 30試験成功、9 route・107ケース、旧91/71/58名と検査本文を復元 | callback列挙とオフライン試験。公開実行ではない |
| root check | 485件中484成功・1skip、215記事、377ファイル・5809リンクの検査成功 | Gitのchecked_commits/mergesは0。外部GitHubを検証していない |
| 初回Edge全体 | 338件中333成功・5skip、D1の16件成功 | 初回aria版。追加selectedStateGridはこの実行に含めない |
| 最終WebKit | alignment 16件とmath 26件、計42件成功 | 最終grid版のlocalhost静的export。実機Safariではない |
| 最終Edge追加 | 意味検査3件成功、β3値×7段階・labelSource2値×5段階 | 初回Edgeと別実行。既存16件全体の再実行とは数えない |
| 実視認画像 | 初期96枚と追加72枚、計168枚を別担当が実視認。Edge84枚・WebKit84枚、full-scene140枚・viewport28枚 | 最終レビュー対象の画像だけ保存。生成全550枚を視認したとは主張しない |
| 独立性能 | D1 cold CLS 0、3図の反応12.8〜13.5 ms、停止中のphase安定を観測 | 固定環境の局所測定。全機種・GPU描画時間・全idle loopの保証ではない |

[初期生成画像台帳](generated-images.json)と[初期実視認の相対索引](viewed-images.json)は初期時点の来歴・pendingを保持しています。[最終実視認の相対索引](final-viewed-images.json)は全168件の原ledger entry、source result、保存PNGを結び付けます。初期96枚は同一ファイルを再利用し、追加72枚だけ保存しました。このarchive担当が画像を独立レビューしたわけではありません。

正式ブラウザーの根拠は[初回Edge](edge-first-aria-results.json)、[最終WebKit](webkit-final-results.json)、[最終Edge追加](edge-grid-final-results.json)に分けています。D1の原resultは16・16・3件、生成画像はそれぞれ216・216・22枚です。これらの画像台帳は生成の証拠で、実視認の主張ではありません。実視認の根拠は最終ledgerに一本化しています。各結果の元HTML SHA256は `16c1e36c35ebf570cfc1bce9186a5723b8495c35362c08063706cfc4e4bfea16` と一致しています。

最終WebKitとEdge追加は、初回aria版に含まれないselectedStateGridの実観測を持ちます。preferenceは21状態、feedbackは10状態、操作のないreward-riskは空配列です。noJSで意図的に拒否したscriptは原resultに残しており、通常のscript失敗やCSS失敗を許容する根拠にはしません。

## 初回404と図形検査の分離

初回のEdge/WebKit捕捉は、それぞれ48状態で図形範囲外0・ページ横overflow0を記録しました。文字bboxの交差候補はEdge97・WebKit27あり、候補数は読みにくい箇所の確定数ではありません。実際の字形・線・意図した数式の関係は独立画像レビューで扱います。

両初回resultにはconsole404が各3件あります。この記録を消していません。次の診断は末尾スラッシュなし `http://127.0.0.1:4209/ai-agent-library` の404を記録し、補助serverの修正後の診断ではconsole404・requestsNotFoundが0になりました。4 resultは同じbuild・HTML hash・9記事入力に結び付き、各before/afterは一致しています。

修正対象は補助捕捉helperです。正式なローカルadapter、製品export server、公開サイトの全ネットワーク受入へ、この診断の成功を読み替えません。失敗診断時点の中間helper原本は提供されておらず、その実行内容を初期版または後続版と同一だったとは主張しません。

## 検査版の区別

作者記録のkit manifestは `0212a71e7a910dc2c49c2740af50d154eb646e39004a88b31d40b86edd23eb37` です。初回Edge aria版は `01b0b5f8c522a7dfb67cd9d83554885685f03f06a164af30bf015c2889d15300`、追加grid版のchecksは `c2dec4a5e62f2f557de44fbfff9a4d9b4a10aa94d449356268ebf9a267c74717` です。

初回Edge版は、後続版からselectedStateGridの追加1箇所を厳密に逆置換して保存しました。逆置換したmanifestが変更前に実観測した `6b4f4c0004ec1bcf9cd1e80f40550a855f4816a960d8516e2e0eb739441a6bd2` と一致した根拠も保存しています。初回実行に後続のβ3値×7段階・labelSource2値×5段階を実行済みとして付け足しません。

その後、rootがREADMEの無図対照の記述をC1時点の歴史と明示し、manifest statusをD1候補へ同期しました。現行参照manifestは `40cca5a2f969f4c0385fac358cf4988decb6f72076c5b91e1b52fe22153adee9` で、作者原本のhashは変更していません。[独立kitコードレビュー](kit-independent-review.json)はこの最終manifestへ結合済みです。2026-09-29T20:24:05.615Z、approved / low / must 0 / should 0。別担当がunit30件、53負例を含む11群、実Git基準11ファイルの復元一致を確認しました。reviewer自身が作った製品、記事、実ブラウザーや実画像、公開受入はこの判定の対象外です。

## 独立性能の測定範囲

[独立性能記録](independent-performance.json)は、Windows・Edge 154・1440×1000・DSF 1、throttlingなしのloopback静的exportで得た値を保持しています。native rAFの間隔はGPU frame timeではなく、500 msのphase安定も全体のidle loop停止を証明しません。chunkのgzip値は保守的なファイル容量で、通信量そのものではありません。

元resultの非critical fetch中断30件と分類原本を保存しました。critical errorは0ですが、中断の正確な時機・原因を断定せず、kitのネットワーク条件を緩和していません。性能helperの無図比較はinterpretability-basicsで、公開kitのembeddings対照とは別です。性能結果は別の最終総合レビューへ結合済みで、初期の派生記録にあるpendingも当時の状態として保持しています。

## 最終独立レビューの範囲

D1のコード・式・意味・統合、実画像、完了済みローカルブラウザー・性能を承認しました。低いviewportでは図の一部が固定headerの後ろや画面外になる捕捉もあり、すべての図が一画面へ収まるという判定ではありません。full-sceneと既存のスクロール・拡大操作を併せて確認しています。390pxの縮小表示とDSF2の模擬条件を、実機やブラウザーzoomの確認と混同しません。

既存8記事は、PR62の独立公開レビュー、本文・5共通ファイル以外の入力の一致、共通差分の限定レビュー、現行Edge全体の回帰を根拠に引き継ぎました。今回は既存8記事の画像を再視認しておらず、現在のWebKit全体も再実行していません。9記事の入力・9 HTML・51正本の正規化LF hashを最終identityへ結合し、PR62の元レビューへ相対参照を用意しています。

## 別PCでの扱い

rawのgzipは通常のgzip展開で元バイトへ戻せます。索引のoriginalSha256とoriginalBytesを復元後に確認し、storedSha256と取り違えないでください。元のPC絶対パスを実行先にせず、indexのstoredPathをこのディレクトリから解決します。画像はfinal-viewed-imagesのstoredPathを使います。

**raw/alignment-integrate.mjs.gzは適用済みの製品変更helperで、再実行不可です。** その他の歴史helperも読むための保存で、元PC依存のimport・TEMP・絶対pathを含みます。別PCで検査を実行するときは[現行公開kitの案内](../../../../scripts/diagram-release/README.md)を使います。

追補時は完了を確認したログと固定レビュー原本を新しい名前で保存し、対象hashを照合します。rawを上書きせず、実視認した追加画像だけを台帳へ結び付けます。indexがverificationのhashを持たず、verificationがindexのhashを記録するため、相互hash循環はありません。

[kit実装記録](../alignment-portable-implementation.md)と[図解制作の正本](../alignment-reading-diagrams.md)を併読してください。P1は既存8/15記事が公開受入済みでD1は受入作業中です。全体199記事、P0の部分対応2記事はP1全記事の件数に含めません。P1全15記事の公開受入で停止し、P2へ進みません。
