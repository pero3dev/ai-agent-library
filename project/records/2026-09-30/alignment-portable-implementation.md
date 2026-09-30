# D1 公開検査kitの実装と移管

状態は作者の実装・オフライン検査、kit独立コード承認、独立ローカル総合レビューと証拠保存の完了です。総合判定は2026-09-30T09:15:22.545Zのapproved / low / must 0 / should 0です。D1の固定treeの記事レビュー・公開受入は別工程です。[機械可読な実装記録](alignment-portable-implementation.json)と[証拠の保存入口](alignment-local-evidence/README.md)から、会話や元PCのTEMPなしで根拠を辿れます。

## 作業契約

- 目的: D1アラインメントの3図・15段階・15 READを公開検査へ追加し、同じ検査をlocalhostとCIでも実行できるようにする。
- base: `5940334a6fd3aab8178cfeb8746a58c8b937d390`。
- 実装所有: `scripts/diagram-release/`、`tests/unit/diagram-release-portable.test.mjs`、`website/tests/browser/alignment.spec.mjs`。製品model・scene・本文・gates・Git・公開操作は他担当。
- 保存所有: このMD/JSONと`alignment-local-evidence/`。他者の変更を戻さず、原本の判定やエラーを変更しない。
- 許可: ユーザーの自律的実装と公開までの依頼をrootが作業単位へ分担。独立承認や公開受入は作者検査と分ける。
- 終了条件: kitの構文・単体・復元・準備を確認し、固定版と残件を保存する。P1全15記事の公開受入で停止し、P2は開始しない。

## 実装した検査

[採択済みの具体案・kit計画とレビュー](p1-interface-preparation/README.md)に従い、固定9 route・全107ケースへ拡張しました。D1追加は16ケースで、6画面条件の15段階、3図の独立意味・数値・操作・中点往復、keyboard/modal、全15 READ、3図の実時間再生・停止・巻戻し、noJS、printを含みます。βとlabelSourceは全選択肢から全段階へ移動し、許可された段階以外に操作を出さないことも検査します。

DPOの期待値は製品modelをimportせず、固定分数と閉形式から作りました。βが0.5/1/2の確率2/3・4/5・16/17、1ペア損失ln(3/2)・ln(5/4)・ln(17/16)を未丸め1e-12と可視3桁で別々に照合します。同じ入力、固定参照、二つの正規化項の相殺、1ペアの損失と全体の期待値を区別し、未指定の応答をまとめたKLを捏造しません。報酬の代理性・出所と粒度・副作用に測定値や保証を追加しません。

既存90ケースの本文を保持し、旧alignment無図対照1件だけをP1対象外のembeddingsへ名称・route・H1と一緒に移行しました。HTTP・MIME・BUILD_ID・ゼロ図・ゼロtoc・ゼロheavy chunkの検査条件を保持しています。新alignment記事は独立CI artifact HTML hashが必須となり、対照embeddingsをその9記事集合には含めません。

flatなD1 predecessor proofで固定3入口を旧C2全文へ復元し、既存C2 proofでC1へ戻して古い保護区間まで照合します。旧91名は1件の逆renameだけで戻り、旧71/58名も順序一致を検査します。旧C2 proofと6 moduleはバイト不変、旧helperは完全prefixを保護しました。自己hashや現在manifestのhashをproofへ埋め込んでいません。

localhost専用adapterは同じ16callbackを使い、公開entryへ偽SHA・artifactを渡しません。loopbackのHTTPと固定basePathだけを許可し、実ブラウザー・ネットワーク・画像をローカル証拠として記録します。390px明暗では既存DPO原式のkeyboard・focus-visible・左右端・分数と添字の高さも検査します。実行方法は[kit README](../../../scripts/diagram-release/README.md)を参照してください。

## 作者検査と版の保存

kit単体30/30、構文14ファイル、inventory18ファイル、README lint、9 route・107名の準備検査が成功しました。旧C2/C1検査本文の復元、未宣言assert変更、二重rename、順序変更、異なるxの相殺、KL値捏造、tarの欠落・重複・リンク・BUILD_ID混在を拒否する負例も実行しました。

作者記録のmanifestは `0212a71e7a910dc2c49c2740af50d154eb646e39004a88b31d40b86edd23eb37` です。rootの初回Edge試験開始後にselectedStateGridの追加を行ったため、初回aria版を厳密な逆置換で復元し、変更前に観測したmanifest hashとの一致・before/after全文を保存しました。初回結果は後続追加検査を含むと扱わず、該当ケースの再検証とWebKitの最終版実行を別途結び付けています。

rootによるREADMEの歴史表記訂正とmanifest status同期後の現行manifestは `40cca5a2f969f4c0385fac358cf4988decb6f72076c5b91e1b52fe22153adee9` です。作者原本は旧版のまま保持し、[独立kitレビュー](alignment-local-evidence/kit-independent-review.json)を最終対象hashへ結合しました。判定は2026-09-29T20:24:05.615Zのapproved / low / must 0 / should 0です。独立unit30件、53負例を含む11群と実Git基準11ファイルの復元を確認しています。reviewer自身が作った製品、記事全体、ブラウザー結果・画像、CI/Pages・公開受入は対象外です。

初期ローカルの統合失敗、build・単体・回帰・root check、補助scene捕捉、404原因診断は[保存索引](alignment-local-evidence/index.json)に収録しました。初期96枚は再利用し、最終reviewerが実際に見た72枚を追補して、計168枚を[最終画像台帳](alignment-local-evidence/final-viewed-images.json)へ結合しました。図形の範囲内配置とネットワーク受入を分け、初回console404各3件の原本を残しています。

正式なローカル検証は、[初回Edge全体](alignment-local-evidence/edge-first-aria-results.json)が333成功・5skip、[最終WebKit alignmentとmath](alignment-local-evidence/webkit-final-results.json)が42成功、[最終Edge追加](alignment-local-evidence/edge-grid-final-results.json)が3成功です。D1の16・16・3原resultを保存し、同一HTMLと検査版を照合しました。初回EdgeにはないselectedStateGridを後二つの結果で確認しています。全結果の元pendingは保持し、[別の最終独立レビュー](alignment-local-evidence/final-independent-review.json)へ結合しました。

[独立性能](alignment-local-evidence/independent-performance.json)は固定ローカル環境のcold CLS、反応時間、native rAF、停止時phaseを記録しています。非critical fetch中断30件も原本と分類を保持し、正確な中断原因を断定していません。性能helperの無図比較と公開kitの対照記事も区別しています。

## 残件

固定treeの記事レビューと、D1 main CI/Pages・9記事artifact・公開全107件・公開実画像レビューが残ります。既存8記事の意味は限定された同一性とPR62独立レビューから引き継いでおり、今回の168画像へ旧記事の過去画像を加算していません。受入の正本は[図解制作記録](alignment-reading-diagrams.md)と記事別gatesで、この作者実装記録はそれらの代わりになりません。
