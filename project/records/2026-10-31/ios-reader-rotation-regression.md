# 固定列幅表の回転後の読書位置回帰

## 9dでの実観測とCI時間配分の訂正

head `9d7010c4c9725a24e8f9e9a58469732a28b3ab74` では、訂正した検索→Buttonの入口から専用記事を開き、本文・しおり操作と目次の選択まで進んだ。4分のxcodebuild枠が終了し、R25・回転の結果は得られなかった。UI step開始からcase開始まで約193.122秒、caseは約46.48秒で、最後のidle記録からtimeout assertionまでは約1.601秒だった。Popenの独立UTCは保存しておらずstep時刻基準の比較だが、本文のフリーズを示す証拠とは扱わない。旧3e7の同じ40行表を使う通常Fullケースの201.768秒成功は、旧caseの比較材料に限る。

同じ9d・条件で1回だけ再実行した結果、xcodebuildはexit0だったが、その後の`built-content-audit`が30秒でSIGKILL／ETIMEDOUTとなった。実intentにはbuild共有枠が139.628秒残っていた。`check-package.sh`は各回でCore4と監査用Swiftをコンパイルするため、通常の短いコマンド用default30秒が当たっていた。どちらの失敗も保存し、9dの三度目の条件不変retryは行わない。

候補では、生成後の代表・fixtureと、build後のContent・TestContent、計4回の同じnative package監査へ明示120秒を割り当てる。content180秒／build360秒の共有deadlineは保ち、各コマンドには残時間との小さい方を適用する。監査自体、期待記事数3／4、Source・asset・resource照合は省略しない。

UIの共有枠とxcodebuild上限は240秒から420秒、CI stepは5分から8分へ改める。観測されたcase開始前193秒と旧同一表ケース201秒を根拠とする実行枠の候補で、製品の性能予算ではない。明示step上限合計は39分から42分、jobは1分の余裕を保つ40分から43分へそろえる。他のstage上限、strict1件・skip／重複拒否・owned UUID・Source相関・cleanup・storage、テスト本文とhittable／R25／しおりの合否条件は維持する。新しい実行での効果と専用1件の成功は未確認である。

9dのNativeは単体278件（成功276・skip2）・UI7件、iOS26は厳密UI3件、Full BはUI8件・実コピー374B・Release199記事／音声1本に成功した。続いてFull Aも単体278件（成功276・skip2）・UI18件、完全な `npm run check` 1206件（成功1191・skip15・失敗0）と全工程に成功し、A18＋B8の一意26件を照合した。現9dの同じ40行表を使う既存ケースは164.934秒で成功したが、別caseのため新Reflowの時間・回転成功を保証しない。Recovery初回はUI開始前の180秒timeout等で失敗し、同条件1回の再実行ではF／R各1件が成功した。取得したraw-test JSONの一意なcase／祖先階層／Passed／owned UUIDを独立照合し、Fは15.903秒、Rは69.935秒だった。52B sentinelの前後SHA一致はrunnerの記録に基づく整合確認で、別マシンからの実FS再読取や全ユーザーデータ保証ではない。

