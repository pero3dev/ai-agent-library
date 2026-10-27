# 同梱記事が欠けた場合と正常版への更新のUI回帰

2026-10-26に準備した試験を、2026-10-27のCore統合後のmain `f5e6221b7dd01132ff76d36e993b13047b15e24c`（tree `fb717f389c8a94a27c942d59673fb9d762bfd683`）へ接続する候補である。Appは0.2.19（21）。実アプリのコードと通常の回帰ケースを保ち、専用の[workflow](../../../.github/workflows/ios-missing-package-ui.yml)と[FailureReaderUITests](../../../ios/AILibraryUITests/FailureReaderUITests.swift)を追加する。PR #281で実SDKビルド・形式照合と欠損版の明示installまで確認した。F/RのUIと正常版への更新確認は、インストール後のinventory比較で止まっており未完了である。

## 目的と作業範囲

ユーザーの自律実装・commit・PR・通常main統合の依頼に基づく。所有は上記workflow、テストSwift、PBX構成、同名JSONと本記録、project索引と完成版TODOに、Runtime26 CIの待機調整、xctestrun helperとNode検査、installed inventory helperとNode検査、PublishedReaderの復帰操作・診断を加えた13パスである。PBXはUIテストへのファイル登録に必要な2オブジェクトと2参照だけを加える。既存App・UIケース数・版番号・署名設定を維持し、既存Runtime26 CIではdevice一覧取得の待機だけを調整する。

[構造化記録](ios-missing-package-ui.json)の既存フィールドは、固定したprivate準備時点のsnapshotである。`root_proposed_integration`へ現在の入力・提案範囲を追加し、過去の未採用状態を新しい成功へ書き換えない。前提mainの新push CIは[共通](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841890)・[Native](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841894)・[全記事](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841889)の3系統で成功した。最終差分の独立レビュー、新headでの必要CIと実F/Rを確認してから通常squashを判断する。

## 二つの確認段階

1. **F: 初期データの欠損**。生成した代表版の正規native JSONを1本だけ取り除き、実際に不完全なアプリを専用Simulatorへ入れる。「コンテンツを読み込めません」と一覧不一致の理由が表示され、本文と正常件数が表示されないこと、再試行後も前面でエラーと再試行操作が保たれることを確認する。
2. **R: 正常版への更新**。取り除いたファイルを正しいbytes・modeへ戻し、全同梱物のinventoryを再照合する。アンインストールせず明示的に正常版を上書きし、保存しておいた固定sentinelのbytes・SHAが更新前後と通常本文ケース後にも残ることを確認する。既存の代表3記事の本文ケースも実行する。

Rは別の正常インストール段階である。壊れたファイルを直した同じプロセスで再試行が成功すること、XCTestが自動で再インストールすること、アンインストールによる復旧は前提にしない。

## 検査と実行の境界

固定sourceから単体153メソッド、通常UI22（機能16＋pure geometry6）、専用性能1、新しいFailure1の宣言・選択範囲を静的に照合した。この件数は新しい実行結果ではない。過去89基線の単体152等はJSONの履歴に保持する。今回の入力ではApp・既存構成を保ち、非所有のmode・type・blobと、PBX追加を逆に除いた元bytesが一致することを確認する。

専用jobは公開リポジトリの標準macos-15、Xcode16.4、iOS18.5／iPhone16の所有Simulator1台を使う。署名・秘密情報・Store操作は含めない。job60分、step合計55分、cleanup4分・driver210秒の上限を維持し、実xctestrun・selector・UUID・OS・install・F/R・sentinel・cleanupを別々に監査する。初回Hostedの結果とartifactは後続の実施記録へ残す。

## 残件と終了条件

前提Core mainの新push CIは成功した。この候補の最終checkpoint差分の独立レビュー・新head実SDK・実F/Rは未完了である。新headの必要チェックと完了ログを照合し、失敗やskipを成功へ変えずに記録する。main統合時も実merge SHA・message・tree・新main検査を確認する。

更新前後の実際のしおり・読書位置の維持は未確認であり、今回のRが直接証明するのはアプリが読み込まない専用確認ファイルの保持である。同じプロセス内での修復後再試行、import picker、初回オフライン、旧記録移行、記事なしroute、最大文字・VoiceOver・実機、IOS-18／25全体は未完了である。ユーザー指定により追加実機確認は未完了のまま省略する。TODOは32行・完了12行を保つ。課金・契約・配布用署名・公開方式・Store申請はこの変更へ含めない。

## 初回Hostedの準備段階での失敗と修正

PR #281の初回head `21b88cdaa83507e5d2e2456220621f66f81346be`、run `40448288905` はruntime一覧の取得が30秒で時間切れになり、inventoryで停止した。runtime内容の不一致を確認した結果ではない。依存導入・生成・Simulator作成・build・F/Rへは到達せず、cleanupは作成なしで成功、全体summaryは未完了である。5,663 Bの小artifactはSHA・全26 entryのCRC／size／path等をRAMで照合した。stdout／stderrは空で、30秒のSIGKILLとtimed_outを確認した。selection・Simulator所有・build・F/Rの証拠は存在しない。

