# 保存コンテンツの容量を読み取り専用で確認する候補

2026-11-02の初回準備を、2026-11-03にReader29の公開PRへ照合した記録である。以下はUTC `2026-11-03T11:43:08.645540+00:00` 時点の観測と未採用候補を示す。普通mainはApp0.2.28（30）、PR #328のReader候補は0.2.29（31）、この容量表示の次候補は0.2.30（32）である。Reader29は普通mainへ未統合であり、この候補のactualparent・Source・要求・commitは未作成である。

## 容量表示の範囲

通常一覧の「その他の操作」から「保存コンテンツの容量を確認」を明示して開き、観測した通常ファイルの論理サイズ、保存版、現在と前の参照、使用中の参考情報、その他の保存版、取り込み作業領域と未確認を表示する。「再確認」「閉じる」だけを置く。端末の空き容量・割当容量・削除で増える容量の計算や、本文の正常性検証には使わない。重なる参照が同じ版を指す場合は重複加算を避ける。

configured storageRootのmetadataだけを上限付きで観測し、記事・画像の本文bytesや同梱コンテンツ、読書記録と他profileを走査しない。current.jsonは前後で比較し、受理上限4096Bに加え、増大を検知するため4097番目のsentinelを読む場合がある。最大8192entry・深さ12・保存版256、非負Int64のchecked加算で、欠落・異常・上限・読取失敗・参照先未確認を完全な集計として扱わない。保存先がなくても作成しない。

POSIX realpathで親を確定した後、最後のstorageRootと子directoryはO_NOFOLLOW、metadataはfstatatの非追跡で開いたdirectory内から読む。リンクと特殊ファイルを追わず、表示するsnapshotを保持し、request/rootと取消しで古い結果を抑える。件数や取消しの境界はkernel内I/Oの完了時間を保証せず、全processに対するatomic snapshotや全並行変更の安全性は主張しない。Modelsの参照台帳と読書状態・既存isBusyを保ち、参考観測を削除権限として使わない。

## Reader29へ照合した差分

