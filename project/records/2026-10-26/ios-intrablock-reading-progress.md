# IOS-11: block内部位置の候補とPR275の限定CI修正

## 基線と範囲

旧保存を維持したblock内部位置の候補を、実main270 `955c066c8dc0fdbedf6f0c845a461abda39ac476`（tree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`）へbindし、PR275へ提出した。今回の私有修正は、相対参照の記録修正後の実head `5f59010763fbded71cb1636a03159a5bf3cdd5d6`（tree `af6550c2aa440e0149aab0e99f1a69c458a99b60`）を親とする。Published setup、独立承認済みruntime26 workflow、記録MD/JSONの4pathだけで、main955c比の累積は17pathとなる。prepare時点は `preview_only:true`・`publishable:false`、独立root reviewと正確な修正版headのCIを待つ。treeをcommit親にしない。

App4・Core/Inline2・fixture1の承認v3 bytes、Reader584196/Store89eb397/Core629d6、schemaとPBX 0.2.16（18）は5f590から変更しない。最新snapshot/pickerの既存Published13case/helpers、Nativebcaf/pure geometry6、三つのpublished selector、親のruntime/picker実績・site待機を保持する。Core15のPR273は別Draftで、この候補へ混ぜない。

## 実装候補の意味

旧保存キー・ReadingPosition・block順fraction・anchor.version1を保ち、任意で有限な `intraBlockFraction` を加える。意味内容で同じblockと照合できる場合だけ内部割合を再利用し、見出し・割合fallbackでは捨てる。読取だけで永続記録を書き換えない。

実top/end markerから高さを得て配置・読書線・captureのvisible topを統一する。自動復帰失敗や未実測proxy位置は保存せず、pan/世代/350ms debounce/離脱flushを区別する。未達の検索・目次・記事内リンクは自動layout再起動へ引き継ぎ、完了・最新ユーザー操作で消費する。これらのApp/Core本文は承認v3と同じである。

## PR275初回Hostedの2失敗

rootが報告したhead5f590のfull run `40252163359` / job `121346524924` は、単体152件（150成功・2skip）とUI22件のうち21成功・1失敗を記録し、ReleaseはUI失敗後にskipされた。追加の `testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch` は22.474秒で最初の `openFixtureLibrary` 内のMore Actions待機に失敗した。本文・40行表・row25保存・再起動復帰へ未到達であり、復帰精度の成否は未確認である。190MBのraw artifactは今回取得していない。

別のruntime26 run `40252163497` / job `121346711814` は、未束縛 `-showdestinations` がexit0でも所有UUIDを一覧へ出さず、membership assertが最初の失敗となった。placeholder-onlyの原因は未確定で、明示UUIDの実testへ未到達、UI0件・app/xcresultなし、summaryはnot-completedだった。独立照合済みのrawでは所有Simulatorを削除し、既存60 UUIDを全て保持した。取得済みartifactは44,994 bytes・89 entriesのCRC正常、SHA-256 `7b55f150884564dd6681e2a1ac1dfe6a3bdd2ca6697aa98e1465572d8ce8e857`。この履歴を新修正版の成功へ変えない。

## 限定修正と保全

`LibraryView`はfilterなしでMoreをMenu、filterありで実Buttonからsheetとして提示する。新caseはfilterを設定せずfiltered専用helperへ進んでいたため、nested `openFixtureLibrary` 内で、既存公開UI helperによる `transformer` タグと `Transformer` 検索をMoreの直前へ設定する1行だけを加える。初回と再起動後の両入口へ適用され、routeや保存記録を注入しない。実行時AXが0か複数かまではsource確認から断定しない。同head・同SDKで既存のfiltered fixture caseが成功したとrootが報告したため、resumeのButton queryも元のまま保持する。row25の再表示、実測rowheightとの比較、row1非表示、再起動後の補正scroll・TOC禁止、assert・15秒待機は全て維持する。

runtime26は独立承認済みworkflow SHA-256 `10b1d3df0c8d4f9dae259568e3ade6994a48efd0089088f6a74b899552c02d84` をそのまま採用する。未束縛一覧のraw/exitと掲載有無を診断用に残し、直後のfresh inventoryを30秒・16MiBで取得する。所有lease・head/run/attempt/repository・UUID/name/runtime/type/Booted/isAvailableを必須照合した後、既存の明示UUID testを一度だけ実行する。test commandとpost-xcresult checkerはbyte単位で同一で、結果の実UUID/OS/platformと既存2件のPassed判定、destination120秒・UI8分・job40分・所有cleanupは維持する。workerのmock28＋shell2＋既存結果監査10、embedded Node6/shell14構文、actionlint成功は私有source検証の履歴であり、実destination bindingやUI成功ではない。

この追加UI caseの対象は**同じレイアウトでの再起動復帰**であり、回転操作を含まない。rootの静的照合ではtable markerのplain labelと行列のcustom content、fixture countはrender源と既存caseに整合するが、修正版の本文到達・保存・復帰の実UIはまだ未確認である。実回転・最大文字・VoiceOver・物理QAは未確認として維持する。

## 既存証跡とCI実行上限

旧SDK4段階はApp16module生成、Core71＋Inline37型検査、明示source listのCoreSmoke6とPackageAudit5 compileが診断0で成功した履歴で、証跡SHAは `3e56565e0aaffd01ea3e03798525fcfad9e5e070e57dc0b9eecc569f2de4d744`。公開3db＋v3 codeの限定検証であり、その後のPublished/UI結果は上記の5f590 Hostedと分ける。

旧238e fullのunit133（131成功＋2skip）・UI14/15、A/picker成功・B最初の到着失敗とTOC/save/restart未到達を保持する。親PR270 head85d9の全15check・unit133（131成功＋2skip）・full21・Release成功は85d9の履歴で、正常merge後main955cと同treeだった。親の成功をP1修正版の成功へ流用しない。

Published CI jobの上限40→50分は、親head85d9のfull21が約38分だったroot報告と追加talltable1件に備えた既承認の実行上限調整である。selector・個別15秒・assert・commands・auditsを変えず、今回も保持する。root review originはリポジトリ相対 `.local/ios-autonomous-evidence/published-ci-budget50-root-review.json` のままとする。CI実行上限とアプリの性能改善・SLO・製品性能budgetを区別する。

## 残件

unit152・機能16（Published14＋Native2）＋pure geometry6＝22 selectedのsource数は維持する。5f590の単体とUI登録は確認されたが、この修正版headのcommon/native/full22/runtime26/budget/site/Release/SDK26は未実施である。今回の統合作業は静的・Node・私有Git再計算だけで、API mutation・CI・SDK/compiler・Simulator・browser・networkを実行していない。独立payload review後にrootが通常追commitでPR275へ反映し、必要exact-head CIとmerge条件が揃うまでmainへ統合しない。

相対高さは同じ文字・行・pixelを保証しない。記事改訂後の実位置、実viewport仮説、実回転・最大文字・VoiceOver・実機の受入を残し、IOS-11 checkboxは未完了のままとする。詳細と元の親履歴は[JSON](ios-intrablock-reading-progress.json)へ保存する。旧freezeと共有source/index/ref/publicは変更しない。