9d時刻比較票は`3eead417cbf38af49e147696b13bd149e85d2920613d395878dcd8ba0c5e4b7b`、二つの限定再実行票は`655f2108f67ea292b09d6043636d4f236582eba8ef407fa899db6d66ca2d8c9c`。初回ReflowのZIPは`439def581380e0d30d34c9ee97e4c2f9dac8443c86905ec2308abab69672d456`、再実行のbuild監査ZIPは`accda2d5a5fb4056e08b3616a80279c462ebf41b56aab26e4ad79e7a5c92a3fd`。Recovery再実行のcompact ZIPは`252c6a1ed34be07581a23e91424c73dbd583e3818f150fc7a8730ddaeb702e76`、Rootのraw照合票は`a1a63e660e5801049c0744fedd60d9c0479c263d9b0e7d97690b9cae37e51901`である。[Reflow run](https://github.com/pero3dev/ai-agent-library/actions/runs/41169970568)と[Recovery run](https://github.com/pero3dev/ai-agent-library/actions/runs/41169970586)に対応する。

App0.2.28（30）・Core／既存Swift・本文199記事・音声1本・通常UIの対象・保存形式を保持する。新workflowと記録の独立レビュー、共通検査、新headの専用1件と通常CIが成功してから通常mainへ統合する。IOS-11・実機・VoiceOver・大きな文字・実package改訂と段落reflowは未完了、TODO32行・完了14行を維持する。

## 9d提出までの記録

以下は各提出時点の履歴であり、当時の予定や未確認を現在の成功へ読み替えない。

## PR317の初回失敗と入口の訂正

head `3e7f444a9f584c723e07b50c5ed6f305bd7e463c` の通常Nativeは単体278件（成功276・skip2）とUI7件、FullはUI18＋8の一意26件、コピー374B、Release199記事・音声1本の監査に成功した。Full Aの完全な `npm run check` は1206件（成功1191・skip15・失敗0）で、Markdown・記事・リンク・TODO・ハーネスの全工程も成功した。専用ケースの成功とは分ける。

専用Reflowの初回はSimulator起動後の端末一覧取得がtimeoutし、build前に失敗した。同じsource・条件で1回だけ再実行したところ、build後に新テスト1件が失敗した。実artifactのstdoutでは、最初の「その他の操作」のhittable判定でactivation pointを取得できず、fixture・しおり・表・回転の操作には到達していない。読書位置の不具合が見つかったとは判定しない。iOS26の初回は依存監査APIのHTTP400でUI前に失敗し、同条件の再実行1回では厳密なUI3件が成功した。どちらも最初の失敗を残し、三度目の同条件retryは行わない。

通常一覧の「その他の操作」はtoolbar Menuで、検索中の同名Buttonだけが「その他の操作」画面を開く。新テストは両者を混同していた。入口を公開の本文検索「Transformer」で絞り込む導線へ訂正し、検索値と絞り込み表示を確認してから、既存Fullのfixture検査で使う同じButton・画面へ進む。準備swipeは最大8回で、検索・前面一意性・15秒待機と、到着後のR25・R1・R24・しおり・offset・補正操作禁止の判定は保持する。production UI、保存形式、App0.2.28（30）、既存Native/Full/iOS26と専用workflowは変更しない。

初回観測票のSHA-256は`062359c0bcfe2d75886ce7f7ca66e6797fe5014bd0d7e0d70928f09cffc42bab`、二つの再実行票は`1e777c0007bfe7a862ae0cfa25dc8c7cd572ce6d340d29bc4a81270c3eff10e2`。Reflow attempt2のartifact ZIPは`79a2ce69397c1a26c61c70f0480b98f4891664aa7294e99a7f9013a72f3225f0`、実stdoutは`7e9a1db455e1ac69b36f923e083e6343f6e9af72130a440784805d12dd40795b`である。[専用run](https://github.com/pero3dev/ai-agent-library/actions/runs/41165880724)と[PR317](https://github.com/pero3dev/ai-agent-library/pull/317)に対応する。署名付き一時URLやraw・画面写真は追跡ファイルへ収録しない。

訂正後ソースの独立レビューと新headの専用1ケース・通常CIを確認してから、通常保護でmainへ統合する。旧f17のSDK型検査を訂正後ソースの成功へ転用せず、新しい実buildとUIの結果を待つ。実機・大きな文字・VoiceOver・段落reflow・実package改訂の位置照合とIOS-11全体は未確認、TODO32行・完了14行を維持する。

## 初回3e7提出時点の履歴

以下2段落は入口訂正前のf17ソースを提出した時点の記録である。保存SDKとSource3レビューは当時の入力だけを対象とし、訂正後47bの実build・UI成功を表さない。

現状態: 先行PR316の実parent `8ff3ac6c069c630b5be53ab21ec2d4331686f3c8` への提出候補投影。App0.2.28（30）を引き継ぎ、この単位の版上げはない。PBX30への4test組込み差分は独立静的レビュー済みSource3のexact bytesへ一致する。新規workflow/test/record2を含む7パス、parent2839→target2843を投影する。新共通・最終7レビュー・新headの1case Hosted/通常CI/main・実機/VoiceOverは未確認、IOS-11とTODO32行/14完了を維持する。

保存SDKは現Native00eと新Reflow f17の2ファイルだけのstandalone型検査で、exit0・8.147275秒、phase9.150103秒、10固定入力保持・保持19件・raw0を確認した。Source7のApp17/Core/Diagnostics型検査ではなく、PBX登録や実XCTest/UIの代用でもない。Source3投影IR `768812994bdb439e42c990855a0b8190ace063d17b489199c92d49473e35fd0c`、SDK保存票IR `c9c5a891c338180a3122e35ba1ec2f9c12005ab8fd15f296d455ef400bb4492f`へ結ぶ。旧522/bc9の結果を現在へ代入しない。

## 初期v4原稿の履歴

以下はactual parent未確定時の原稿全文restであり、当時の予定/未確認は現在の成功を意味しない。

現状態（v4私有準備）: **PR trigger対応workflowの静的検証と、現Native00e＋Reflowの新しい単独SDK型検査まで**。actualparent SHA/tree/countは未確定である。先行previous-stored fallback7が通常mainになった後の予定App0.2.28（30）を引き継ぎ、このUI単位では版を上げない。現在のApp29をApp30の実Bundleや署名済み実物として扱わない。Source3の実parent結合・PBX30登録再投影・共通・最終7レビュー・Hosted新case・CI/main・実機/VoiceOverは未実施で、TODO32行・14完了を保つ。

## 旧v3時点の履歴

以下は旧522／将来trace bc9のSDK構成とmanual-only workflowを記録したv3本文の全文である。App29、manual-only、dispatch github.shaという当時の段階記述を履歴として保持し、最新状態は末尾節に記す。

作成日: 2026-10-31。状態: **私有候補の静的検証と単独SDK型検査まで**。Notice後または読書UI待機trace後の実parentは未確定で、parent SHA・tree・追跡ファイル総数は未記入とする。先行NoticeのApp0.2.27（29）を維持する予定で、この単位では版を上げない。実UI・専用manual workflow・CI・main反映は未実施で、IOS-11全体とTODO32行・完了14行を維持する。

## 目的と作業契約

既存の専用記事にある40行表を実際に読み、しおりを付けて保存した位置が、縦から横へ変えた再起動と、開いたまま縦へ戻す操作の後にも保たれるか検査する。所有予定は`ReaderReflowUITests.swift`、UITest登録だけの`project.pbxproj`、専用manual workflow、当記録と同名JSON、`project/README.md`、[完成版TODO](../../plans/engineering/ios-app-completion.md)の7パスである。[共通契約](../../../AGENTS.md)と[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)に従う。

ユーザーのTODO自律実施、小単位のcommitと通常PR/main統合の依頼を作業根拠とする。実機確認は未完了と記録してスキップできる。この記録は親の私有準備を整理したもので、managedへの採用・Git操作・外部起動を実施した記録ではない。

新規追跡ファイルはUITest1、workflow1、記録2の予定4ファイルである。PBXと索引2本は既存ファイルの変更に限る。実parentが未確定のため、追跡総数を旧mainから推測せず、`parentの実数 + 4`だけを予定差分として残す。

## 一つの公開UIシナリオ

新しい隔離suiteでportraitを使い、「その他の操作」→「本文表示テスト」から専用記事へ入ってしおりを付ける。目次`CASE-INTRABLOCK-01`から、既存40行表のblock IDを動的に読み取る。18回以内の準備swipeでR25を表示した後、1回の実測dragで短いcellを読書領域の上部へ寄せる。通常の文字サイズを変える設定・引数は追加しない。

R25の識別子は`native-table-cell-<blockID>-25-1`、labelは`INTRABLOCK-R25`とする。一意なcellが完全表示され、hittableであり、しおりの削除操作が使えることを保存前に確認する。一覧へ戻って保存をflushし、アプリを終了する。landscapeへ変えて同じsuiteで起動し、公開の「続きを読む」の最初の到着で同じ条件を要求する。そのまま本文を開いた状態でportraitへ戻し、同じ目印をもう一度確認する。どちらの復帰後も目次・検索・swipe・dragによる補正を行わない。

R1は解決済みviewportと部分的にも交差しないことを要求し、表先頭へのfallbackを検出する。R24は完全表示されないことだけを要求する。隣接するcellに隙間がないため、R24が一部見える状態は許容し、完全outsideとは記述しない。unknown geometryは既存checked判定で失敗にする。R25自体の一意性・正確label・完全表示・hittable、foregroundと15秒の既存判定を緩めない。

保存時の読書上端からのoffsetとの差が、保存前後に測った目印cellの高さの大きい方以内であることも確認する。この高さはcellのframeであり、第二列のほうが高い場合のGridRow全体の高さではない。縦横の絶対画面Yを比較せず、文字単位の正確さも主張しない。失敗時もteardownのdeferで開始時のorientationへ戻す。

## 保持する実装と実行枠

新classの1メソッドを既存classから分ける。Nativeクラス3件、通常Native workflowのRecovery4件を含む7件、Full workflowのNative3＋Published17＋geometry6、計26件は変更しない。専用caseは既存二つのworkflowから選ばれない。既存の同じレイアウトでの表内部復帰case、本文・fixture・保存形式・production UI、viewport/EPS、正の完全表示と既存上限も保つ。

PBXは新Swiftのfile reference、build reference、UITest group、UITest Sourcesの4点だけを追加する。私有準備のbeforeはApp0.2.26（28）で、逆変換は元byteと一致した。これは将来のApp0.2.27（29）への結合を確認した結果ではない。実parentが確定した後、そのPBXへ4点だけを移し、version・App・署名・resource不変とinverseを取り直す。

workflowは`workflow_dispatch`専用、read-only permission、固定action SHA、正確なdispatch時のfull40SHAのcheckoutを使う。macos-15・Xcode16.4・SDK/runtime18.5・iPhone16の実inventoryとsource hashを照合し、代表3記事と専用fixture4記事を生成・監査する。新たに作成し所有を証明したUUIDだけをboot・shutdown・deleteする。他の端末の停止や全消去は行わない。

固定selectorは`AILibraryUITests/ReaderReflowUITests/testFixtureMeasuredRowAndBookmarkSurviveRotatedRelaunchAndLiveReturn`の1件で、build1回とtest-without-building1回に限定する。strict gateは観測済みXcode16.4のplan／bundle／suite／case構造、Passed、正確ID／URL、owned UUID・runtime・platformを要求する。skip・重複・余分なcaseを受理しない。

各stageの共有deadline、commandのmaxBuffer8MiB、JSON128KiB、raw evidence256MiB・8192entries、step上限合計39分・job40分を設定した候補である。raw uploadはstorage gate成功時に限定し、小さなJSON receiptを失敗時にも残す。これらは継続的なDerivedDataのdisk quotaや子孫processの完全隔離を保証しない。強制終了・runner消失時のcleanup完了も未保証である。retry、既存profileやSDK27 helperの変更、署名・配布・新しいcredentialsは追加しない。

## 検証済みの範囲

| 検査 | 確認結果 | 受入に含めないもの |
| --- | --- | --- |
| sourceのNode構文・既存js-yamlでのYAML解釈 | 成功 | actionlint、Hosted実行 |
| 新class・selector・既存count、PBX逆変換 | 静的検査成功 | Xcodeでの登録、App build、XCTest |
| strict結果gateの合成JSON | 正常1＋拒否17の18件成功 | 実xcresultの照合 |
| Source3の別作者レビュー | P1・P2とも0件 | 実行や最終7パスのレビュー |
| SDK実行ガードの別作者レビュー | P1・P2とも0件、起動前固定 | 実UIや最終payloadの受入 |
| 既存Native＋新classの単独SDK型検査 | Rootが1回実行、exit0 | PBX登録、App build、XCTest、UI |
| 将来trace Native＋新classの単独SDK型検査 | 別の固定specでRootが1回実行、exit0 | 採用mainや実UI |
| 保存済みSDK2構成と将来spec差分の別作者照合 | P1・P2とも0件、receiptと10入力を独立確認 | 新しい実行、最終7パスやApp／PBX／AX／UI |

SDK型検査は既存`NativeReaderUITests.swift`のSHA-256 `52286e1861fae89fdf7aa225307a8f525c6bc0e937e4164f495a1d0cd3963566`と、新classの`f17bd31d97a133c81d34d77fd0d24f07196d3ce42fc7670591aebae9a68a4329`を、iPhoneSimulator SDK18.2・arm64・iOS17 Simulator target・Swift5・DEBUGで組み合わせた。コマンド6.106828秒、全phase7.041835秒、8入力とguard/spec2入力の保持、log0B、所有process group1件のreapを記録した。最小空き容量の標本は3,656,994,816B、所有領域の最大標本は69,295,556Bだった。標本による観測を瞬時の上限保証へ読み替えない。

別に、将来trace版Nativeの`bc9c8268ab4bfb82a936f69be94d86667f23fb9ef669389d9e62ac159cb299f6`と同じ新classを組み合わせた型検査も、Rootが別の固定specで1回実行してexit0だった。toolchain条件と90秒枠は同じで、コマンド5.901629秒、phase6.52376秒、10入力の保持、log0B、所有group1件のreapを記録した。最小空き容量の標本は3,579,572,224B、所有領域の最大標本は69,304,263Bだった。現行baseの結果を将来構成へ代入せず、この別結果として残す。

将来構成のguard logicはreview済みの同じSHAである。新specはRootが静的差分を確認して起動し、後の別作者照合で、将来spec固有の差分と両構成の保存済みreceiptを確認した。小票のSHA-256は`a185e746c1528edab124eb7482edb00f29ba4ef01a81f48d3ebc2929ce86f93c`で、P1・P2はともに0件だった。実行前のguard logic reviewと保存結果の独立照合を区別し、新たなSDK実行は行っていない。SDK18.2での型検査はworkflow予定のXcode16.4／runtime18.5での実行成功でも、iOS17の実UI受入でもない。同じSDK検査の再実行は行わない。

小さなJSONにsource・review・SDK結果のSHA-256と範囲を記録する。大量のSDK cache・raw log・画面添付や、私有領域の絶対パスは公開記録へ含めない。

## 次の境界と未完了

実parentの決定、App29へのPBX再bind、記録・索引を含む最終7パスの独立レビューと共通検査を行う。その後の通常PR/main統合、専用manual workflowの実行、実raw結果とowned cleanupの照合は未実施として追跡する。既存Native7／Full26の成功を新case1件の成功へ代入しない。

この表は内容から決まる固定列幅なので、今回のcaseはviewport回転を検査する候補である。段落の折返し再配置、Dynamic Type、最大文字サイズ、実際の有効package Aでの保存から有効package Bのactivateを通る移行、VoiceOver、実機とIOS-11全体は未完了のまま残す。架空digestのseedを実package移行の代わりに使わず、表全体の大きなframeとの交差をR25の復帰の代わりにしない。

全32行のTODO checkboxと本文は変更しない。現在の完了14行を維持し、追加テストの準備や型検査だけでIOS-11を完了へ変更しない。

## v4：同repo PR triggerと現Native SDKの新しい証拠

現在のSource3候補は新class `ReaderReflowUITests.swift`（10,869B、SHA `f17bd31d97a133c81d34d77fd0d24f07196d3ce42fc7670591aebae9a68a4329`）、旧PBX28に4membership点を加えた準備snapshot、および新workflow（29,645B、SHA `1bd7c4ee2c3f6a56e7cce1e38a885c120b70f54e47bda54ebf764abcdcceaef3`）である。新caseは固定selectorの**1件**であり、Source3は3ファイルを意味する。Source3旧レビューは元snapshotへの静的判定で、新workflowのRoot独立レビュー `338332b065d5de064fe2c22a41de0bbcf1873eecc2b5db6618adeef806588e58`（review.json、P1/P2=0）と分ける。全Source3の実parent再結合と最終7パスの判定は後続である。

workflowはmanualを保持し、同じ公開repoのhead/baseを持つpull_requestにも対応する。PR pathはworkflow、新Reflow Swift、PBXの3つだけ。PRはevent head、manualはgithub.shaを正確なcheckout/expected sourceに使い、eventのmerge commitは別metadataとして記録する。job gateとNode gateがrepo/event/headを照合してからcommandへ進む。read-only permission、pinned actions、persist-credentials false、固定1selector、既存caps/strict結果・所有UUID cleanup・upload条件を保持し、retryは足さない。RootのYAML parseは成功し、実driverを使うfake pure検証20件がNode24.19.0で全成功した。GitHub expressionのモデルやfake結果を実Hosted/XCTest成功へ広げない。

現在の別SDK実行はNative `00e75a518b7af8a69679adb9771c2e6d584c466c91e39c7e68b2ea75956c707c`（50,205B）と同じReflow `f17bd31d97a133c81d34d77fd0d24f07196d3ce42fc7670591aebae9a68a4329`だけの単独typecheckである。iPhoneSimulator18.2・arm64 iOS17 Simulator target・Swift5 DEBUG、1command exit0、8.147275秒、phase9.150103秒。固定10入力保持・raw stdout/stderrとも0B、既知group1のreap/remaining false、最小sample空き1,160,851,456B・最大sample所有69,327,174Bを記録した。上限は90秒・log1MiB・所有300MiB・空き700MiB・.05秒待機設定であり、hardpeak/全filesystem隔離の証明ではない。

summary.jsonのSHAは `4f87c20ec09094b616f98263b19ba9d64a4d56d52e4c366a69e1826621258ea9`、execution-manifest.jsonは `9fbbcc7782aaa6f661e94d0369b483ac1c42b5efe7926f2cf28892440f98211d`。保存証拠の別作者レビューreport.json `c9c5a891c338180a3122e35ba1ec2f9c12005ab8fd15f296d455ef400bb4492f` はP1/P2=0で、保持19ファイルとmanifest、現在10入力、intent・終了・raw・既知group記録を照合した。guardの保持flagと現在の再hashを根拠とし、独立したafter10行hash配列があるとは記述しない。cacheだけは独立レビュー後にRootが削除したが、保持19件とmanifestは引き続き必要である。旧522／bc9の成功はこの00e構成へ代入していない。このRootdocs作業ではSDKを再実行していない。

このSDK成功はPBX登録・App build・AX/UI・Simulator runtime・実case・署名・現在/将来mainの受入ではない。旧PBX準備snapshot28を将来親へそのままcopyせず、fallback7の実mainとApp30が成立した後にそのPBXへ4点だけ再投影し、version/App/signing/resources不変と全文inverseを取り直す。この単位のversion bumpは0である。

新規追跡はReflow Swift1・workflow1・record2の予定4ファイルだけで、実parent数/総数はnull、formulaはactualparent実数＋4とする。Root実parent結合、共通、最終7パスIR、新PR CIと固定case1のHosted結果・cleanup、通常mainは全て未実施。既存Native3/通常7/Full26の成功は新caseへ転用しない。段落reflow、Dynamic Type/最大文字、実package移行、実機/VoiceOverとIOS-11全体も未完了に保つ。
