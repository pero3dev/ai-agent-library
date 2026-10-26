# フォルダー選択取消の新snapshot追随preview

## 目的と基線

PR #270の固有6パスを、正常統合済みの実main269 commit `750a305a82c6ff7882de46fdf7889c81925c509e`（tree `7636f378ecd8e8202cd2d9c8c9e89e2aa85b875d`）へbindした。元PR269 headは `dde0ee07669f6697a68446cd06235e27a96b805e` でtreeが一致する。公開parentにこの実commitを固定した私有候補で、`preview_only:true`・`publishable:false`を維持し、独立最終レビューとexact new headのCIを待つ。treeをcommit parentにせず、公開PR270 head238eは変更しない。

原authored deltaは`3dbdfe4512de9948074fcb74151f2422818bf214`→`238e5e9968ff669f191cf3ee62db9d9a6f14378f`。新基線のPub d9edeへ旧5638→picker v2 9d503の追記をthree-way適用し、Pub SHA-256 `41c3cfe54c34d608561a5db63b7c3f087fc1b2c62a12a9a0320c993a27e2e6ba`を得た。既存12 Published caseとhelpersの全prefix、新picker case/helperの全assert・timeout・gestureを保つ。Native bcafの既存2機能＋geometry6を変更せず、source上は15機能＋geometry6＝21 selectedで、実登録件数ではない。

## 保持する実行履歴

旧fd26 sourceの初回run40218125409/job121243610854はunit129（127成功・2skip）、UI13/15成功だった。本文検索Aとpicker識別の失敗を保持し、画像/AXから観測したsystem barへv2 helperを束縛した。v2 9d503＋旧Native1296の限定SDK型検査6.751秒も履歴であり、新snapshot sourceのcompileではない。

旧238eの[full run40226683804](https://github.com/pero3dev/ai-agent-library/actions/runs/40226683804)・job121269430760はunit133登録・131成功・2skip、機能UI15登録・14成功・1失敗だった。本文検索Aとpicker取消caseは成功し、picker case時間は138.720秒。Bは最初の到着で失敗し、その後のTOC移動・位置保存・restart・resume比較へ未到達だった。取消成功を新41c3/Nativebcafの実UIや全保存条件の一般的受入へ読み替えない。原failed source/記録/証跡は残す。

## 新previewで保全するもの

picker helperは観測済み`FullDocumentManagerViewControllerNavigationBar`だけを、一意性・baseline不在・有効geometry・配下の唯一のhittable Cancelを確かめて束縛する。global Cancel・座標・firstMatch fallback、alert自動dismissは加えない。新snapshotの完全表示・先頭ID一致・15秒と既存helperを弱めない。

Nativebcaf、Published selector20、Reader9043、Inlineb6、PBX0.2.15(17)、runtime26 workflow1bdd（bounded取得helper/LF修正とinventory3分）、site graph wait1973、runtime26記録を含む全非対象blob/modeを基線から保つ。既存のclass selectorは変更せず、新pickerの追加でsource上の選択数は21となる。

## 検証と公開条件

この作業はstatic diff・source byte/hash・Node構文等だけで、新SDK/compiler/Simulator/browser/full npm/測定を実行しない。新snapshot21・full/native/runtime26・budget/site/Releaseは正確な再生成new headで未実施である。このprepare時点では`publishable:false`の私有候補で、実main269 commitへの6path再bindは完了した。独立payload review後にrootがDraftへ反映して正確な新headのCIを実行し、必要なexact-head CI成功とmerge前条件が揃うまでmainへ統合しない。実機・VoiceOver・最大文字、IOS-25全体も未完了である。

元のpicker観測scopeはquery/tag/summary/件数、scoped picker消失、no-alert、More/About再操作、restart後のしおり/resumeであり、raw保存bytesやcatalog SHA同一性、provider選択/importまでを証明しない。詳細履歴とsource数は[JSON記録](ios-picker-cancel-ui.json)に残す。

## 実main基線へのbind

旧承認previewの基線5d8から実PR269/tree7636への差分は非所有のruntime26 workflowと記録MD/JSONの3パスだけで、すべてincoming bytesのまま保持した。元の取得helper、LF修正、150秒のinventory総deadline/intent・exit記録、inventory3分・job40分、親に追記されたmain同期と旧成功/失敗記録を戻さない。サイト待機1973と他の全非所有mode/type/blobも保持する。Pub41c3は旧承認sourceとbyte exactで、変更は本記録と入口の基準・parent/hash表記だけである。旧privateのd0e workflow fingerprintは歴史であり、現workflow SHA-256は `1bdd5304ed1418504444773d83e0b43d347ebc6f39aeecda70ca73ce050aea5e` である。新SDK/compiler/Simulator/公開操作・実測は0、App/PBXは0.2.15(17)のままである。
