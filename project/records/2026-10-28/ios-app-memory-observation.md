# iOS App本文表示時のメモリ観測

2026-10-28。IOS-15の次の小単位として、指定iOS Appの本文表示区間を観測する候補を準備する。自分用初版の実装・検証を優先度順に自律実施し、commit・PR・通常main統合へ分ける本人の依頼を根拠とする。新しい課金・契約・外部配布・署名更新・OS更新は対象にしない。

## 目的と対象

基準はmain `e0c3031f3d62adab017c72949ffa3376e77b18bf`、App 0.2.22（24）。既存のMac Core CLIのRSSをAppのメモリと扱わず、UIテストから対象Appを指定する。App・PBX・版・本文の実装を変えず、既存Clockの2ケースとexport契約を保持する。

[Appleのinitializer](https://developer.apple.com/documentation/xctest/xctmemorymetric/init(application:))とローカルXcode16.2のXCTest SDK headerにより、`XCTMemoryMetric(application: app)`が指定Appを対象とし、引数なしが現在のprocessを対象とすることを確認した。APIは確認したが、iOS18.5での実標本はまだ得ていない。

[Appleの説明](https://developer.apple.com/documentation/xcode/preventing-memory-use-regressions)は計測区間のピークと開始・終了間の増加を扱う。1つのmetric objectから出るrow数・identifier・wire unitを決め付けず、増分を正値と仮定しない。[Simulatorの制約](https://developer.apple.com/documentation/xcode/gathering-information-about-memory-use)と[代表的な計測環境の推奨](https://developer.apple.com/documentation/xcode/writing-and-running-performance-tests)を踏まえ、今回をDebug Simulatorの参考観測とする。

## 旧実験の参照

[閉じた一時PR #274](https://github.com/pero3dev/ai-agent-library/pull/274)には、0.2.14（16）の検索区間でmemory 3行・各5値を記録した履歴がある。UIは成功したがcollectorは読取前のseal不一致で停止し、元のbefore filelistがないためSQLite更新が原因とは確定していない。旧記録の承認範囲と、後続再読取の独立確認待ちを区別する。

今回は0.2.22のTransformer本文シナリオで初回rawを採取する別の観測で、旧5値・指標の意味・換算・性能基準を転用しない。旧branchは変更・統合しない。新exporterはcontextの安定した読取とxcresultのroot同一性を検査するが、公式reader前後のbundle内部全byte不変を検証済みとは主張しない。

## 測定の境界

全記事一覧と学習ガイドの準備後にmetricを構築する。最初の明示launchは1回。各invocationで一覧・検索・一意なTransformer行を準備した後、行tapの直前に開始し、前面のTransformer文脈、reader、その内部の非空で完全表示されたnative textを確認して停止する。戻り・検索・行の準備・添付・終了は区間外。UI／AX同期と画面遷移を含む。

[iterationCount](https://developer.apple.com/documentation/xctest/xctmeasureoptions/iterationcount)のwarm-up1回と記録3回を採用し、sourceでは4回の呼出しと本文witnessを確認する。[開始](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystart)・[停止](https://developer.apple.com/documentation/xctest/xctmeasureoptions/invocationoptions-swift.struct/manuallystop)を手動指定する。明示launch1回とforeground状態の確認は、PID不変を独立観測した証拠ではない。

対象は `11-llm-internals/transformer-architecture`、scenarioは `published-article-app-memory`、caseは `PublishedPerformanceUITests/testPublishedArticleAppMemory`。起動時間、cold起動、lifetime peak、全画像decode、scroll、Release、実機の安全限界、製品SLOを測ったとはしない。

## 実装と初回の採択手順

Swiftの専用case・新memory workflow・別exporter・独立Node試験をSource commitへまとめ、記録と索引を別commitにする。既存Clockの単一指標・CSV契約をmemoryへ拡張しない。

初回のtrusted memory契約は未採択とする。exact1 case・型付き3値・出所の対応と、上限付きraw／CSVを保存しても、契約が未確定なら `metric-contract-unconfirmed`、`accepted_measurements: null`、非ゼロ終了を保つ。Draftのまま実metric集合・単位・row数・CSVとsource／checkoutを独立に確認し、別commitで固定契約を採択して新headの検証を行う。初回の未採択結果を削除・同条件retryで置き換えず、製品不具合や性能合格とも扱わない。

job40分とビルド・UI実行の別上限はCI資源の制限で、製品の性能予算ではない。専用Simulatorだけを作成・片付け、compactは全体2MiB・JSON各512KiB・CSV各64KiBを上限に90日保持する。上限超過時に指標を切り落として成功にしない。source／checkoutとGitHub event／run／attemptは別に照合する。

## 確認状況と残件

候補のSwift構文と、Xcode16.2／iOS18.2 Simulator SDKを使う単一UIファイルの型検査が成功した。Appのlink・実UI・実メモリ実行ではない。workflowのactionlint・YAML・Bash・埋込Nodeの静的検査、新memory Node20件と既存Clock44件が成功した。exporterの初回レビューで見つかった別case混入・open直前のサイズ増加・最終child後の期限確認の3件を修正し、負例を追加した。3件の修正版の独立差分レビューでも新しいP1・P2は0件だった。lockfileから依存を隔離準備した `npm run check` も成功し、Node1130件中1115成功・15skip・失敗0を確認した。Macの一時path・Git設定は専用配置で隔離し、既存sourceをこのために変更していない。独立レビューと実SDK型検査、実UIと3標本、identifier・unit・cardinality・CSVの採択、必要CIと通常main統合を区別して記録する。実protocol payloadを取得していなければ、sourceのassertとcase成功をpayload検証済みへ広げない。

IOS-15全体と受入目標、他のTODOは未完了を維持する。実機確認は本人の許可により未完了のままスキップできる。TODO32行・完了13行を保持し、旧0.2.20のClock値を今回の実メモリや現行版の値として転用しない。

## 初回Hostedの環境失敗と再確認

2026-10-29追記。Draftの[PR #296](https://github.com/pero3dev/ai-agent-library/pull/296)、head `b7f3ae46b217c15d545a34a8aa8a3b23e752b53b`の[初回run](https://github.com/pero3dev/ai-agent-library/actions/runs/40711271095/attempts/1)は、専用Simulator起動後の端末一覧取得で停止した。bootとbootstatusはexit 0で、後続の `simctl list devices --json` が約59.9秒の制限でタイムアウトした。ビルド・UI・メモリ計測は未到達であり、契約未採択のexit 2ではない。後続exportはxcresult未作成で失敗した。

同じ一覧取得は後片付け時に成功し、今回作成した端末だけのshutdown・deleteと削除後の一覧確認も成功した。初回raw 75,321Bと公式compact ZIP 72,481Bを1回ずつ取得し、ZIPの公式SHA256 `449db972a94375f22072b3d09be6d31eadedcdd80d372b54724dcef1b87db9ca`と78 memberの上限・hashを独立に照合した。一時的な管理コマンドの無応答と整合するが、原因は確定しない。初回失敗を保持し、Source・timeout・選択条件を変えない1回だけの再実行を行った。実測未採択を同条件retryで置き換える手順とは区別する。

## 再実行で分かったmanifest読取上限の不整合

[同runのattempt 2](https://github.com/pero3dev/ai-agent-library/actions/runs/40711271095/attempts/2)、job `122905720245`では専用Simulatorの起動後確認とDebugのbuild-for-testingが成功した。ビルドは約237秒だったが、App内のContent manifestを読む際に一般メタデータ向けの512KiB上限へ達して停止し、UI・メモリ計測には進まなかった。これはSource側の上限の不整合であり、追加の同条件retryは行わない。後続exportはxcresult未作成で失敗し、専用端末の後片付けは成功した。

[アプリの検証器](../../../ios/AILibrary/Sources/ContentValidator.swift)はmanifestに8MiB上限を設けている。Appと生成元のContent／TestContentの4読取だけをこの上限に揃える。一般JSONの512KiB、compact全体2MiBと各ファイル上限、ビルド・起動・測定の制限時間、未採択の指標契約は保持する。ローカルの全199記事manifestは3,120,173Bで同じ種類の失敗を再現できるが、その生成revisionはHostedと異なり、Hosted Appのmanifest実サイズとして転用しない。

attempt 2のraw 77,325Bとcompact ZIP 77,605Bを各1回取得し、公式SHA256 `a51ad185961f16795038e6ff2e711669d76bede241fa4d606336ac99765fe7d6`、86 memberと85件のmanifest記載ファイルのbyte・hash、出所を独立に照合した。修正後の実行で初めて実metricとCSVを確認する。現時点の測定結果は未取得で、IOS-15・性能予算・実機の未完了を保持する。

修正候補の4引数だけを戻すと元workflowと完全一致する。抽出した実auditとreaderにローカルの全199記事manifestと既存fixtureを通し、修正前のbyte cap失敗と修正後のcontext作成を確認した。4読取それぞれの8MiB超過、両組のbyte不一致を拒否し、一般readerの512KiB境界も維持した。外部のpackage audit・plutil・executableはstubであり、Hosted SDK／UIの再実行成功とはしない。actionlintとYAML・Bash11本・埋込Nodeの静的検査も成功した。

この4引数の修正版の独立レビューは新しいP1・P2が0件だった。隔離済み依存と同じlockfileで共通検査を再実行し、Node1130件中1115成功・15skip・失敗0、`npm run check` exit 0を確認した。既存の本文・App・PBX・版・Clock・新memory caseとexporterは保持する。新headのHosted実行と実指標の採択は別の確認として残す。
