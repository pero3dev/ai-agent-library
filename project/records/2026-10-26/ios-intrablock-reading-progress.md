# IOS-11: block内部位置の候補とPR275の限定CI修正

## 基線と範囲

旧保存を維持したblock内部位置の候補を、実main270 `955c066c8dc0fdbedf6f0c845a461abda39ac476`（tree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`）へbindし、PR275へ提出した。今回の私有follow-upは実head `03a45eecf7a2d0842f638e29ccb78c2ca0a5d952`（tree `6b8e97ec1cfbd87b9898e70644342a789129abe2`）を親とする。runtime26の有限な起動/UI準備予算と記録MD/JSONの3pathだけで、main955c比の累積は17pathを維持する。App/PBX・Published03a・単体・他CIは変更しない。prepare時点は `preview_only:true`・`publishable:false`、独立root reviewと正確な修正版headのCIを待つ。treeをcommit親にしない。

App4・Core/Inline2・fixture1の承認v3 bytes、Reader584196/Store89eb397/Core629d6、schemaとPBX 0.2.16（18）は03aから変更しない。最新snapshot/pickerの既存Published13case/helpers、Nativebcaf/pure geometry6、三つのpublished selector、親のruntime/picker実績・site待機を保持する。Core15のPR273は別Draftで、この候補へ混ぜない。

## 実装候補の意味

旧保存キー・ReadingPosition・block順fraction・anchor.version1を保ち、任意で有限な `intraBlockFraction` を加える。意味内容で同じblockと照合できる場合だけ内部割合を再利用し、見出し・割合fallbackでは捨てる。読取だけで永続記録を書き換えない。

実top/end markerから高さを得て配置・読書線・captureのvisible topを統一する。自動復帰失敗や未実測proxy位置は保存せず、pan/世代/350ms debounce/離脱flushを区別する。未達の検索・目次・記事内リンクは自動layout再起動へ引き継ぎ、完了・最新ユーザー操作で消費する。これらのApp/Core本文は承認v3と同じである。

## PR275初回Hostedの2失敗

rootが報告したhead5f590のfull run `40252163359` / job `121346524924` は、単体152件（150成功・2skip）とUI22件のうち21成功・1失敗を記録し、ReleaseはUI失敗後にskipされた。追加の `testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch` は22.474秒で最初の `openFixtureLibrary` 内のMore Actions待機に失敗した。本文・40行表・row25保存・再起動復帰へ未到達であり、復帰精度の成否は未確認である。190MBのraw artifactは今回取得していない。

別のruntime26 run `40252163497` / job `121346711814` は、未束縛 `-showdestinations` がexit0でも所有UUIDを一覧へ出さず、membership assertが最初の失敗となった。placeholder-onlyの原因は未確定で、明示UUIDの実testへ未到達、UI0件・app/xcresultなし、summaryはnot-completedだった。独立照合済みのrawでは所有Simulatorを削除し、既存60 UUIDを全て保持した。取得済みartifactは44,994 bytes・89 entriesのCRC正常、SHA-256 `7b55f150884564dd6681e2a1ac1dfe6a3bdd2ca6697aa98e1465572d8ce8e857`。この履歴を新修正版の成功へ変えない。

## 限定修正と保全

`LibraryView`はfilterなしでMoreをMenu、filterありで実Buttonからsheetとして提示する。新caseはfilterを設定せずfiltered専用helperへ進んでいたため、nested `openFixtureLibrary` 内で、既存公開UI helperによる `transformer` タグと `Transformer` 検索をMoreの直前へ設定する1行だけを加える。初回と再起動後の両入口へ適用され、routeや保存記録を注入しない。実行時AXが0か複数かまではsource確認から断定しない。同head・同SDKで既存のfiltered fixture caseが成功したとrootが報告したため、resumeのButton queryも元のまま保持する。row25の再表示、実測rowheightとの比較、row1非表示、再起動後の補正scroll・TOC禁止、assert・15秒待機は全て維持する。

d84/03aのruntime26 preflightは独立承認済みworkflow SHA-256 `10b1d3df0c8d4f9dae259568e3ade6994a48efd0089088f6a74b899552c02d84` を採用した。ここに記す旧上限UI8分等はその履歴で、今回の予算差分は後段に分ける。未束縛一覧のraw/exitと掲載有無を診断用に残し、直後のfresh inventoryを30秒・16MiBで取得する。所有lease・head/run/attempt/repository・UUID/name/runtime/type/Booted/isAvailableを必須照合した後、既存の明示UUID testを一度だけ実行する。test commandとpost-xcresult checkerはbyte単位で同一で、結果の実UUID/OS/platformと既存2件のPassed判定、destination120秒・UI8分・job40分・所有cleanupは維持する。workerのmock28＋shell2＋既存結果監査10、embedded Node6/shell14構文、actionlint成功は私有source検証の履歴であり、実destination bindingやUI成功ではない。

この追加UI caseの対象は**同じレイアウトでの再起動復帰**であり、回転操作を含まない。rootの静的照合ではtable markerのplain labelと行列のcustom content、fixture countはrender源と既存caseに整合する。d84では初回の本文・row25到達まで進んだが、再開後のrow25復帰精度は未確認である。実回転・最大文字・VoiceOver・物理QAは未確認として維持する。

## 既存証跡とCI実行上限

旧SDK4段階はApp16module生成、Core71＋Inline37型検査、明示source listのCoreSmoke6とPackageAudit5 compileが診断0で成功した履歴で、証跡SHAは `3e56565e0aaffd01ea3e03798525fcfad9e5e070e57dc0b9eecc569f2de4d744`。公開3db＋v3 codeの限定検証であり、その後のPublished/UI結果は上記の5f590 Hostedと分ける。

旧238e fullのunit133（131成功＋2skip）・UI14/15、A/picker成功・B最初の到着失敗とTOC/save/restart未到達を保持する。親PR270 head85d9の全15check・unit133（131成功＋2skip）・full21・Release成功は85d9の履歴で、正常merge後main955cと同treeだった。親の成功をP1修正版の成功へ流用しない。

Published CI jobの上限40→50分は、親head85d9のfull21が約38分だったroot報告と追加talltable1件に備えた既承認の実行上限調整である。selector・個別15秒・assert・commands・auditsを変えず、今回も保持する。root review originはリポジトリ相対 `.local/ios-autonomous-evidence/published-ci-budget50-root-review.json` のままとする。CI実行上限とアプリの性能改善・SLO・製品性能budgetを区別する。

## d84の再開後body witness失敗と3path follow-up

rootが完成ログを照合したd84 fullrun `40259035363` / job `121367137316` は、単体152件（150成功・2private skip）、UI22件（21成功・1失敗）、Release skipだった。唯一の失敗は追加Tallcaseで、開始02:52:45.296、before-departure captureはlog5833/02:55:01.807/t136.51秒、terminateは5846/t140.15秒、launchはt141.19秒に到達した。source上でcaptureは初回body・表・row25完全表示/label照合と元Y/rowheight実測の後にある。

再開後はt174.49秒にfixture resumeをtap、t175.67秒にreader20秒待機へ入り、t176.69秒にreader存在を通過した。t176.85秒からparagraph10秒待機、log6074/02:55:53.503/t187.55秒に共有helperのnative-text paragraph存在で失敗し、6076でcase188.461秒の失敗を記録した。したがって初回bodyではなく再開後の汎用paragraph witnessで停止した。表row25の復帰精度を検査する後続assertは未到達で、復帰成功とは記録しない。元5f590の最初のMore入口失敗22.474秒とは別の履歴である。

paragraphは `native-text-`、表cellは `native-table-cell-` という別の識別子契約で、LazyVStackの長い表の途中に別paragraphのAX存在を要求する必要はない。新caseのresume直後だけgeneric helperをreader存在20秒と同じ専用記事navigation bar存在10秒へ置換する。**修正版の本文witnessは表の行25そのもの**であり、既存のfullyVisible/hittable、plain label、元の実測rowheight以内、row1非表示、補正scroll/TOC禁止を全て維持する。初回のgeneric helper、共有helper全体、他13case/helpers・15秒・App/PBX/unit/fixture/schema/runtime26 workflowは変更しない。

artifact metadataはID12624975864・270,463,986 bytes・SHA-256 `5045376529cb143327c371f586bf9a725b09d2c39804576d7992b534b92f81a3`・期限2027-01-24T02:25:38Zとして保持する。このfollow-upではdownload0で、archive bytesの再hash/CRCは主張しない。root完成ログの時刻・line番号とsource契約で段階を確定し、生のrunner profile path行は転載しない。

d84の他14checkは成功し、rootはNativeのunit152・既存UI2・Release、SDK26 Archive199記事、runtime26 run40259035353/job121367136961のNative2/skip0・postaudit/cleanup全step成功を報告した。runtime26 rawの独立照合prefixはd21752edである。これらはd84の実績で、今回のbody witness修正版やSDK27の成功へ流用しない。

## 03aの成功とruntime26の有限予算

rootが確認した03a full run40263169058は単体152件（150成功・2private skip）、UI22件成功、Release成功だった。追加Tallcaseもlog6148で202.200秒のPassedとなり、同一レイアウトでのrow25完全表示・plain label・元の実測rowheight比較・row1非表示・補正scroll禁止を全て通過した。Nativeのunit152/UI2/Release、SDK26 Archiveと通常11checkも03aの成功であり、以下のruntime26未完了と混同しない。これはアプリ性能SLOや実回転・VoiceOver・実機の受入ではない。

runtime26 run40263168942のattempt1はbootstatusのCoreLocation Data Migration中にETIMEDOUT/SIGTERMで停止し、実UI0件・summary not-completedだった。初期の「150秒」というroot説明はsource値の誤認で、03a/10b1のrun helperは**120000ms**だった。唯一の150000msはinventory全体deadlineで、変更しない。既存rawにはtimeout値が記録されておらず、source値とraw ETIMEDOUT・最後のmigration elapsed02:00を区別する。root監査のrawはZIP40,565 bytes・SHA-256 `1630bf00de5fbff05ae51533f6b4588e68601da4b2fda2daf4a3adffad6b181e`・80entries/CRC正常。所有Simulator削除、既存60 UUIDの完全保持を確認した。一次raw/logは書き換えない。

同じ旧headへのfresh-host retryは1回だけで、attempt2/job121387213773はUI step03:49:38開始、最初のtestcase03:56:02開始まで6分24秒を要し、03:57:51にUI step8分の強制timeoutとなった。最初のcaseはt109.15秒のBackButton/見出し検査中で、XCTest assertion failureは観測されず、case完了/Passedの宣言もない。summaryはsimulator成功・UI失敗・app audit成功・results失敗・cleanup成功。rootが取得/監査したartifact12625839922は1,222,582 bytes・SHA-256 `9e1bb7b31c0ba3e84cc56238b5a14de1244265f1230105610db4aab9fedc4767`・136entries/展開19,863,627 bytes・CRC正常で、所有削除と既存60 UUIDのexact保持も確認した。このcandidateで追加downloadは行っていない。

今回のsource差分はowned create/boot step4→6分、bootstatusだけ実source120000→240000ms、UI step8→12分。run helperのoptional timeoutMsは既定120000を維持し、bootstatus呼出だけ240000を渡す。spawnSyncへ同じ値を渡し、exit receiptのtimeout_msにも記録する。他のcalls/default120000、job40分、inventory150000、fresh30秒/16MiB、destination120秒、各XCTest待機/assert・selector/exact2・結果監査・cleanup4分は変えない。コメントのstep上限合計だけ42→48分へ同期する。

これはOSのcold migration・build・runner/XCTest準備を含む**CI資源予算**であり、アプリ性能SLOやテストの合格条件を緩めるものではない。step合計48分よりjob全体40分の方が短く、強制timeout・取消・runner lossではcleanup/証跡完遂を引き続き保証しない。新予算のheadは未実施で、root最終review後の通常追commitによる新変更headで1回確認する。同じheadの追加rerunは行わず、旧2attemptの失敗・未完了を成功へ変えない。SDK27への反映は別の私有単位とし、今回は混ぜない。

## 残件

unit152・機能16（Published14＋Native2）＋pure geometry6＝22 selectedのsource数を維持する。03aのfull22成功とruntime26の2attempt未完了を分け、新しいCI予算headのexact-head CIは未実施として残す。今回の統合作業は静的・Node・私有Git再計算だけで、API mutation・CI・SDK/compiler・Simulator・browser・networkを実行していない。独立payload review後にrootが通常追commitでPR275へ反映し、必要exact-head CIとmerge条件が揃うまでmainへ統合しない。

相対高さは同じ文字・行・pixelを保証しない。記事改訂後の実位置、実viewport仮説、実回転・最大文字・VoiceOver・実機の受入を残し、IOS-11 checkboxは未完了のままとする。詳細と元の親履歴は[JSON](ios-intrablock-reading-progress.json)へ保存する。旧freezeと共有source/index/ref/publicは変更しない。