論理参照は[PR #328](https://github.com/pero3dev/ai-agent-library/pull/328)の実head `1834a4fe9bcaac009974b01709a26755f55e449f` で、普通mainの代わりには扱わない。ContentRepository・LibraryStore・LibraryViewとcheck-core.shのbeforeは旧Code8と同じで、新規3ファイルは同headに存在しなかった。7つの非PBX payloadは旧Code8と同じbytesを保つ。

PBXはReader29（31）の既存member・署名・最低OS設定を保ち、旧Code8と同じApp2/Core test1の登録を加えて、版4値だけを候補30（32）へ進める。Readerの6ファイルと追加9単体メソッドの定義を上書きしない。StorageGate、削除、保持方針の採択、更新挙動と新配布は含めない。

## 保存済み検証と未実施の範囲

旧Code8は独立レビューでP1/P2が0件だった。初回hostは10件中1成功・9失敗/31assert失敗を保存し、Foundationが/private/tmpを/tmpへ短縮する入口の親解決だけをPOSIX realpathへ直した追加1回では、macOS Foundationの新10件が10成功・0失敗・0skip、全工程16.558秒だった。current.jsonの4096Bは受理上限であり、読取の4097B sentinelと区別する。

旧base400・App28に同Code8を載せたiOS18.2 SDKのDebug build-for-testingは57.010秒・exit0だった。初回の外側sandboxによるSwift開始前停止も保存する。これらは旧baseのhost/型検査であり、現在のReader29との統合、候補30のSDK・runtime・SwiftUI画面・VoiceOver・実機や整理安全性を受け入れた結果ではない。このrebaseではHost・SDK・npmcheckを再実行していない。旧意味レビューも同じbytesの範囲だけへ参照する。

## 次のコミットと通常main

1. Reader29の同一sourceの必須CI・追加検証と独立レビュー、通常保護でのmain統合、actualmainのraw canonical/fullmapをRootが確認する。3つの公式main push観測は別scopeで、未終了はstatusとnull conclusionを保ち成功扱いしない。
2. その実mainのbefore5と新規3不存在、版29（31）とTODO32行14完了の全rowへfresh結合し、コード8と記録・索引4を分ける。現在の公開PR headだけでSourcebindや要求を作らない。
3. 新Sourceの共通・形式・SDK/必要CIと独立レビューを確認し、通常PR/mainへ進める。実機・VoiceOver待ちは未完了としてスキップする。

IOS-21全体、削除・保持設計、Reader全体の受入とIOS-11・18・25は未完了である。TODOは32行・完了14行と原criteriaを保ち、この容量表示の準備やソフトウェア検証で完了数を進めない。

## Reader UI追補後の結合準備

旧1834／tree394154／2893への照合は、上記準備時点の履歴として保持する。次は新Reader head自身の必要11・custom/source CI・全Source IRを揃え、通常保護で採用された実mainのraw canonical commitと全tuple mapをRootが渡した後にだけ結合する。現時点のactual parent／tree／Source12／要求／commitは未生成である。2895は新Reader候補の見込みで、実mainの証明には使わない。

Storage Code8は7e91940…を保持し、実PBX29（31）と既存5beforeのtuple／SHA、new3不存在を改めて確認する。drift時は差分を報告し、beforeを置換しない。出力規模は実親件数+3（Code8）／+5（record2込み）の式で検証し、12path以外の全tuple・Reader6・採用されたUI・Models／privacy／Assets／audioを保つ。現索引は親全文を維持したprefix挿入だけとし、TODO全32行／14完了と全criteria、IOS11／18／21の未完了を変えない。

旧composition SDK a7f540…は1834とStorage8／App30の型検査だけで、新UI f998を含まない。新UI SDK cbbb1b5…はReader29とf998の型検査だけで、Storageを含まない。両者から将来の合成Runtime・30秒成立・原因解消・新Source CI／main成功を合成して主張しない。Source12の最終検査とIR、公開後の新head CIは後続である。別main pushはCommon／Native／Fullの公式同一SHA・tree・push/mainの3runを実観測し、terminal conclusion又はpending/nullを正確に保存する。失敗・取消・未完了を全成功に数えない。

容量表示は「保存コンテンツの容量を確認」からの明示操作で、metadataの論理bytesを上限付き集計するread-only previewである。pointerは4096Bを受理上限とし4097B目は超過判定用sentinelである。削除・Gate・保持方針拡大やIOS21全体の完了を含めない。

## 0486公開候補の後続確認

Rootのactual pair proof9a58809…で新Reader head0486／tree44d／2895の公開、親・raw message・全tupleを確認した。DraftでCI進行中、通常mainとwhole featureは未受入である。before5／PBX29とnew3不存在、Reader6・f998のtupleはこの公開mapで一致したが、future mainの保証にはしない。実親がこの同一mapとして採用された場合の算術は2895+3=2898、record2を含め2895+5=2900であり、Source12のtree／commit／要求は未生成である。

ContentStoragePreviewTestsのsource定義は10methodで、Reader287へ組み込む候補数は297である。実raw IDとpass／skipは将来のfeature CIで別確認する。旧SDKのApp19／Unit8／UI6はコンパイル入力file数であり、runtime297件の証明ではない。unit件数literalがない現Native／Full workflowは変更しない予定である。

## 0486時点のpayload12作成用追補

この追補はRoot報告をUTC `2026-11-03T14:14:24.492778+00:00` に保存した作成時点snapshotを記録する。公開Reader候補はhead `0486be5f43acecad3723971ed8833b08488dfe86`／tree `44d287ec73b5cb942367e7067dfbc0bbff10ac25`／追跡2895件で、Readerの累積Source14（新規4件）を表す。Storageが所有するSourceを14件へ増やす意味ではない。必要11・Common・Full26・SDK26・Dynamic・Rotation・Revision・Native UI stageはRoot報告でsuccess、Native Releaseはin_progress、RecoveryとR26は同条件retry1がin_progressである。これは新たなAPI観測ではなく、通常mainとwhole featureは未受入のままである。

今回の候補はStorage Code8 MF `7e91940d67be71c40952ab23d938aabd4b452cfa4858f7b23ed74b90f08b470a` の8パス、記録2、索引2の計12パスに限る。App候補は0.2.30（32）を保つ。実際の将来mainが同じ2895件のtuple mapを採用した場合に限り、コードの新規3件で2898、記録を含む新規5件で2900となる算術であり、現在の通常main件数や将来のSource受入を証明しない。actual future main・Storage SourceMF・要求・commit・tree・renderはすべて未生成である。

旧SDK a7f540…はReader1834＋Storage8／App30・旧UIのみ、新UI SDK cbbb1b5…はf998／App29・Storageなしのみの型検査である。いずれも合成Runtime、将来Storageの新Source CI、通常main、30秒成立や原因解消を証明しない。単体はReader source287＋Storage source10＝候補297で、旧SDKのApp19／Unit8／UI6はコンパイル入力file数である。将来のfeature CIで得る実raw ID、pass／skipは未観測のまま保つ。

TODO32行／14完了と全criteria、Reader6と採用UI f998の保持条件を変えない。容量表示は明示操作でmetadataの論理bytesを観測するread-onlyの参考表示で、削除・Gate・保持方針の採択・IOS-21全体の完了を含めない。この作成は記録のmetadata処理に限り、general binder・fixture・proposalを追加せず、新たなGit／API／SDK／Host試験・source適用・旧source編集を実施していない。

## PR330採用後のSource12入力準備（2026-11-04）

この追補はUTC `2026-11-03T16:17:08.907610+00:00` に保存した準備時点の状態である。先行節のpendingや未採用状態とJSONの旧key/valueは、当時の作成snapshotとしてそのまま保持する。今回の実親は通常保護で採用されたmain `1f752a7cef0c1e4593d7900e51338d56d30587e0`、tree `742956d165dc3d6ca95713f47ff2bd644eccb2d0`、全2897tupleで、Rootのraw canonical／soleparent cdf2／全map証明へ結合した。

Storage Code8 MF `7e91940d67be71c40952ab23d938aabd4b452cfa4858f7b23ed74b90f08b470a` は8payloadをbyte保持する。既存5beforeと新規3の不存在をこの実親へ照合し、Code8後2900、記録2を加えたSource12後2902、非所有2890tupleの式と実体を確認する。Reader6と採用UI f998、App候補0.2.30（32）、TODO全32行／14完了と全criteriaを保つ。表示はmetadataの論理bytesを上限付きで参考集計し、再確認／閉じるだけを扱う。削除・Gate・保持方針やIOS21全体の完了は含めない。

Readerのcdf2 main pushはNative実287件中285成功・既知2skipとUI8全成功、FullA18＋B8の重複なし全26成功だった。実Back2／Cancel2／closure2、374Bコピー1回、代表Release3記事／140ファイルとFull Release199記事／625ファイル、各所有Simulatorのcleanupを受領した。直接初期Browse-rootへ入る分岐は未実行である。Commonは実9検査中8成功・1失敗で、EC2の152Bミラー一覧が既存の厳密guardに拒否された履歴を保持する。

PR330の修復head84adでは必要11とCommon Linuxが成功した。実際の取得・installは既存Azure144の環境で、metadata1／download1／install／complete・43package、235ページ、browser677成功／5skip、Firefox14成功を観測した。新EC2152は旧78＋新11の計89fakeIO試験が成功した範囲であり、そのprofileの実APT成功へ広げない。Linux root単体は1528件中1509成功・19skip・失敗0である。PR330 Nativeと新mainのpushは別観測で、今回のStorage実行結果に数えない。

最新のStorage Code8＋Reader6＋UI f998合成は、Xcode16.2／iPhoneSimulator18.2のunsigned generic Debug build-for-testingを1回、48.45679025秒・exit0で完了した。両archの実FileListsはApp19＋generated1／Unit8／UI6、Reader6・StorageSwift6・UI1を確認し、678入力と保全対象は一致した。これはSDK／API型検査であり、Reader source287＋Storage source10＝候補297のRuntime、新Storage head CI、通常mainや実機の受入ではない。旧a7f540・cbbbの型検査scopeとも分ける。

この記録を含む具体的12入力を固定し、同lock／Node24.22.1の私有共通検査を1回だけ行ってから、4形式metadata・Git Data要求・Source12最終IRを確認する。ここは共通検査実施前の作成snapshotで、SourceMF／実要求発行／実commit／Storage新head CIは未受入である。Native／Full正本に単体総数287の固定受入値はなく、全AILibraryTests選択を保つ。文書履歴とgit-conventionsの例示287は変更しない。実機・VoiceOver・最低OS・署名・配布を今回のsoftware準備で完了扱いしない。