同じheadの共通CI `40448288830` は、docsとWindowsで既存の「同じ作業ディレクトリのlockfile監査がinstallより前のstepにある」検査に失敗した。監査とinstallを同stepへ置いていたため、rootと`ios/tools`をそれぞれaudit1分・install2分へ分ける。`--ignore-scripts`・`pipefail`と元の計3分ずつ、全step55分・job60分を保ち、summaryでも二つのaudit結果を成功条件に含める。

runtime一覧の取得だけ90秒へ配分し、inventory全体150秒・step3分の範囲を保つ。他の情報取得は30秒、SDK・OS・runtime／deviceの一意性とsource照合、F/Rの判定・selector・保存範囲・cleanupは保ち、再試行は加えない。新workflowの空行18行にあった末尾空白も除く。修正後headの実SDK・F/R・共通CIは未実施であり、前の成功や未到達段階を新しい成功へ置き換えない。

別のRuntime26 run `40448288867` は、UI step冒頭の`xcrun simctl list devices --json`が30秒の`ETIMEDOUT`で停止した。実test・caseイベントには到達せず、後続監査は失敗、所有Simulator cleanup stepは成功した。こちらもAppの表示失敗を確認した結果ではない。このdevice一覧取得の上限だけ90秒へ変更し、UI step12分と他のコード・selector・判定・cleanupを保つ。二つの在庫取得が90秒なら成功することは未確認で、基盤側の根本原因も断定しない。

## Xcode16の実xctestrun形式への対応

修正後head f58d61c817dd2c1e4fef80f6a56283e7d26f2484の専用run40450998480では、環境照合・監査・導入・生成・所有Simulator起動とbuild-for-testingが成功した。新しいFailureReaderUITests.swiftはx86_64／arm64の両方でcompileされた。停止したのは、その後のxctestrun形式検査である。実ファイルはFormatVersion 1で、targetをtop-levelの辞書へ持ち、想定したTestConfigurations配列を持たなかった。UI targetのUITargetAppBundleIdentifierも存在しない。F/R・欠損操作・明示install・sentinel確認には未到達で、所有Simulatorは削除を実確認した。

88,589 Bのartifactは全85 entry・947,128 BをRAMで展開し、CRC・digest・size・path等を照合した。実metadataとbuild成功を、F/Rの成功へ拡張しない。形式の選択をNodeだけの小さいhelperへ切り出し、version1の名前付き辞書とversion2のenabled TestConfigurationsを明示的に扱う。期待するUI targetが一つで、BlueprintName・UITestの種別が一致することを確認する。

実AppのInfo.plistからCFBundleIdentifierを読み、両形式で期待IDとの厳密一致を必須とする。metadataにIDがある場合も同じIDを要求し、version2では従来どおりmetadataのIDを必須とする。version1の欠損だけを許すが、owned buildの実App IDとUITargetAppPathのrealpath照合は省略しない。未知の形式・不正な形・重複UI target・ID不一致を拒否するNode検査も追加する。

今回の所有はhelperとそのNode検査を加えた計10パスになる。実Appのコード・PBX・Failure Swift・F/R selectorと判定、全体の上限・所有cleanupは維持する。追加のplist取得は同じbuild420秒の中で10秒を上限とする。修正後headでの実SDK・形式照合・F/Rは未実施であり、さらに実bookmark／読書位置の更新維持・実機等の未確認も保持する。

## インストール後のmode差分と実行前の停止

