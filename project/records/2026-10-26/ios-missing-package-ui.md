# 同梱記事が欠けた場合と正常版への更新のUI回帰

2026-10-26に準備した試験を、2026-10-27のCore統合後のmain `f5e6221b7dd01132ff76d36e993b13047b15e24c`（tree `fb717f389c8a94a27c942d59673fb9d762bfd683`）へ接続する候補である。Appは0.2.19（21）。実アプリのコードと通常の回帰ケースを保ち、専用の[workflow](../../../.github/workflows/ios-missing-package-ui.yml)と[FailureReaderUITests](../../../ios/AILibraryUITests/FailureReaderUITests.swift)を追加する。現在は私有準備・静的検査までで、新しい実SDKビルド・インストール・UI実行は未確認である。

## 目的と作業範囲

ユーザーの自律実装・commit・PR・通常main統合の依頼に基づく。所有は上記workflow、テストSwift、PBX構成、同名JSONと本記録、project索引と完成版TODOに、Runtime26 CIの待機調整、xctestrun helperとNode検査を加えた10パスである。PBXはUIテストへのファイル登録に必要な2オブジェクトと2参照だけを加える。既存App・UIケース・版番号・署名設定を維持し、既存Runtime26 CIではdevice一覧取得の待機だけを調整する。

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
