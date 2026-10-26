# IOS-11: block内部位置の新snapshot/picker追随preview

## 基線と範囲

承認済み旧final tree `64b6ded12bfa496f146a3bfbf4977c4b234d6356`（旧basis238e/tree9b0d）の固有15pathと承認済みCI実行上限1行の計16pathを、実main270 commit `955c066c8dc0fdbedf6f0c845a461abda39ac476`（元PR270 head85d9）のtree `9d2525e28ce3d9b6659eeac57b0b6f910e7e262b`へ追随する。`preview_only:true`・`publishable:false`で、公開用parentは実main955cへ固定した私有候補である。treeをcommit親にしない。Core15のPR273は独立Draftでこのbasisへ未マージであり、そのファイルを混ぜない。

App4・Core/Inline2・fixture1の承認v3 bytesをそのまま維持し、Reader584196/Store89eb397/Core629d6を改変しない。旧Published ae9eeeには旧picker9dと古いpredicateが含まれるため、そこからtalltableの追加1methodだけを取り出す。最新41c3の全13case/helpersのprefixへそのbytesを加え、snapshot helperとpickerを戻さない。Nativebcaf/pure6、三つのpublished selector、実main269で取得helper/LF修正を含むworkflow1bdd、sitewait1973とruntime/picker actual recordは全て保持する。AppはPBXの版4fieldだけ0.2.16（18）へ進める。

## 実装候補の意味

旧保存キー・ReadingPosition・block順fraction・anchor.version1を保ち、任意で有限な`intraBlockFraction`を加える。意味内容で同じblockと照合できる場合だけ内部割合を再利用し、見出し・割合fallbackでは捨てる。読取だけで永続記録を書き換えない。

実top/end markerから高さを得て配置・読書線・captureのvisible topを統一する。自動復帰失敗や未実測proxy位置は保存せず、pan/世代/350ms debounce/離脱flushを区別する。未達の検索・目次・記事内リンクは自動layout再起動へ引き継ぎ、完了・最新ユーザー操作で消費する。これらのcode本文は承認v3と同じである。

## 既存証跡と新source数

旧SDK4段階はApp16module生成、Core71＋Inline37型検査、明示source listのCoreSmoke6とPackageAudit5 compileが診断0で成功した履歴である。証跡SHAは`3e56565e0aaffd01ea3e03798525fcfad9e5e070e57dc0b9eecc569f2de4d744`。これは公開3db＋v3 codeの限定検証で、新Published/snapshot/picker・版・全projectをcompileした結果ではない。今回SDK/compiler/Simulator/browser/full npm/測定は行わない。

unit152・機能16（Published14＋Native2）＋pure geometry6＝22 selectedはsource数で、実登録・実行ではない。旧238e fullのunit133/131成功＋2skip・UI14/15、A/picker成功・B最初の到着失敗という後発の親履歴を維持する。BはTOC/save/restartへ未到達で、原failedを新sourceの成功へ読み替えない。親のruntime26/budget/sitewait/Release等の実績とexact new head pendingも、そのrecordを変更せず保持する。

## 残件と再生成

新main270で再生成した正確なheadのSDK・common/native/full22/runtime26/budget/site/Release/SDK26、独立payload reviewが必要である。新Pubは未compileで、古いSDK passを新UI22の受入へ使わない。物理QA、最大文字・回転・改訂後の実位置・VoiceOver、実viewport仮説は未確認。相対高さは同じ文字・行・pixelを保証せず、IOS-11 checkboxは未完了のままとする。

構造と旧証跡・現source数・公開不可条件は[JSON](ios-intrablock-reading-progress.json)に保存する。共有source/index/ref/publicと旧v1/v2/v3/finalfreezeは変更しない。

## 実main270へのfinal bind

PR270はroot独立bind review後にDraft head85d9へ更新され、parentsは旧238eと実main750aだった。rootが報告したunit133登録（131成功＋2skip）、full21・Release、全15check成功はすべて正確なhead85d9の親履歴であり、runtime26/SDK26等の既存記録とともに保持する。正常merge後の実main955cは同じtree9d252で、local immutable commit/treeを照合した。これらをP1 unit152/UI22のcompile・実行成功へ引き継がない。承認source7・Pub7c053・schema・PBX版4値は前previewからbyte exactである。prepare時点は私有候補のまま、独立payload review後にrootがDraftへ反映してCIを実行し、必要なexact-head CIとmerge条件が揃うまでmainへ統合しない。

## Published CIの実行上限

親head85d9のfull21 jobは約38分で40分上限の残りが2分弱だったとrootが報告した。P1のtalltable追加1件を含む新22sourceの実行に備え、M0候補をrootが独立照合したPublished workflowのjob timeout-minutesだけ40から50へ変更する。逆置換するとactualmain955cの全bytesへ戻り、selector3class・個別15秒・assert・commands・auditsは全て同一である。これはCIの実行予算であり、アプリの性能改善、SLOや製品性能budgetの変更を意味しない。新P1の実行時間・成功はまだ観測していない。