head `2d4f156bb932322c6be025aaf8b9456d5b3e9988`の[専用run](https://github.com/pero3dev/ai-agent-library/actions/runs/40454615296)では、build-for-testingに続き、実FormatVersion 1の選択・owned Appのrealpath・実Info.plistのBundle ID照合が成功した。Appは0.2.19（21）、Xcode16.4・iOS18.5・専用iPhone16 Simulatorである。JSON1本を除いた180ファイルのアプリを明示installできたが、直後のinventory比較で停止した。

診断表示には、Debug用dylib・XCTest関連framework等の12パスで、bytesとSHAは同じままmodeが0755から0644へ変わった差分がある。主実行ファイルはこの差分に含まれない。ただし詳細配列は先頭100件と省略80件の表示であり、全installed inventoryを独立に保存できていない。ほかの差分が存在しないと断定する証拠にはしない。117,437 Bのartifactは全117 entry・1,036,602 BのCRC／digest／path等をRAMで確認した。

FはUI実行前、Rはhost側JSONの正しい復元後に、Fのinstallation記録がないため停止した。正常版の上書き・sentinel・F/R UIはいずれも未実施である。Rの停止を別のアプリ不具合とは数えない。所有Simulatorはshutdown・deleteの終了0と削除後の不在を確認した。

次の候補では、hostの欠損・復元はmodeを含む完全一致のまま保ち、installed側だけ実観測12パスの0755→0644または0755維持を明示的に扱う。全パス集合・bytes・SHA、他パスのmode、主実行ファイルやデータは厳密に照合する。照合結果の成否をassertする前にexpected／actual／差分を上限付きJSONへ保存し、RはFの前提不足を明示記録して変更・install・UI前に拒否する。この候補の新しい実F/Rは未実施である。

旧head `f58d61c817dd2c1e4fef80f6a56283e7d26f2484`の[全記事UI run](https://github.com/pero3dev/ai-agent-library/actions/runs/40450998872)は22件中1件が失敗した。初回Transformerの本文表示は到達し、フォルダー選択取消を扱うケースの後段で「続きを読む」を押した後にnative-readerを20秒待って停止した。初期表示の失敗やxctestrunの解析失敗とは別であり、タップ対象・遷移・描画のどこが原因かは未確定である。旧headの失敗を後続headの成功へ置き換えず、実行ごとに追跡する。

## 通常復帰テストのタップ条件と診断

同じ2d4 headの[全記事run](https://github.com/pero3dev/ai-agent-library/actions/runs/40454615354)は成功し、UI22件・0失敗・1091.970秒をログで確認した。うちpure geometryは6件・0失敗、前述のフォルダー取消後の復帰ケースは109.849秒で成功した。旧f58とApp・当該Swiftは同じであり、この結果だけでは旧失敗の原因や修正との因果は分からない。32,166,318 Bの大artifactは取得せず、APIの状態・上限付きtailのRelease検査と、GitHub画面でのUI集計を別々の出所として記録した。

次の候補では[PublishedReaderUITests](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)の当該ケースの再起動後操作だけを補強する。通常のresumeボタンを一意・有効・完全可視で選び、既存の前面navigation barで切り取ったviewportと、一意な操作可能検索欄がある場合の下端を使う。最大8回の下向きscrollと15秒の待機の範囲で確認し、保存された記事名と一致したボタンを一度だけ押す。本文20秒・段落10秒・非空の確認と、その後のtitle・しおり・見出し判定は保つ。

失敗時だけ、公開AX上の画面タイトル・一覧／本文／読み込み／エラー表示・ボタンと検索欄の数とframeをJSONへ残す。JSON本文は8,192 Bまで、hierarchyのprefixはUTF-8の末尾補正を含め8,002 Bまでとする。AX取得そのものの時間や一連の観測の同時性を保証するものではなく、その他の遮蔽はXCTestのisHittableに依存する。通常UIの件数は22のままで、App・共通Native helper・他ケースの操作を変えない。

この操作条件と診断の改善は、installed inventoryの補正とは別コミットにする。両候補の独立レビューは実SDK・実F/R・候補の復帰UI実行を代替しない。最終headの実行前であり、本文表示・保存の全体受入や旧失敗の原因解消は未完了のまま残す。

## 所有Simulator起動後の一覧取得の時間切れ

head `aef7d822b76c9f75c158c43e06dd4d3ffbb67eb0`の[専用run](https://github.com/pero3dev/ai-agent-library/actions/runs/40459959589)は、代表版生成と所有Simulatorのcreate・boot・bootstatusが成功した後、`simctl list devices --json`が30秒で時間切れになった。呼出し時のstage残り時間は189,512 msで、Simulator段階全体の270秒を使い切った結果ではない。stdoutは空、SIGKILL・timed_outを記録した。build・metadata・実Info・新installed比較・F/Rへは未到達であり、アプリの機能失敗とは扱わない。

50,907 Bのartifactは全77 entry・466,435 BをRAMで検証し、digest・CRC・size・path等が一致した。所有UUIDは既存132台に含まれず、cleanup前の一覧ではiOS18.5／iPhone16のBootedが一つだった。shutdown・deleteはいずれも終了0、削除後は不在だった。

次の候補ではこの一覧取得だけを90秒まで待つ。同じSimulator段階270秒・step5分と、job60分・step合計55分の内側で既存のdeadlineにより制限し、再試行・失敗判定の省略・全体上限の拡張は加えない。他のコマンド、App・UI・installed比較・cleanupは保つ。90秒で成功することと新しいF/Rは未確認である。

同headのMarkdown検査は、記録の節間2か所の連続空行でMD012に失敗した。余分なLF2つだけを取り除く独立した書式コミットを先に置く。隔離した候補ディレクトリと正本と同じ設定で対象Markdownのlintは成功し、今回の追記を含む最終本文も提出前に検査する。旧headの検査失敗や各未到達段階は履歴として保持する。

## 同じheadのiOS26の目次移動テスト

[aef7のRuntime26](https://github.com/pero3dev/ai-agent-library/actions/runs/40459959585)はUI2件中1件が失敗した。Transformerの本文は表示され、目次から「自己注意の数式」を押した後の可視条件が時間切れになった。該当ケースは118.253秒、別の3記事本文ケースは133.835秒で成功し、集計は252.088秒だった。UI stepの実508秒は上限720秒に達していない。

失敗後の別時刻の診断では同見出しの完全可視・isHittable等がtrueだったが、待機中のframe値は記録されていない。後の状態から待機中の条件や原因を確定せず、失敗結果を保持する。hierarchyと画像の実内容は未読で、101,924,031 Bのartifactは取得上限を超えるため取得していない。今回はApp・共通Native helperを変えておらず、旧f58の別ケースの再起動後resumeとも検証段階が異なる。次のheadの結果と、この失敗を分けて追跡する。
