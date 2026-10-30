# 現在の記事版にない読書記録の件数と保管案内

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
