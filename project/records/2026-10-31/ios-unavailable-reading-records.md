# 現在の記事版にない読書記録の件数と保管案内

## 起動後の準備コマンドの上限を見直す候補

2026-10-31の最新状態は、head7fの失敗を保持した12パスの修正候補である。App構成0.2.27（29）とTODO32行・完了14行を維持する。以降の既存節は各採録時点の履歴として保持する。

head7fではNative270件（268成功・2skip）とUI7件、Runtime26 UI3件、Full Aの270件とUI18件が成功した。Full B初回は起動後の端末一覧取得が30秒で停止した。A完了前の再実行APIは拒否されjobを作成していない。全体終了後に受理されたB単独再実行1回は、一覧とseedを通過後、準備用canaryの`simctl pbpaste`が30秒でETIMEDOUTとなった。両BともXCTest未開始で、UI8件・独立374-byte照合・Releaseは未実施である。同一headの追加再実行は行わない。

新候補は2つの準備用読取だけを明示90秒へする。初期一覧・boot・seed・UI後の374-byte取得の30秒、bootstatus240秒、同じ唯一のUUID・type・Booted状態、canaryの全bytes比較、UI26件・各job50分・Release監査を保つ。各sliceの個別コマンド上限は合計最大120秒増えるが、共通wall上限や製品性能予算ではない。再試行を加えず、根因解消や成功も断定しない。inventory再発時だけの旧1call候補は採用せず、別段階の失敗を受けた2call候補として分ける。

新しいNode24.19.0の実inline抽出／fake FS・spawn fixtureは1回で23件すべて成功し、別作者のSource1レビューはP1・P2とも0だった。実simctlや新headのUI受入ではなく、旧Node18の候補結果も転用しない。

ローカル容量は共通検査内の2GiB条件を下回るため完全な共通検査は未起動とする。既存の分散CIを`npm run check`全体の実行とは呼ばない。具体的な代替経路として、既存のroot／ios-toolsの`npm ci --ignore-scripts`とChromium導入・証跡ディレクトリ作成後、reading-state sliceだけに3分枠の`npm run check` stepを追加する。`set -euo pipefail`で全出力を保持し、非zeroやtimeoutなら失敗として扱う。job50分・既存iOS検査と権限を保ち、実際の新headのfull common exit0・必要iOS検査・最新11必須チェックと本文後policyを満たすまでmainへ統合しない。旧head7fの成功を新headへ代入しない。

実機・VoiceOver・保存先provider・上書き更新、最低iOS17とSDK27の既知UI失敗、署名更新・一般配布・複合TODOは未完了として残す。

## これまでの記録

作成日: 2026-10-31。状態: **PR #315の初回失敗と診断工程の時間切れを保持し、12パスの検査修正を準備中**。前段Aboutの通常main採用を別途確認した実parent `568dd2948a58c174cef739a667c3f9bd19ea8fa3`へSource4のbeforeを照合し、PBXの版だけをApp0.2.27（29）へ変更した。main採用自体は実行者の外部前提であり、local HEADの一致だけから推定しない。IOS-22全体は未完了とし、完成版TODOの32行・完了14行を保つ。

## 目的と所有範囲

正常な読書記録に、現在選択している記事版では見つからない記事の記録がある場合、記事数と保管の案内を一覧へ表示する。識別子を利用者へ出さず、自動改名・削除・移行・書き出しは行わない。既存の破損記録の確認、保存停止、復旧、読書JSON復元を優先する。

予定所有はReadingStore・LibraryStore・LibraryView・LibraryCoreTestsの既存Source4、版だけを変えるPBX、記録2本、索引2本の計9パス。新規は記録2本だけで、実parentのtracked2835と9所有差分から2837となるtreeを計算する。2837は提出treeの予想であり、この単位のGit/main採用完了ではない。[共通契約](../../../AGENTS.md)、[運用文書規約](../../../harness/writing-rules.md#調査記録と運用文書)、[Git共通規約](../../../harness/git-rules.md)を適用する。ユーザーの残TODOの自律実施・通常commit/PR/main統合の許可を根拠とし、本人操作の実機確認は未完了のままスキップできる。新課金・外部配布・network操作・容量整理やGCを追加する単位ではない。

## 表示と保持の意味

しおりの記事、保存位置を持つ記事、最後に開いた記事を重複なしでまとめ、選択中の完全な記事一覧の全IDを差し引く。同じ記事が複数種類の記録に現れても1記事として数え、検索語・しおり絞り込み・画面上の表示件数には左右されない。タイトルやpathの類似から別IDへ対応付ける処理は加えない。

読み込み中、記事版がない場合、テスト用ライブラリ、テスト記事を含む版、破損・部分復旧・保存停止、読書記録の復元中や復元画面の表示中は案内を抑える。正常状態でも件数0なら表示しない。既存の復旧や復元の判断に、新しい件数案内を混ぜない。

利用者には「現在の記事版にない読書記録」と記事数、記録を保管していること、既存の「その他の操作」→「読書記録を書き出す」の場所だけを案内する。opaqueな記事IDや内部の保存方式は表示せず、書き出し・復元の成功も保証しない。件数取得は読み取り専用で、読書raw・backup・選択記事版のpointerを変更しない。復元previewと取り消しも既存動作を保ち、本人が確認した復元だけが既存手順で状態を置換する。

記事版を切り替えて同じIDが再び見つかると、その記事は見つからない件数から外れる。現在の記事を別IDへ改名した場合は旧記録を保持したまま数える。この挙動は、自動rename mapや将来schemaへの移行、削除された記事の復元を実装したという意味ではない。

## 初回Source4の静的レビューと実macOS確認

Source4は独立静的レビューでP1/P2が0件。ReadingStore・LibraryStore・Viewの追加部分を除くと各beforeへ全bytesが戻り、LibraryCoreTestsは旧280,415Bの全文をprefixとして保持し、13,896B・新6件のextensionを末尾へ加えた。新Appファイル・依存・PBX・版・保存schema・権限の変更はこの私有Source4に含まれない。Viewのbeforeは前段Aboutの最終文言a8ae版であり、実parentの全Source4 before bytesへ一致することを確認した。

最初のHost試行は空き270,897,152Bで700MiBの事前条件を満たさず、stepsが空のまま停止した。version、compiler、testは1つも起動せず、その拒否票を保持している。容量確保後、別出力へ同じguard・抽出Core7・support・新6件を全bytes同一で固定し、明示許可を受けた別試行を1回実行した。

そのmacOS Darwin XCTestでは**一意6件・実行6件・skip0・fail0**。Core7 module生成12.961秒、新test build5.621秒、runtime1.824秒、version確認を含む全工程26.835秒で、全4コマンドがexit0となった。6件それぞれのStarted/Passed各1回とruntime JSONを照合し、11入力と元Source4・初回事前拒否票の不変を確認した。実行対象は重複union、保護状態、全catalogとfilterの区別、記事版/ID変更時の保持、loading/fixture/復元表示の抑制、preview・cancel・確認済み復元の区別である。

元の制限は120秒・合計log2MiB・所有出力512MiB・空き700MiB、0.25秒間隔の観測。最小空き4,000,542,720B、最大所有116,388,681B、子出力2,999Bを記録し、既知の自process groupを終了処理した。Swift/XCTest子はprivate HOME・preferences・TMPDIRを明示した。これは全filesystemアクセスの隔離証明やhard peakの保証ではない。外側Pythonのtemp-dir警告も子の設定と区別して保持する。

## 実parentへ結合したソースと既存SDK証拠

実parentへ結合したApp17ソースの各bytes/SHAと、全文CoreTests294,311B・現在のDiagnosticsTests8,057Bが、先に固定した将来構成のSDK入力へ全て一致した。これは既存のSDK検証結果を現在のソースへ結び直す操作であり、新しいSDK実行ではない。初版draftのApp/SDK未実施という記述は当時の段階で、元記録を履歴として保持する。

既存のiPhoneOS18.2・arm64 iOS17・Swift5・DEBUG検証は、App17 module13.244021秒、全文CoreTests型検査3.834591秒、現在のDiagnosticsTests型検査0.474170秒が全exit0、全工程18.660774秒だった。spec68入力とguard/spec2の計70固定入力、追加module4の保存時のhashを照合し、元実行時の入力保持・既知3process groupのreap・子raw出力6本0Bを確認した。独立した保存証拠レビューもP1/P2=0である。先のmacOS Core7/6件26.835秒とは別の証拠で、Host6の再実行ではない。

SDK工程は90秒・合計log1MiB・所有300MiB・空き700MiB、0.05秒間隔の観測で、最小空き3,772,260,352B・最大所有92,865,407Bだった。生成cache linkはlstatのみでtargetを追わず、固定入力はregular/hashを保持した。観測値はhard peak・全filesystemアクセス隔離・全SDKの完全性の証明ではない。外側launcherのfs-event/cache-dir警告は転記した観測票で、空のcompiler raw logや別取得のlauncher raw streamとは区別する。例外cleanupは静的確認で、障害注入による実証はしていない。

証拠のmanifestは `7585117f1b8cd5e8502fcf52a810d69da80a54280e686938f1f76348c0e23a3c`、resultは `90eaa884fb8a22d8795b62ac7c706ba05e07edf9d1d7f92af8a42891dcf99b0c`、独立レビューは `fbbc40c01f755f9a15fcc1a51128e01a973e5608a2c3796135e79deb2cafa3d1`。PBX29の設定だけから実Bundle・表示版・新署名の成立を推定しない。

## 初回9パス候補時点の提出計画と未確認

実parent `568dd2948a58c174cef739a667c3f9bd19ea8fa3`とSource4のbeforeを照合し、PBXを0.2.26（28）から0.2.27（29）へ版だけ変更して、この記録・索引を含む9パスを結合した。parent tree・before blobとPBX前後SHAは対になるJSONに保存した。共通検査と最終9パスの独立レビューを通した後、小さなcommit・PR・必要CI・通常main統合へ進め、各段階の結果を別に記録する。

新headのHosted単体270件（前段予定264＋新6）・Native7件・Full26件、新共通検査・最終9パスレビュー・CI・通常main採用、実notice表示・VoiceOver・実機・provider・新署名・実Bundleは未確認である。既存SDK結果の再利用やHostのCore7成功を実UI・iOS runtime・現main採用へ広げない。

IOS-22の跨ID自動改名対応・schema/旧HTML等を含む全移行受入は残る。IOS-11の改訂後の位置精度、IOS-18の障害復旧、IOS-23の性能、IOS-25のUI回帰、IOS-27の申告/policy、IOS-28の実運用もこの単位で完了にしない。実機等はユーザーの許可に従い未完了として進め、[完成版TODO](../../plans/engineering/ios-app-completion.md)の全32行・14完了を保つ。既存データを消したり、GCの安全性や自動復元の保証を追加したりしない。

## PR #315の初回検査と次の検査構成

初回の9パス候補はhead `324ed14e26bbe4a6a567ab06bae86c2657433b37`、tree `1d2d39674e945a4e8e9fb658d7c51d3739ed9bc1`、tracked2837で[PR #315](https://github.com/pero3dev/ai-agent-library/pull/315)へ提出した。共通検査は1206件中1191成功・15skip・失敗0、最終9パスの独立レビューはP1/P2=0だった。Ready本文以後の必須11検査も成功した。初回の予定を記した前節とは段階を分ける。

Nativeでは実単体270件中268成功・2skip・失敗0、新しい件数判定6件とDiagnostics6件を含み、UI7件も成功した。DedicatedとSDK26 Archiveはmetadataで初回成功を確認した。一方、Runtime26は3件中2成功・1失敗で、健全な旧記録のケースが、最初の一覧の「続きを読む」を押す前の15秒待機で失敗した。最後のpollは約14.383秒かかってfalseを返した。後段のgeometryと画面写真ではカードが見えたが、待機後の別の時点なので、当該pollが成功すべきだった証明や原因確定には使わない。通常の待機時間、完全表示判定、hittable条件を緩める修正は行っていない。

Full初回は51分21秒でcancelledとなった。実単体270件は上記と同数で成功し、完了したUI19件（Native3・Published16）も全て成功したが、残るPublished1とgeometry6は完了していない。コピーのUIケース成功と独立した374B stdout照合は別で、独立probeは未完了、ReleaseもskipのためFullは未受入である。前段mainの別runでは必要なUI26・copy374B・Release監査まで完了していてもjob全体はcancelledだった。これらの中断を検査成功と読み替えない。

次の候補ではFull用workflowだけを固定2組へ分割する。reading-stateはNative3・Published9・geometry6の18件と単体を、content-copyは残るPublished8件と独立copy374B・Release199記事監査を担当する。両組でDebug資産監査と実UIの厳密集合照合を行い、重複・欠落・skip・failを許さない。content-copyはDebug監査より前にUIのbuild-for-testingを行う。各jobの50分枠、SDK、テスト本体、既存の署名不要条件を保ち、artifact名を組ごとに分ける。分割自体の実Hosted効果はまだ未確認である。

別のNativeテスト差分は、既に読んでいるgeometry判定とhittable値・経過時間だけを待機診断へ記録する。追加AX取得や読書動作の変更は加えず、同じpredicateと15秒を保つ。診断だけの別branch/head `63f7a82674e39d4343df08aec042b9fd54df4f74`に対し、[Runtime26の診断run](https://github.com/pero3dev/ai-agent-library/actions/runs/41134722071)を1回開始した。初回headの再試行ではなく診断ソースの別実行であり、その成功だけで元失敗の原因が解消したとは扱わない。

提出差分は元Source4・PBX・記録2・索引2に、Full workflow、Native待機診断、Runtime26 workflowを加える計12パスを予定する。新規pathは増えずtracked2837を保つ。App17・PBX0.2.27（29）・記事/音声・単体の本文は初回候補を保持する。追加ソースの独立レビュー、新しい全12パスの共通検査・最終レビュー・正確な新headのCI、通常main統合は後続である。noticeの実表示、VoiceOver、実機、新しい署名候補は未完了として残す。

診断runは実UI3件が全成功し、22個の待機はいずれも1回のpollでgeometry可視・hittable trueを返した。初期Continueの待機は約3.407秒だった。最初の失敗は今回再現しておらず、解消原因を確定したわけではない。Xcodeは22:14:29.214 UTCにTEST SUCCEEDEDを出力したが、22:14:31.564 UTCに12分上限で工程が失敗した。strictな3件の結果readerが成功しても、UI工程とcompletion gate・jobは失敗のため、診断run全体を成功扱いしない。コマンドexit記録ファイルの存在・値はraw stdoutだけでは未確認である。

この実測を根拠として、RootはRuntime26のUI工程枠を12分から15分へ再配分する。job全体40分、cleanup4分、artifact2分、残る工程cap、UI3件の完全一致と各predicateの15秒を保つ。工程capの合計表記は48分から51分へ同期するが、この合計は全工程完了の保証ではなくjob40分が全体を制限する。実テスト本体の条件を緩和せず、SDK27の既存12分回帰検査とworkflowは変更しない。この新sourceでのHosted完了は後続で検証する。

分割候補は既存Node24.19.0で純粋fixture44件が全成功した。現在と診断版のSwift3クラスの全test集合を元26件へ照合し、未知・不足・重複・曖昧な追加や平坦でない入力は拒否する。これは新しい実UIやHosted成功ではない。

## Source12の初回Full失敗と操作準備の追随修正

追加head `7860f53f136c7cf9b0cd7fc3a784a5e88005e7ed`は、必須11検査と本文更新後policy2、Nativeの実単体270件（268成功・2skip）/UI7件、Runtime26の実UI3件が成功した。Fullの2組はそれぞれ独立に失敗し、reading-stateは18件中17成功・1失敗、content-copyは8件中7成功・1失敗だった。26件の総和24成功・2失敗であり、独立copy374BとRelease199記事監査は未実施なので、Fullを受入・main反映しない。Source12の初回共通検査のMD012停止と修正後の成功も別票として保持する。

content-copyの失敗はBodyLinksの3回目のTOC準備だった。前2本の同記事リンク到着は成功し、「末尾の到着地点へ」を押す前に、CASE-LINK-01の操作準備の15秒待機が失敗した。後段geometryでは可視・操作可能だったが、別時点なので待機中の成功証明にしない。旧rawにprecheck Boolの直接記録はなく、Swipe記録0からの推論だけで原因を確定しない。

この追随修正では、goToContents内の既存predicateが最初にtrueを返した場合、そのBoolを当該call内で保存し、同じtargetのtapへ使う。新たなAX取得で同じ成功条件を二度観測し直さない。各callのBoolはfalseから始め、18回のcheckでtrueを得なければ従来のrequireHittable15秒を必ず実行する。18gesture上限、同じgeometry/hittable条件、公開tap、移動後headingの完全表示と本文witnessのassertを保つ。判定機会は2時点から1時点へ変わるので、全時序不変・実行間隔0・旧失敗の根本原因解消とは扱わない。

既存Boolと回数、2回のmonotonic時計だけを使い、precheck終了時に1回、prefix込み1024B以内の診断を出す。headingIDは96Bのprefixへ制限し、encoding不能時も短い固定形を使う。診断は可視性や最終待機の成功を作り出す条件には使わず、追加AXはない。

reading-stateの別の失敗は、TOC移動と完全表示・captureが成功した後、returnToLibraryのback tapに続く「native-readerが存在しなくなる」の10秒待機だった。再起動・続きを読むの検証には未到達で、この失敗がTOC改善で直るとは主張しない。10秒・元predicate・back選択・後段search/8回revealを保ち、待機結果を一度保存して、不成功の時だけ画面とUI階層を添付してから元の失敗assertへ進む。成功経路にはAXやcaptureを追加しない。後段添付を元の10秒待機の合格根拠にしない。

新Native50,205Bはbc9の全文へ正逆2hunkで戻る。静的Source1レビューはP1/P2=0。既存のFull source-rosterを新Nativeと変更していないPublished/他3ファイルへ適用し、元26件の正確な集合を確認した。新しいiPhoneSimulator18.2・arm64 iOS17・Swift5/DEBUGの2ファイル単独型検査はexit0、compiler9.514538秒・phase10.316490秒、固定10入力保持・raw2本0B・既知1群reap/remainingfalseだった。これは実XCTest・Simulator・App本体・署名・main受入ではない。

元の機能Source4・PBX0.2.27（29）・Publishedのtest本文・Full18/8とRuntime26の15分/40分設定を保ち、元の12所有パスだけで新共通・最終12レビュー・追加commit・正確な新headのCIを確認する。実notice・VoiceOver・実機は未完了として維持し、TODO32行・14完了を保つ。

このUI2ファイルSDK保存結果の独立レビューもP1/P2=0で、型検査入力・終了コード・raw・既知群の記録を照合した。実XCTestや旧待機原因の解消へは広げない。
